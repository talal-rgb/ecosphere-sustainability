CREATE SCHEMA IF NOT EXISTS platform;

CREATE OR REPLACE FUNCTION platform.current_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION platform.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION platform.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION platform.reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is immutable', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;

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
    OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
    OR NEW.uploaded_at IS DISTINCT FROM OLD.uploaded_at
  THEN
    RAISE EXCEPTION 'Evidence file identity and storage metadata are immutable' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE platform.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  locale text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'deleted')),
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email = lower(email)),
  CHECK (char_length(email) BETWEEN 3 AND 254),
  CHECK (char_length(display_name) BETWEEN 1 AND 200)
);
CREATE UNIQUE INDEX app_users_email_unique ON platform.app_users (lower(email));

CREATE TABLE platform.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  industry_code text,
  country_code text CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  data_region text NOT NULL DEFAULT 'eu',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'closed')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (char_length(slug) BETWEEN 3 AND 80),
  CHECK (char_length(name) BETWEEN 1 AND 200)
);

CREATE TABLE platform.role_definitions (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 100),
  is_system boolean NOT NULL DEFAULT true
);

CREATE TABLE platform.permissions (
  code text PRIMARY KEY,
  resource text NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  UNIQUE (resource, action)
);

CREATE TABLE platform.role_permissions (
  role_code text NOT NULL REFERENCES platform.role_definitions(code) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES platform.permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE platform.organization_memberships (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES platform.app_users(id) ON DELETE CASCADE,
  role_code text NOT NULL REFERENCES platform.role_definitions(code),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid REFERENCES platform.app_users(id),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX organization_memberships_user_idx ON platform.organization_memberships (user_id, status);

CREATE OR REPLACE FUNCTION platform.has_permission(requested_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = platform, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships membership
    JOIN role_permissions grant_row ON grant_row.role_code = membership.role_code
    WHERE membership.organization_id = platform.current_organization_id()
      AND membership.user_id = platform.current_user_id()
      AND membership.status = 'active'
      AND grant_row.permission_code = requested_permission
  )
$$;

CREATE TABLE platform.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  parent_id uuid,
  code text,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code),
  FOREIGN KEY (organization_id, parent_id) REFERENCES platform.business_units(organization_id, id)
);

CREATE TABLE platform.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  business_unit_id uuid,
  code text,
  name text NOT NULL,
  country_code text CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  address jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(address) = 'object'),
  latitude numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code),
  FOREIGN KEY (organization_id, business_unit_id) REFERENCES platform.business_units(organization_id, id)
);

CREATE TABLE platform.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  site_id uuid NOT NULL,
  code text,
  name text NOT NULL,
  facility_type text,
  floor_area_m2 numeric(16,3) CHECK (floor_area_m2 IS NULL OR floor_area_m2 >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code),
  FOREIGN KEY (organization_id, site_id) REFERENCES platform.sites(organization_id, id)
);

CREATE TABLE platform.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  business_unit_id uuid,
  site_id uuid,
  facility_id uuid,
  owner_user_id uuid REFERENCES platform.app_users(id),
  code text,
  name text NOT NULL,
  description text,
  product_module text NOT NULL CHECK (product_module IN ('carbon', 'esg', 'energy', 'training', 'quiz', 'intelligence', 'cross_platform')),
  project_type text NOT NULL,
  reporting_period_start date,
  reporting_period_end date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'in_review', 'approved', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code),
  FOREIGN KEY (organization_id, business_unit_id) REFERENCES platform.business_units(organization_id, id),
  FOREIGN KEY (organization_id, site_id) REFERENCES platform.sites(organization_id, id),
  FOREIGN KEY (organization_id, facility_id) REFERENCES platform.facilities(organization_id, id),
  CHECK (reporting_period_end IS NULL OR reporting_period_start IS NULL OR reporting_period_end >= reporting_period_start)
);
CREATE INDEX projects_org_status_idx ON platform.projects (organization_id, status, updated_at DESC);

