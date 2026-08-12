ALTER TABLE platform.evidence_versions
  ADD COLUMN processing_profile text NOT NULL DEFAULT 'storage_only'
    CHECK (processing_profile IN ('storage_only', 'document_intelligence')),
  ADD COLUMN review_threshold numeric(5,4)
    CHECK (review_threshold IS NULL OR review_threshold BETWEEN 0 AND 1),
  ADD CONSTRAINT evidence_versions_processing_threshold_check CHECK (
    (processing_profile = 'storage_only' AND review_threshold IS NULL)
    OR (processing_profile = 'document_intelligence' AND review_threshold IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION platform.protect_evidence_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.evidence_document_id IS DISTINCT FROM OLD.evidence_document_id
    OR NEW.version_number IS DISTINCT FROM OLD.version_number
    OR NEW.original_file_name IS DISTINCT FROM OLD.original_file_name
    OR NEW.media_type IS DISTINCT FROM OLD.media_type
    OR NEW.byte_size IS DISTINCT FROM OLD.byte_size
    OR NEW.sha256 IS DISTINCT FROM OLD.sha256
    OR NEW.storage_provider IS DISTINCT FROM OLD.storage_provider
    OR NEW.storage_bucket IS DISTINCT FROM OLD.storage_bucket
    OR NEW.object_key IS DISTINCT FROM OLD.object_key
    OR NEW.processing_profile IS DISTINCT FROM OLD.processing_profile
    OR NEW.review_threshold IS DISTINCT FROM OLD.review_threshold
    OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
    OR NEW.uploaded_at IS DISTINCT FROM OLD.uploaded_at
  THEN
    RAISE EXCEPTION 'Evidence file identity, processing profile, and storage metadata are immutable' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE platform.document_extraction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  evidence_version_id uuid NOT NULL,
  provider text NOT NULL,
  model text,
  schema_version text NOT NULL,
  review_threshold numeric(5,4) NOT NULL CHECK (review_threshold BETWEEN 0 AND 1),
  overall_confidence numeric(5,4) CHECK (overall_confidence IS NULL OR overall_confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, evidence_version_id),
  FOREIGN KEY (organization_id, evidence_version_id) REFERENCES platform.evidence_versions(organization_id, id)
);

CREATE TABLE platform.document_extracted_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  extraction_run_id uuid NOT NULL,
  evidence_version_id uuid NOT NULL,
  field_code text NOT NULL CHECK (field_code ~ '^[a-z][a-z0-9_]{0,99}$'),
  value jsonb NOT NULL,
  unit text,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  requires_review boolean NOT NULL,
  source_locator jsonb NOT NULL CHECK (jsonb_typeof(source_locator) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, extraction_run_id, field_code),
  FOREIGN KEY (organization_id, extraction_run_id) REFERENCES platform.document_extraction_runs(organization_id, id),
  FOREIGN KEY (organization_id, evidence_version_id) REFERENCES platform.evidence_versions(organization_id, id)
);
CREATE INDEX document_extracted_fields_review_idx
  ON platform.document_extracted_fields (organization_id, evidence_version_id, requires_review);

CREATE TABLE platform.document_classification_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  evidence_version_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report', 'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report', 'sustainability_report', 'governance_document', 'erp_export', 'other')),
  activity_type text CHECK (activity_type IS NULL OR activity_type IN ('stationary_combustion', 'mobile_combustion', 'fugitive_emissions', 'purchased_electricity', 'purchased_heat_steam_cooling', 'business_travel', 'employee_commuting', 'waste', 'transport_distribution', 'purchased_goods_services', 'capital_goods', 'other')),
  ghg_scope text CHECK (ghg_scope IS NULL OR ghg_scope IN ('scope_1', 'scope_2', 'scope_3', 'undetermined')),
  scope_3_category smallint CHECK (scope_3_category IS NULL OR scope_3_category BETWEEN 1 AND 15),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  requires_review boolean NOT NULL,
  provider text NOT NULL,
  model text,
  rationale_code text CHECK (rationale_code IS NULL OR rationale_code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, evidence_version_id),
  FOREIGN KEY (organization_id, evidence_version_id) REFERENCES platform.evidence_versions(organization_id, id),
  CHECK (scope_3_category IS NULL OR ghg_scope = 'scope_3')
);

