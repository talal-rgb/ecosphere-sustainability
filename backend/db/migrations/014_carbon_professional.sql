CREATE TABLE platform.carbon_inventories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  reporting_standard text NOT NULL DEFAULT 'ghg_protocol_corporate',
  consolidation_approach text NOT NULL CHECK (consolidation_approach IN ('operational_control', 'financial_control', 'equity_share')),
  operational_boundary text NOT NULL DEFAULT 'scopes_1_2_3' CHECK (operational_boundary IN ('scopes_1_2', 'scopes_1_2_3')),
  boundary_notes text,
  base_year integer CHECK (base_year BETWEEN 1990 AND 2200),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CHECK (char_length(name) BETWEEN 1 AND 200)
);

CREATE TABLE platform.carbon_reporting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL,
  label text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'approved', 'locked')),
  comparison_period_id uuid,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  approved_by uuid REFERENCES platform.app_users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, id, inventory_id),
  UNIQUE (organization_id, inventory_id, starts_on, ends_on),
  FOREIGN KEY (organization_id, inventory_id) REFERENCES platform.carbon_inventories(organization_id, id),
  FOREIGN KEY (organization_id, comparison_period_id, inventory_id)
    REFERENCES platform.carbon_reporting_periods(organization_id, id, inventory_id),
  CHECK (ends_on >= starts_on),
  CHECK ((status IN ('approved', 'locked') AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR status NOT IN ('approved', 'locked'))
);

CREATE TABLE platform.carbon_boundary_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL,
  business_unit_id uuid,
  site_id uuid,
  facility_id uuid,
  ownership_percent numeric(7,4) CHECK (ownership_percent BETWEEN 0 AND 100),
  consolidation_percent numeric(7,4) NOT NULL CHECK (consolidation_percent BETWEEN 0 AND 100),
  control_classification text NOT NULL CHECK (control_classification IN ('operational_control', 'financial_control', 'equity_share', 'not_controlled')),
  included boolean NOT NULL DEFAULT true,
  exclusion_reason text,
  effective_from date,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, inventory_id) REFERENCES platform.carbon_inventories(organization_id, id),
  FOREIGN KEY (organization_id, business_unit_id) REFERENCES platform.business_units(organization_id, id),
  FOREIGN KEY (organization_id, site_id) REFERENCES platform.sites(organization_id, id),
  FOREIGN KEY (organization_id, facility_id) REFERENCES platform.facilities(organization_id, id),
  CHECK (((business_unit_id IS NOT NULL)::integer + (site_id IS NOT NULL)::integer + (facility_id IS NOT NULL)::integer) = 1),
  CHECK (included OR char_length(exclusion_reason) > 0),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE TABLE platform.carbon_scope_categories (
  code text PRIMARY KEY,
  ghg_scope smallint NOT NULL CHECK (ghg_scope BETWEEN 1 AND 3),
  category_number smallint,
  name text NOT NULL,
  CHECK ((ghg_scope = 3 AND category_number BETWEEN 1 AND 15) OR (ghg_scope <> 3 AND category_number IS NULL))
);

INSERT INTO platform.carbon_scope_categories (code, ghg_scope, category_number, name) VALUES
  ('scope_1.stationary_combustion', 1, NULL, 'Stationary combustion'),
  ('scope_1.mobile_combustion', 1, NULL, 'Mobile combustion'),
  ('scope_1.process_emissions', 1, NULL, 'Process emissions'),
  ('scope_1.fugitive_emissions', 1, NULL, 'Fugitive emissions'),
  ('scope_2.purchased_electricity', 2, NULL, 'Purchased electricity'),
  ('scope_2.purchased_steam_heat_cooling', 2, NULL, 'Purchased steam, heat, and cooling'),
  ('scope_3.01', 3, 1, 'Purchased goods and services'),
  ('scope_3.02', 3, 2, 'Capital goods'),
  ('scope_3.03', 3, 3, 'Fuel- and energy-related activities'),
  ('scope_3.04', 3, 4, 'Upstream transportation and distribution'),
  ('scope_3.05', 3, 5, 'Waste generated in operations'),
  ('scope_3.06', 3, 6, 'Business travel'),
  ('scope_3.07', 3, 7, 'Employee commuting'),
  ('scope_3.08', 3, 8, 'Upstream leased assets'),
  ('scope_3.09', 3, 9, 'Downstream transportation and distribution'),
  ('scope_3.10', 3, 10, 'Processing of sold products'),
  ('scope_3.11', 3, 11, 'Use of sold products'),
  ('scope_3.12', 3, 12, 'End-of-life treatment of sold products'),
  ('scope_3.13', 3, 13, 'Downstream leased assets'),
  ('scope_3.14', 3, 14, 'Franchises'),
  ('scope_3.15', 3, 15, 'Investments');

