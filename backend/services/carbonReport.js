import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { createTrustedReport } from './reportEngine.js';
import { canonicalJson, requireFeature, requirePermission } from './platformService.js';

const MAX_REPORT_LINES = 2000;

export async function createCarbonProfessionalReport(databasePool, context, input = {}) {
  for (const [value, name] of [[input.projectId, 'projectId'], [input.inventoryId, 'inventoryId'],
    [input.reportingPeriodId, 'reportingPeriodId'], [input.calculationRunId, 'calculationRunId']]) {
    assertUuid(value, name);
  }
  const snapshot = await loadCarbonReportSnapshot(databasePool, context, input);
  const reportTitle = optionalText(input.title, 250)
    || `${snapshot.metadata.organizationName} ${snapshot.metadata.reportingPeriodLabel} carbon inventory`;
  snapshot.metadata.reportTitle = reportTitle;
  return createTrustedReport(databasePool, context, {
    projectId: input.projectId,
    title: reportTitle,
    templateCode: 'carbon-professional',
    audience: optionalText(input.audience, 200) || 'sustainability teams and reviewers',
    reportingStandard: snapshot.metadata.reportingStandard,
    parameters: {
      inventoryId: input.inventoryId,
      reportingPeriodId: input.reportingPeriodId,
      traceabilityStatus: snapshot.metadata.traceabilityStatus
    },
    content: snapshot,
    sourceManifest: snapshot.sourceManifest,
    calculationIds: snapshot.calculationIds,
    evidenceIds: snapshot.evidenceIds,
    sourceKind: 'carbon_professional',
    inventoryId: input.inventoryId,
    reportingPeriodId: input.reportingPeriodId,
    calculationRunId: input.calculationRunId,
    calculationRunIds: snapshot.sourceManifest.calculationRuns.map((item) => item.id),
    calculationDetailIds: snapshot.sourceManifest.calculationDetails.map((item) => item.id),
    evidenceVersions: snapshot.sourceManifest.evidenceVersions
  });
}