CREATE TABLE platform.evidence_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  project_id uuid,
  current_version integer NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  display_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report', 'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report', 'sustainability_report', 'governance_document', 'erp_export', 'other')),
  classification_status text NOT NULL DEFAULT 'pending' CHECK (classification_status IN ('pending', 'classified', 'review_required', 'approved', 'rejected')),
  retention_policy text NOT NULL DEFAULT 'organization_default',
  retention_until date,
  legal_hold boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id)
);
CREATE INDEX evidence_documents_search_idx ON platform.evidence_documents (organization_id, project_id, document_type, classification_status);

CREATE TABLE platform.evidence_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  evidence_document_id uuid NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  original_file_name text NOT NULL,
  media_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 52428800),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  object_key text NOT NULL,
  malware_scan_status text NOT NULL DEFAULT 'pending' CHECK (malware_scan_status IN ('pending', 'clean', 'infected', 'failed')),
  extraction_status text NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'review_required', 'complete', 'failed', 'not_applicable')),
  extracted_data jsonb CHECK (extracted_data IS NULL OR jsonb_typeof(extracted_data) = 'object'),
  extraction_confidence numeric(5,4) CHECK (extraction_confidence IS NULL OR extraction_confidence BETWEEN 0 AND 1),
  extraction_model text,
  uploaded_by uuid NOT NULL REFERENCES platform.app_users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, evidence_document_id, version_number),
  UNIQUE (organization_id, object_key),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id),
  CHECK (object_key LIKE organization_id::text || '/%')
);

CREATE TABLE platform.evidence_tags (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  evidence_document_id uuid NOT NULL,
  tag text NOT NULL CHECK (tag ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, evidence_document_id, tag),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id)
);

CREATE TABLE platform.calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  site_id uuid,
  parent_calculation_id uuid,
  calculation_type text NOT NULL,
  methodology text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'in_review', 'approved', 'superseded', 'void')),
  input_data jsonb NOT NULL CHECK (jsonb_typeof(input_data) = 'object'),
  result_data jsonb CHECK (result_data IS NULL OR jsonb_typeof(result_data) = 'object'),
  factor_manifest jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(factor_manifest) = 'array'),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  approved_by uuid REFERENCES platform.app_users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id),
  FOREIGN KEY (organization_id, site_id) REFERENCES platform.sites(organization_id, id),
  FOREIGN KEY (organization_id, parent_calculation_id) REFERENCES platform.calculations(organization_id, id),
  CHECK ((status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR status <> 'approved')
);

CREATE TABLE platform.calculation_evidence (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  calculation_id uuid NOT NULL,
  evidence_document_id uuid NOT NULL,
  purpose text NOT NULL DEFAULT 'source',
  linked_by uuid NOT NULL REFERENCES platform.app_users(id),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, calculation_id, evidence_document_id),
  FOREIGN KEY (organization_id, calculation_id) REFERENCES platform.calculations(organization_id, id),
  FOREIGN KEY (organization_id, evidence_document_id) REFERENCES platform.evidence_documents(organization_id, id)
);

CREATE TABLE platform.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  report_type text NOT NULL,
  title text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'in_review', 'approved', 'published', 'archived')),
  storage_provider text,
  storage_bucket text,
  object_key text,
  sha256 text CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
  created_by uuid NOT NULL REFERENCES platform.app_users(id),
  approved_by uuid REFERENCES platform.app_users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id),
  CHECK (object_key IS NULL OR object_key LIKE organization_id::text || '/%')
);

CREATE TABLE platform.report_calculations (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL,
  calculation_id uuid NOT NULL,
  PRIMARY KEY (organization_id, report_id, calculation_id),
  FOREIGN KEY (organization_id, report_id) REFERENCES platform.reports(organization_id, id),
  FOREIGN KEY (organization_id, calculation_id) REFERENCES platform.calculations(organization_id, id)
);

CREATE TABLE platform.plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  display_order smallint NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE platform.plan_features (
  plan_code text NOT NULL REFERENCES platform.plans(code) ON DELETE CASCADE,
  feature_code text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  limit_value bigint CHECK (limit_value IS NULL OR limit_value >= 0),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(configuration) = 'object'),
  PRIMARY KEY (plan_code, feature_code)
);

