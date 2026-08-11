import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, requirePermission } from './platformService.js';

const CATEGORIES = new Set(['evidence', 'deadline', 'regulation', 'training', 'recommendation', 'risk', 'billing', 'system', 'support']);
const SEVERITIES = new Set(['info', 'success', 'warning', 'critical']);
const DIGESTS = new Set(['immediate', 'daily', 'weekly']);

export async function listNotifications(databasePool, context, options = {}) {
  const page = positiveInteger(options.page, 1, 10_000);
  const pageSize = positiveInteger(options.pageSize, 25, 100);
  const category = optionalEnum(options.category, CATEGORIES, 'category');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.read');
    const parameters = [context.organizationId, context.userId];
    const predicates = ['organization_id = $1', 'user_id = $2', 'archived_at IS NULL', '(expires_at IS NULL OR expires_at > now())'];
    if (String(options.unreadOnly) === 'true') predicates.push('read_at IS NULL');
    if (category) { parameters.push(category); predicates.push(`category = $${parameters.length}`); }
    const where = predicates.join(' AND ');
    const count = await client.query(`SELECT count(*)::integer AS total FROM platform.notifications WHERE ${where}`, parameters);
    parameters.push(pageSize, (page - 1) * pageSize);
    const result = await client.query(
      `SELECT id, project_id, notification_type, category, severity, title, body, action_url,
              event_key, metadata, read_at, expires_at, created_at
       FROM platform.notifications WHERE ${where}
       ORDER BY created_at DESC, id LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
      parameters
    );
    const unread = await client.query(
      `SELECT count(*)::integer AS total FROM platform.notifications
       WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL AND archived_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())`,
      [context.organizationId, context.userId]
    );
    return { items: result.rows.map(notificationResource), unread: unread.rows[0].total,
      pagination: { page, pageSize, total: count.rows[0].total, totalPages: Math.ceil(count.rows[0].total / pageSize) } };
  });
}

export async function getNotificationPreferences(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    const result = await client.query(
      `SELECT category, in_app_enabled, email_enabled, push_enabled, digest_frequency,
              quiet_hours_start, quiet_hours_end, timezone
       FROM platform.notification_preferences WHERE organization_id = $1 AND user_id = $2`,
      [context.organizationId, context.userId]
    );
    const saved = new Map(result.rows.map((row) => [row.category, preferenceResource(row)]));
    return [...CATEGORIES].map((category) => saved.get(category) || {
      category, inAppEnabled: true, emailEnabled: false, pushEnabled: false,
      digestFrequency: 'immediate', quietHoursStart: null, quietHoursEnd: null, timezone: 'UTC'
    });
  });
}

export async function updateNotificationPreference(databasePool, context, categoryInput, input = {}) {
  const category = requiredEnum(categoryInput, CATEGORIES, 'category');
  const digest = input.digestFrequency === undefined ? 'immediate' : requiredEnum(input.digestFrequency, DIGESTS, 'digestFrequency');
  const timezone = text(input.timezone ?? 'UTC', 'timezone', 100);
  const quietStart = optionalTime(input.quietHoursStart, 'quietHoursStart');
  const quietEnd = optionalTime(input.quietHoursEnd, 'quietHoursEnd');
  if ((quietStart === null) !== (quietEnd === null)) throw validationError('Both quiet hours values are required together.');
  return withPlatformContext(databasePool, context, async (client) => {
    const result = await client.query(
      `INSERT INTO platform.notification_preferences (
         organization_id, user_id, category, in_app_enabled, email_enabled, push_enabled,
         digest_frequency, quiet_hours_start, quiet_hours_end, timezone
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (organization_id, user_id, category) DO UPDATE SET
         in_app_enabled = EXCLUDED.in_app_enabled, email_enabled = EXCLUDED.email_enabled,
         push_enabled = EXCLUDED.push_enabled, digest_frequency = EXCLUDED.digest_frequency,
         quiet_hours_start = EXCLUDED.quiet_hours_start, quiet_hours_end = EXCLUDED.quiet_hours_end,
         timezone = EXCLUDED.timezone
       RETURNING category, in_app_enabled, email_enabled, push_enabled, digest_frequency,
                 quiet_hours_start, quiet_hours_end, timezone`,
      [context.organizationId, context.userId, category, booleanValue(input.inAppEnabled, true),
        booleanValue(input.emailEnabled, false), booleanValue(input.pushEnabled, false), digest,
        quietStart, quietEnd, timezone]
    );
    return preferenceResource(result.rows[0]);
  });
}

export async function markNotificationRead(databasePool, context, notificationId) {
  assertUuid(notificationId, 'notificationId');
  return mutateNotification(databasePool, context, notificationId,
    'UPDATE platform.notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND organization_id = $2 AND user_id = $3 RETURNING *');
}

export async function archiveNotification(databasePool, context, notificationId) {
  assertUuid(notificationId, 'notificationId');
  return mutateNotification(databasePool, context, notificationId,
    'UPDATE platform.notifications SET archived_at = COALESCE(archived_at, now()) WHERE id = $1 AND organization_id = $2 AND user_id = $3 RETURNING *');
}

export async function markAllNotificationsRead(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    const result = await client.query(
      `UPDATE platform.notifications SET read_at = now()
       WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL AND archived_at IS NULL`,
      [context.organizationId, context.userId]
    );
    return { updated: result.rowCount };
  });
}

export async function publishNotificationEvent(databasePool, context, input = {}) {
  const eventKey = text(input.eventKey, 'eventKey', 120);
  const sourceModule = text(input.sourceModule, 'sourceModule', 80);
  const idempotencyKey = text(input.idempotencyKey, 'idempotencyKey', 200);
  const recipients = [...new Set(input.recipientUserIds || [context.userId])];
  recipients.forEach((id) => assertUuid(id, 'recipientUserId'));
  if (input.entityId) assertUuid(input.entityId, 'entityId');
  if (input.projectId) assertUuid(input.projectId, 'projectId');
  const category = requiredEnum(input.category || 'system', CATEGORIES, 'category');
  const severity = requiredEnum(input.severity || 'info', SEVERITIES, 'severity');
  const title = text(input.title, 'title', 200);
  const body = text(input.body, 'body', 2_000);
  return withPlatformContext(databasePool, context, async (client) => {
    if (recipients.some((id) => id !== context.userId)) await requirePermission(client, 'notification.manage');
    const event = await client.query(
      `INSERT INTO platform.notification_events (
         organization_id, event_key, source_module, entity_type, entity_id, actor_user_id,
         idempotency_key, payload, occurred_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (organization_id, idempotency_key) DO NOTHING RETURNING id`,
      [context.organizationId, eventKey, sourceModule, input.entityType || null, input.entityId || null,
        context.userId, idempotencyKey, objectValue(input.payload), input.occurredAt || new Date()]
    );
    if (!event.rows[0]) return { duplicate: true, notifications: [] };
    const notifications = [];
    for (const userId of recipients) {
      const member = await client.query(
        `SELECT 1 FROM platform.organization_memberships
         WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
        [context.organizationId, userId]
      );
      if (!member.rows[0]) throw validationError('Every notification recipient must be an active organization member.');
      const preference = await client.query(
        `SELECT in_app_enabled, email_enabled, push_enabled FROM platform.notification_preferences
         WHERE organization_id = $1 AND user_id = $2 AND category = $3`,
        [context.organizationId, userId, category]
      );
      const settings = preference.rows[0] || { in_app_enabled: true, email_enabled: false, push_enabled: false };
      if (!settings.in_app_enabled && !settings.email_enabled && !settings.push_enabled) continue;
      const created = await client.query(
        `INSERT INTO platform.notifications (
           organization_id, user_id, project_id, notification_type, category, severity,
           title, body, action_url, event_key, dedupe_key, metadata, expires_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [context.organizationId, userId, input.projectId || null, input.notificationType || eventKey,
          category, severity, title, body, input.actionUrl || null, eventKey,
          `${idempotencyKey}:${userId}`, objectValue(input.metadata), input.expiresAt || null]
      );
      for (const channel of ['email', 'push']) {
        if (settings[`${channel}_enabled`]) await client.query(
          `INSERT INTO platform.notification_delivery_outbox (organization_id, notification_id, user_id, channel)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [context.organizationId, created.rows[0].id, userId, channel]
        );
      }
      notifications.push(notificationResource(created.rows[0]));
    }
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'notification.event_published', entityType: 'notification_event', entityId: event.rows[0].id,
      payload: { eventKey, recipientCount: notifications.length, sourceModule } });
    return { duplicate: false, eventId: event.rows[0].id, notifications };
  });
}

