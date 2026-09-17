import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { getApprovedLocalFactor } from './factorProvider.js';
import { appendAuditEvent, canonicalJson, requireFeature, requirePermission } from './platformService.js';

const SCOPE_CATEGORIES = /^(scope_1\.(stationary_combustion|mobile_combustion|process_emissions|fugitive_emissions)|scope_2\.(purchased_electricity|purchased_steam_heat_cooling)|scope_3\.(0[1-9]|1[0-5]))$/;
const MACHINE_CODE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const REVIEW_DECISIONS = new Set(['accepted', 'corrected', 'rejected']);
const UNIT_CONVERSIONS = new Map([
  ['kwh:kwh', 1], ['mwh:kwh', 1000], ['wh:kwh', 0.001],
  ['litre:litre', 1], ['litres:litre', 1], ['l:litre', 1],
  ['m3:m3', 1], ['m³:m3', 1], ['km:km', 1],
  ['passenger-km:passenger-km', 1], ['pkm:passenger-km', 1], ['gj:gj', 1]
]);

export async function listCarbonInventories(databasePool, context) {
  return carbonContext(databasePool, context, 'calculation.read', async (client) => {
    const result = await client.query(
      `SELECT id, name, reporting_standard, consolidation_approach, operational_boundary,
              boundary_notes, base_year, status, created_at, updated_at
         FROM platform.carbon_inventories WHERE organization_id = $1
        ORDER BY updated_at DESC, id`, [context.organizationId]
    );
    return result.rows.map(inventoryResource);
  });
}

export async function createCarbonInventory(databasePool, context, input = {}) {
  const id = input.id || crypto.randomUUID();
  assertUuid(id, 'inventoryId');
  const name = requiredText(input.name, 'name', 200);
  const consolidation = enumValue(input.consolidationApproach, 'consolidationApproach',
    new Set(['operational_control', 'financial_control', 'equity_share']));
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    const result = await client.query(
      `INSERT INTO platform.carbon_inventories (
         id, organization_id, name, reporting_standard, consolidation_approach,
         operational_boundary, boundary_notes, base_year, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [id, context.organizationId, name,
        optionalText(input.reportingStandard, 100) || 'ghg_protocol_corporate', consolidation,
        enumValue(input.operationalBoundary || 'scopes_1_2_3', 'operationalBoundary', new Set(['scopes_1_2', 'scopes_1_2_3'])),
        optionalText(input.boundaryNotes, 5000), optionalInteger(input.baseYear, 1990, 2200), context.userId]
    );
    await audit(client, context, 'carbon_inventory.created', 'carbon_inventory', id, { name, consolidationApproach: consolidation });
    return inventoryResource(result.rows[0]);
  });
}

export async function listCarbonReportingPeriods(databasePool, context, inventoryId) {
  assertUuid(inventoryId, 'inventoryId');
  return carbonContext(databasePool, context, 'calculation.read', async (client) => {
    const result = await client.query(
      `SELECT id, inventory_id, label, starts_on, ends_on, status, comparison_period_id,
              approved_calculation_run_id, approved_by, approved_at, created_at, updated_at
         FROM platform.carbon_reporting_periods
        WHERE organization_id = $1 AND inventory_id = $2
        ORDER BY starts_on DESC, id`, [context.organizationId, inventoryId]
    );
    return result.rows.map(periodResource);
  });
}

export async function createCarbonReportingPeriod(databasePool, context, inventoryId, input = {}) {
  assertUuid(inventoryId, 'inventoryId');
  const id = input.id || crypto.randomUUID();
  assertUuid(id, 'reportingPeriodId');
  if (input.comparisonPeriodId) assertUuid(input.comparisonPeriodId, 'comparisonPeriodId');
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    const result = await client.query(
      `INSERT INTO platform.carbon_reporting_periods (
         id, organization_id, inventory_id, label, starts_on, ends_on, comparison_period_id, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, context.organizationId, inventoryId, requiredText(input.label, 'label', 100),
        isoDate(input.startsOn, 'startsOn'), isoDate(input.endsOn, 'endsOn'), input.comparisonPeriodId || null, context.userId]
    );
    await audit(client, context, 'carbon_reporting_period.created', 'carbon_reporting_period', id, { inventoryId });
    return periodResource(result.rows[0]);
  });
}