CREATE TABLE platform.document_field_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  extracted_field_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  decision text NOT NULL CHECK (decision IN ('accepted', 'corrected', 'rejected')),
  corrected_value jsonb,
  corrected_unit text,
  reason_code text CHECK (reason_code IS NULL OR reason_code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  comment text,
  reviewed_by uuid NOT NULL REFERENCES platform.app_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, extracted_field_id, revision),
  FOREIGN KEY (organization_id, extracted_field_id) REFERENCES platform.document_extracted_fields(organization_id, id),
  CHECK ((decision = 'corrected' AND corrected_value IS NOT NULL) OR (decision <> 'corrected' AND corrected_value IS NULL))
);

CREATE TABLE platform.document_classification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  classification_proposal_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  decision text NOT NULL CHECK (decision IN ('accepted', 'corrected', 'rejected')),
  corrected_document_type text CHECK (corrected_document_type IS NULL OR corrected_document_type IN ('fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report', 'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report', 'sustainability_report', 'governance_document', 'erp_export', 'other')),
  corrected_activity_type text CHECK (corrected_activity_type IS NULL OR corrected_activity_type IN ('stationary_combustion', 'mobile_combustion', 'fugitive_emissions', 'purchased_electricity', 'purchased_heat_steam_cooling', 'business_travel', 'employee_commuting', 'waste', 'transport_distribution', 'purchased_goods_services', 'capital_goods', 'other')),
  corrected_ghg_scope text CHECK (corrected_ghg_scope IS NULL OR corrected_ghg_scope IN ('scope_1', 'scope_2', 'scope_3', 'undetermined')),
  corrected_scope_3_category smallint CHECK (corrected_scope_3_category IS NULL OR corrected_scope_3_category BETWEEN 1 AND 15),
  reason_code text CHECK (reason_code IS NULL OR reason_code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  comment text,
  reviewed_by uuid NOT NULL REFERENCES platform.app_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, classification_proposal_id, revision),
  FOREIGN KEY (organization_id, classification_proposal_id) REFERENCES platform.document_classification_proposals(organization_id, id),
  CHECK ((decision = 'corrected' AND corrected_document_type IS NOT NULL) OR (decision <> 'corrected' AND corrected_document_type IS NULL)),
  CHECK (corrected_scope_3_category IS NULL OR corrected_ghg_scope = 'scope_3')
);

CREATE TRIGGER document_extraction_runs_immutable BEFORE UPDATE OR DELETE ON platform.document_extraction_runs FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER document_extracted_fields_immutable BEFORE UPDATE OR DELETE ON platform.document_extracted_fields FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER document_classification_proposals_immutable BEFORE UPDATE OR DELETE ON platform.document_classification_proposals FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER document_field_reviews_immutable BEFORE UPDATE OR DELETE ON platform.document_field_reviews FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER document_classification_reviews_immutable BEFORE UPDATE OR DELETE ON platform.document_classification_reviews FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.document_extraction_runs ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.document_extraction_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.document_extracted_fields ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.document_extracted_fields FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.document_classification_proposals ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.document_classification_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.document_field_reviews ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.document_field_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.document_classification_reviews ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.document_classification_reviews FORCE ROW LEVEL SECURITY;

CREATE POLICY document_extraction_runs_select ON platform.document_extraction_runs FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_extracted_fields_select ON platform.document_extracted_fields FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_classification_proposals_select ON platform.document_classification_proposals FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_field_reviews_select ON platform.document_field_reviews FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_field_reviews_insert ON platform.document_field_reviews FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id() AND reviewed_by = platform.current_user_id() AND platform.has_permission('evidence.update'));
CREATE POLICY document_classification_reviews_select ON platform.document_classification_reviews FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_classification_reviews_insert ON platform.document_classification_reviews FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id() AND reviewed_by = platform.current_user_id() AND platform.has_permission('evidence.update'));

ALTER TABLE platform.feature_definitions NO FORCE ROW LEVEL SECURITY;

INSERT INTO platform.feature_definitions (
  code, name, category, value_type, description, is_metered
) VALUES (
  'document_intelligence.review', 'Document intelligence review', 'evidence', 'boolean',
  'Source-located extraction, carbon classification, and human correction workflow.', false
);

ALTER TABLE platform.feature_definitions FORCE ROW LEVEL SECURITY;

INSERT INTO platform.plan_features (plan_code, feature_code, enabled, limit_value, configuration) VALUES
  ('free', 'document_intelligence.review', false, 0, '{"minimum_confidence":0.85}'),
  ('starter', 'document_intelligence.review', false, 0, '{"minimum_confidence":0.85}'),
  ('professional', 'document_intelligence.review', true, NULL, '{"minimum_confidence":0.85}'),
  ('business', 'document_intelligence.review', true, NULL, '{"minimum_confidence":0.85}'),
  ('enterprise', 'document_intelligence.review', true, NULL, '{"minimum_confidence":0.85}');