CREATE TABLE platform.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES platform.organizations(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES platform.plans(code),
  provider text NOT NULL DEFAULT 'none' CHECK (provider IN ('none', 'stripe', 'paypal', 'bank_transfer', 'enterprise_invoice')),
  provider_customer_ref text,
  provider_subscription_ref text,
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'incomplete')),
  billing_interval text CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual', 'contract')),
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_customer_ref),
  UNIQUE (provider, provider_subscription_ref)
);

CREATE TABLE platform.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES platform.app_users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);
CREATE INDEX notifications_user_unread_idx ON platform.notifications (organization_id, user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE platform.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES platform.app_users(id),
  project_id uuid,
  agent_type text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  estimated_cost_minor bigint CHECK (estimated_cost_minor IS NULL OR estimated_cost_minor >= 0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  request_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, request_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id)
);
CREATE INDEX ai_usage_org_created_idx ON platform.ai_usage (organization_id, created_at DESC);

CREATE TABLE platform.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES platform.app_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  request_id text,
  previous_event_hash text CHECK (previous_event_hash IS NULL OR previous_event_hash ~ '^[a-f0-9]{64}$'),
  event_hash text NOT NULL CHECK (event_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_hash)
);
CREATE INDEX audit_events_org_created_idx ON platform.audit_events (organization_id, created_at DESC, id);

CREATE TRIGGER app_users_touch_updated_at BEFORE UPDATE ON platform.app_users FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER organizations_touch_updated_at BEFORE UPDATE ON platform.organizations FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER memberships_touch_updated_at BEFORE UPDATE ON platform.organization_memberships FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER business_units_touch_updated_at BEFORE UPDATE ON platform.business_units FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER sites_touch_updated_at BEFORE UPDATE ON platform.sites FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER facilities_touch_updated_at BEFORE UPDATE ON platform.facilities FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON platform.projects FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER evidence_documents_touch_updated_at BEFORE UPDATE ON platform.evidence_documents FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER calculations_touch_updated_at BEFORE UPDATE ON platform.calculations FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER reports_touch_updated_at BEFORE UPDATE ON platform.reports FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER subscriptions_touch_updated_at BEFORE UPDATE ON platform.subscriptions FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER evidence_versions_protect_file BEFORE UPDATE ON platform.evidence_versions FOR EACH ROW EXECUTE FUNCTION platform.protect_evidence_version();
CREATE TRIGGER evidence_versions_reject_delete BEFORE DELETE ON platform.evidence_versions FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON platform.audit_events FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

INSERT INTO platform.role_definitions (code, name, description, rank) VALUES
  ('owner', 'Owner', 'Full organization control including ownership, billing, and deletion.', 100),
  ('administrator', 'Administrator', 'Manages organization configuration, users, projects, and billing.', 90),
  ('manager', 'Manager', 'Manages projects, evidence, calculations, reports, and workflows.', 75),
  ('engineer', 'Engineer', 'Creates and updates technical projects, evidence, and calculations.', 60),
  ('consultant', 'Consultant', 'Works across assigned projects and produces recommendations and reports.', 55),
  ('reviewer', 'Reviewer', 'Reviews calculations, evidence, and reports without administration access.', 45),
  ('auditor', 'Auditor', 'Read-only access to evidence, calculations, reports, and audit history.', 35),
  ('read_only', 'Read-only', 'Views permitted organization and project records.', 10);

