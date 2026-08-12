ALTER TABLE platform.feature_definitions NO FORCE ROW LEVEL SECURITY;

INSERT INTO platform.feature_definitions (
  code, name, category, value_type, description, is_metered
) VALUES (
  'calculations.evidence_ledger', 'Evidence-backed calculation ledger', 'calculation', 'boolean',
  'Versioned carbon calculations with field, evidence, factor, formula, and actor provenance.', false
);

ALTER TABLE platform.feature_definitions FORCE ROW LEVEL SECURITY;

INSERT INTO platform.plan_features (plan_code, feature_code, enabled, limit_value) VALUES
  ('free', 'calculations.evidence_ledger', false, 0),
  ('starter', 'calculations.evidence_ledger', false, 0),
  ('professional', 'calculations.evidence_ledger', true, NULL),
  ('business', 'calculations.evidence_ledger', true, NULL),
  ('enterprise', 'calculations.evidence_ledger', true, NULL);

CREATE TABLE platform.calculation_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  calculation_id uuid NOT NULL,
  evidence_document_id uuid NOT NULL,
  evidence_version_id uuid NOT NULL,
  extraction_run_id uuid NOT NULL,
  classification_proposal_id uuid NOT NULL,
  classification_review_id uuid,
  extracted_field_id uuid NOT NULL,
  field_review_id uuid,
  idempotency_key text NOT NULL,
  source_value jsonb NOT NULL,
  source_unit text NOT NULL,
  source_locator jsonb NOT NULL CHECK (jsonb_typeof(source_locator) = 'object'),
  conversion_factor numeric NOT NULL CHECK (conversion_factor > 0),
  normalized_quantity numeric NOT NULL CHECK (normalized_quantity > 0),
  normalized_unit text NOT NULL,
  effective_activity_type text NOT NULL,
  effective_ghg_scope text NOT NULL CHECK (effective_ghg_scope IN ('scope_1','scope_2','scope_3')),
  effective_scope_3_category smallint CHECK (effective_scope_3_category IS NULL OR effective_scope_3_category BETWEEN 1 AND 15),
  mapping_decision text NOT NULL CHECK (mapping_decision = 'user_selected'),
  mapping_reason text NOT NULL,
  factor_group text NOT NULL,
  factor_key text NOT NULL,
  factor_id text NOT NULL,
  factor_name text NOT NULL,
  factor_value numeric NOT NULL CHECK (factor_value >= 0),
  factor_unit text NOT NULL,
  factor_source text NOT NULL,
  factor_source_url text,
  factor_year integer,
  factor_version text NOT NULL,
  factor_confidence text NOT NULL CHECK (factor_confidence IN ('low','medium','high')),
  formula text NOT NULL,
  emissions_kg_co2e numeric NOT NULL CHECK (emissions_kg_co2e >= 0),
  input_sha256 text NOT NULL CHECK (input_sha256 ~ '^[a-f0-9]{64}$'),
  calculated_by uuid NOT NULL REFERENCES platform.app_users(id),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, calculation_id),
  UNIQUE (organization_id, idempotency_key),
  FOREIGN KEY (organization_id, calculation_id) REFERENCES platform.calculations(organization_id, id),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id),
  FOREIGN KEY (organization_id, evidence_version_id) REFERENCES platform.evidence_versions(organization_id, id),
  FOREIGN KEY (organization_id, extraction_run_id) REFERENCES platform.document_extraction_runs(organization_id, id),
  FOREIGN KEY (organization_id, classification_proposal_id) REFERENCES platform.document_classification_proposals(organization_id, id),
  FOREIGN KEY (organization_id, classification_review_id) REFERENCES platform.document_classification_reviews(organization_id, id),
  FOREIGN KEY (organization_id, extracted_field_id) REFERENCES platform.document_extracted_fields(organization_id, id),
  FOREIGN KEY (organization_id, field_review_id) REFERENCES platform.document_field_reviews(organization_id, id),
  CHECK (effective_scope_3_category IS NULL OR effective_ghg_scope = 'scope_3')
);

CREATE INDEX calculation_lineage_project_idx ON platform.calculation_lineage
  (organization_id, calculated_at DESC, calculation_id);

CREATE TRIGGER calculation_lineage_immutable
BEFORE UPDATE OR DELETE ON platform.calculation_lineage
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.calculation_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.calculation_lineage FORCE ROW LEVEL SECURITY;
CREATE POLICY calculation_lineage_select ON platform.calculation_lineage FOR SELECT USING (
  organization_id = platform.current_organization_id()
  AND platform.has_permission('calculation.read')
  AND platform.has_permission('evidence.read')
);
CREATE POLICY calculation_lineage_insert ON platform.calculation_lineage FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND calculated_by = platform.current_user_id()
  AND platform.has_permission('calculation.create')
);