CREATE TABLE platform.carbon_activity_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL,
  reporting_period_id uuid NOT NULL,
  project_id uuid,
  facility_id uuid,
  scope_category_code text NOT NULL REFERENCES platform.carbon_scope_categories(code),
  activity_type text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  activity_date date,
  data_quality_status text NOT NULL DEFAULT 'unassessed' CHECK (data_quality_status IN ('unassessed', 'estimated', 'secondary', 'primary', 'verified')),
  data_quality_dimensions jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data_quality_dimensions) = 'object'),
  review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'review_required', 'approved', 'rejected')),
  approval_status text NOT NULL DEFAULT 'not_submitted' CHECK (approval_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  anomaly_status text NOT NULL DEFAULT 'unchecked' CHECK (anomaly_status IN ('unchecked', 'clear', 'flagged', 'resolved')),
  anomaly_details jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(anomaly_details) = 'array'),
  source_reference text,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  reviewed_by uuid REFERENCES platform.app_users(id),
  reviewed_at timestamptz,
  approved_by uuid REFERENCES platform.app_users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, inventory_id) REFERENCES platform.carbon_inventories(organization_id, id),
  FOREIGN KEY (organization_id, reporting_period_id, inventory_id) REFERENCES platform.carbon_reporting_periods(organization_id, id, inventory_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id),
  FOREIGN KEY (organization_id, facility_id) REFERENCES platform.facilities(organization_id, id),
  CHECK ((review_status = 'approved' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR review_status <> 'approved'),
  CHECK ((approval_status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR approval_status <> 'approved'),
  CHECK (approval_status <> 'approved' OR review_status = 'approved')
);

ALTER TABLE platform.evidence_versions
  ADD CONSTRAINT evidence_versions_document_identity_unique
  UNIQUE (organization_id, id, evidence_document_id);

CREATE TABLE platform.carbon_activity_evidence (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  activity_data_id uuid NOT NULL,
  evidence_document_id uuid NOT NULL,
  evidence_version_id uuid,
  purpose text NOT NULL DEFAULT 'source' CHECK (purpose IN ('source', 'corroboration', 'methodology', 'approval')),
  linked_by uuid NOT NULL REFERENCES platform.app_users(id),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, activity_data_id, evidence_document_id),
  FOREIGN KEY (organization_id, activity_data_id) REFERENCES platform.carbon_activity_data(organization_id, id),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id),
  FOREIGN KEY (organization_id, evidence_version_id, evidence_document_id)
    REFERENCES platform.evidence_versions(organization_id, id, evidence_document_id)
);

CREATE TABLE platform.carbon_emission_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  factor_key text NOT NULL,
  name text NOT NULL,
  factor_value numeric NOT NULL CHECK (factor_value >= 0),
  numerator_unit text NOT NULL DEFAULT 'kgCO2e',
  denominator_unit text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  geography text,
  factor_year integer CHECK (factor_year BETWEEN 1990 AND 2200),
  version text NOT NULL,
  methodology text NOT NULL,
  uncertainty_percent numeric CHECK (uncertainty_percent BETWEEN 0 AND 100),
  review_status text NOT NULL DEFAULT 'proposed' CHECK (review_status IN ('proposed', 'approved', 'rejected', 'superseded')),
  reviewed_by uuid REFERENCES platform.app_users(id),
  reviewed_at timestamptz,
  valid_from date,
  valid_to date,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, factor_key, version),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from),
  CHECK ((review_status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR review_status IN ('proposed', 'superseded'))
);

CREATE TABLE platform.carbon_calculation_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  calculation_id uuid NOT NULL,
  activity_data_id uuid NOT NULL,
  emission_factor_id uuid NOT NULL,
  evidence_document_id uuid,
  formula text NOT NULL,
  activity_quantity numeric NOT NULL CHECK (activity_quantity > 0),
  activity_unit text NOT NULL,
  scope_2_method text CHECK (scope_2_method IN ('location_based', 'market_based')),
  conversion_factor numeric NOT NULL DEFAULT 1 CHECK (conversion_factor > 0),
  factor_value numeric NOT NULL CHECK (factor_value >= 0),
  factor_unit text NOT NULL,
  emissions_kg_co2e numeric NOT NULL CHECK (emissions_kg_co2e >= 0),
  provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance) = 'object'),
  input_sha256 text NOT NULL CHECK (input_sha256 ~ '^[a-f0-9]{64}$'),
  calculation_version integer NOT NULL DEFAULT 1 CHECK (calculation_version > 0),
  supersedes_calculation_detail_id uuid,
  recalculation_reason text,
  is_current boolean NOT NULL DEFAULT true,
  calculated_by uuid NOT NULL REFERENCES platform.app_users(id),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, calculation_id, activity_data_id),
  FOREIGN KEY (organization_id, calculation_id) REFERENCES platform.calculations(organization_id, id),
  FOREIGN KEY (organization_id, activity_data_id) REFERENCES platform.carbon_activity_data(organization_id, id),
  FOREIGN KEY (organization_id, emission_factor_id) REFERENCES platform.carbon_emission_factors(organization_id, id),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id),
  FOREIGN KEY (organization_id, supersedes_calculation_detail_id)
    REFERENCES platform.carbon_calculation_details(organization_id, id),
  CHECK ((calculation_version = 1 AND supersedes_calculation_detail_id IS NULL)
    OR (calculation_version > 1 AND supersedes_calculation_detail_id IS NOT NULL AND char_length(recalculation_reason) > 0))
);

