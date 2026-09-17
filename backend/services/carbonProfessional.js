import { assertUuid, withPlatformContext } from './database.js';
import { requireFeature, requirePermission } from './platformService.js';

export async function getCarbonDashboardOverview(databasePool, context) {
  const result = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'carbon.professional.workspace');
    return client.query(`WITH selected_period AS (
       SELECT period.id, period.inventory_id, period.label, period.starts_on, period.ends_on,
              period.status, period.comparison_period_id, inventory.name AS inventory_name
         FROM platform.carbon_reporting_periods period
         JOIN platform.carbon_inventories inventory
           ON inventory.organization_id = period.organization_id AND inventory.id = period.inventory_id
        WHERE period.organization_id = $1 AND inventory.status <> 'archived'
        ORDER BY CASE period.status WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'approved' THEN 3 ELSE 4 END,
                 period.ends_on DESC, period.id
        LIMIT 1
     ), current_details AS (
       SELECT CASE WHEN calculation.status = 'approved'
                        AND activity.review_status = 'approved'
                        AND activity.approval_status = 'approved'
                        AND activity.anomaly_status <> 'flagged'
                   THEN detail.emissions_kg_co2e END AS emissions_kg_co2e,
              CASE WHEN calculation.status = 'approved'
                        AND activity.review_status = 'approved'
                        AND activity.approval_status = 'approved'
                        AND activity.anomaly_status <> 'flagged'
                   THEN detail.scope_2_method END AS scope_2_method,
              activity.scope_category_code, category.name AS category_name,
              activity.facility_id, facility.name AS facility_name,
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
         LEFT JOIN platform.carbon_scope_categories category ON category.code = activity.scope_category_code
         LEFT JOIN platform.facilities facility
           ON facility.organization_id = activity.organization_id AND facility.id = activity.facility_id
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
     ), facilities AS (
       SELECT facility_id, facility_name,
              COALESCE(SUM(emissions_kg_co2e) FILTER (
                WHERE scope_category_code NOT LIKE 'scope_2.%' OR scope_2_method = 'location_based'
              ), 0) AS emissions_kg
         FROM current_details
        WHERE facility_id IS NOT NULL
        GROUP BY facility_id, facility_name
     ), categories AS (
       SELECT scope_category_code, category_name,
              COALESCE(SUM(emissions_kg_co2e) FILTER (
                WHERE scope_category_code NOT LIKE 'scope_2.%' OR scope_2_method = 'location_based'
              ), 0) AS emissions_kg
         FROM current_details
        GROUP BY scope_category_code, category_name
     ), comparison AS (
       SELECT comparison_period.id, comparison_period.label, comparison_period.starts_on, comparison_period.ends_on,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (
                WHERE calculation.id IS NOT NULL AND (activity.scope_category_code NOT LIKE 'scope_2.%' OR detail.scope_2_method = 'location_based')
              ), 0) AS emissions_kg
         FROM selected_period selected
         JOIN platform.carbon_reporting_periods comparison_period
           ON comparison_period.organization_id = $1 AND comparison_period.id = selected.comparison_period_id
          AND comparison_period.inventory_id = selected.inventory_id
         LEFT JOIN platform.carbon_activity_data activity
           ON activity.organization_id = comparison_period.organization_id
          AND activity.reporting_period_id = comparison_period.id
          AND activity.review_status = 'approved' AND activity.approval_status = 'approved'
          AND activity.anomaly_status <> 'flagged'
         LEFT JOIN platform.carbon_calculation_details detail
           ON detail.organization_id = activity.organization_id AND detail.activity_data_id = activity.id
          AND detail.is_current = true
         LEFT JOIN platform.calculations calculation
           ON calculation.organization_id = detail.organization_id AND calculation.id = detail.calculation_id
          AND calculation.status = 'approved'
        GROUP BY comparison_period.id, comparison_period.label, comparison_period.starts_on, comparison_period.ends_on
     )
     SELECT period.*, totals.*, COALESCE(evidence.covered_count, 0) AS evidence_covered_count,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('month', month, 'emissionsKgCo2e', emissions_kg) ORDER BY month) FROM monthly), '[]'::jsonb) AS trend,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id', facility_id, 'name', facility_name, 'emissionsKgCo2e', emissions_kg) ORDER BY emissions_kg DESC, facility_id) FROM facilities), '[]'::jsonb) AS facilities,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('code', scope_category_code, 'name', category_name, 'emissionsKgCo2e', emissions_kg) ORDER BY emissions_kg DESC, scope_category_code) FROM categories), '[]'::jsonb) AS categories,
            (SELECT to_jsonb(comparison) FROM comparison) AS comparison
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
    })) : [],
    byFacility: numericSeries(row.facilities, 'id', 'name'),
    byCategory: numericSeries(row.categories, 'code', 'name'),
    comparison: row.comparison ? {
      id: row.comparison.id, label: row.comparison.label,
      startsOn: row.comparison.starts_on, endsOn: row.comparison.ends_on,
      totalKgCo2e: Number(row.comparison.emissions_kg)
    } : null
  };
}

export async function getCarbonReviewQueue(databasePool, context) {
  const result = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'carbon.professional.workspace');
    return client.query(
      `SELECT activity.id, activity.activity_type, activity.scope_category_code,
              activity.review_status, activity.approval_status, activity.anomaly_status,
              activity.data_quality_status, period.label AS reporting_period,
              proposal.id AS proposal_id, proposal.confidence, proposal.compatibility,
              review.decision AS factor_decision
         FROM platform.carbon_activity_data activity
         JOIN platform.carbon_reporting_periods period
           ON period.organization_id = activity.organization_id AND period.id = activity.reporting_period_id
         LEFT JOIN LATERAL (SELECT item.* FROM platform.carbon_factor_mapping_proposals item
           WHERE item.organization_id = activity.organization_id AND item.activity_data_id = activity.id
           ORDER BY item.revision DESC LIMIT 1) proposal ON true
         LEFT JOIN LATERAL (SELECT item.* FROM platform.carbon_factor_mapping_reviews item
           WHERE item.organization_id = proposal.organization_id AND item.proposal_id = proposal.id
           ORDER BY item.revision DESC LIMIT 1) review ON true
        WHERE activity.organization_id = $1 AND (
          activity.review_status IN ('draft','review_required')
          OR activity.approval_status IN ('not_submitted','pending')
          OR activity.anomaly_status = 'flagged'
          OR proposal.id IS NULL OR review.id IS NULL
        )
        ORDER BY activity.updated_at DESC, activity.id LIMIT 100`, [context.organizationId]
    );
  });
  return result.rows.map((row) => ({
    id: row.id, activityType: row.activity_type, scopeCategoryCode: row.scope_category_code,
    reportingPeriod: row.reporting_period, reviewStatus: row.review_status,
    approvalStatus: row.approval_status, anomalyStatus: row.anomaly_status,
    dataQualityStatus: row.data_quality_status, proposalId: row.proposal_id,
    confidence: row.confidence === null ? null : Number(row.confidence),
    compatibility: row.compatibility, factorDecision: row.factor_decision
  }));
}

function emptyMetrics() {
  return {
    totalKgCo2e: 0, scope1KgCo2e: 0, scope2LocationKgCo2e: 0,
    scope2MarketKgCo2e: 0, scope3KgCo2e: 0, activityCount: 0,
    evidenceCoveragePercent: 0, highQualityPercent: 0, approvedCount: 0,
    reviewRequiredCount: 0
  };
}

function numericSeries(value, idKey, nameKey) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    [idKey]: item[idKey], [nameKey]: item[nameKey] || item[idKey], emissionsKgCo2e: Number(item.emissionsKgCo2e)
  }));
}

export async function getInventoryYearOverYear(databasePool, context, inventoryId) {
  assertUuid(inventoryId, 'inventoryId');
  const result = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'carbon.professional.workspace');
    return client.query(
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
    );
  });

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
