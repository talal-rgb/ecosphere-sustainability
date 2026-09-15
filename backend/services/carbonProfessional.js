import { assertUuid, withPlatformContext } from './database.js';

export async function getInventoryYearOverYear(databasePool, context, inventoryId) {
  assertUuid(inventoryId, 'inventoryId');
  const result = await withPlatformContext(databasePool, context, (client) => client.query(
    `WITH period_totals AS (
       SELECT period.id, period.label, period.starts_on, period.ends_on,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 1), 0) AS scope_1_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 2 AND activity.scope_2_method = 'location_based'), 0) AS scope_2_location_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 2 AND activity.scope_2_method = 'market_based'), 0) AS scope_2_market_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope = 3), 0) AS scope_3_kg,
              COALESCE(SUM(detail.emissions_kg_co2e) FILTER (WHERE category.ghg_scope <> 2 OR activity.scope_2_method <> 'market_based'), 0) AS total_location_kg
         FROM platform.carbon_reporting_periods period
         LEFT JOIN platform.carbon_activity_data activity
           ON activity.reporting_period_id = period.id AND activity.organization_id = period.organization_id
         LEFT JOIN platform.carbon_scope_categories category ON category.code = activity.scope_category_code
         LEFT JOIN platform.carbon_calculation_details detail
           ON detail.activity_data_id = activity.id AND detail.organization_id = activity.organization_id
         LEFT JOIN platform.calculations calculation
           ON calculation.id = detail.calculation_id AND calculation.organization_id = detail.organization_id
        WHERE period.organization_id = $1 AND period.inventory_id = $2
          AND (detail.id IS NULL OR (activity.review_status = 'approved' AND calculation.status = 'approved'))
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
