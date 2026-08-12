CREATE TABLE platform.feature_definitions (
  code text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('boolean', 'limit', 'tier')),
  unit text,
  aggregation text CHECK (aggregation IS NULL OR aggregation IN ('count', 'sum', 'maximum')),
  reset_period text CHECK (reset_period IS NULL OR reset_period IN ('monthly', 'annual', 'never')),
  description text NOT NULL,
  is_metered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform.feature_definitions (code, name, category, value_type, unit, aggregation, reset_period, description, is_metered) VALUES
  ('calculations.monthly', 'Monthly calculations', 'carbon', 'limit', 'calculation', 'count', 'monthly', 'Completed calculation runs per billing month.', true),
  ('projects.total', 'Projects', 'platform', 'limit', 'project', 'count', 'never', 'Active and archived projects retained by an organization.', false),
  ('reports.basic', 'Basic reports', 'reporting', 'limit', 'report', 'count', 'monthly', 'Basic report exports per billing month.', true),
  ('reports.professional', 'Professional reports', 'reporting', 'boolean', NULL, NULL, NULL, 'Professional branded and assurance-ready reports.', false),
  ('document_uploads.monthly', 'Monthly document uploads', 'evidence', 'limit', 'document', 'count', 'monthly', 'Evidence versions uploaded per billing month.', true),
  ('documents.total', 'Stored documents', 'evidence', 'limit', 'document', 'count', 'never', 'Evidence versions retained in private storage.', false),
  ('storage.bytes', 'Storage', 'evidence', 'limit', 'byte', 'sum', 'never', 'Private evidence and report storage.', true),
  ('ai.requests.monthly', 'Monthly AI requests', 'ai', 'limit', 'request', 'count', 'monthly', 'Metered AI operations per billing month.', true),
  ('organization.users', 'Team members', 'organization', 'limit', 'member', 'count', 'never', 'Active organization members.', false),
  ('organizations.total', 'Organizations', 'organization', 'limit', 'organization', 'count', 'never', 'Organizations owned by one commercial account.', false),
  ('business_units.total', 'Business units', 'organization', 'limit', 'business_unit', 'count', 'never', 'Business units within an organization.', false),
  ('sites.total', 'Sites', 'organization', 'limit', 'site', 'count', 'never', 'Sites within an organization.', false),
  ('facilities.total', 'Facilities', 'organization', 'limit', 'facility', 'count', 'never', 'Facilities within an organization.', false),
  ('evidence.repository', 'Evidence repository', 'evidence', 'boolean', NULL, NULL, NULL, 'Searchable versioned evidence repository.', false),
  ('recommendations.ai', 'AI recommendations', 'ai', 'boolean', NULL, NULL, NULL, 'Context-aware AI recommendations.', false),
  ('workflow.approvals', 'Approval workflows', 'platform', 'boolean', NULL, NULL, NULL, 'Multi-role review and approval workflows.', false),
  ('audit.full', 'Full audit history', 'security', 'boolean', NULL, NULL, NULL, 'Complete organization audit event access.', false),
  ('api.access', 'API access', 'integrations', 'boolean', NULL, NULL, NULL, 'Terrnix public API access.', false),
  ('api.requests.monthly', 'Monthly API requests', 'integrations', 'limit', 'request', 'count', 'monthly', 'Public API requests per billing month.', true),
  ('training.corporate', 'Corporate training', 'training', 'boolean', NULL, NULL, NULL, 'Organization training assignment and tracking.', false),
  ('sso.saml', 'SAML SSO', 'security', 'boolean', NULL, NULL, NULL, 'Enterprise SAML single sign-on.', false),
  ('integrations.enterprise', 'Enterprise integrations', 'integrations', 'boolean', NULL, NULL, NULL, 'Enterprise connector framework.', false),
  ('branding.custom', 'Custom branding', 'reporting', 'boolean', NULL, NULL, NULL, 'Custom organization branding.', false),
  ('support.tier', 'Support tier', 'support', 'tier', NULL, NULL, NULL, 'Commercial customer support service level.', false);

ALTER TABLE platform.plan_features
  ADD CONSTRAINT plan_features_definition_fk FOREIGN KEY (feature_code) REFERENCES platform.feature_definitions(code);