export async function transitionCarbonReportingPeriod(databasePool, context, inventoryId, periodId, input = {}) {
  assertUuid(inventoryId, 'inventoryId');
  assertUuid(periodId, 'reportingPeriodId');
  const status = enumValue(input.status, 'status', new Set(['open', 'in_review', 'approved', 'locked']));
  if (status === 'approved') assertUuid(input.calculationRunId, 'calculationRunId');
  const transitions = { open: new Set(['in_review']), in_review: new Set(['open', 'approved']), approved: new Set(['locked']), locked: new Set() };
  const permission = ['approved', 'locked'].includes(status) ? 'calculation.approve' : 'calculation.create';
  return carbonContext(databasePool, context, permission, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${context.organizationId}:carbon-boundary:${inventoryId}`]);
    const current = await client.query(
      `SELECT status FROM platform.carbon_reporting_periods
        WHERE organization_id=$1 AND id=$2 AND inventory_id=$3 FOR UPDATE`,
      [context.organizationId, periodId, inventoryId]
    );
    if (!current.rows[0]) throw notFoundError('Reporting period was not found.');
    if (!transitions[current.rows[0].status].has(status)) throw conflictError(`Reporting period cannot transition from ${current.rows[0].status} to ${status}.`);
    if (status === 'approved') {
      const readiness = await client.query(
        `SELECT count(*) FILTER (WHERE review_status <> 'approved' OR approval_status <> 'approved' OR anomaly_status = 'flagged')::integer AS blocked,
                count(*)::integer AS total,
                (SELECT count(DISTINCT item.activity_data_id)::integer
                   FROM platform.carbon_calculation_runs run
                   JOIN platform.calculations calculation
                     ON calculation.organization_id=run.organization_id AND calculation.id=run.calculation_id
                    AND calculation.status='approved'
                   JOIN platform.carbon_calculation_run_activities item
                     ON item.organization_id=run.organization_id AND item.run_id=run.id
                   JOIN platform.carbon_calculation_details detail
                     ON detail.organization_id=item.organization_id AND detail.id=item.calculation_detail_id
                    AND detail.is_current=true
                  WHERE run.organization_id=$1 AND run.inventory_id=$2 AND run.reporting_period_id=$3
                    AND run.id=$4) AS approved_calculated,
                (SELECT count(*)::integer FROM platform.carbon_activity_data activity
                  JOIN platform.carbon_reporting_periods approval_period
                    ON approval_period.organization_id=activity.organization_id AND approval_period.id=activity.reporting_period_id
                  LEFT JOIN platform.carbon_boundary_members boundary
                    ON boundary.organization_id=activity.organization_id AND boundary.inventory_id=activity.inventory_id
                   AND boundary.facility_id=activity.facility_id AND boundary.included=true
                   AND boundary.consolidation_percent=100
                   AND (boundary.effective_from IS NULL OR boundary.effective_from <= approval_period.starts_on)
                   AND (boundary.effective_to IS NULL OR boundary.effective_to >= approval_period.ends_on)
                  WHERE activity.organization_id=$1 AND activity.inventory_id=$2 AND activity.reporting_period_id=$3
                    AND boundary.id IS NULL) AS uncovered_boundary
           FROM platform.carbon_activity_data
          WHERE organization_id=$1 AND inventory_id=$2 AND reporting_period_id=$3`,
        [context.organizationId, inventoryId, periodId, input.calculationRunId]
      );
      if (!readiness.rows[0].total || readiness.rows[0].blocked || readiness.rows[0].uncovered_boundary
        || readiness.rows[0].approved_calculated !== readiness.rows[0].total) {
        throw conflictError('A reporting period requires one approved full-coverage run over boundary-aligned, approved, anomaly-free activity data.');
      }
    }
    const result = await client.query(
      `UPDATE platform.carbon_reporting_periods SET status=$1,
          approved_calculation_run_id=CASE WHEN $1='approved' THEN $5 ELSE approved_calculation_run_id END
        WHERE organization_id=$2 AND id=$3 AND inventory_id=$4 RETURNING *`,
      [status, context.organizationId, periodId, inventoryId, input.calculationRunId || null]
    );
    await audit(client, context, `carbon_reporting_period.${status}`, 'carbon_reporting_period', periodId, { inventoryId, previousStatus: current.rows[0].status });
    return periodResource(result.rows[0]);
  });
}

export async function createCarbonBoundaryMember(databasePool, context, inventoryId, input = {}) {
  assertUuid(inventoryId, 'inventoryId');
  const id = input.id || crypto.randomUUID();
  assertUuid(id, 'boundaryMemberId');
  const target = ['businessUnitId', 'siteId', 'facilityId'].filter((key) => input[key]);
  if (target.length !== 1) throw validationError('Exactly one boundary target is required.');
  assertUuid(input[target[0]], target[0]);
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${context.organizationId}:carbon-boundary:${inventoryId}`]);
    const result = await client.query(
      `INSERT INTO platform.carbon_boundary_members (
         id, organization_id, inventory_id, business_unit_id, site_id, facility_id,
         ownership_percent, consolidation_percent, control_classification, included,
         exclusion_reason, effective_from, effective_to
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, context.organizationId, inventoryId, input.businessUnitId || null, input.siteId || null,
        input.facilityId || null, optionalNumber(input.ownershipPercent, 0, 100),
        numberValue(input.consolidationPercent, 'consolidationPercent', 0, 100),
        enumValue(input.controlClassification, 'controlClassification', new Set(['operational_control', 'financial_control', 'equity_share', 'not_controlled'])),
        input.included !== false, input.included === false ? requiredText(input.exclusionReason, 'exclusionReason', 1000) : null,
        input.effectiveFrom ? isoDate(input.effectiveFrom, 'effectiveFrom') : null,
        input.effectiveTo ? isoDate(input.effectiveTo, 'effectiveTo') : null]
    );
    await audit(client, context, 'carbon_boundary_member.created', 'carbon_boundary_member', id, { inventoryId, target: target[0] });
    return boundaryResource(result.rows[0]);
  });
}

export async function listCarbonBoundaryMembers(databasePool, context, inventoryId) {
  assertUuid(inventoryId, 'inventoryId');
  return carbonContext(databasePool, context, 'calculation.read', async (client) => {
    const result = await client.query('SELECT * FROM platform.carbon_boundary_members WHERE organization_id = $1 AND inventory_id = $2 ORDER BY created_at, id', [context.organizationId, inventoryId]);
    return result.rows.map(boundaryResource);
  });
}

export async function reviseCarbonBoundaryMember(databasePool, context, boundaryMemberId, input = {}) {
  assertUuid(boundaryMemberId, 'boundaryMemberId');
  const effectiveFrom = isoDate(input.effectiveFrom, 'effectiveFrom');
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    const currentResult = await client.query(
      `SELECT * FROM platform.carbon_boundary_members WHERE organization_id=$1 AND id=$2 FOR UPDATE`,
      [context.organizationId, boundaryMemberId]
    );
    const current = currentResult.rows[0];
    if (!current) throw notFoundError('Boundary member was not found.');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [`${context.organizationId}:carbon-boundary:${current.inventory_id}`]);
    const closeResult = await client.query(
      `UPDATE platform.carbon_boundary_members SET effective_to=$1::date - 1
        WHERE organization_id=$2 AND id=$3
          AND (effective_from IS NULL OR effective_from < $1::date)
          AND (effective_to IS NULL OR effective_to >= $1::date)
        RETURNING *`, [effectiveFrom, context.organizationId, boundaryMemberId]
    );
    if (!closeResult.rows[0]) throw conflictError('The successor boundary must start after the current boundary begins and before it ends.');
    const id = input.id || crypto.randomUUID();
    assertUuid(id, 'boundaryMemberId');
    const controlClassification = input.controlClassification === undefined
      ? current.control_classification
      : enumValue(input.controlClassification, 'controlClassification', new Set(['operational_control', 'financial_control', 'equity_share', 'not_controlled']));
    const result = await client.query(
      `INSERT INTO platform.carbon_boundary_members (
         id, organization_id, inventory_id, business_unit_id, site_id, facility_id,
         ownership_percent, consolidation_percent, control_classification, included,
         exclusion_reason, effective_from, effective_to
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, context.organizationId, current.inventory_id, current.business_unit_id, current.site_id, current.facility_id,
        input.ownershipPercent === undefined ? current.ownership_percent : optionalNumber(input.ownershipPercent, 0, 100),
        input.consolidationPercent === undefined ? Number(current.consolidation_percent) : numberValue(input.consolidationPercent, 'consolidationPercent', 0, 100),
        controlClassification,
        input.included === undefined ? current.included : input.included,
        input.included === false ? requiredText(input.exclusionReason, 'exclusionReason', 1000) : null,
        effectiveFrom, input.effectiveTo ? isoDate(input.effectiveTo, 'effectiveTo') : null]
    );
    await audit(client, context, 'carbon_boundary_member.revised', 'carbon_boundary_member', id,
      { inventoryId: current.inventory_id, supersedesBoundaryMemberId: boundaryMemberId, effectiveFrom });
    return { previous: boundaryResource(closeResult.rows[0]), current: boundaryResource(result.rows[0]) };
  });
}

