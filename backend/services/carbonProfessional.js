import { assertUuid, withPlatformContext } from './database.js';
import { requireFeature, requirePermission } from './platformService.js';

export async function getCarbonDashboardOverview(databasePool, context) {
  const result = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'carbon.professional.workspace');
    return client.query(`WITH selected_period AS (
       SELECT period.id, period.inventory_id, period.label, period.starts_on, period.ends_on,
              period.status, inventory.name AS inventory_name
         FROM platform.carbon_reporting_periods period
         JOIN platform.carbon_inventories inventory
           ON inventory.organization_id = period.organization_id AND inventory.id = period.inventory_id
        WHERE period.organization_id = $1 AND inventory.status <> 'archived'
        ORDER BY CASE period.status WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'approved' THEN 3 ELSE 4 END,
                 period.ends_on DESC, period.id
        LIMIT 1
     ), current_details AS (
       SELECT CASE WHEN calculation.status = 'approved' THEN detail.emissions_kg_co2e END AS emissions_kg_co2e,
              CASE WHEN calculation.status = 'approved' THEN detail.scope_2_method END AS scope_2_method,
              activity.scope_category_code,
              activity.data_quality_status, activity.review_status, activity.approval_status,
              activity.anomaly_status, activity.activity_date, activity.id AS activity_id
         FROM selected_period period
         JOIN platform.carbon_activity_data activity
           ON activity.organization_id = $1 AND activity.reporting_period_id = period.id
         LEFT JOIN platform.carbon_calculation_details detail
           ON detail.organization_id = activity.organization_id AND detail.activity_data_id = activity.id
          AND detail.is_current = true
         LEFT JOIN platform.calculations calculation
           ON calculation.organization_id = detail.organization_id AND calculation.id = detail.calculation_id
     ), totals AS (
       SELECT
         COALESCE(SUM(emissions_kg_co2e) FILTER (WHERE scope_category_code LIKE 'scope_1.%'), 0) AS scope_1_kg,
         COALESCE(SUM(emissions_kg_co2e) FILTER (WHERE scope_category_code LIKE 'scope_2.%' AND scope_2_method = 'location_based'), 0) AS scope_2_location_kg,
         COALESCE(SUM(emissions_kg_co2e) FILTER (WHERE scope_category_code LIKE 'scope_2.%' AND scope_2_method = 'market_based'), 0) AS scope_2_market_kg,
         COALESCE(SUM(emissions_kg_co2e) FILTER (WHERE scope_category_code LIKE 'scope_3.%'), 0) AS scope_3_kg,
         count(DISTINCT activity_id)::integer AS activity_count,
         count(DISTINCT activity_id) FILTER (WHERE review_status = 'review_required' OR anomaly_status = 'flagged')::integer AS review_required_count,
         count(DISTINCT activity_id) FILTER (WHERE approval_status = 'approved')::integer AS approved_count,
         count(DISTINCT activity_id) FILTER (WHERE data_quality_status IN ('primary', 'verified'))::integer AS high_quality_count
       FROM current_details
     ), evidence AS (
       SELECT count(DISTINCT activity.id)::integer AS covered_count
         FROM selected_period period
         JOIN platform.carbon_activity_data activity
           ON activity.organization_id = $1 AND activity.reporting_period_id = period.id
         JOIN platform.carbon_activity_evidence link
           ON link.organization_id = activity.organization_id AND link.activity_data_id = activity.id
     ), monthly AS (
       SELECT date_trunc('month', activity_date)::date AS month,
              COALESCE(SUM(emissions_kg_co2e) FILTER (
                WHERE scope_category_code NOT LIKE 'scope_2.%' OR scope_2_method = 'location_based'
              ), 0) AS emissions_kg
         FROM current_details
        WHERE activity_date IS NOT NULL
        GROUP BY date_trunc('month', activity_date)
        ORDER BY month
     )
     SELECT period.*, totals.*, COALESCE(evidence.covered_count, 0) AS evidence_covered_count,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('month', month, 'emissionsKgCo2e', emissions_kg) ORDER BY month) FROM monthly), '[]'::jsonb) AS trend
       FROM selected_period period
       CROSS JOIN totals
       LEFT JOIN evidence ON true`,
    [context.organizationId]);
  });

  const row = result.rows[0];
  if (!row) return { reportingPeriod: null, metrics: emptyMetrics(), trend: [] };
  const scope1 = Number(row.scope_1_kg);
  const scope2Location = Number(row.scope_2_location_kg);
  const scope3 = Number(row.scope_3_kg);
  const activityCount = Number(row.activity_count);
  return {
    inventory: { id: row.inventory_id, name: row.inventory_name },
    reportingPeriod: {
      id: row.id, label: row.label, startsOn: row.starts_on, endsOn: row.ends_on, status: row.status
    },
    metrics: {
      totalKgCo2e: scope1 + scope2Location + scope3,
      scope1KgCo2e: scope1,
      scope2LocationKgCo2e: scope2Location,
      scope2MarketKgCo2e: Number(row.scope_2_market_kg),
      scope3KgCo2e: scope3,
      activityCount,
      evidenceCoveragePercent: activityCount ? Math.round((Number(row.evidence_covered_count) / activityCount) * 100) : 0,
      highQualityPercent: activityCount ? Math.round((Number(row.high_quality_count) / activityCount) * 100) : 0,
      approvedCount: Number(row.approved_count),
      reviewRequiredCount: Number(row.review_required_count)
    },
    trend: Array.isArray(row.trend) ? row.trend.map((item) => ({
      month: item.month, emissionsKgCo2e: Number(item.emissionsKgCo2e)
    })) : []
  };
}

