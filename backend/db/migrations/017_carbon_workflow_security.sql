-- Harden approval transitions before exposing the Carbon Professional workflow.
-- Review/approval identity and timestamps are always derived from the active
-- tenant session, never accepted from a customer payload.

CREATE OR REPLACE FUNCTION platform.guard_carbon_period_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'open' OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'New reporting periods must start open and unapproved';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'locked' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Locked reporting periods are immutable';
  END IF;
  IF NEW.status IN ('approved', 'locked') AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT platform.has_permission('calculation.approve') THEN
      RAISE EXCEPTION 'Calculation approval permission is required';
    END IF;
    NEW.approved_by := platform.current_user_id();
    NEW.approved_at := now();
  ELSIF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Reporting-period approval metadata is server controlled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION platform.guard_carbon_activity_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_status <> 'draft' OR NEW.approval_status <> 'not_submitted'
      OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL
      OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'New carbon activities must start as unreviewed drafts';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.approval_status = 'approved' AND (
       NEW.inventory_id IS DISTINCT FROM OLD.inventory_id
    OR NEW.reporting_period_id IS DISTINCT FROM OLD.reporting_period_id
    OR NEW.project_id IS DISTINCT FROM OLD.project_id
    OR NEW.facility_id IS DISTINCT FROM OLD.facility_id
    OR NEW.scope_category_code IS DISTINCT FROM OLD.scope_category_code
    OR NEW.activity_type IS DISTINCT FROM OLD.activity_type
    OR NEW.quantity IS DISTINCT FROM OLD.quantity
    OR NEW.unit IS DISTINCT FROM OLD.unit
    OR NEW.activity_date IS DISTINCT FROM OLD.activity_date
  ) THEN
    RAISE EXCEPTION 'Approved carbon activity facts are immutable';
  END IF;
  IF NEW.review_status IN ('approved', 'rejected') AND OLD.review_status IS DISTINCT FROM NEW.review_status THEN
    IF NOT platform.has_permission('calculation.approve') THEN
      RAISE EXCEPTION 'Calculation approval permission is required';
    END IF;
    NEW.reviewed_by := platform.current_user_id();
    NEW.reviewed_at := now();
  ELSIF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Activity review metadata is server controlled';
  END IF;
  IF NEW.approval_status IN ('approved', 'rejected') AND OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    IF NOT platform.has_permission('calculation.approve') THEN
      RAISE EXCEPTION 'Calculation approval permission is required';
    END IF;
    NEW.approved_by := platform.current_user_id();
    NEW.approved_at := now();
  ELSIF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Activity approval metadata is server controlled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION platform.guard_approval_status_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND (
       (TG_TABLE_NAME = 'reports' AND NEW.status IN ('approved', 'published'))
    OR (TG_TABLE_NAME = 'calculations' AND NEW.status IN ('approved', 'superseded', 'void'))
  ) THEN
    IF NOT platform.has_permission(CASE WHEN TG_TABLE_NAME = 'reports' THEN 'report.approve' ELSE 'calculation.approve' END) THEN
      RAISE EXCEPTION 'Approval permission is required';
    END IF;
    IF NEW.status = 'published' AND OLD.status <> 'approved' THEN
      RAISE EXCEPTION 'Only approved reports can be published';
    END IF;
    IF NEW.status = 'approved' THEN
      NEW.approved_by := platform.current_user_id();
      NEW.approved_at := now();
    END IF;
  ELSIF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Approval metadata is server controlled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION platform.guard_carbon_emission_factor_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Carbon emission factors are append-only';
  END IF;
  IF OLD.review_status = 'proposed' AND NEW.review_status IN ('approved', 'rejected') THEN
    IF NOT platform.has_permission('calculation.approve') THEN
      RAISE EXCEPTION 'Calculation approval permission is required';
    END IF;
    IF (to_jsonb(NEW) - ARRAY['review_status', 'reviewed_by', 'reviewed_at'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['review_status', 'reviewed_by', 'reviewed_at']) THEN
      RAISE EXCEPTION 'Factor review cannot alter factor provenance';
    END IF;
    NEW.reviewed_by := platform.current_user_id();
    NEW.reviewed_at := now();
    RETURN NEW;
  END IF;
  IF OLD.review_status = 'approved' AND NEW.review_status = 'superseded' THEN
    IF NOT platform.has_permission('calculation.approve') THEN
      RAISE EXCEPTION 'Calculation approval permission is required';
    END IF;
    IF (to_jsonb(NEW) - ARRAY['review_status', 'valid_to'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['review_status', 'valid_to']) THEN
      RAISE EXCEPTION 'Factor supersession cannot alter factor provenance or review history';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Unsupported carbon emission factor lifecycle transition';
END;
$$;

CREATE TRIGGER carbon_reporting_periods_lifecycle
BEFORE INSERT OR UPDATE ON platform.carbon_reporting_periods
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_period_lifecycle();

CREATE TRIGGER carbon_activity_data_lifecycle
BEFORE INSERT OR UPDATE ON platform.carbon_activity_data
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_activity_lifecycle();

CREATE TRIGGER calculations_approval_lifecycle
BEFORE UPDATE ON platform.calculations
FOR EACH ROW EXECUTE FUNCTION platform.guard_approval_status_transition();

CREATE TRIGGER reports_approval_lifecycle
BEFORE UPDATE ON platform.reports
FOR EACH ROW EXECUTE FUNCTION platform.guard_approval_status_transition();

CREATE TABLE platform.carbon_factor_mapping_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  activity_data_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  proposed_factor_id uuid,
  factor_snapshot jsonb CHECK (factor_snapshot IS NULL OR jsonb_typeof(factor_snapshot) = 'object'),
  ruleset text NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  rationale_code text NOT NULL CHECK (rationale_code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  rationale jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(rationale) = 'object'),
  compatibility text NOT NULL CHECK (compatibility IN ('compatible', 'uncertain', 'incompatible')),
  requires_review boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, activity_data_id, revision),
  FOREIGN KEY (organization_id, activity_data_id)
    REFERENCES platform.carbon_activity_data(organization_id, id),
  FOREIGN KEY (organization_id, proposed_factor_id)
    REFERENCES platform.carbon_emission_factors(organization_id, id),
  CHECK ((proposed_factor_id IS NULL) = (factor_snapshot IS NULL)),
  CHECK (requires_review OR (compatibility = 'compatible' AND confidence >= 0.95))
);