INSERT INTO platform.permissions (code, resource, action, description) VALUES
  ('organization.read', 'organization', 'read', 'View organization structure and profile.'),
  ('organization.update', 'organization', 'update', 'Update organization profile and structure.'),
  ('organization.delete', 'organization', 'delete', 'Close or delete an organization.'),
  ('member.read', 'member', 'read', 'View organization members.'),
  ('member.manage', 'member', 'manage', 'Invite, update, suspend, and remove members.'),
  ('project.read', 'project', 'read', 'View projects.'),
  ('project.create', 'project', 'create', 'Create projects.'),
  ('project.update', 'project', 'update', 'Update projects.'),
  ('project.delete', 'project', 'delete', 'Delete or archive projects.'),
  ('evidence.read', 'evidence', 'read', 'View evidence and versions.'),
  ('evidence.upload', 'evidence', 'upload', 'Create evidence and upload versions.'),
  ('evidence.update', 'evidence', 'update', 'Update evidence metadata and review status.'),
  ('evidence.delete', 'evidence', 'delete', 'Apply retention-aware evidence deletion.'),
  ('calculation.read', 'calculation', 'read', 'View calculations and ledgers.'),
  ('calculation.create', 'calculation', 'create', 'Create and update draft calculations.'),
  ('calculation.approve', 'calculation', 'approve', 'Approve or void calculations.'),
  ('report.read', 'report', 'read', 'View reports.'),
  ('report.create', 'report', 'create', 'Create and update draft reports.'),
  ('report.approve', 'report', 'approve', 'Approve or publish reports.'),
  ('audit.read', 'audit', 'read', 'View the organization audit trail.'),
  ('billing.read', 'billing', 'read', 'View subscription and billing status.'),
  ('billing.manage', 'billing', 'manage', 'Manage subscription and billing settings.'),
  ('subscription.entitlement', 'subscription', 'entitlement', 'Read effective feature entitlements for product gating.'),
  ('ai.use', 'ai', 'use', 'Use enabled AI assistants.'),
  ('ai.admin', 'ai', 'admin', 'View organization-wide AI usage and controls.'),
  ('training.read', 'training', 'read', 'View training records and certificates.'),
  ('training.manage', 'training', 'manage', 'Manage corporate training assignments.'),
  ('api.manage', 'api', 'manage', 'Manage API keys and integrations.');

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT role.code, permission.code
FROM platform.role_definitions role
CROSS JOIN platform.permissions permission
WHERE role.code = 'owner';

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT 'administrator', code FROM platform.permissions WHERE code <> 'organization.delete';

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT 'manager', code FROM platform.permissions WHERE code IN (
  'organization.read', 'member.read', 'project.read', 'project.create', 'project.update',
  'evidence.read', 'evidence.upload', 'evidence.update', 'calculation.read', 'calculation.create',
  'calculation.approve', 'report.read', 'report.create', 'report.approve', 'audit.read',
  'ai.use', 'ai.admin', 'training.read', 'training.manage'
);

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT role_code, permission_code FROM (VALUES
  ('engineer', 'organization.read'), ('engineer', 'project.read'), ('engineer', 'project.create'), ('engineer', 'project.update'),
  ('engineer', 'evidence.read'), ('engineer', 'evidence.upload'), ('engineer', 'evidence.update'),
  ('engineer', 'calculation.read'), ('engineer', 'calculation.create'), ('engineer', 'report.read'), ('engineer', 'report.create'), ('engineer', 'ai.use'),
  ('consultant', 'organization.read'), ('consultant', 'project.read'), ('consultant', 'project.create'), ('consultant', 'project.update'),
  ('consultant', 'evidence.read'), ('consultant', 'evidence.upload'), ('consultant', 'evidence.update'),
  ('consultant', 'calculation.read'), ('consultant', 'calculation.create'), ('consultant', 'report.read'), ('consultant', 'report.create'), ('consultant', 'ai.use'),
  ('reviewer', 'organization.read'), ('reviewer', 'project.read'), ('reviewer', 'evidence.read'), ('reviewer', 'calculation.read'),
  ('reviewer', 'calculation.approve'), ('reviewer', 'report.read'), ('reviewer', 'report.approve'), ('reviewer', 'audit.read'),
  ('auditor', 'organization.read'), ('auditor', 'member.read'), ('auditor', 'project.read'), ('auditor', 'evidence.read'),
  ('auditor', 'calculation.read'), ('auditor', 'report.read'), ('auditor', 'audit.read'),
  ('read_only', 'organization.read'), ('read_only', 'project.read'), ('read_only', 'calculation.read'), ('read_only', 'report.read'),
  ('read_only', 'training.read')
) grants(role_code, permission_code);

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT code, 'subscription.entitlement' FROM platform.role_definitions
ON CONFLICT DO NOTHING;

