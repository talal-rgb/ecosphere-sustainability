INSERT INTO platform.permissions (code, resource, action, description) VALUES
  ('notification.manage', 'notification', 'manage', 'Create organization notifications and manage customer-success automation.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT code, 'notification.manage' FROM platform.role_definitions WHERE code IN ('owner', 'administrator')
ON CONFLICT DO NOTHING;

ALTER TABLE platform.notifications
  ADD COLUMN project_id uuid,
  ADD COLUMN category text NOT NULL DEFAULT 'system',
  ADD COLUMN severity text NOT NULL DEFAULT 'info',
  ADD COLUMN event_key text,
  ADD COLUMN dedupe_key text,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN archived_at timestamptz,
  ADD CONSTRAINT notifications_category_check CHECK (category IN (
    'evidence', 'deadline', 'regulation', 'training', 'recommendation', 'risk', 'billing', 'system', 'support'
  )),
  ADD CONSTRAINT notifications_severity_check CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  ADD CONSTRAINT notifications_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object'),
  ADD CONSTRAINT notifications_project_fk FOREIGN KEY (organization_id, project_id)
    REFERENCES platform.projects(organization_id, id);

CREATE UNIQUE INDEX notifications_dedupe_unique
  ON platform.notifications (organization_id, user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX notifications_feed_idx
  ON platform.notifications (organization_id, user_id, archived_at, created_at DESC);

CREATE TABLE platform.notification_preferences (
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES platform.app_users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'evidence', 'deadline', 'regulation', 'training', 'recommendation', 'risk', 'billing', 'system', 'support'
  )),
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  digest_frequency text NOT NULL DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'daily', 'weekly')),
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, category),
  FOREIGN KEY (organization_id, user_id) REFERENCES platform.organization_memberships(organization_id, user_id) ON DELETE CASCADE,
  CHECK ((quiet_hours_start IS NULL) = (quiet_hours_end IS NULL)),
  CHECK (char_length(timezone) BETWEEN 1 AND 100)
);

CREATE TABLE platform.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  source_module text NOT NULL,
  entity_type text,
  entity_id uuid,
  actor_user_id uuid REFERENCES platform.app_users(id),
  idempotency_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, idempotency_key),
  CHECK (char_length(event_key) BETWEEN 3 AND 120),
  CHECK (char_length(source_module) BETWEEN 2 AND 80),
  CHECK (char_length(idempotency_key) BETWEEN 3 AND 200)
);
CREATE INDEX notification_events_timeline_idx
  ON platform.notification_events (organization_id, occurred_at DESC);

CREATE TABLE platform.notification_delivery_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES platform.app_users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'webhook')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'retry', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, channel),
  FOREIGN KEY (organization_id, notification_id) REFERENCES platform.notifications(organization_id, id) ON DELETE CASCADE
);
CREATE INDEX notification_delivery_claim_idx
  ON platform.notification_delivery_outbox (status, scheduled_at, created_at)
  WHERE status IN ('pending', 'retry');

CREATE TRIGGER notification_preferences_touch_updated_at
  BEFORE UPDATE ON platform.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER notification_delivery_touch_updated_at
  BEFORE UPDATE ON platform.notification_delivery_outbox
  FOR EACH ROW EXECUTE FUNCTION platform.touch_updated_at();
CREATE TRIGGER notification_events_immutable
  BEFORE UPDATE OR DELETE ON platform.notification_events
  FOR EACH ROW EXECUTE FUNCTION platform.reject_mutation();

ALTER TABLE platform.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.notification_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_preferences_select ON platform.notification_preferences FOR SELECT USING (
  organization_id = platform.current_organization_id() AND user_id = platform.current_user_id()
);
CREATE POLICY notification_preferences_insert ON platform.notification_preferences FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id() AND user_id = platform.current_user_id()
);
CREATE POLICY notification_preferences_update ON platform.notification_preferences FOR UPDATE USING (
  organization_id = platform.current_organization_id() AND user_id = platform.current_user_id()
) WITH CHECK (organization_id = platform.current_organization_id() AND user_id = platform.current_user_id());

ALTER TABLE platform.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.notification_events FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_events_select ON platform.notification_events FOR SELECT USING (
  organization_id = platform.current_organization_id() AND platform.has_permission('audit.read')
);
CREATE POLICY notification_events_insert ON platform.notification_events FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND (actor_user_id IS NULL OR actor_user_id = platform.current_user_id())
);

ALTER TABLE platform.notification_delivery_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.notification_delivery_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_delivery_select ON platform.notification_delivery_outbox FOR SELECT USING (
  organization_id = platform.current_organization_id() AND user_id = platform.current_user_id()
);
CREATE POLICY notification_delivery_insert ON platform.notification_delivery_outbox FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND (user_id = platform.current_user_id() OR platform.has_permission('notification.manage'))
);

CREATE POLICY notifications_insert ON platform.notifications FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND (user_id = platform.current_user_id() OR platform.has_permission('notification.manage'))
);