export async function createCarbonActivity(databasePool, context, input = {}) {
  for (const [value, name] of [[input.inventoryId, 'inventoryId'], [input.reportingPeriodId, 'reportingPeriodId'], [input.projectId, 'projectId']]) assertUuid(value, name);
  if (input.facilityId) assertUuid(input.facilityId, 'facilityId');
  if (input.evidenceId) assertUuid(input.evidenceId, 'evidenceId');
  if (input.evidenceVersionId) assertUuid(input.evidenceVersionId, 'evidenceVersionId');
  const id = input.id || crypto.randomUUID();
  assertUuid(id, 'activityId');
  const scopeCategory = String(input.scopeCategoryCode || '');
  if (!SCOPE_CATEGORIES.test(scopeCategory)) throw validationError('scopeCategoryCode is invalid.');
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    if (input.evidenceId) {
      await requirePermission(client, 'evidence.read');
      const evidence = await client.query(
        `SELECT document.id, version.id AS version_id
           FROM platform.evidence_documents document
           JOIN platform.evidence_versions version ON version.organization_id = document.organization_id
            AND version.evidence_document_id = document.id AND version.version_number = document.current_version
          WHERE document.organization_id = $1 AND document.id = $2 AND document.deleted_at IS NULL
            AND document.classification_status IN ('classified','approved')
            AND version.extraction_status = 'complete'`, [context.organizationId, input.evidenceId]
      );
      if (!evidence.rows[0] || (input.evidenceVersionId && evidence.rows[0].version_id !== input.evidenceVersionId)) {
        throw conflictError('Evidence must be current, extracted, reviewed, and tenant-owned before activity linking.');
      }
      input.evidenceVersionId = evidence.rows[0].version_id;
    }
    const result = await client.query(
      `INSERT INTO platform.carbon_activity_data (
         id, organization_id, inventory_id, reporting_period_id, project_id, facility_id,
         scope_category_code, activity_type, quantity, unit, activity_date,
         data_quality_status, data_quality_dimensions, anomaly_status, anomaly_details,
         source_reference, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [id, context.organizationId, input.inventoryId, input.reportingPeriodId, input.projectId,
        input.facilityId || null, scopeCategory, requiredText(input.activityType, 'activityType', 150),
        positiveNumber(input.quantity, 'quantity'), requiredText(input.unit, 'unit', 50),
        input.activityDate ? isoDate(input.activityDate, 'activityDate') : null,
        enumValue(input.dataQualityStatus || 'unassessed', 'dataQualityStatus', new Set(['unassessed', 'estimated', 'secondary', 'primary', 'verified'])),
        objectValue(input.dataQualityDimensions), enumValue(input.anomalyStatus || 'unchecked', 'anomalyStatus', new Set(['unchecked', 'clear', 'flagged', 'resolved'])),
        arrayValue(input.anomalyDetails), input.evidenceId ? `evidence:${input.evidenceId}:${input.evidenceVersionId}` : optionalText(input.sourceReference, 1000), context.userId]
    );
    if (input.evidenceId) {
      await client.query(
        `INSERT INTO platform.carbon_activity_evidence (
           organization_id, activity_data_id, evidence_document_id, evidence_version_id, linked_by
         ) VALUES ($1,$2,$3,$4,$5)`,
        [context.organizationId, id, input.evidenceId, input.evidenceVersionId, context.userId]
      );
    }
    await audit(client, context, 'carbon_activity.created', 'carbon_activity', id, { inventoryId: input.inventoryId, reportingPeriodId: input.reportingPeriodId, evidenceId: input.evidenceId || null });
    return activityResource(result.rows[0]);
  });
}

export async function reviewCarbonActivity(databasePool, context, activityId, input = {}) {
  assertUuid(activityId, 'activityId');
  const decision = enumValue(input.decision, 'decision', new Set(['approved', 'rejected']));
  return carbonContext(databasePool, context, 'calculation.approve', async (client) => {
    const result = await client.query(
      `UPDATE platform.carbon_activity_data
          SET review_status = $1, approval_status = $1, anomaly_status = CASE WHEN $1 = 'approved' AND anomaly_status = 'unchecked' THEN 'clear' ELSE anomaly_status END
        WHERE organization_id = $2 AND id = $3 AND review_status IN ('draft','review_required')
        RETURNING *`, [decision, context.organizationId, activityId]
    );
    if (!result.rows[0]) throw notFoundError('Reviewable carbon activity was not found.');
    await audit(client, context, `carbon_activity.${decision}`, 'carbon_activity', activityId, { reason: optionalText(input.reason, 1000) });
    return activityResource(result.rows[0]);
  });
}

export async function proposeCarbonFactor(databasePool, context, activityId, input = {}) {
  assertUuid(activityId, 'activityId');
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:factor-proposal:${activityId}`]);
    const activityResult = await client.query('SELECT * FROM platform.carbon_activity_data WHERE organization_id = $1 AND id = $2', [context.organizationId, activityId]);
    const activity = activityResult.rows[0];
    if (!activity) throw notFoundError('Carbon activity was not found.');
    const suggestion = deterministicSuggestion(activity, input);
    let factorId = null;
    let snapshot = null;
    if (suggestion.factorGroup) {
      const approved = await getApprovedLocalFactor(suggestion.factorGroup, suggestion.factorKey);
      if (!approved) throw conflictError('The deterministic rules selected an unavailable factor.');
      snapshot = factorSnapshot(suggestion, approved);
      const existing = await client.query(
        `SELECT id FROM platform.carbon_emission_factors
          WHERE organization_id = $1 AND factor_key = $2 AND version = $3`,
        [context.organizationId, `${suggestion.factorGroup}.${suggestion.factorKey}`, approved.metadata.version]
      );
      factorId = existing.rows[0]?.id || crypto.randomUUID();
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO platform.carbon_emission_factors (
             id, organization_id, factor_key, name, factor_value, numerator_unit, denominator_unit,
             source_name, source_url, geography, factor_year, version, methodology,
             uncertainty_percent, review_status, created_by
           ) VALUES ($1,$2,$3,$4,$5,'kgCO2e',$6,$7,$8,$9,$10,$11,$12,$13,'proposed',$14)`,
          [factorId, context.organizationId, `${suggestion.factorGroup}.${suggestion.factorKey}`,
            approved.factor.name, approved.factor.value, approved.factor.activity_unit, approved.factor.source,
            approved.factor.source_url || null, suggestion.geography || null, approved.factor.year || null,
            approved.metadata.version, suggestion.ruleset, confidenceUncertainty(suggestion.confidence), context.userId]
        );
      }
    }
    const revisionResult = await client.query('SELECT COALESCE(max(revision),0)::integer AS revision FROM platform.carbon_factor_mapping_proposals WHERE organization_id=$1 AND activity_data_id=$2', [context.organizationId, activityId]);
    const revision = Number(revisionResult.rows[0].revision) + 1;
    const proposalId = crypto.randomUUID();
    await client.query(
      `INSERT INTO platform.carbon_factor_mapping_proposals (
         id, organization_id, activity_data_id, revision, proposed_factor_id, factor_snapshot,
         ruleset, confidence, rationale_code, rationale, compatibility, requires_review, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12)`,
      [proposalId, context.organizationId, activityId, revision, factorId, snapshot,
        suggestion.ruleset, suggestion.confidence, suggestion.rationaleCode,
        { considered: suggestion.considered, geography: suggestion.geography || null }, suggestion.compatibility, context.userId]
    );
    await audit(client, context, 'carbon_factor_mapping.proposed', 'carbon_activity', activityId,
      { proposalId, revision, factorId, confidence: suggestion.confidence, compatibility: suggestion.compatibility, rationaleCode: suggestion.rationaleCode });
    return { id: proposalId, activityId, revision, factorId, factor: snapshot, confidence: suggestion.confidence,
      compatibility: suggestion.compatibility, requiresReview: true, rationaleCode: suggestion.rationaleCode };
  });
}

export async function reviewCarbonFactorProposal(databasePool, context, proposalId, input = {}) {
  assertUuid(proposalId, 'proposalId');
  const decision = enumValue(input.decision, 'decision', REVIEW_DECISIONS);
  if (input.selectedFactorId) assertUuid(input.selectedFactorId, 'selectedFactorId');
  const expectedRevision = integerValue(input.expectedRevision, 'expectedRevision', 0, 1000000);
  return carbonContext(databasePool, context, 'calculation.approve', async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:factor-review:${proposalId}`]);
    const proposalResult = await client.query('SELECT * FROM platform.carbon_factor_mapping_proposals WHERE organization_id=$1 AND id=$2', [context.organizationId, proposalId]);
    const proposal = proposalResult.rows[0];
    if (!proposal) throw notFoundError('Factor proposal was not found.');
    if (decision === 'accepted' && (!proposal.proposed_factor_id || proposal.compatibility === 'incompatible')) {
      throw conflictError('Missing or incompatible factor proposals cannot be accepted.');
    }
    const latest = await client.query('SELECT COALESCE(max(revision),0)::integer AS revision FROM platform.carbon_factor_mapping_reviews WHERE organization_id=$1 AND proposal_id=$2', [context.organizationId, proposalId]);
    if (Number(latest.rows[0].revision) !== expectedRevision) throw conflictError('The factor review changed; reload before saving.');
    const selectedFactorId = decision === 'accepted' ? proposal.proposed_factor_id : (decision === 'corrected' ? input.selectedFactorId : null);
    if (decision === 'corrected' && !selectedFactorId) throw validationError('selectedFactorId is required for a correction.');
    if (selectedFactorId) {
      const factor = await client.query('SELECT id, review_status FROM platform.carbon_emission_factors WHERE organization_id=$1 AND id=$2', [context.organizationId, selectedFactorId]);
      if (!factor.rows[0]) throw notFoundError('Selected factor was not found.');
      if (factor.rows[0].review_status === 'proposed') {
        await client.query("UPDATE platform.carbon_emission_factors SET review_status='approved', reviewed_by=$1, reviewed_at=now() WHERE organization_id=$2 AND id=$3", [context.userId, context.organizationId, selectedFactorId]);
      } else if (factor.rows[0].review_status !== 'approved') throw conflictError('Selected factor is not approved.');
    }
    const reviewId = crypto.randomUUID();
    const revision = expectedRevision + 1;
    await client.query(
      `INSERT INTO platform.carbon_factor_mapping_reviews (
         id, organization_id, proposal_id, revision, decision, selected_factor_id,
         reason_code, comment, reviewed_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [reviewId, context.organizationId, proposalId, revision, decision, selectedFactorId,
        machineCode(input.reasonCode || `review.${decision}`, 'reasonCode'), optionalText(input.comment, 2000), context.userId]
    );
    await audit(client, context, 'carbon_factor_mapping.reviewed', 'carbon_activity', proposal.activity_data_id,
      { proposalId, reviewId, revision, decision, selectedFactorId });
    return { id: reviewId, proposalId, revision, decision, selectedFactorId };
  });
}

export async function createCarbonCalculationRun(databasePool, context, input = {}) {
  assertUuid(input.inventoryId, 'inventoryId');
  assertUuid(input.reportingPeriodId, 'reportingPeriodId');
  const activityIds = uniqueUuidArray(input.activityIds, 'activityIds', 1000);
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey', 200);
  return carbonContext(databasePool, context, 'calculation.create', async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${context.organizationId}:carbon-run:${idempotencyKey}`]);
    const inputHash = crypto.createHash('sha256').update(canonicalJson({ inventoryId: input.inventoryId, reportingPeriodId: input.reportingPeriodId, activityIds: [...activityIds].sort() })).digest('hex');
    const existing = await client.query('SELECT id, calculation_id, input_sha256 FROM platform.carbon_calculation_runs WHERE organization_id=$1 AND idempotency_key=$2', [context.organizationId, idempotencyKey]);
    if (existing.rows[0]) {
      if (existing.rows[0].input_sha256 !== inputHash) throw conflictError('The idempotency key was used with different run inputs.');
      return loadCalculationRun(client, context.organizationId, existing.rows[0].id, true);
    }
    const period = await client.query('SELECT status FROM platform.carbon_reporting_periods WHERE organization_id=$1 AND id=$2 AND inventory_id=$3 FOR UPDATE', [context.organizationId, input.reportingPeriodId, input.inventoryId]);
    if (!period.rows[0]) throw notFoundError('Reporting period was not found.');
    if (!['open', 'in_review'].includes(period.rows[0].status)) throw conflictError('Approved or locked reporting periods cannot be recalculated.');
    const rows = await client.query(
      `SELECT activity.*, proposal.id AS proposal_id, proposal.compatibility,
              review.id AS review_id, review.decision, review.selected_factor_id,
              factor.factor_value, factor.denominator_unit, factor.numerator_unit,
              factor.factor_key, factor.name AS factor_name, factor.source_name,
              factor.source_url, factor.factor_year, factor.version AS factor_version,
              factor.methodology AS factor_methodology, factor.review_status AS factor_review_status
         FROM platform.carbon_activity_data activity
         JOIN LATERAL (SELECT item.* FROM platform.carbon_factor_mapping_proposals item
           WHERE item.organization_id=activity.organization_id AND item.activity_data_id=activity.id
           ORDER BY item.revision DESC LIMIT 1) proposal ON true
         JOIN LATERAL (SELECT item.* FROM platform.carbon_factor_mapping_reviews item
           WHERE item.organization_id=proposal.organization_id AND item.proposal_id=proposal.id
           ORDER BY item.revision DESC LIMIT 1) review ON true
         JOIN platform.carbon_emission_factors factor ON factor.organization_id=review.organization_id AND factor.id=review.selected_factor_id
        WHERE activity.organization_id=$1 AND activity.inventory_id=$2 AND activity.reporting_period_id=$3
          AND activity.id=ANY($4::uuid[]) ORDER BY activity.id FOR UPDATE OF activity`,
      [context.organizationId, input.inventoryId, input.reportingPeriodId, activityIds]
    );
    if (rows.rows.length !== activityIds.length) throw conflictError('Every selected activity must have a reviewed factor mapping in this tenant and period.');
    const boundaryCoverage = await client.query(
      `SELECT count(*) FILTER (WHERE boundary.id IS NULL)::integer AS blocked
         FROM platform.carbon_activity_data activity
         JOIN platform.carbon_reporting_periods period
           ON period.organization_id=activity.organization_id AND period.id=activity.reporting_period_id
         LEFT JOIN platform.carbon_boundary_members boundary
           ON boundary.organization_id=activity.organization_id AND boundary.inventory_id=activity.inventory_id
          AND boundary.facility_id=activity.facility_id AND boundary.included=true
          AND boundary.consolidation_percent=100
          AND (boundary.effective_from IS NULL OR boundary.effective_from <= period.starts_on)
          AND (boundary.effective_to IS NULL OR boundary.effective_to >= period.ends_on)
        WHERE activity.organization_id=$1 AND activity.inventory_id=$2 AND activity.reporting_period_id=$3
          AND activity.id=ANY($4::uuid[])`,
      [context.organizationId, input.inventoryId, input.reportingPeriodId, activityIds]
    );
    if (boundaryCoverage.rows[0].blocked) {
      throw conflictError('Calculation currently requires every activity facility to be in an effective, included 100% consolidation boundary.');
    }
    const projectIds = new Set(rows.rows.map((row) => row.project_id));
    if (projectIds.size !== 1 || projectIds.has(null)) throw conflictError('A calculation run must contain activities from one project.');
    const lines = rows.rows.map((row) => calculationLine(row));
    const totals = totalsByScope(rows.rows, lines);
    const calculationId = crypto.randomUUID();
    await client.query(
      `INSERT INTO platform.calculations (
         id, organization_id, project_id, calculation_type, methodology, status,
         input_data, result_data, factor_manifest, created_by
       ) VALUES ($1,$2,$3,'carbon_inventory','ghg_protocol_corporate_standard','calculated',$4,$5,$6,$7)`,
      [calculationId, context.organizationId, rows.rows[0].project_id,
        { inventoryId: input.inventoryId, reportingPeriodId: input.reportingPeriodId, activityIds },
        { ...totals, lineCount: lines.length, assuranceStatus: 'unassured' },
        lines.map((line) => line.factorSnapshot), context.userId]
    );
    const runId = crypto.randomUUID();
    await client.query(
      `INSERT INTO platform.carbon_calculation_runs (
         id, organization_id, inventory_id, reporting_period_id, calculation_id,
         idempotency_key, input_sha256, activity_count, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [runId, context.organizationId, input.inventoryId, input.reportingPeriodId, calculationId,
        idempotencyKey, inputHash, lines.length, context.userId]
    );
    for (let index = 0; index < lines.length; index += 1) {
      const row = rows.rows[index];
      const line = lines[index];
      const detailId = crypto.randomUUID();
      const priorResult = await client.query(
        `SELECT id, calculation_version FROM platform.carbon_calculation_details
          WHERE organization_id=$1 AND activity_data_id=$2 AND is_current=true
          FOR UPDATE`, [context.organizationId, row.id]
      );
      const prior = priorResult.rows[0] || null;
      if (prior) {
        await client.query(
          `UPDATE platform.carbon_calculation_details SET is_current=false
            WHERE organization_id=$1 AND id=$2`, [context.organizationId, prior.id]
        );
      }
      await client.query(
        `INSERT INTO platform.carbon_calculation_details (
           id, organization_id, calculation_id, activity_data_id, emission_factor_id,
           formula, activity_quantity, activity_unit, scope_2_method, conversion_factor,
           factor_value, factor_unit, emissions_kg_co2e, provenance, input_sha256,
           calculation_version, supersedes_calculation_detail_id, recalculation_reason,
           calculated_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [detailId, context.organizationId, calculationId, row.id, row.selected_factor_id,
          line.formula, row.quantity, row.unit, line.scope2Method, line.conversionFactor,
          row.factor_value, `${row.numerator_unit}/${row.denominator_unit}`, line.emissionsKgCo2e,
          { factorProposalId: row.proposal_id, factorReviewId: row.review_id, factorVersion: row.factor_version },
          line.inputSha256, prior ? Number(prior.calculation_version) + 1 : 1, prior?.id || null,
          prior ? requiredText(input.recalculationReason, 'recalculationReason', 1000) : null,
          context.userId]
      );
      await client.query(
        `INSERT INTO platform.carbon_calculation_run_activities (
           organization_id, run_id, activity_data_id, mapping_proposal_id,
           mapping_review_id, calculation_detail_id
         ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [context.organizationId, runId, row.id, row.proposal_id, row.review_id, detailId]
      );
    }
    await audit(client, context, 'carbon_calculation_run.created', 'calculation', calculationId,
      { runId, inventoryId: input.inventoryId, reportingPeriodId: input.reportingPeriodId, activityCount: lines.length, inputSha256: inputHash });
    return loadCalculationRun(client, context.organizationId, runId, false);
  });
}

export async function getCarbonCalculationRun(databasePool, context, runId) {
  assertUuid(runId, 'runId');
  return carbonContext(databasePool, context, 'calculation.read', (client) => loadCalculationRun(client, context.organizationId, runId, false));
}

export async function reviewCarbonCalculationRun(databasePool, context, runId, input = {}) {
  assertUuid(runId, 'runId');
  const decision = enumValue(input.decision, 'decision', new Set(['approved', 'void']));
  return carbonContext(databasePool, context, 'calculation.approve', async (client) => {
    const run = await client.query(
      `SELECT run.calculation_id, run.reporting_period_id, calculation.status
         FROM platform.carbon_calculation_runs run
         JOIN platform.calculations calculation
           ON calculation.organization_id=run.organization_id AND calculation.id=run.calculation_id
        WHERE run.organization_id=$1 AND run.id=$2 FOR UPDATE OF calculation`,
      [context.organizationId, runId]
    );
    if (!run.rows[0]) throw notFoundError('Carbon calculation run was not found.');
    if (run.rows[0].status !== 'calculated') throw conflictError('Only calculated runs can receive an approval decision.');
    if (decision === 'approved') {
      const blocked = await client.query(
        `SELECT count(*)::integer AS count
           FROM platform.carbon_calculation_run_activities item
           JOIN platform.carbon_activity_data activity
             ON activity.organization_id=item.organization_id AND activity.id=item.activity_data_id
           JOIN platform.carbon_calculation_details detail
             ON detail.organization_id=item.organization_id AND detail.id=item.calculation_detail_id
          WHERE item.organization_id=$1 AND item.run_id=$2
            AND (NOT detail.is_current OR activity.review_status <> 'approved' OR activity.approval_status <> 'approved' OR activity.anomaly_status='flagged')`,
        [context.organizationId, runId]
      );
      if (blocked.rows[0].count) throw conflictError('Calculation approval requires current, approved, anomaly-free activity data.');
    }
    await client.query('UPDATE platform.calculations SET status=$1 WHERE organization_id=$2 AND id=$3',
      [decision, context.organizationId, run.rows[0].calculation_id]);
    await audit(client, context, `carbon_calculation.${decision}`, 'calculation', run.rows[0].calculation_id, { runId });
    return loadCalculationRun(client, context.organizationId, runId, false);
  });
}

async function carbonContext(pool, context, permission, operation) {
  return withPlatformContext(pool, context, async (client) => {
    await requirePermission(client, permission);
    await requireFeature(client, 'carbon.professional.workspace');
    return operation(client);
  });
}

function deterministicSuggestion(activity, input) {
  const activityType = `${activity.activity_type} ${String(input.fuelType || '')} ${String(input.travelMode || '')}`.toLowerCase();
  const unit = normalizeUnit(activity.unit);
  const geography = String(input.geography || '').trim().toUpperCase();
  const ruleset = 'terrnix-deterministic-factor-rules-v1';
  const considered = { scopeCategoryCode: activity.scope_category_code, activityType: activity.activity_type, unit };
  if (activity.scope_category_code === 'scope_2.purchased_electricity') {
    if (['GB', 'UK'].includes(geography)) return { factorGroup: 'electricity_location_based', factorKey: 'uk_2026', confidence: 0.98, compatibility: compatibleUnit(unit, 'kwh'), rationaleCode: 'electricity.uk_region', ruleset, geography, considered };
    return { factorGroup: 'electricity_location_based', factorKey: 'world_average', confidence: 0.35, compatibility: compatibleUnit(unit, 'kwh') === 'incompatible' ? 'incompatible' : 'uncertain', rationaleCode: 'electricity.region_missing_proxy', ruleset, geography, considered };
  }
  if (activity.scope_category_code === 'scope_1.stationary_combustion' && unit === 'm3') return { factorGroup: 'stationary_combustion', factorKey: 'natural_gas_m3', confidence: 0.92, compatibility: 'compatible', rationaleCode: 'combustion.natural_gas_unit', ruleset, geography, considered };
  if (activity.scope_category_code === 'scope_1.stationary_combustion' && ['litre', 'l', 'litres'].includes(unit)) {
    if (activityType.includes('diesel')) return { factorGroup: 'stationary_combustion', factorKey: 'diesel_litre', confidence: 0.95, compatibility: 'compatible', rationaleCode: 'combustion.diesel_declared', ruleset, geography, considered };
    if (activityType.includes('petrol') || activityType.includes('gasoline')) return { factorGroup: 'stationary_combustion', factorKey: 'petrol_litre', confidence: 0.95, compatibility: 'compatible', rationaleCode: 'combustion.petrol_declared', ruleset, geography, considered };
  }
  if (activity.scope_category_code === 'scope_1.mobile_combustion' && unit === 'km') return { factorGroup: 'mobile_combustion', factorKey: 'passenger_car_unknown_km', confidence: 0.65, compatibility: 'uncertain', rationaleCode: 'mobile.fuel_missing_proxy', ruleset, geography, considered };
  if (activity.scope_category_code === 'scope_3.06' && ['passenger-km', 'pkm'].includes(unit)) {
    if (activityType.includes('rail') || activityType.includes('train')) return { factorGroup: 'scope3', factorKey: 'business_rail_pkm', confidence: 0.95, compatibility: 'compatible', rationaleCode: 'travel.rail_declared', ruleset, geography, considered };
    if (activityType.includes('short') && activityType.includes('flight')) return { factorGroup: 'scope3', factorKey: 'business_flight_short_haul_pkm', confidence: 0.95, compatibility: 'compatible', rationaleCode: 'travel.short_haul_declared', ruleset, geography, considered };
    if (activityType.includes('long') && activityType.includes('flight')) return { factorGroup: 'scope3', factorKey: 'business_flight_long_haul_pkm', confidence: 0.95, compatibility: 'compatible', rationaleCode: 'travel.long_haul_declared', ruleset, geography, considered };
  }
  return { factorGroup: null, factorKey: null, confidence: 0, compatibility: 'incompatible', rationaleCode: 'factor.no_deterministic_match', ruleset, geography, considered };
}

function calculationLine(row) {
  if (row.review_status !== 'approved' || row.approval_status !== 'approved') throw conflictError('Every activity must complete human approval before calculation.');
  if (row.anomaly_status === 'flagged') throw conflictError('Flagged activity anomalies must be resolved before calculation.');
  if (!['accepted', 'corrected'].includes(row.decision) || row.factor_review_status !== 'approved') throw conflictError('Every factor must complete human approval before calculation.');
  if (row.compatibility === 'incompatible') throw conflictError('Incompatible factor mappings cannot be calculated.');
  const conversionFactor = conversion(row.unit, row.denominator_unit);
  const emissionsKgCo2e = Number(row.quantity) * conversionFactor * Number(row.factor_value);
  if (!Number.isFinite(emissionsKgCo2e) || emissionsKgCo2e < 0 || emissionsKgCo2e > 1e24) throw conflictError('Calculation result is outside supported bounds.');
  const scope2Method = row.scope_category_code.startsWith('scope_2.') ? 'location_based' : null;
  const formula = `${Number(row.quantity)} ${row.unit} x ${conversionFactor} x ${Number(row.factor_value)} kgCO2e/${row.denominator_unit}`;
  const factorSnapshot = { id: row.selected_factor_id, key: row.factor_key, name: row.factor_name,
    value: Number(row.factor_value), numeratorUnit: row.numerator_unit, denominatorUnit: row.denominator_unit,
    source: row.source_name, sourceUrl: row.source_url, year: row.factor_year, version: row.factor_version,
    methodology: row.factor_methodology };
  const inputSha256 = crypto.createHash('sha256').update(canonicalJson({ activityId: row.id, quantity: Number(row.quantity), unit: row.unit,
    factorSnapshot, conversionFactor, proposalId: row.proposal_id, reviewId: row.review_id })).digest('hex');
  return { conversionFactor, emissionsKgCo2e, scope2Method, formula, factorSnapshot, inputSha256 };
}

function totalsByScope(rows, lines) {
  const totals = { scope1KgCo2e: 0, scope2LocationKgCo2e: 0, scope2MarketKgCo2e: 0, scope3KgCo2e: 0, totalLocationKgCo2e: 0 };
  rows.forEach((row, index) => {
    const value = lines[index].emissionsKgCo2e;
    if (row.scope_category_code.startsWith('scope_1.')) totals.scope1KgCo2e += value;
    else if (row.scope_category_code.startsWith('scope_2.')) totals.scope2LocationKgCo2e += value;
    else totals.scope3KgCo2e += value;
  });
  totals.totalLocationKgCo2e = totals.scope1KgCo2e + totals.scope2LocationKgCo2e + totals.scope3KgCo2e;
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, rounded(value, 6)]));
}

async function loadCalculationRun(client, organizationId, runId, duplicate) {
  const result = await client.query(
    `SELECT run.*, calculation.status, calculation.result_data, calculation.factor_manifest,
            detail.id AS detail_id, detail.activity_data_id, detail.formula,
            detail.emissions_kg_co2e, detail.input_sha256
       FROM platform.carbon_calculation_runs run
       JOIN platform.calculations calculation ON calculation.organization_id=run.organization_id AND calculation.id=run.calculation_id
       JOIN platform.carbon_calculation_run_activities item ON item.organization_id=run.organization_id AND item.run_id=run.id
       JOIN platform.carbon_calculation_details detail ON detail.organization_id=item.organization_id AND detail.id=item.calculation_detail_id
      WHERE run.organization_id=$1 AND run.id=$2 ORDER BY detail.activity_data_id`, [organizationId, runId]
  );
  if (!result.rows[0]) throw notFoundError('Carbon calculation run was not found.');
  const row = result.rows[0];
  return { id: row.id, calculationId: row.calculation_id, inventoryId: row.inventory_id,
    reportingPeriodId: row.reporting_period_id, status: row.status, inputSha256: row.input_sha256,
    result: row.result_data, factors: row.factor_manifest, duplicate,
    lines: result.rows.map((item) => ({ id: item.detail_id, activityId: item.activity_data_id,
      formula: item.formula, emissionsKgCo2e: Number(item.emissions_kg_co2e), inputSha256: item.input_sha256 })) };
}

function factorSnapshot(suggestion, approved) { return { group: suggestion.factorGroup, key: suggestion.factorKey,
  id: approved.factor.id, name: approved.factor.name, value: approved.factor.value,
  numeratorUnit: 'kgCO2e', denominatorUnit: approved.factor.activity_unit,
  source: approved.factor.source, sourceUrl: approved.factor.source_url || null,
  year: approved.factor.year || null, version: approved.metadata.version, confidence: approved.factor.confidence }; }
function confidenceUncertainty(confidence) { return Math.round((1 - confidence) * 10000) / 100; }
function compatibleUnit(source, target) { try { conversion(source, target); return 'compatible'; } catch { return 'incompatible'; } }
function conversion(source, target) { const value = UNIT_CONVERSIONS.get(`${normalizeUnit(source)}:${normalizeUnit(target)}`); if (!value) throw conflictError(`No approved conversion exists from ${source} to ${target}.`); return value; }
function normalizeUnit(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
function inventoryResource(row) { return { id: row.id, name: row.name, reportingStandard: row.reporting_standard, consolidationApproach: row.consolidation_approach, operationalBoundary: row.operational_boundary, boundaryNotes: row.boundary_notes, baseYear: row.base_year, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }; }
function periodResource(row) { return { id: row.id, inventoryId: row.inventory_id, label: row.label, startsOn: row.starts_on, endsOn: row.ends_on, status: row.status, comparisonPeriodId: row.comparison_period_id, approvedCalculationRunId: row.approved_calculation_run_id, approvedBy: row.approved_by, approvedAt: row.approved_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function boundaryResource(row) { return { id: row.id, inventoryId: row.inventory_id, businessUnitId: row.business_unit_id, siteId: row.site_id, facilityId: row.facility_id, ownershipPercent: row.ownership_percent === null ? null : Number(row.ownership_percent), consolidationPercent: Number(row.consolidation_percent), controlClassification: row.control_classification, included: row.included, exclusionReason: row.exclusion_reason, effectiveFrom: row.effective_from, effectiveTo: row.effective_to }; }
function activityResource(row) { return { id: row.id, inventoryId: row.inventory_id, reportingPeriodId: row.reporting_period_id, projectId: row.project_id, facilityId: row.facility_id, scopeCategoryCode: row.scope_category_code, activityType: row.activity_type, quantity: Number(row.quantity), unit: row.unit, activityDate: row.activity_date, dataQualityStatus: row.data_quality_status, reviewStatus: row.review_status, approvalStatus: row.approval_status, anomalyStatus: row.anomaly_status, sourceReference: row.source_reference }; }
function audit(client, context, action, entityType, entityId, payload) { return appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId, action, entityType, entityId, payload }); }
function requiredText(value, field, max) { const text = String(value || '').trim(); if (!text || text.length > max) throw validationError(`${field} is invalid.`); return text; }
function optionalText(value, max) { if (value === undefined || value === null || value === '') return null; const text = String(value).trim(); if (!text || text.length > max) throw validationError('Text value is invalid.'); return text; }
function machineCode(value, field) { const code = requiredText(value, field, 100); if (!MACHINE_CODE.test(code)) throw validationError(`${field} is invalid.`); return code; }
function enumValue(value, field, values) { if (!values.has(value)) throw validationError(`${field} is invalid.`); return value; }
function objectValue(value) { if (value === undefined || value === null) return {}; if (typeof value !== 'object' || Array.isArray(value)) throw validationError('Expected an object.'); return value; }
function arrayValue(value) { if (value === undefined || value === null) return []; if (!Array.isArray(value) || value.length > 100) throw validationError('Expected a bounded array.'); return value; }
function positiveNumber(value, field) { return numberValue(value, field, Number.MIN_VALUE, 1e18); }
function optionalNumber(value, min, max) { return value === undefined || value === null || value === '' ? null : numberValue(value, 'number', min, max); }
function numberValue(value, field, min, max) { const number = Number(value); if (!Number.isFinite(number) || number < min || number > max) throw validationError(`${field} is invalid.`); return number; }
function optionalInteger(value, min, max) { return value === undefined || value === null || value === '' ? null : integerValue(value, 'integer', min, max); }
function integerValue(value, field, min, max) { const number = Number(value); if (!Number.isSafeInteger(number) || number < min || number > max) throw validationError(`${field} is invalid.`); return number; }
function isoDate(value, field) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw validationError(`${field} is invalid.`); return value; }
function uniqueUuidArray(value, field, max) { if (!Array.isArray(value) || value.length < 1 || value.length > max) throw validationError(`${field} is invalid.`); const unique = [...new Set(value)]; if (unique.length !== value.length) throw validationError(`${field} contains duplicates.`); unique.forEach((id) => assertUuid(id, field)); return unique; }
function rounded(value, places) { const scale = 10 ** places; return Math.round(value * scale) / scale; }
function validationError(message) { return domainError('validation_error', 400, message); }
function conflictError(message) { return domainError('carbon_workflow_conflict', 409, message); }
function notFoundError(message) { return domainError('carbon_resource_not_found', 404, message); }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
