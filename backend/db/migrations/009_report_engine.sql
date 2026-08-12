CREATE TABLE platform.report_template_definitions (
  code text PRIMARY KEY,
  name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('executive', 'technical', 'board', 'audit', 'investor', 'compliance')),
  audience text NOT NULL,
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  supported_formats text[] NOT NULL,
  template_spec jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(template_spec) = 'object'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (supported_formats <@ ARRAY['pdf','xlsx','docx','pptx','dashboard']::text[]),
  CHECK (cardinality(supported_formats) > 0)
);

INSERT INTO platform.report_template_definitions (code, name, report_type, audience, supported_formats) VALUES
  ('executive-standard', 'Executive Report', 'executive', 'executive leadership', ARRAY['pdf','xlsx','docx','pptx','dashboard']),
  ('technical-standard', 'Technical Report', 'technical', 'sustainability and engineering teams', ARRAY['pdf','xlsx','docx','dashboard']),
  ('board-standard', 'Board Report', 'board', 'board of directors', ARRAY['pdf','pptx','dashboard']),
  ('audit-standard', 'Audit Report', 'audit', 'internal and external auditors', ARRAY['pdf','xlsx','docx']),
  ('investor-standard', 'Investor Report', 'investor', 'investors and lenders', ARRAY['pdf','docx','pptx','dashboard']),
  ('compliance-standard', 'Compliance Report', 'compliance', 'regulators and compliance teams', ARRAY['pdf','xlsx','docx']);

ALTER TABLE platform.reports
  ADD COLUMN template_code text REFERENCES platform.report_template_definitions(code),
  ADD COLUMN audience text,
  ADD COLUMN locale text NOT NULL DEFAULT 'en',
  ADD COLUMN reporting_standard text,
  ADD COLUMN parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN current_content_version integer NOT NULL DEFAULT 0,
  ADD COLUMN published_at timestamptz,
  ADD CONSTRAINT reports_parameters_object_check CHECK (jsonb_typeof(parameters) = 'object'),
  ADD CONSTRAINT reports_locale_check CHECK (locale ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  ADD CONSTRAINT reports_content_version_check CHECK (current_content_version >= 0);

CREATE INDEX reports_workspace_idx ON platform.reports (organization_id, project_id, status, updated_at DESC);

CREATE TABLE platform.report_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  source_manifest jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(source_manifest) = 'object'),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, report_id, version),
  FOREIGN KEY (organization_id, report_id) REFERENCES platform.reports(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE platform.report_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  content_version integer NOT NULL CHECK (content_version > 0),
  output_format text NOT NULL CHECK (output_format IN ('pdf','xlsx','docx','pptx','dashboard')),
  renderer_version text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','retry','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  priority smallint NOT NULL DEFAULT 100 CHECK (priority BETWEEN 1 AND 1000),
  queued_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  locked_by text,
  started_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, idempotency_key),
  FOREIGN KEY (organization_id, report_id, content_version)
    REFERENCES platform.report_content_versions(organization_id, report_id, version)
);
CREATE INDEX report_generation_claim_idx ON platform.report_generation_jobs (priority, available_at, queued_at, id)
  WHERE status IN ('queued','retry');

CREATE TABLE platform.report_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  generation_job_id uuid NOT NULL,
  content_version integer NOT NULL CHECK (content_version > 0),
  output_format text NOT NULL CHECK (output_format IN ('pdf','xlsx','docx','pptx','dashboard')),
  media_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  object_key text NOT NULL,
  renderer_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, generation_job_id),
  FOREIGN KEY (organization_id, report_id) REFERENCES platform.reports(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, generation_job_id) REFERENCES platform.report_generation_jobs(organization_id, id),
  CHECK (object_key LIKE organization_id::text || '/%')
);
CREATE INDEX report_artifacts_report_idx ON platform.report_artifacts (organization_id, report_id, created_at DESC);

CREATE TABLE platform.report_evidence (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  evidence_document_id uuid NOT NULL,
  purpose text NOT NULL DEFAULT 'supporting',
  linked_by uuid NOT NULL REFERENCES platform.app_users(id),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, report_id, evidence_document_id),
  FOREIGN KEY (organization_id, report_id) REFERENCES platform.reports(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id)
);

CREATE TRIGGER report_template_definitions_touch_updated_at BEFORE UPDATE ON platform.report_template_definitions
  FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER report_generation_jobs_touch_updated_at BEFORE UPDATE ON platform.report_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER report_content_versions_immutable BEFORE UPDATE OR DELETE ON platform.report_content_versions
  FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER report_artifacts_immutable BEFORE UPDATE OR DELETE ON platform.report_artifacts
  FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.report_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_content_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY report_content_versions_select ON platform.report_content_versions FOR SELECT USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('report.read')
);
CREATE POLICY report_content_versions_insert ON platform.report_content_versions FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id() AND created_by = platform.current_user_id()
  AND platform.has_permission('report.create')
);

ALTER TABLE platform.report_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_generation_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY report_generation_jobs_select ON platform.report_generation_jobs FOR SELECT USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('report.read')
);
CREATE POLICY report_generation_jobs_insert ON platform.report_generation_jobs FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id() AND created_by = platform.current_user_id()
  AND platform.has_permission('report.create')
);

ALTER TABLE platform.report_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_artifacts FORCE ROW LEVEL SECURITY;
CREATE POLICY report_artifacts_select ON platform.report_artifacts FOR SELECT USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('report.read')
);

ALTER TABLE platform.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.report_evidence FORCE ROW LEVEL SECURITY;
CREATE POLICY report_evidence_select ON platform.report_evidence FOR SELECT USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('report.read')
  AND platform.has_permission('evidence.read')
);
CREATE POLICY report_evidence_write ON platform.report_evidence FOR ALL USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('report.create')
) WITH CHECK (
  organization_id = platform.current_organization_id() AND linked_by = platform.current_user_id()
  AND platform.has_permission('report.create')
);