CREATE TABLE platform.carbon_factor_mapping_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  decision text NOT NULL CHECK (decision IN ('accepted', 'corrected', 'rejected')),
  selected_factor_id uuid,
  reason_code text NOT NULL CHECK (reason_code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  comment text,
  reviewed_by uuid NOT NULL REFERENCES platform.app_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, proposal_id, revision),
  FOREIGN KEY (organization_id, proposal_id)
    REFERENCES platform.carbon_factor_mapping_proposals(organization_id, id),
  FOREIGN KEY (organization_id, selected_factor_id)
    REFERENCES platform.carbon_emission_factors(organization_id, id),
  CHECK ((decision = 'rejected' AND selected_factor_id IS NULL)
      OR (decision IN ('accepted', 'corrected') AND selected_factor_id IS NOT NULL))
);

CREATE TABLE platform.carbon_calculation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL,
  reporting_period_id uuid NOT NULL,
  calculation_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  input_sha256 text NOT NULL CHECK (input_sha256 ~ '^[a-f0-9]{64}$'),
  activity_count integer NOT NULL CHECK (activity_count > 0 AND activity_count <= 1000),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (organization_id, calculation_id),
  FOREIGN KEY (organization_id, inventory_id)
    REFERENCES platform.carbon_inventories(organization_id, id),
  FOREIGN KEY (organization_id, reporting_period_id, inventory_id)
    REFERENCES platform.carbon_reporting_periods(organization_id, id, inventory_id),
  FOREIGN KEY (organization_id, calculation_id)
    REFERENCES platform.calculations(organization_id, id)
);

CREATE TABLE platform.carbon_calculation_run_activities (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  activity_data_id uuid NOT NULL,
  mapping_proposal_id uuid NOT NULL,
  mapping_review_id uuid NOT NULL,
  calculation_detail_id uuid NOT NULL,
  PRIMARY KEY (organization_id, run_id, activity_data_id),
  FOREIGN KEY (organization_id, run_id)
    REFERENCES platform.carbon_calculation_runs(organization_id, id),
  FOREIGN KEY (organization_id, activity_data_id)
    REFERENCES platform.carbon_activity_data(organization_id, id),
  FOREIGN KEY (organization_id, mapping_proposal_id)
    REFERENCES platform.carbon_factor_mapping_proposals(organization_id, id),
  FOREIGN KEY (organization_id, mapping_review_id)
    REFERENCES platform.carbon_factor_mapping_reviews(organization_id, id),
  FOREIGN KEY (organization_id, calculation_detail_id)
    REFERENCES platform.carbon_calculation_details(organization_id, id)
);

CREATE TRIGGER carbon_factor_mapping_proposals_immutable
BEFORE UPDATE OR DELETE ON platform.carbon_factor_mapping_proposals
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER carbon_factor_mapping_reviews_immutable
BEFORE UPDATE OR DELETE ON platform.carbon_factor_mapping_reviews
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER carbon_calculation_runs_immutable
BEFORE UPDATE OR DELETE ON platform.carbon_calculation_runs
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER carbon_calculation_run_activities_immutable
BEFORE UPDATE OR DELETE ON platform.carbon_calculation_run_activities
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.carbon_factor_mapping_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_factor_mapping_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_factor_mapping_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_factor_mapping_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_calculation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_calculation_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_calculation_run_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.carbon_calculation_run_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY carbon_factor_proposals_select ON platform.carbon_factor_mapping_proposals FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_factor_proposals_insert ON platform.carbon_factor_mapping_proposals FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id()
  AND created_by = platform.current_user_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_factor_reviews_select ON platform.carbon_factor_mapping_reviews FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_factor_reviews_insert ON platform.carbon_factor_mapping_reviews FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id()
  AND reviewed_by = platform.current_user_id() AND platform.has_permission('calculation.approve'));
CREATE POLICY carbon_calculation_runs_select ON platform.carbon_calculation_runs FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_calculation_runs_insert ON platform.carbon_calculation_runs FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id()
  AND created_by = platform.current_user_id() AND platform.has_permission('calculation.create'));
CREATE POLICY carbon_calculation_run_activities_select ON platform.carbon_calculation_run_activities FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY carbon_calculation_run_activities_insert ON platform.carbon_calculation_run_activities FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create'));
