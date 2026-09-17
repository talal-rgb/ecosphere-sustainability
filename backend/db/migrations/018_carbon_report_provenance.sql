-- Bind Carbon Professional reports to an immutable, tenant-owned calculation
-- snapshot and prevent approved reporting periods from changing underneath it.

UPDATE platform.report_template_definitions
SET template_spec = template_spec || jsonb_build_object(
  'contentAuthority', 'server_derived',
  'assuranceLanguage', 'traceable and review-ready only when the report metadata confirms complete provenance'
)
WHERE code='carbon-professional';

ALTER TABLE platform.carbon_calculation_runs
  ADD CONSTRAINT carbon_calculation_runs_report_identity_unique
  UNIQUE (organization_id, id, reporting_period_id, inventory_id);

ALTER TABLE platform.carbon_reporting_periods
  ADD COLUMN approved_calculation_run_id uuid,
  ADD CONSTRAINT carbon_periods_approved_run_fk
    FOREIGN KEY (organization_id, approved_calculation_run_id, id, inventory_id)
    REFERENCES platform.carbon_calculation_runs(organization_id, id, reporting_period_id, inventory_id);

CREATE OR REPLACE FUNCTION platform.guard_carbon_period_approved_run()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('approved','locked') AND NEW.approved_calculation_run_id IS NULL THEN
    RAISE EXCEPTION 'Approved reporting periods require one approved full-coverage calculation run';
  END IF;
  IF OLD.approved_calculation_run_id IS NOT NULL
    AND NEW.approved_calculation_run_id IS DISTINCT FROM OLD.approved_calculation_run_id THEN
    RAISE EXCEPTION 'The approved reporting-period calculation run is immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER carbon_reporting_periods_approved_run
BEFORE UPDATE ON platform.carbon_reporting_periods
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_period_approved_run();

ALTER TABLE platform.reports
  ADD COLUMN source_kind text NOT NULL DEFAULT 'customer_authored'
    CHECK (source_kind IN ('customer_authored','carbon_professional')),
  ADD COLUMN carbon_inventory_id uuid,
  ADD COLUMN carbon_reporting_period_id uuid,
  ADD COLUMN carbon_calculation_run_id uuid,
  ADD CONSTRAINT reports_carbon_inventory_fk
    FOREIGN KEY (organization_id, carbon_inventory_id)
    REFERENCES platform.carbon_inventories(organization_id, id),
  ADD CONSTRAINT reports_carbon_period_fk
    FOREIGN KEY (organization_id, carbon_reporting_period_id, carbon_inventory_id)
    REFERENCES platform.carbon_reporting_periods(organization_id, id, inventory_id),
  ADD CONSTRAINT reports_carbon_run_fk
    FOREIGN KEY (organization_id, carbon_calculation_run_id, carbon_reporting_period_id, carbon_inventory_id)
    REFERENCES platform.carbon_calculation_runs(organization_id, id, reporting_period_id, inventory_id),
  ADD CONSTRAINT reports_carbon_context_check CHECK (
    (source_kind = 'customer_authored' AND carbon_inventory_id IS NULL
      AND carbon_reporting_period_id IS NULL AND carbon_calculation_run_id IS NULL)
    OR
    (source_kind = 'carbon_professional' AND template_code = 'carbon-professional'
      AND carbon_inventory_id IS NOT NULL AND carbon_reporting_period_id IS NOT NULL
      AND carbon_calculation_run_id IS NOT NULL)
  );

CREATE TABLE platform.report_version_calculation_runs (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  content_version integer NOT NULL,
  calculation_run_id uuid NOT NULL,
  PRIMARY KEY (organization_id, report_id, content_version, calculation_run_id),
  FOREIGN KEY (organization_id, report_id, content_version)
    REFERENCES platform.report_content_versions(organization_id, report_id, version) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, calculation_run_id)
    REFERENCES platform.carbon_calculation_runs(organization_id, id)
);

CREATE TABLE platform.report_version_calculation_details (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  content_version integer NOT NULL,
  calculation_detail_id uuid NOT NULL,
  PRIMARY KEY (organization_id, report_id, content_version, calculation_detail_id),
  FOREIGN KEY (organization_id, report_id, content_version)
    REFERENCES platform.report_content_versions(organization_id, report_id, version) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, calculation_detail_id)
    REFERENCES platform.carbon_calculation_details(organization_id, id)
);