INSERT INTO platform.plan_features (plan_code, feature_code, enabled, limit_value, configuration) VALUES
  ('free', 'organizations.total', true, 1, '{}'), ('starter', 'organizations.total', true, 1, '{}'),
  ('professional', 'organizations.total', true, 1, '{}'), ('business', 'organizations.total', true, 5, '{}'),
  ('enterprise', 'organizations.total', true, NULL, '{}'),
  ('free', 'documents.total', false, 0, '{}'), ('starter', 'documents.total', true, 100, '{}'),
  ('professional', 'documents.total', true, 10000, '{}'), ('business', 'documents.total', true, 100000, '{}'),
  ('enterprise', 'documents.total', true, NULL, '{}'),
  ('free', 'storage.bytes', false, 0, '{}'), ('starter', 'storage.bytes', true, 1073741824, '{}'),
  ('professional', 'storage.bytes', true, 53687091200, '{}'), ('business', 'storage.bytes', true, 536870912000, '{}'),
  ('enterprise', 'storage.bytes', true, NULL, '{}'),
  ('free', 'api.requests.monthly', false, 0, '{}'), ('starter', 'api.requests.monthly', false, 0, '{}'),
  ('professional', 'api.requests.monthly', false, 0, '{}'), ('business', 'api.requests.monthly', true, 100000, '{}'),
  ('enterprise', 'api.requests.monthly', true, NULL, '{}'),
  ('free', 'reports.professional', false, 0, '{}'), ('starter', 'reports.professional', false, 0, '{}'),
  ('free', 'support.tier', true, NULL, '{"tier":"community"}'),
  ('starter', 'support.tier', true, NULL, '{"tier":"standard"}'),
  ('professional', 'support.tier', true, NULL, '{"tier":"priority"}'),
  ('business', 'support.tier', true, NULL, '{"tier":"premium"}'),
  ('enterprise', 'support.tier', true, NULL, '{"tier":"enterprise"}')
ON CONFLICT (plan_code, feature_code) DO NOTHING;

CREATE TABLE platform.billing_accounts (
  organization_id uuid PRIMARY KEY REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  legal_name text NOT NULL,
  billing_email text NOT NULL,
  billing_address jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(billing_address) = 'object'),
  tax_ids jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(tax_ids) = 'array'),
  tax_exempt text NOT NULL DEFAULT 'none' CHECK (tax_exempt IN ('none', 'exempt', 'reverse')),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
  preferred_provider text CHECK (preferred_provider IS NULL OR preferred_provider IN ('stripe', 'paypal', 'bank_transfer', 'enterprise_invoice')),
  purchase_order_required boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.billing_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal', 'bank_transfer', 'enterprise_invoice')),
  plan_code text NOT NULL REFERENCES platform.plans(code),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'annual', 'contract')),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  unit_amount_minor bigint CHECK (unit_amount_minor IS NULL OR unit_amount_minor >= 0),
  provider_product_ref text NOT NULL,
  provider_price_ref text NOT NULL,
  tax_behavior text NOT NULL DEFAULT 'exclusive' CHECK (tax_behavior IN ('inclusive', 'exclusive', 'unspecified')),
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_until timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_price_ref),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE TABLE platform.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES platform.subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_invoice_ref text NOT NULL,
  invoice_number text,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor bigint NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor bigint NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  amount_paid_minor bigint NOT NULL DEFAULT 0 CHECK (amount_paid_minor >= 0),
  amount_due_minor bigint NOT NULL DEFAULT 0 CHECK (amount_due_minor >= 0),
  period_starts_at timestamptz,
  period_ends_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  hosted_invoice_url text,
  invoice_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_invoice_ref),
  UNIQUE (organization_id, id)
);

CREATE TABLE platform.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES platform.billing_invoices(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_payment_ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  refunded_minor bigint NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0 AND refunded_minor <= amount_minor),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  failure_code text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_ref),
  UNIQUE (organization_id, id)
);

CREATE TABLE platform.billing_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_coupon_ref text,
  provider_promotion_ref text,
  name text,
  percent_off numeric(5,2) CHECK (percent_off IS NULL OR percent_off BETWEEN 0 AND 100),
  amount_off_minor bigint CHECK (amount_off_minor IS NULL OR amount_off_minor >= 0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'removed')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CHECK ((percent_off IS NOT NULL)::integer + (amount_off_minor IS NOT NULL)::integer = 1)
);