export async function loadCarbonReportSnapshot(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.create');
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'carbon.professional.workspace');
    await requireFeature(client, 'reports.professional');

    const headerResult = await client.query(
      `SELECT organization.name AS organization_name, organization.country_code,
              project.id AS project_id, project.name AS project_name,
              inventory.id AS inventory_id, inventory.name AS inventory_name,
              inventory.reporting_standard, inventory.consolidation_approach,
              inventory.operational_boundary, inventory.boundary_notes, inventory.updated_at AS inventory_updated_at,
              period.id AS reporting_period_id, period.label AS reporting_period_label,
              period.starts_on, period.ends_on, period.status AS period_status,
              period.approved_by AS period_approved_by, period.approved_at AS period_approved_at,
              period.approved_calculation_run_id,
              (SELECT count(*)::integer FROM platform.carbon_activity_data activity
                WHERE activity.organization_id=organization.id AND activity.inventory_id=inventory.id
                  AND activity.reporting_period_id=period.id) AS period_activity_count,
              (SELECT count(*)::integer FROM platform.carbon_activity_data activity
                WHERE activity.organization_id=organization.id AND activity.inventory_id=inventory.id
                  AND activity.reporting_period_id=period.id AND activity.project_id=project.id) AS project_activity_count
         FROM platform.organizations organization
         JOIN platform.projects project ON project.organization_id=organization.id AND project.id=$2
         JOIN platform.carbon_inventories inventory ON inventory.organization_id=organization.id AND inventory.id=$3
         JOIN platform.carbon_reporting_periods period
           ON period.organization_id=organization.id AND period.id=$4 AND period.inventory_id=inventory.id
        WHERE organization.id=$1 AND project.product_module IN ('carbon','cross_platform')`,
      [context.organizationId, input.projectId, input.inventoryId, input.reportingPeriodId]
    );
    const header = headerResult.rows[0];
    if (!header) throw notFoundError('The tenant-owned project, inventory, or reporting period was not found.');
    if (!['approved', 'locked'].includes(header.period_status)) {
      throw conflictError('A Carbon Professional report requires an approved or locked reporting period.');
    }
    if (header.approved_calculation_run_id !== input.calculationRunId) {
      throw conflictError('The report must use the calculation run approved for this reporting period.');
    }

    const [boundaryResult, lineResult] = await Promise.all([
      client.query(
        `SELECT member.id, member.included, member.ownership_percent, member.consolidation_percent,
                member.control_classification, member.exclusion_reason, member.effective_from, member.effective_to,
                COALESCE(facility.name, site.name, unit.name) AS entity_name,
                CASE WHEN facility.id IS NOT NULL THEN 'facility' WHEN site.id IS NOT NULL THEN 'site' ELSE 'business_unit' END AS entity_type
           FROM platform.carbon_boundary_members member
           JOIN platform.carbon_reporting_periods period
             ON period.organization_id=member.organization_id AND period.id=$3 AND period.inventory_id=member.inventory_id
           LEFT JOIN platform.facilities facility ON facility.organization_id=member.organization_id AND facility.id=member.facility_id
           LEFT JOIN platform.sites site ON site.organization_id=member.organization_id AND site.id=member.site_id
           LEFT JOIN platform.business_units unit ON unit.organization_id=member.organization_id AND unit.id=member.business_unit_id
          WHERE member.organization_id=$1 AND member.inventory_id=$2
            AND (member.effective_from IS NULL OR member.effective_from <= period.starts_on)
            AND (member.effective_to IS NULL OR member.effective_to >= period.ends_on)
          ORDER BY member.created_at, member.id LIMIT 2001`,
        [context.organizationId, input.inventoryId, input.reportingPeriodId]
      ),
      client.query(
        `SELECT calculation.id AS calculation_id, calculation.approved_by AS calculation_approved_by,
                calculation.approved_at AS calculation_approved_at,
                run.id AS run_id, run.input_sha256 AS run_input_sha256,
                detail.id AS detail_id, detail.input_sha256, detail.formula, detail.activity_quantity,
                detail.activity_unit, detail.conversion_factor, detail.factor_value, detail.factor_unit,
                detail.emissions_kg_co2e, detail.scope_2_method, detail.provenance,
                activity.id AS activity_id, activity.activity_type, activity.activity_date,
                activity.scope_category_code, category.name AS category_name,
                activity.data_quality_status, activity.data_quality_dimensions,
                activity.anomaly_status, activity.anomaly_details,
                facility.id AS facility_id, facility.name AS facility_name,
                boundary.id AS boundary_member_id, boundary.consolidation_percent AS boundary_consolidation_percent,
                factor.id AS factor_id, factor.factor_key, factor.name AS factor_name,
                factor.source_name, factor.source_url, factor.factor_year, factor.version AS factor_version,
                factor.methodology AS factor_methodology, factor.uncertainty_percent,
                COALESCE(evidence.items, '[]'::jsonb) AS evidence
           FROM platform.carbon_calculation_details detail
           JOIN platform.calculations calculation
             ON calculation.organization_id=detail.organization_id AND calculation.id=detail.calculation_id
            AND calculation.status='approved' AND calculation.project_id=$2
           JOIN platform.carbon_calculation_runs run
             ON run.organization_id=calculation.organization_id AND run.calculation_id=calculation.id
            AND run.inventory_id=$3 AND run.reporting_period_id=$4 AND run.id=$5
           JOIN platform.carbon_activity_data activity
             ON activity.organization_id=detail.organization_id AND activity.id=detail.activity_data_id
            AND activity.inventory_id=$3 AND activity.reporting_period_id=$4
            AND activity.review_status='approved' AND activity.approval_status='approved'
            AND activity.anomaly_status <> 'flagged'
           JOIN platform.carbon_scope_categories category ON category.code=activity.scope_category_code
           JOIN platform.carbon_emission_factors factor
             ON factor.organization_id=detail.organization_id AND factor.id=detail.emission_factor_id
            AND factor.review_status='approved'
           LEFT JOIN platform.facilities facility
             ON facility.organization_id=activity.organization_id AND facility.id=activity.facility_id
           LEFT JOIN platform.carbon_reporting_periods period
             ON period.organization_id=activity.organization_id AND period.id=activity.reporting_period_id
           LEFT JOIN platform.carbon_boundary_members boundary
             ON boundary.organization_id=activity.organization_id AND boundary.inventory_id=activity.inventory_id
            AND boundary.facility_id=activity.facility_id AND boundary.included=true
            AND boundary.consolidation_percent=100
            AND (boundary.effective_from IS NULL OR boundary.effective_from <= period.starts_on)
            AND (boundary.effective_to IS NULL OR boundary.effective_to >= period.ends_on)
           LEFT JOIN LATERAL (
             SELECT jsonb_agg(jsonb_build_object(
               'id', document.id, 'displayName', document.display_name, 'versionId', version.id,
               'version', version.version_number, 'sha256', version.sha256,
               'classificationStatus', document.classification_status,
               'extractionStatus', version.extraction_status
             ) ORDER BY document.id) AS items
               FROM platform.carbon_activity_evidence link
               JOIN platform.evidence_documents document
                 ON document.organization_id=link.organization_id AND document.id=link.evidence_document_id
               JOIN platform.evidence_versions version
                 ON version.organization_id=link.organization_id AND version.id=link.evidence_version_id
              WHERE link.organization_id=activity.organization_id AND link.activity_data_id=activity.id
           ) evidence ON true
          WHERE detail.organization_id=$1 AND detail.is_current=true
          ORDER BY activity.scope_category_code, activity.id LIMIT 2001`,
        [context.organizationId, input.projectId, input.inventoryId, input.reportingPeriodId, input.calculationRunId]
      )
    ]);
    if (boundaryResult.rows.length > MAX_REPORT_LINES || lineResult.rows.length > MAX_REPORT_LINES) {
      throw conflictError('The report exceeds the supported line limit.');
    }
    if (header.project_activity_count !== header.period_activity_count || !lineResult.rows.length
      || lineResult.rows.length !== header.period_activity_count) {
      throw conflictError('The approved calculation run must cover every current activity in the project reporting period.');
    }
    if (lineResult.rows.some((line) => !line.boundary_member_id || Number(line.boundary_consolidation_percent) !== 100)) {
      throw conflictError('Professional reports currently require every activity facility to be in an effective, included 100% consolidation boundary.');
    }
    return assembleCarbonProfessionalReport(header, boundaryResult.rows, lineResult.rows, new Date().toISOString());
  });
}