async function mutateNotification(databasePool, context, id, sql) {
  return withPlatformContext(databasePool, context, async (client) => {
    const result = await client.query(sql, [id, context.organizationId, context.userId]);
    if (!result.rows[0]) { const error = new Error('Notification was not found.'); error.status = 404; error.code = 'notification_not_found'; throw error; }
    return notificationResource(result.rows[0]);
  });
}

function notificationResource(row) { return { id: row.id, projectId: row.project_id, type: row.notification_type,
  category: row.category, severity: row.severity, title: row.title, body: row.body, actionUrl: row.action_url,
  eventKey: row.event_key, metadata: row.metadata, readAt: row.read_at, expiresAt: row.expires_at, createdAt: row.created_at }; }
function preferenceResource(row) { return { category: row.category, inAppEnabled: row.in_app_enabled,
  emailEnabled: row.email_enabled, pushEnabled: row.push_enabled, digestFrequency: row.digest_frequency,
  quietHoursStart: row.quiet_hours_start, quietHoursEnd: row.quiet_hours_end, timezone: row.timezone }; }
function positiveInteger(value, fallback, maximum) { if (value === undefined) return fallback; const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw validationError('Pagination value is invalid.'); return parsed; }
function optionalEnum(value, values, field) { return value === undefined ? null : requiredEnum(value, values, field); }
function requiredEnum(value, values, field) { if (!values.has(value)) throw validationError(`${field} is invalid.`); return value; }
function text(value, field, maximum) { if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw validationError(`${field} is invalid.`); return value.trim(); }
function optionalTime(value, field) { if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw validationError(`${field} must use HH:MM.`); return value; }
function booleanValue(value, fallback) { if (value === undefined) return fallback; if (typeof value !== 'boolean') throw validationError('Preference flags must be boolean.'); return value; }
function objectValue(value) { if (value === undefined) return {}; if (!value || Array.isArray(value) || typeof value !== 'object') throw validationError('Metadata must be an object.'); return value; }
function validationError(message) { const error = new TypeError(message); error.status = 400; error.code = 'validation_error'; return error; }