INSERT INTO platform.plans (code, name, display_order) VALUES
  ('free', 'Free', 10), ('starter', 'Starter', 20), ('professional', 'Professional', 30),
  ('business', 'Business', 40), ('enterprise', 'Enterprise', 50);

INSERT INTO platform.plan_features (plan_code, feature_code, enabled, limit_value) VALUES
  ('free', 'calculations.monthly', true, 5), ('free', 'projects.total', false, 0), ('free', 'reports.basic', true, 2),
  ('free', 'document_uploads.monthly', false, 0), ('free', 'ai.requests.monthly', false, 0), ('free', 'organization.users', false, 0),
  ('starter', 'calculations.monthly', true, 50), ('starter', 'projects.total', true, 5), ('starter', 'reports.basic', true, 20),
  ('starter', 'document_uploads.monthly', true, 10), ('starter', 'ai.requests.monthly', true, 25), ('starter', 'organization.users', true, 1),
  ('professional', 'calculations.monthly', true, NULL), ('professional', 'projects.total', true, NULL), ('professional', 'reports.professional', true, NULL),
  ('professional', 'document_uploads.monthly', true, 500), ('professional', 'ai.requests.monthly', true, 1000), ('professional', 'organization.users', true, 5),
  ('professional', 'evidence.repository', true, NULL), ('professional', 'recommendations.ai', true, NULL),
  ('business', 'calculations.monthly', true, NULL), ('business', 'projects.total', true, NULL), ('business', 'reports.professional', true, NULL),
  ('business', 'document_uploads.monthly', true, 5000), ('business', 'ai.requests.monthly', true, 10000), ('business', 'organization.users', true, 50),
  ('business', 'evidence.repository', true, NULL), ('business', 'recommendations.ai', true, NULL), ('business', 'workflow.approvals', true, NULL),
  ('business', 'audit.full', true, NULL), ('business', 'api.access', true, NULL), ('business', 'training.corporate', true, NULL),
  ('enterprise', 'calculations.monthly', true, NULL), ('enterprise', 'projects.total', true, NULL), ('enterprise', 'reports.professional', true, NULL),
  ('enterprise', 'document_uploads.monthly', true, NULL), ('enterprise', 'ai.requests.monthly', true, NULL), ('enterprise', 'organization.users', true, NULL),
  ('enterprise', 'evidence.repository', true, NULL), ('enterprise', 'recommendations.ai', true, NULL), ('enterprise', 'workflow.approvals', true, NULL),
  ('enterprise', 'audit.full', true, NULL), ('enterprise', 'api.access', true, NULL), ('enterprise', 'training.corporate', true, NULL),
  ('enterprise', 'sso.saml', true, NULL), ('enterprise', 'integrations.enterprise', true, NULL), ('enterprise', 'branding.custom', true, NULL);

CREATE OR REPLACE FUNCTION platform.bootstrap_organization(
  requested_user_id uuid,
  requested_organization_id uuid,
  requested_auth_subject text,
  requested_email text,
  requested_display_name text,
  requested_slug text,
  requested_organization_name text,
  requested_industry_code text DEFAULT NULL,
  requested_country_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform, pg_temp
AS $$
BEGIN
  IF requested_user_id IS DISTINCT FROM platform.current_user_id()
    OR requested_organization_id IS DISTINCT FROM platform.current_organization_id()
  THEN
    RAISE EXCEPTION 'Bootstrap identity does not match the authenticated platform context' USING ERRCODE = '42501';
  END IF;

  INSERT INTO app_users (id, auth_subject, email, display_name, status)
  VALUES (requested_user_id, requested_auth_subject, requested_email, requested_display_name, 'active')
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = requested_user_id AND auth_subject = requested_auth_subject
  ) THEN
    RAISE EXCEPTION 'Authenticated subject does not match the platform user' USING ERRCODE = '42501';
  END IF;

  INSERT INTO organizations (id, slug, name, industry_code, country_code, status)
  VALUES (
    requested_organization_id, requested_slug, requested_organization_name,
    requested_industry_code, requested_country_code, 'active'
  );
  INSERT INTO organization_memberships (organization_id, user_id, role_code, status, joined_at)
  VALUES (requested_organization_id, requested_user_id, 'owner', 'active', now());
  INSERT INTO subscriptions (organization_id, plan_code, provider, status)
  VALUES (requested_organization_id, 'free', 'none', 'free');