export function assembleCarbonProfessionalReport(header, boundaryRows, lines, generatedAt) {
  const calculationIds = unique(lines.map((line) => line.calculation_id));
  const evidence = lines.flatMap((line) => Array.isArray(line.evidence) ? line.evidence : []);
  const evidenceIds = unique(evidence.map((item) => item.id));
  const evidenceVersions = [...new Map(evidence.map((item) => [`${item.id}:${item.versionId}`, {
    evidenceId: item.id, versionId: item.versionId, sha256: item.sha256
  }])).values()];
  const sourceManifest = {
    inventoryId: header.inventory_id,
    reportingPeriodId: header.reporting_period_id,
    calculationRuns: unique(lines.map((line) => line.run_id)).map((id) => ({
      id, inputSha256: lines.find((line) => line.run_id === id).run_input_sha256
    })),
    calculationDetails: lines.map((line) => ({ id: line.detail_id, inputSha256: line.input_sha256 })),
    evidenceVersions
  };
  const totals = totalsByScope(lines);
  const evidenceCovered = lines.filter((line) => Array.isArray(line.evidence) && line.evidence.length).length;
  const evidenceReviewComplete = evidenceCovered === lines.length && evidence.every((item) =>
    item.classificationStatus === 'approved' && item.extractionStatus === 'complete');
  const calculationProvenanceComplete = lines.every((line) => line.input_sha256 && line.factor_version && line.run_input_sha256);
  const traceabilityComplete = evidenceReviewComplete && calculationProvenanceComplete;
  const largest = Object.entries({ 'Scope 1': totals.scope1KgCo2e, 'Scope 2': totals.scope2LocationKgCo2e, 'Scope 3': totals.scope3KgCo2e })
    .sort((a, b) => b[1] - a[1])[0];
  const metadata = {
    organizationName: header.organization_name,
    reportTitle: `${header.organization_name} ${header.reporting_period_label} carbon inventory`,
    reportingStandard: header.reporting_standard,
    reportingPeriodLabel: header.reporting_period_label,
    generatedAt,
    inventoryVersion: new Date(header.inventory_updated_at).toISOString(),
    ledgerHash: crypto.createHash('sha256').update(canonicalJson(sourceManifest)).digest('hex'),
    traceabilityStatus: traceabilityComplete ? 'complete' : 'partial',
    evidenceReviewStatus: evidenceReviewComplete ? 'complete' : 'partial',
    calculationProvenanceStatus: calculationProvenanceComplete ? 'complete' : 'partial',
    reviewStatus: header.period_status,
    assuranceStatus: 'unassured'
  };
  const sources = lines.map((line) => ({ activity: line.activity_type, scopeCategoryCode: line.scope_category_code, category: line.category_name,
    facility: line.facility_name || 'Unassigned', quantity: Number(line.activity_quantity), unit: line.activity_unit,
    emissionsKgCo2e: Number(line.emissions_kg_co2e), dataQuality: line.data_quality_status }));
  const factors = uniqueBy(lines.map((line) => ({ id: line.factor_id, key: line.factor_key, name: line.factor_name,
    value: Number(line.factor_value), unit: line.factor_unit, source: line.source_name, sourceUrl: line.source_url,
    year: line.factor_year, version: line.factor_version, methodology: line.factor_methodology,
    uncertaintyPercent: line.uncertainty_percent === null ? null : Number(line.uncertainty_percent) })), 'id');
  return {
    metadata,
    sections: {
      executiveSummary: { totalKgCo2e: totals.totalLocationKgCo2e, scope1KgCo2e: totals.scope1KgCo2e,
        scope2LocationKgCo2e: totals.scope2LocationKgCo2e, scope3KgCo2e: totals.scope3KgCo2e,
        reviewStatus: header.period_status, assuranceStatus: 'unassured' },
      inventoryBoundary: boundaryRows.length ? boundaryRows.map((row) => ({ entity: row.entity_name, type: row.entity_type,
        included: row.included, consolidationPercent: Number(row.consolidation_percent), control: row.control_classification,
        exclusionReason: row.exclusion_reason })) : [{ status: 'No boundary members recorded' }],
      reportingPeriod: { label: header.reporting_period_label, startsOn: header.starts_on, endsOn: header.ends_on,
        status: header.period_status, approvedAt: header.period_approved_at },
      methodology: { standard: header.reporting_standard, consolidationApproach: header.consolidation_approach,
        operationalBoundary: header.operational_boundary, boundaryNotes: header.boundary_notes || 'No additional boundary notes' },
      scope1: sources.filter((row) => row.scopeCategoryCode.startsWith('scope_1.')),
      scope2: sources.filter((row) => row.scopeCategoryCode.startsWith('scope_2.')),
      scope3: sources.filter((row) => row.scopeCategoryCode.startsWith('scope_3.')),
      emissionSources: sources,
      emissionFactors: factors,
      calculationMethodology: lines.map((line) => ({ activityId: line.activity_id, formula: line.formula,
        inputSha256: line.input_sha256, conversionFactor: Number(line.conversion_factor) })),
      evidenceCoverage: { coveredActivities: evidenceCovered, totalActivities: lines.length,
        coveragePercent: Math.round((evidenceCovered / lines.length) * 100), exactEvidenceVersions: evidence.length,
        reviewedEvidenceComplete: evidenceReviewComplete },
      dataQuality: qualitySummary(lines),
      assumptions: [{ text: header.boundary_notes || 'No customer-supplied inventory assumptions were recorded.' }],
      exceptionsAndAnomalies: [{ status: 'Only approved, anomaly-free current calculation lines are included.' }],
      yearOverYearAnalysis: [{ status: 'Not included unless an explicitly linked comparison period is validated.' }],
      decarbonizationOpportunities: largest[1] > 0
        ? [{ measuredSignal: `${largest[0]} is the largest measured scope`, emissionsKgCo2e: largest[1] }]
        : [{ status: 'No measured reduction signal is available.' }],
      terrnixRecommendations: [{ recommendation: `Review the evidence and operational drivers behind ${largest[0]}.`,
        basis: 'Largest measured scope in this approved reporting period', requiresOperationalValidation: true }],
      auditProvenanceAppendix: lines.map((line) => ({ calculationId: line.calculation_id, runId: line.run_id,
        detailId: line.detail_id, activityId: line.activity_id, inputSha256: line.input_sha256,
        factorId: line.factor_id, factorVersion: line.factor_version,
        evidenceVersionIds: (line.evidence || []).map((item) => item.versionId).join(', ') || 'None' }))
    },
    sourceManifest,
    calculationIds,
    evidenceIds
  };
}