CREATE TABLE platform.report_version_evidence_versions (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  content_version integer NOT NULL,
  evidence_document_id uuid NOT NULL,
  evidence_version_id uuid NOT NULL,
  PRIMARY KEY (organization_id, report_id, content_version, evidence_document_id, evidence_version_id),
  FOREIGN KEY (organization_id, report_id, content_version)
    REFERENCES platform.report_content_versions(organization_id, report_id, version) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, evidence_version_id, evidence_document_id)
    REFERENCES platform.evidence_versions(organization_id, id, evidence_document_id)
);

CREATE OR REPLACE FUNCTION platform.guard_report_version_run_source()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform.reports report
    WHERE report.organization_id=NEW.organization_id AND report.id=NEW.report_id
      AND report.source_kind='carbon_professional'
      AND report.carbon_calculation_run_id=NEW.calculation_run_id) THEN
    RAISE EXCEPTION 'Report version calculation run must match the server-derived report context';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER report_version_calculation_runs_context
BEFORE INSERT ON platform.report_version_calculation_runs
FOR EACH ROW EXECUTE FUNCTION platform.guard_report_version_run_source();

CREATE OR REPLACE FUNCTION platform.guard_report_version_detail_source()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform.reports report
    JOIN platform.carbon_calculation_run_activities item
      ON item.organization_id=report.organization_id AND item.run_id=report.carbon_calculation_run_id
     AND item.calculation_detail_id=NEW.calculation_detail_id
    WHERE report.organization_id=NEW.organization_id AND report.id=NEW.report_id
      AND report.source_kind='carbon_professional') THEN
    RAISE EXCEPTION 'Report version calculation detail must belong to the bound calculation run';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER report_version_calculation_details_context
BEFORE INSERT ON platform.report_version_calculation_details
FOR EACH ROW EXECUTE FUNCTION platform.guard_report_version_detail_source();

CREATE OR REPLACE FUNCTION platform.guard_report_version_evidence_source()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform.reports report
    JOIN platform.carbon_calculation_run_activities item
      ON item.organization_id=report.organization_id AND item.run_id=report.carbon_calculation_run_id
    JOIN platform.carbon_activity_evidence link
      ON link.organization_id=item.organization_id AND link.activity_data_id=item.activity_data_id
     AND link.evidence_document_id=NEW.evidence_document_id
     AND link.evidence_version_id=NEW.evidence_version_id
    WHERE report.organization_id=NEW.organization_id AND report.id=NEW.report_id
      AND report.source_kind='carbon_professional') THEN
    RAISE EXCEPTION 'Report version evidence must belong to an activity in the bound calculation run';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER report_version_evidence_versions_context
BEFORE INSERT ON platform.report_version_evidence_versions
FOR EACH ROW EXECUTE FUNCTION platform.guard_report_version_evidence_source();

CREATE TRIGGER report_version_calculation_runs_immutable
BEFORE UPDATE OR DELETE ON platform.report_version_calculation_runs
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER report_version_calculation_details_immutable
BEFORE UPDATE OR DELETE ON platform.report_version_calculation_details
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER report_version_evidence_versions_immutable
BEFORE UPDATE OR DELETE ON platform.report_version_evidence_versions
FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.report_version_calculation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_version_calculation_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.report_version_calculation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_version_calculation_details FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.report_version_evidence_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_version_evidence_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY report_version_runs_select ON platform.report_version_calculation_runs FOR SELECT
USING (organization_id=platform.current_organization_id() AND platform.has_permission('report.read'));
CREATE POLICY report_version_runs_insert ON platform.report_version_calculation_runs FOR INSERT
WITH CHECK (organization_id=platform.current_organization_id() AND platform.has_permission('report.create'));
CREATE POLICY report_version_details_select ON platform.report_version_calculation_details FOR SELECT
USING (organization_id=platform.current_organization_id() AND platform.has_permission('report.read'));
CREATE POLICY report_version_details_insert ON platform.report_version_calculation_details FOR INSERT
WITH CHECK (organization_id=platform.current_organization_id() AND platform.has_permission('report.create'));
CREATE POLICY report_version_evidence_select ON platform.report_version_evidence_versions FOR SELECT
USING (organization_id=platform.current_organization_id() AND platform.has_permission('report.read'));
CREATE POLICY report_version_evidence_insert ON platform.report_version_evidence_versions FOR INSERT
WITH CHECK (organization_id=platform.current_organization_id() AND platform.has_permission('report.create'));