CREATE TABLE platform.billing_subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  subscription_id uuid NOT NULL REFERENCES platform.subscriptions(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_event_ref text,
  change_type text NOT NULL CHECK (change_type IN ('created', 'trial_started', 'activated', 'renewed', 'upgraded', 'downgraded', 'scheduled_cancel', 'cancelled', 'paused', 'resumed', 'past_due', 'payment_recovered')),
  previous_state jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(previous_state) = 'object'),
  new_state jsonb NOT NULL CHECK (jsonb_typeof(new_state) = 'object'),
  effective_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_ref, change_type),
  UNIQUE (organization_id, id)
);

CREATE TABLE platform.billing_event_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_ref text NOT NULL,
  event_type text NOT NULL,
  api_version text,
  livemode boolean NOT NULL DEFAULT false,
  organization_id uuid REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  canonical_payload jsonb NOT NULL CHECK (jsonb_typeof(canonical_payload) = 'object'),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'ignored', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, provider_event_ref)
);
CREATE INDEX billing_event_inbox_status_idx ON platform.billing_event_inbox (status, received_at);

CREATE TABLE platform.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE RESTRICT,
  feature_code text NOT NULL REFERENCES platform.feature_definitions(code),
  quantity bigint NOT NULL CHECK (quantity > 0),
  idempotency_key text NOT NULL,
  source_type text NOT NULL,
  source_ref text,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, feature_code, idempotency_key),
  UNIQUE (organization_id, id)
);
CREATE INDEX usage_events_rollup_idx ON platform.usage_events (organization_id, feature_code, occurred_at);

CREATE TRIGGER billing_accounts_touch_updated_at BEFORE UPDATE ON platform.billing_accounts FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER billing_invoices_touch_updated_at BEFORE UPDATE ON platform.billing_invoices FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER billing_payments_touch_updated_at BEFORE UPDATE ON platform.billing_payments FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER usage_events_immutable BEFORE UPDATE OR DELETE ON platform.usage_events FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.feature_definitions ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.feature_definitions FORCE ROW LEVEL SECURITY;
CREATE POLICY feature_definitions_select ON platform.feature_definitions FOR SELECT USING (platform.has_permission('subscription.entitlement'));
ALTER TABLE platform.billing_prices ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_prices FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_prices_select ON platform.billing_prices FOR SELECT USING (platform.has_permission('billing.read'));

ALTER TABLE platform.billing_accounts ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_accounts_select ON platform.billing_accounts FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.read'));
CREATE POLICY billing_accounts_update ON platform.billing_accounts FOR UPDATE USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.manage')) WITH CHECK (organization_id = platform.current_organization_id());

ALTER TABLE platform.billing_invoices ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_invoices_select ON platform.billing_invoices FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.read'));
ALTER TABLE platform.billing_payments ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_payments FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_payments_select ON platform.billing_payments FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.read'));
ALTER TABLE platform.billing_discounts ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_discounts FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_discounts_select ON platform.billing_discounts FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.read'));
ALTER TABLE platform.billing_subscription_history ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_subscription_history FORCE ROW LEVEL SECURITY;
CREATE POLICY billing_subscription_history_select ON platform.billing_subscription_history FOR SELECT USING (organization_id = platform.current_organization_id() AND platform.has_permission('billing.read'));
ALTER TABLE platform.billing_event_inbox ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.billing_event_inbox FORCE ROW LEVEL SECURITY;

ALTER TABLE platform.usage_events ENABLE ROW LEVEL SECURITY; ALTER TABLE platform.usage_events FORCE ROW LEVEL SECURITY;
CREATE POLICY usage_events_select ON platform.usage_events FOR SELECT USING (organization_id = platform.current_organization_id() AND (platform.has_permission('billing.read') OR platform.has_permission('subscription.entitlement')));
CREATE POLICY usage_events_insert ON platform.usage_events FOR INSERT WITH CHECK (organization_id = platform.current_organization_id() AND platform.has_permission('subscription.entitlement'));