function totalsByScope(lines) {
  const totals = { scope1KgCo2e: 0, scope2LocationKgCo2e: 0, scope2MarketKgCo2e: 0, scope3KgCo2e: 0 };
  for (const line of lines) {
    const value = Number(line.emissions_kg_co2e);
    if (line.scope_category_code.startsWith('scope_1.')) totals.scope1KgCo2e += value;
    else if (line.scope_category_code.startsWith('scope_2.')) {
      if (line.scope_2_method === 'market_based') totals.scope2MarketKgCo2e += value;
      else totals.scope2LocationKgCo2e += value;
    } else totals.scope3KgCo2e += value;
  }
  totals.totalLocationKgCo2e = totals.scope1KgCo2e + totals.scope2LocationKgCo2e + totals.scope3KgCo2e;
  return totals;
}
function qualitySummary(lines) { return [...new Set(lines.map((line) => line.data_quality_status))].map((status) => ({
  status, activities: lines.filter((line) => line.data_quality_status === status).length
})); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function uniqueBy(values, key) { return [...new Map(values.map((item) => [item[key], item])).values()]; }
function optionalText(value, max) { if (value === undefined || value === null || value === '') return null; const text = String(value).trim(); if (!text || text.length > max) throw validationError('Text value is invalid.'); return text; }
function validationError(message) { return domainError('validation_error', 400, message); }
function conflictError(message) { return domainError('carbon_report_conflict', 409, message); }
function notFoundError(message) { return domainError('carbon_report_resource_not_found', 404, message); }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
