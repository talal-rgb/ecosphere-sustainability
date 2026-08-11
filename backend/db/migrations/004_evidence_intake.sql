CREATE TABLE platform.evidence_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  planned_evidence_document_id uuid NOT NULL,
  planned_version_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1 CHECK (version_number > 0),
  display_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report', 'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report', 'sustainability_report', 'governance_document', 'erp_export', 'other')),
  original_file_name text NOT NULL,
  media_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 52428800),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  object_key text NOT NULL,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'verified', 'finalized', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  finalized_at timestamptz,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, planned_evidence_document_id),
  UNIQUE (organization_id, planned_version_id),
  UNIQUE (organization_id, object_key),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id),
  CHECK (object_key LIKE organization_id::text || '/quarantine/%'),
  CHECK (expires_at > created_at)
);
CREATE INDEX evidence_upload_sessions_expiry_idx ON platform.evidence_upload_sessions (status, expires_at);

CREATE OR REPLACE FUNCTION platform.protect_evidence_upload_session()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id
     OR NEW.planned_evidence_document_id IS DISTINCT FROM OLD.planned_evidence_document_id
     OR NEW.planned_version_id IS DISTINCT FROM OLD.planned_version_id
     OR NEW.display_name IS DISTINCT FROM OLD.display_name
     OR NEW.document_type IS DISTINCT FROM OLD.document_type
     OR NEW.original_file_name IS DISTINCT FROM OLD.original_file_name
     OR NEW.media_type IS DISTINCT FROM OLD.media_type
     OR NEW.byte_size IS DISTINCT FROM OLD.byte_size
     OR NEW.sha256 IS DISTINCT FROM OLD.sha256
     OR NEW.storage_provider IS DISTINCT FROM OLD.storage_provider
     OR NEW.storage_bucket IS DISTINCT FROM OLD.storage_bucket
     OR NEW.object_key IS DISTINCT FROM OLD.object_key
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Evidence upload identity and storage metadata are immutable';
  END IF;
  IF OLD.status <> 'initiated' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Evidence upload is already in a terminal state';
  END IF;
  IF NEW.status = 'finalized' AND (
    NEW.verified_at IS NULL OR NEW.finalized_at IS NULL
    OR NOT EXISTS (SELECT 1 FROM platform.evidence_documents WHERE organization_id = NEW.organization_id AND id = NEW.planned_evidence_document_id)
    OR NOT EXISTS (SELECT 1 FROM platform.evidence_versions WHERE organization_id = NEW.organization_id AND id = NEW.planned_version_id)
  ) THEN
    RAISE EXCEPTION 'Finalized evidence upload requires its verified document and version';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_upload_sessions_protect
BEFORE UPDATE ON platform.evidence_upload_sessions
FOR EACH ROW EXECUTE FUNCTION platform.protect_evidence_upload_session();

CREATE TABLE platform.document_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  evidence_version_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage IN ('malware_scan', 'extract', 'classify', 'validate', 'link', 'insights')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'retry', 'complete', 'failed', 'cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  error_code text,
  result jsonb CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, evidence_version_id, stage),
  FOREIGN KEY (organization_id, evidence_version_id) REFERENCES platform.evidence_versions(organization_id, id)
);
CREATE INDEX document_processing_jobs_queue_idx ON platform.document_processing_jobs (stage, status, available_at) WHERE status IN ('queued', 'retry');

CREATE TRIGGER document_processing_jobs_touch_updated_at
BEFORE UPDATE ON platform.document_processing_jobs
FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();

ALTER TABLE platform.evidence_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.evidence_upload_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.document_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.document_processing_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY evidence_upload_sessions_select ON platform.evidence_upload_sessions FOR SELECT
USING (organization_id = platform.current_organization_id() AND (created_by = platform.current_user_id() OR platform.has_permission('evidence.read')));
CREATE POLICY evidence_upload_sessions_insert ON platform.evidence_upload_sessions FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id() AND created_by = platform.current_user_id() AND platform.has_permission('evidence.upload'));
CREATE POLICY evidence_upload_sessions_update ON platform.evidence_upload_sessions FOR UPDATE
USING (organization_id = platform.current_organization_id() AND created_by = platform.current_user_id() AND platform.has_permission('evidence.upload'))
WITH CHECK (organization_id = platform.current_organization_id() AND created_by = platform.current_user_id());

CREATE POLICY document_processing_jobs_select ON platform.document_processing_jobs FOR SELECT
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY document_processing_jobs_insert ON platform.document_processing_jobs FOR INSERT
WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.upload'));
CREATE POLICY document_processing_jobs_update ON platform.document_processing_jobs FOR UPDATE
USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.update'))
WITH CHECK (organization_id = platform.current_organization_id());
