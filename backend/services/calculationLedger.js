import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { getApprovedLocalFactor } from './factorProvider.js';
import { appendAuditEvent, canonicalJson, requireFeature, requirePermission } from './platformService.js';
import { upsertSearchDocument } from './searchService.js';
import { consumeUsage } from './usageMetering.js';

const FACTOR_GROUP_SCOPE = new Map([
  ['stationary_combustion', 'scope_1'],
  ['mobile_combustion', 'scope_1'],
  ['electricity_location_based', 'scope_2'],
  ['purchased_heat', 'scope_2'],
  ['scope3', 'scope_3']
]);
const MACHINE_CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const UNIT_CONVERSIONS = new Map([
  ['mwh:kwh', 1000], ['wh:kwh', 0.001], ['kwh:kwh', 1],
  ['litre:litre', 1], ['litres:litre', 1], ['l:litre', 1],
  ['m3:m3', 1], ['m³:m3', 1], ['km:km', 1],
  ['passenger-km:passenger-km', 1], ['pkm:passenger-km', 1],
  ['gj:gj', 1]
]);

export async function createEvidenceCalculation(databasePool, context, evidenceId, input = {}) {
  assertUuid(evidenceId, 'evidenceId');
  assertUuid(input.versionId, 'versionId');
  assertUuid(input.quantityFieldId, 'quantityFieldId');
  if (input.siteId) assertUuid(input.siteId, 'siteId');
  const factorGroup = machineCode(input.factorGroup, 'factorGroup', 100);
  const factorKey = machineCode(input.factorKey, 'factorKey', 150);
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey', 200);
  const mappingReason = requiredText(input.mappingReason, 'mappingReason', 500);
  const approved = await getApprovedLocalFactor(factorGroup, factorKey);
  if (!approved) throw domainError('factor_not_found', 404, 'The selected emission factor was not found in the approved factor bundle.');
  if (approved.factor.confidence === 'low' && input.acceptLowConfidenceFactor !== true) {
    throw domainError('factor_review_required', 409, 'This low-confidence factor requires explicit acceptance.');
  }

  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.create');
    await requireFeature(client, 'calculations.evidence_ledger');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:calculation:${idempotencyKey}`]);
    const existing = await client.query(
      `SELECT lineage.calculation_id, lineage.evidence_document_id, lineage.evidence_version_id,
              lineage.extracted_field_id, lineage.factor_group, lineage.factor_key,
              lineage.mapping_reason, calculation.site_id
       FROM platform.calculation_lineage lineage
       JOIN platform.calculations calculation ON calculation.organization_id = lineage.organization_id
         AND calculation.id = lineage.calculation_id
       WHERE lineage.organization_id = $1 AND lineage.idempotency_key = $2`,
      [context.organizationId, idempotencyKey]
    );
    if (existing.rows[0]) {
      const prior = existing.rows[0];
      if (prior.evidence_document_id !== evidenceId || prior.evidence_version_id !== input.versionId
          || prior.extracted_field_id !== input.quantityFieldId || prior.factor_group !== factorGroup
          || prior.factor_key !== factorKey || prior.mapping_reason !== mappingReason
          || (prior.site_id || null) !== (input.siteId || null)) {
        throw domainError('idempotency_conflict', 409, 'The idempotency key was already used with different calculation inputs.');
      }
      return getCalculationLedgerEntry(client, context.organizationId, prior.calculation_id, true);
    }

    const provenance = await loadEffectiveProvenance(client, context.organizationId, evidenceId, input.versionId, input.quantityFieldId);
    const expectedScope = FACTOR_GROUP_SCOPE.get(factorGroup);
    if (!expectedScope || provenance.ghgScope !== expectedScope) {
      throw domainError('factor_mapping_conflict', 409, 'The selected factor group does not match the reviewed GHG scope.');
    }
    const conversionFactor = conversion(provenance.unit, approved.factor.activity_unit);
    const sourceQuantity = positiveNumber(provenance.value, 'The effective activity quantity');
    const normalizedQuantity = sourceQuantity * conversionFactor;
    const emissionsKg = normalizedQuantity * Number(approved.factor.value);
    if (!Number.isFinite(emissionsKg)) throw validationError('The calculation result is outside the supported range.');
    const calculationId = crypto.randomUUID();
    const factorManifest = [{
      group: factorGroup, key: factorKey, id: approved.factor.id, name: approved.factor.name,
      value: approved.factor.value, unit: approved.factor.unit, activityUnit: approved.factor.activity_unit,
      source: approved.factor.source, sourceUrl: approved.factor.source_url, year: approved.factor.year,
      version: approved.metadata.version, confidence: approved.factor.confidence
    }];
    const inputData = {
      evidenceId, evidenceVersionId: input.versionId, extractedFieldId: input.quantityFieldId,
      sourceQuantity, sourceUnit: provenance.unit, conversionFactor, normalizedQuantity,
      normalizedUnit: approved.factor.activity_unit, factorGroup, factorKey,
      mappingDecision: 'user_selected', mappingReason
    };
    const resultData = {
      ghgScope: provenance.ghgScope, scope3Category: provenance.scope3Category,
      activityType: provenance.activityType, emissionsKgCo2e: rounded(emissionsKg, 6),
      emissionsTonnesCo2e: rounded(emissionsKg / 1000, 9)
    };
    await client.query(
      `INSERT INTO platform.calculations (
         id, organization_id, project_id, site_id, calculation_type, methodology,
         status, input_data, result_data, factor_manifest, created_by
       ) VALUES ($1,$2,$3,$4,'carbon_activity','activity_data_x_emission_factor','calculated',$5,$6,$7,$8)`,
      [calculationId, context.organizationId, provenance.projectId, input.siteId || null,
        inputData, resultData, JSON.stringify(factorManifest), context.userId]
    );
    await client.query(
      `INSERT INTO platform.calculation_evidence (
         organization_id, calculation_id, evidence_document_id, purpose, linked_by
       ) VALUES ($1,$2,$3,'activity_source',$4)`,
      [context.organizationId, calculationId, evidenceId, context.userId]
    );
    const formula = `${normalizedQuantity} ${approved.factor.activity_unit} x ${approved.factor.value} ${approved.factor.unit} = ${rounded(emissionsKg, 6)} kgCO2e`;
    const lineageInput = { inputData, resultData, factorManifest, sourceLocator: provenance.sourceLocator };
    await client.query(
      `INSERT INTO platform.calculation_lineage (
         organization_id, calculation_id, evidence_document_id, evidence_version_id,
         extraction_run_id, classification_proposal_id, classification_review_id,
         extracted_field_id, field_review_id, idempotency_key, source_value, source_unit,
         source_locator, conversion_factor, normalized_quantity, normalized_unit,
         effective_activity_type, effective_ghg_scope, effective_scope_3_category,
         mapping_decision, mapping_reason, factor_group, factor_key, factor_id, factor_name,
         factor_value, factor_unit, factor_source, factor_source_url, factor_year,
         factor_version, factor_confidence, formula, emissions_kg_co2e, input_sha256, calculated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                 'user_selected',$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)`,
      [context.organizationId, calculationId, evidenceId, input.versionId,
        provenance.extractionRunId, provenance.classificationProposalId, provenance.classificationReviewId,
        input.quantityFieldId, provenance.fieldReviewId, idempotencyKey, JSON.stringify(provenance.value), provenance.unit,
        provenance.sourceLocator, conversionFactor, normalizedQuantity, approved.factor.activity_unit,
        provenance.activityType, provenance.ghgScope, provenance.scope3Category,
        mappingReason, factorGroup, factorKey, approved.factor.id, approved.factor.name,
        approved.factor.value, approved.factor.unit, approved.factor.source, approved.factor.source_url || null,
        approved.factor.year || null, approved.metadata.version, approved.factor.confidence, formula, emissionsKg,
        crypto.createHash('sha256').update(canonicalJson(lineageInput)).digest('hex'), context.userId]
    );
    await consumeUsage(client, context, {
      featureCode: 'calculations.monthly', quantity: 1, idempotencyKey: `calculation:${idempotencyKey}`,
      sourceType: 'calculation', sourceRef: calculationId, metadata: { evidenceId }
    });
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'calculation.created_from_evidence', entityType: 'calculation', entityId: calculationId,
      payload: { evidenceId, evidenceVersionId: input.versionId, factorId: approved.factor.id, inputSha256: crypto.createHash('sha256').update(canonicalJson(lineageInput)).digest('hex') }
    });
    await upsertSearchDocument(client, context, {
      entityType: 'calculation', entityId: calculationId, projectId: provenance.projectId,
      sourceVersion: '1', title: `${provenance.activityType} carbon calculation`,
      body: `${provenance.ghgScope} ${approved.factor.name}`,
      keywords: [provenance.ghgScope, provenance.activityType, factorGroup],
      actionUrl: `/portal/calculations/${calculationId}`,
      metadata: { status: 'calculated', emissionsKgCo2e: rounded(emissionsKg, 6), evidenceId }
    });
    return getCalculationLedgerEntry(client, context.organizationId, calculationId, false);
  });
}

export async function getCalculationLedger(databasePool, context, calculationId) {
  assertUuid(calculationId, 'calculationId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'calculation.read');
    await requireFeature(client, 'calculations.evidence_ledger');
    return getCalculationLedgerEntry(client, context.organizationId, calculationId, false);
  });
}

async function loadEffectiveProvenance(client, organizationId, evidenceId, versionId, fieldId) {
  const result = await client.query(
    `SELECT document.project_id, document.classification_status, version.extraction_status,
            run.id AS extraction_run_id, field.value, field.unit, field.source_locator,
            field.requires_review, field_review.id AS field_review_id,
            field_review.decision AS field_review_decision,
            field_review.corrected_value, field_review.corrected_unit,
            classification.id AS classification_proposal_id,
            classification.activity_type, classification.ghg_scope, classification.scope_3_category,
            classification.requires_review AS classification_requires_review,
            classification_review.id AS classification_review_id,
            classification_review.decision AS classification_review_decision,
            classification_review.corrected_activity_type,
            classification_review.corrected_ghg_scope,
            classification_review.corrected_scope_3_category
     FROM platform.evidence_documents document
     JOIN platform.evidence_versions version ON version.organization_id = document.organization_id
       AND version.evidence_document_id = document.id AND version.id = $3
       AND version.version_number = document.current_version
     JOIN platform.document_extraction_runs run ON run.organization_id = version.organization_id
       AND run.evidence_version_id = version.id
     JOIN platform.document_extracted_fields field ON field.organization_id = version.organization_id
       AND field.evidence_version_id = version.id AND field.id = $4
     JOIN platform.document_classification_proposals classification ON classification.organization_id = version.organization_id
       AND classification.evidence_version_id = version.id
     LEFT JOIN LATERAL (
       SELECT review.* FROM platform.document_field_reviews review
       WHERE review.organization_id = field.organization_id AND review.extracted_field_id = field.id
       ORDER BY review.revision DESC LIMIT 1
     ) field_review ON true
     LEFT JOIN LATERAL (
       SELECT review.* FROM platform.document_classification_reviews review
       WHERE review.organization_id = classification.organization_id
         AND review.classification_proposal_id = classification.id
       ORDER BY review.revision DESC LIMIT 1
     ) classification_review ON true
     WHERE document.organization_id = $1 AND document.id = $2 AND document.deleted_at IS NULL`,
    [organizationId, evidenceId, versionId, fieldId]
  );
  const row = result.rows[0];
  if (!row) throw domainError('not_found', 404, 'Current reviewed evidence and quantity field were not found.');
  if (!['classified', 'approved'].includes(row.classification_status) || row.extraction_status !== 'complete') {
    throw domainError('review_required', 409, 'Evidence must complete human review before calculation.');
  }
  if (row.field_review_decision === 'rejected' || row.classification_review_decision === 'rejected') {
    throw domainError('review_required', 409, 'Rejected extraction or classification cannot be calculated.');
  }
  if (row.requires_review && !row.field_review_id) throw domainError('review_required', 409, 'The selected quantity requires review.');
  if (row.classification_requires_review && !row.classification_review_id) throw domainError('review_required', 409, 'The classification requires review.');
  const correctedField = row.field_review_decision === 'corrected';
  const correctedClassification = row.classification_review_decision === 'corrected';
  return {
    projectId: row.project_id, extractionRunId: row.extraction_run_id,
    classificationProposalId: row.classification_proposal_id,
    classificationReviewId: row.classification_review_id, fieldReviewId: row.field_review_id,
    value: correctedField ? row.corrected_value : row.value,
    unit: correctedField ? row.corrected_unit : row.unit,
    sourceLocator: row.source_locator,
    activityType: correctedClassification ? row.corrected_activity_type : row.activity_type,
    ghgScope: correctedClassification ? row.corrected_ghg_scope : row.ghg_scope,
    scope3Category: correctedClassification ? row.corrected_scope_3_category : row.scope_3_category
  };
}

async function getCalculationLedgerEntry(client, organizationId, calculationId, duplicate) {
  const result = await client.query(
    `SELECT calculation.id, calculation.project_id, calculation.site_id, calculation.status,
            calculation.version, calculation.input_data, calculation.result_data,
            calculation.factor_manifest, calculation.created_by, calculation.created_at,
            lineage.evidence_document_id, lineage.evidence_version_id, lineage.extraction_run_id,
            lineage.classification_proposal_id, lineage.classification_review_id,
            lineage.extracted_field_id, lineage.field_review_id, lineage.source_locator,
            lineage.formula, lineage.input_sha256, lineage.calculated_at
     FROM platform.calculations calculation
     JOIN platform.calculation_lineage lineage ON lineage.organization_id = calculation.organization_id
       AND lineage.calculation_id = calculation.id
     WHERE calculation.organization_id = $1 AND calculation.id = $2`,
    [organizationId, calculationId]
  );
  if (!result.rows[0]) throw domainError('not_found', 404, 'Calculation ledger entry was not found.');
  const row = result.rows[0];
  return {
    id: row.id, projectId: row.project_id, siteId: row.site_id, status: row.status,
    version: row.version, input: row.input_data, result: row.result_data,
    factors: row.factor_manifest, formula: row.formula, inputSha256: row.input_sha256,
    provenance: {
      evidenceId: row.evidence_document_id, evidenceVersionId: row.evidence_version_id,
      extractionRunId: row.extraction_run_id, classificationProposalId: row.classification_proposal_id,
      classificationReviewId: row.classification_review_id, extractedFieldId: row.extracted_field_id,
      fieldReviewId: row.field_review_id, source: row.source_locator
    },
    calculatedBy: row.created_by, calculatedAt: row.calculated_at || row.created_at, duplicate
  };
}

function conversion(sourceUnit, targetUnit) {
  const key = `${normalizeUnit(sourceUnit)}:${normalizeUnit(targetUnit)}`;
  const value = UNIT_CONVERSIONS.get(key);
  if (!value) throw domainError('unit_conversion_required', 409, `No approved conversion exists from ${sourceUnit || 'missing unit'} to ${targetUnit}.`);
  return value;
}
function normalizeUnit(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
function positiveNumber(value, name) { const number = Number(value); if (!Number.isFinite(number) || number <= 0 || number > 1e18) throw validationError(`${name} must be a positive number.`); return number; }
function rounded(value, places) { const scale = 10 ** places; return Math.round(value * scale) / scale; }
function requiredText(value, name, maximum) { const text = String(value || '').trim(); if (!text || text.length > maximum) throw validationError(`${name} is required.`); return text; }
function machineCode(value, name, maximum) { const code = requiredText(value, name, maximum); if (!MACHINE_CODE_PATTERN.test(code)) throw validationError(`${name} is invalid.`); return code; }
function validationError(message) { return domainError('validation_error', 400, message); }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