CREATE OR REPLACE FUNCTION platform.guard_carbon_period_content()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE period_status text;
BEGIN
  SELECT status INTO period_status FROM platform.carbon_reporting_periods
   WHERE organization_id=COALESCE(NEW.organization_id, OLD.organization_id)
     AND id=COALESCE(NEW.reporting_period_id, OLD.reporting_period_id)
   FOR SHARE;
  IF period_status IN ('approved','locked') THEN
    RAISE EXCEPTION 'Approved or locked reporting-period content is immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER carbon_activity_data_lifecycle ON platform.carbon_activity_data;
CREATE TRIGGER carbon_activity_data_period_guard
BEFORE INSERT OR UPDATE OR DELETE ON platform.carbon_activity_data
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_period_content();
CREATE TRIGGER carbon_activity_data_lifecycle
BEFORE INSERT OR UPDATE ON platform.carbon_activity_data
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_activity_lifecycle();

CREATE OR REPLACE FUNCTION platform.guard_carbon_boundary_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(OLD.organization_id::text || ':carbon-boundary:' || OLD.inventory_id::text,0));
    IF EXISTS (SELECT 1 FROM platform.carbon_reporting_periods period
      WHERE period.organization_id=OLD.organization_id AND period.inventory_id=OLD.inventory_id
        AND period.status IN ('approved','locked')
        AND period.ends_on >= COALESCE(OLD.effective_from, '-infinity'::date)
        AND period.starts_on <= COALESCE(OLD.effective_to, 'infinity'::date)) THEN
      RAISE EXCEPTION 'Boundary overlapping an approved reporting period is immutable';
    END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text || ':carbon-boundary:' || NEW.inventory_id::text,0));
    IF EXISTS (SELECT 1 FROM platform.carbon_reporting_periods period
      WHERE period.organization_id=NEW.organization_id AND period.inventory_id=NEW.inventory_id
        AND period.status IN ('approved','locked')
        AND period.ends_on >= COALESCE(NEW.effective_from, '-infinity'::date)
        AND period.starts_on <= COALESCE(NEW.effective_to, 'infinity'::date)) THEN
      RAISE EXCEPTION 'Boundary overlapping an approved reporting period is immutable';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
CREATE TRIGGER carbon_boundary_members_period_guard
BEFORE INSERT OR UPDATE OR DELETE ON platform.carbon_boundary_members
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_boundary_mutation();

CREATE OR REPLACE FUNCTION platform.guard_carbon_run_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE period_status text;
BEGIN
  SELECT status INTO period_status FROM platform.carbon_reporting_periods
    WHERE organization_id=NEW.organization_id AND id=NEW.reporting_period_id FOR SHARE;
  IF period_status IN ('approved','locked') THEN
    RAISE EXCEPTION 'Approved or locked reporting periods cannot be recalculated';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER carbon_calculation_runs_period_guard
BEFORE INSERT ON platform.carbon_calculation_runs
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_run_insert();

CREATE OR REPLACE FUNCTION platform.guard_carbon_detail_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE boundary_valid boolean; period_status text;
BEGIN
  SELECT period.status INTO period_status
    FROM platform.carbon_activity_data activity
    JOIN platform.carbon_reporting_periods period
      ON period.organization_id=activity.organization_id AND period.id=activity.reporting_period_id
   WHERE activity.organization_id=NEW.organization_id AND activity.id=NEW.activity_data_id
   FOR SHARE OF period;
  SELECT EXISTS (
    SELECT 1 FROM platform.carbon_activity_data activity
    JOIN platform.carbon_reporting_periods period
      ON period.organization_id=activity.organization_id AND period.id=activity.reporting_period_id
    JOIN platform.carbon_boundary_members boundary
      ON boundary.organization_id=activity.organization_id AND boundary.inventory_id=activity.inventory_id
     AND boundary.facility_id=activity.facility_id AND boundary.included=true
     AND boundary.consolidation_percent=100
     AND (boundary.effective_from IS NULL OR boundary.effective_from <= period.starts_on)
     AND (boundary.effective_to IS NULL OR boundary.effective_to >= period.ends_on)
    WHERE activity.organization_id=NEW.organization_id AND activity.id=NEW.activity_data_id
  ) INTO boundary_valid;
  IF NOT boundary_valid THEN
    RAISE EXCEPTION 'Calculation detail requires an effective included 100 percent consolidation boundary';
  END IF;
  IF period_status IN ('approved','locked') THEN
    RAISE EXCEPTION 'Approved or locked reporting periods cannot receive calculation details';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER carbon_calculation_details_period_guard
BEFORE INSERT ON platform.carbon_calculation_details
FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_detail_insert();