END;
$$;
REVOKE ALL ON FUNCTION platform.bootstrap_organization(uuid, uuid, text, text, text, text, text, text, text) FROM PUBLIC;

ALTER TABLE platform.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.app_users FORCE ROW LEVEL SECURITY;
CREATE POLICY app_users_self_select ON platform.app_users FOR SELECT USING (id = platform.current_user_id());
CREATE POLICY app_users_self_insert ON platform.app_users FOR INSERT WITH CHECK (id = platform.current_user_id());
CREATE POLICY app_users_self_update ON platform.app_users FOR UPDATE USING (id = platform.current_user_id()) WITH CHECK (id = platform.current_user_id());

ALTER TABLE platform.organizations ENABLE ROW LEVEL SECURITY;
-- The migration owner retains the narrow SECURITY DEFINER bootstrap path. The
-- runtime role must be a non-owner, so normal RLS still applies to every API query.
CREATE POLICY organizations_select ON platform.organizations FOR SELECT USING (id = platform.current_organization_id() AND platform.has_permission('organization.read'));
CREATE POLICY organizations_update ON platform.organizations FOR UPDATE USING (id = platform.current_organization_id() AND platform.has_permission('organization.update')) WITH CHECK (id = platform.current_organization_id());
CREATE POLICY organizations_delete ON platform.organizations FOR DELETE USING (id = platform.current_organization_id() AND platform.has_permission('organization.delete'));

ALTER TABLE platform.organization_memberships ENABLE ROW LEVEL SECURITY;
-- Keep this policy deliberately non-recursive: has_permission() reads the caller's
-- own membership through this policy. Member-directory reads use a dedicated
-- permission-checked repository query rather than broadening the RLS predicate.
CREATE POLICY memberships_select ON platform.organization_memberships FOR SELECT USING (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id());
CREATE POLICY memberships_insert ON platform.organization_memberships FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND platform.has_permission('member.manage')
  AND invited_by = platform.current_user_id()
);
CREATE POLICY memberships_update ON platform.organization_memberships FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('member.manage')) WITH CHECK (organization_id = platform.current_organization_id());
CREATE POLICY memberships_delete ON platform.organization_memberships FOR DELETE USING (organization_id = platform.current_organization_id() AND platform.has_permission('member.manage'));

ALTER TABLE platform.business_units ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.business_units FORCE ROW LEVEL SECURITY;
CREATE POLICY business_units_select ON platform.business_units FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.read'));
CREATE POLICY business_units_write ON platform.business_units FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update'));

ALTER TABLE platform.sites ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.sites FORCE ROW LEVEL SECURITY;
CREATE POLICY sites_select ON platform.sites FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.read'));
CREATE POLICY sites_write ON platform.sites FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update'));

ALTER TABLE platform.facilities ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.facilities FORCE ROW LEVEL SECURITY;
CREATE POLICY facilities_select ON platform.facilities FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.read'));
CREATE POLICY facilities_write ON platform.facilities FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('organization.update'));

ALTER TABLE platform.projects ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.projects FORCE ROW LEVEL SECURITY;
CREATE POLICY projects_select ON platform.projects FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('project.read'));
CREATE POLICY projects_insert ON platform.projects FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('project.create') AND (owner_user_id IS NULL OR owner_user_id = platform.current_user_id()));
CREATE POLICY projects_update ON platform.projects FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('project.update')) WITH CHECK (organization_id = platform.current_organization_id());
CREATE POLICY projects_delete ON platform.projects FOR DELETE USING (organization_id = platform.current_organization_id() AND platform.has_permission('project.delete'));