CREATE INDEX carbon_activity_period_scope_idx ON platform.carbon_activity_data
  (organization_id, reporting_period_id, scope_category_code, review_status);
CREATE INDEX carbon_calculation_activity_idx ON platform.carbon_calculation_details
  (organization_id, activity_data_id, calculated_at DESC);
CREATE UNIQUE INDEX carbon_calculation_current_idx ON platform.carbon_calculation_details
  (organization_id, activity_data_id, COALESCE(scope_2_method, 'not_applicable')) WHERE is_current;
CREATE UNIQUE INDEX carbon_calculation_version_idx ON platform.carbon_calculation_details
  (organization_id, activity_data_id, calculation_version, COALESCE(scope_2_method, 'not_applicable'));

CREATE TRIGGER carbon_inventories_updated BEFORE UPDATE ON platform.carbon_inventories
FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER carbon_reporting_periods_updated BEFORE UPDATE ON platform.carbon_reporting_periods
FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER carbon_activity_data_updated BEFORE UPDATE ON platform.carbon_activity_data
FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE OR REPLACE FUNCTION platform.guard_carbon_emission_factor_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Carbon emission factors are append-only';
  END IF;

  IF OLD.review_status = 'proposed' AND NEW.review_status IN ('approved', 'rejected') THEN
    IF (to_jsonb(NEW) - ARRAY['review_status', 'reviewed_by', 'reviewed_at'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['review_status', 'reviewed_by', 'reviewed_at']) THEN
      RAISE EXCEPTION 'Factor review cannot alter factor provenance';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.review_status = 'approved' AND NEW.review_status = 'superseded' THEN
    IF (to_jsonb(NEW) - ARRAY['review_status', 'valid_to'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['review_status', 'valid_to']) THEN
      RAISE EXCEPTION 'Factor supersession cannot alter factor provenance or review history';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unsupported carbon emission factor lifecycle transition';
END;
$$;

CREATE OR REPLACE FUNCTION platform.guard_carbon_calculation_detail_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Carbon calculation details are append-only';
  END IF;
  IF OLD.is_current AND NOT NEW.is_current
    AND (to_jsonb(NEW) - 'is_current') = (to_jsonb(OLD) - 'is_current') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Carbon calculation provenance is immutable';
END;
$$;

CREATE TRIGGER carbon_emission_factors_guard BEFORE UPDATE OR DELETE ON platform.carbon_emission_factors
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_emission_factor_mutation();
CREATE TRIGGER carbon_calculation_details_guard BEFORE UPDATE OR DELETE ON platform.carbon_calculation_details
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_calculation_detail_mutation();

ALTER TABLE platform.carbon_inventories ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_inventories FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_reporting_periods ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_reporting_periods FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_boundary_members ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_boundary_members FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_activity_data ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_activity_data FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_activity_evidence ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_activity_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_emission_factors ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_emission_factors FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_calculation_details ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.carbon_calculation_details FORCE ROW LEVEL SECURITY;

CREATE POLICY carbon_inventories_select ON platform.carbon_inventories FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_inventories_write ON platform.carbon_inventories FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_periods_select ON platform.carbon_reporting_periods FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_periods_write ON platform.carbon_reporting_periods FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_boundaries_select ON platform.carbon_boundary_members FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_boundaries_write ON platform.carbon_boundary_members FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_activity_select ON platform.carbon_activity_data FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_activity_write ON platform.carbon_activity_data FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_activity_evidence_select ON platform.carbon_activity_evidence FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read') AND platform.has_permission('evidence.read'));
CREATE POLICY carbon_activity_evidence_write ON platform.carbon_activity_evidence FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create') AND linked_by = platform.current_user_id());
CREATE POLICY carbon_factors_select ON platform.carbon_emission_factors FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_factors_insert ON platform.carbon_emission_factors FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create') AND created_by = platform.current_user_id());
CREATE POLICY carbon_factors_review ON platform.carbon_emission_factors FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.approve')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.approve'));
CREATE POLICY carbon_details_select ON platform.carbon_calculation_details FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_details_insert ON platform.carbon_calculation_details FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create') AND calculated_by = platform.current_user_id());
CREATE POLICY carbon_details_retire ON platform.carbon_calculation_details FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