function emptyMetrics() {
  return {
    totalKgCo2e: 0, scope1KgCo2e: 0, scope2LocationKgCo2e: 0,
    scope2MarketKgCo2e: 0, scope3KgCo2e: 0, activityCount: 0,
    evidenceCoveragePercent: 0, highQualityPercent: 0, approvedCount: 0,
    reviewRequiredCount: 0
  };
}

export async function getInventoryYearOverYear(databasePool, context, inventoryId) {
  assertUuid(inventoryId, 'inventoryId');
  const result = await withPlatformContext(databasePool, context, (client) => client.query(
    `WITH period_totals AS (
       SELECT period.id, period.label, period.starts_on, period.ends_on,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 1), 0) AS scope_1_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 2 AND detail.scope_2_method = 'location_based'), 0) AS scope_2_location_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 2 AND detail.scope_2_method = 'market_based'), 0) AS scope_2_market_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 3), 0) AS scope_3_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope <> 2 OR detail.scope_2_method = 'location_based'), 0) AS total_location_kg
         FROM platform.carbon_reporting_periods period
         LEFT JOIN platform.carbon_activity_data activity
           ON activity.reporting_period_id = period.id AND activity.organization_id = period.organization_id
         LEFT JOIN platform.carbon_scope_categories category ON category.code = activity.scope_category_code
         LEFT JOIN platform.carbon_calculation_details detail
           ON detail.activity_data_id = activity.id AND detail.organization_id = activity.organization_id
         LEFT JOIN platform.calculations calculation
           ON calculation.id = detail.calculation_id AND calculation.organization_id = detail.organization_id
        WHERE period.organization_id = $1 AND period.inventory_id = $2
          AND (detail.id IS NULL OR (detail.is_current AND activity.review_status = 'approved'
            AND activity.approval_status = 'approved' AND calculation.status = 'approved'))
        GROUP BY period.id, period.label, period.starts_on, period.ends_on
     ), compared AS (
       SELECT period_totals.*,
              LAG(total_location_kg) OVER (ORDER BY starts_on, id) AS previous_total_location_kg
         FROM period_totals
     )
     SELECT * FROM compared ORDER BY starts_on, id`,
    [context.organizationId, inventoryId]
  ));

  return result.rows.map((row) => {
    const total = Number(row.total_location_kg);
    const previous = row.previous_total_location_kg === null ? null : Number(row.previous_total_location_kg);
    return {
      id: row.id,
      label: row.label,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      scope1KgCo2e: Number(row.scope_1_kg),
      scope2LocationKgCo2e: Number(row.scope_2_location_kg),
      scope2MarketKgCo2e: Number(row.scope_2_market_kg),
      scope3KgCo2e: Number(row.scope_3_kg),
      totalLocationKgCo2e: total,
      previousTotalLocationKgCo2e: previous,
      yearOverYearPercent: previous && previous !== 0
        ? Math.round(((total - previous) / previous) * 10000) / 100
        : null
    };
  });
}