ALTER TABLE platform.evidence_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.evidence_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY evidence_documents_select ON platform.evidence_documents FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY evidence_documents_insert ON platform.evidence_documents FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.upload') AND created_by = platform.current_user_id());
CREATE POLICY evidence_documents_update ON platform.evidence_documents FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.update')) WITH CHECK (organization_id = platform.current_organization_id());
CREATE POLICY evidence_documents_delete ON platform.evidence_documents FOR DELETE USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.delete') AND legal_hold = false);

ALTER TABLE platform.evidence_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.evidence_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY evidence_versions_select ON platform.evidence_versions FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY evidence_versions_insert ON platform.evidence_versions FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.upload') AND uploaded_by = platform.current_user_id());
CREATE POLICY evidence_versions_update ON platform.evidence_versions FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.update')) WITH CHECK (organization_id = platform.current_organization_id());

ALTER TABLE platform.evidence_tags ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.evidence_tags FORCE ROW LEVEL SECURITY;
CREATE POLICY evidence_tags_select ON platform.evidence_tags FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.read'));
CREATE POLICY evidence_tags_write ON platform.evidence_tags FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.update')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('evidence.update') AND created_by = platform.current_user_id());

ALTER TABLE platform.calculations ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.calculations FORCE ROW LEVEL SECURITY;
CREATE POLICY calculations_select ON platform.calculations FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read'));
CREATE POLICY calculations_insert ON platform.calculations FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create') AND created_by = platform.current_user_id());
CREATE POLICY calculations_update ON platform.calculations FOR UPDATE USING (organization_id = platform.current_organization_id() AND (platform.has_permission('calculation.create') OR platform.has_permission('calculation.approve'))) WITH CHECK (organization_id = platform.current_organization_id());

ALTER TABLE platform.calculation_evidence ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.calculation_evidence FORCE ROW LEVEL SECURITY;
CREATE POLICY calculation_evidence_select ON platform.calculation_evidence FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.read') AND platform.has_permission('evidence.read'));
CREATE POLICY calculation_evidence_write ON platform.calculation_evidence FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('calculation.create') AND linked_by = platform.current_user_id());

ALTER TABLE platform.reports ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.reports FORCE ROW LEVEL SECURITY;
CREATE POLICY reports_select ON platform.reports FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('report.read'));
CREATE POLICY reports_insert ON platform.reports FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('report.create') AND created_by = platform.current_user_id());
CREATE POLICY reports_update ON platform.reports FOR UPDATE USING (organization_id = platform.current_organization_id() AND (platform.has_permission('report.create') OR platform.has_permission('report.approve'))) WITH CHECK (organization_id = platform.current_organization_id());

ALTER TABLE platform.report_calculations ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.report_calculations FORCE ROW LEVEL SECURITY;
CREATE POLICY report_calculations_select ON platform.report_calculations FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('report.read'));
CREATE POLICY report_calculations_write ON platform.report_calculations FOR ALL USING (organization_id = platform.current_organization_id() AND platform.has_permission('report.create')) WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('report.create'));

ALTER TABLE platform.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_select ON platform.subscriptions FOR SELECT USING (organization_id = platform.current_organization_id() AND (platform.has_permission('billing.read') OR platform.has_permission('subscription.entitlement')));

ALTER TABLE platform.notifications ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON platform.notifications FOR SELECT USING (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id());
CREATE POLICY notifications_update ON platform.notifications FOR UPDATE USING (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id()) WITH CHECK (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id());

ALTER TABLE platform.ai_usage ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.ai_usage FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_select ON platform.ai_usage FOR SELECT USING (organization_id = platform.current_organization_id() AND (user_id = platform.current_user_id() OR platform.has_permission('ai.admin')));
CREATE POLICY ai_usage_insert ON platform.ai_usage FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id() AND platform.has_permission('ai.use'));

ALTER TABLE platform.audit_events ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.audit_events FORCE ROW LEVEL SECURITY;
-- Tenant members may resolve the previous hash for append-only chaining. User-facing
-- audit-list APIs must additionally require audit.read before returning event data.
CREATE POLICY audit_events_select ON platform.audit_events FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('organization.read'));
CREATE POLICY audit_events_insert ON platform.audit_events FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND actor_user_id = platform.current_user_id());
