import { withPlatformContext } from './database.js';
import { requirePermission } from './platformService.js';

export async function recordUsage(databasePool, context, input) {
  return withPlatformContext(databasePool, context, (client) => consumeUsage(client, context, input));
}

export async function consumeUsage(client, context, input) {
  await requirePermission(client, 'subscription.entitlement');
  const featureCode = requiredCode(input.featureCode, 'featureCode');
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey', 200);
  const quantity = positiveInteger(input.quantity ?? 1, 'quantity');
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.valueOf()) || occurredAt > new Date(Date.now() + 300_000)) throw validationError('occurredAt is invalid.');
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:${featureCode}:usage`]);
  const entitlementResult = await client.query(
    `SELECT feature.enabled, feature.limit_value, feature.configuration,
            definition.is_metered, definition.aggregation, definition.reset_period, definition.unit
     FROM platform.subscriptions subscription
     JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
     JOIN platform.feature_definitions definition ON definition.code = feature.feature_code
     WHERE subscription.organization_id = $1 AND feature.feature_code = $2`,
    [context.organizationId, featureCode]
  );
  const entitlement = entitlementResult.rows[0];
  if (!entitlement?.enabled) throw domainError('plan_upgrade_required', 402, `Feature ${featureCode} is not enabled.`);
  if (!entitlement.is_metered) throw validationError(`Feature ${featureCode} is not metered.`);
  const existing = await client.query(
    'SELECT id, quantity FROM platform.usage_events WHERE organization_id = $1 AND feature_code = $2 AND idempotency_key = $3',
    [context.organizationId, featureCode, idempotencyKey]
  );
  if (existing.rows[0]) return { id: existing.rows[0].id, quantity: Number(existing.rows[0].quantity), duplicate: true };
  const period = usagePeriod(entitlement.reset_period, occurredAt);
  const currentResult = await client.query(
    `SELECT COALESCE(sum(quantity), 0)::bigint AS used FROM platform.usage_events
     WHERE organization_id = $1 AND feature_code = $2 AND occurred_at >= $3 AND occurred_at < $4`,
    [context.organizationId, featureCode, period.startsAt, period.endsAt]
  );
  const used = Number(currentResult.rows[0].used);
  const limit = entitlement.limit_value === null ? null : Number(entitlement.limit_value);
  if (limit !== null && used + quantity > limit) throw domainError('usage_limit_exceeded', 402, `Usage limit reached for ${featureCode}.`);
  const inserted = await client.query(
    `INSERT INTO platform.usage_events (
       organization_id, feature_code, quantity, idempotency_key, source_type, source_ref, occurred_at, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at`,
    [context.organizationId, featureCode, quantity, idempotencyKey,
      requiredText(input.sourceType, 'sourceType', 100), optionalText(input.sourceRef, 200), occurredAt, objectValue(input.metadata)]
  );
  return { id: inserted.rows[0].id, featureCode, quantity, duplicate: false, used: used + quantity, limit,
    unit: entitlement.unit, period, createdAt: inserted.rows[0].created_at };
}

export async function getUsageSnapshot(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'subscription.entitlement');
    const rows = await client.query(
      `SELECT definition.code, definition.name, definition.unit, definition.reset_period,
              feature.enabled, feature.limit_value, feature.configuration,
              COALESCE((SELECT sum(event.quantity) FROM platform.usage_events event
                        WHERE event.organization_id = subscription.organization_id
                          AND event.feature_code = definition.code
                          AND event.occurred_at >= CASE definition.reset_period
                            WHEN 'monthly' THEN date_trunc('month', now())
                            WHEN 'annual' THEN date_trunc('year', now())
                            ELSE '-infinity'::timestamptz END), 0)::bigint AS used
       FROM platform.subscriptions subscription
       JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
       JOIN platform.feature_definitions definition ON definition.code = feature.feature_code
       WHERE subscription.organization_id = $1 AND definition.is_metered = true
       ORDER BY definition.category, definition.code`,
      [context.organizationId]
    );
    return rows.rows.map((row) => ({ code: row.code, name: row.name, unit: row.unit, resetPeriod: row.reset_period,
      enabled: row.enabled, used: Number(row.used), limit: row.limit_value === null ? null : Number(row.limit_value), configuration: row.configuration }));
  });
}

function usagePeriod(resetPeriod, date) {
  if (resetPeriod === 'monthly') return { startsAt: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)), endsAt: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)) };
  if (resetPeriod === 'annual') return { startsAt: new Date(Date.UTC(date.getUTCFullYear(), 0, 1)), endsAt: new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1)) };
  return { startsAt: new Date('1970-01-01T00:00:00.000Z'), endsAt: new Date('9999-12-31T23:59:59.999Z') };
}
function requiredCode(value, name) { const text = requiredText(value, name, 150); if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(text)) throw validationError(`${name} is invalid.`); return text; }
function requiredText(value, name, maximum) { const text = String(value || '').trim(); if (!text || text.length > maximum) throw validationError(`${name} is required.`); return text; }
function optionalText(value, maximum) { if (!value) return null; const text = String(value).trim(); if (text.length > maximum) throw validationError('Value is too long.'); return text || null; }
function positiveInteger(value, name) { const number = Number(value); if (!Number.isSafeInteger(number) || number <= 0) throw validationError(`${name} must be a positive integer.`); return number; }
function objectValue(value) { if (value === undefined || value === null) return {}; if (typeof value !== 'object' || Array.isArray(value)) throw validationError('metadata must be an object.'); return value; }
function validationError(message) { return domainError('validation_error', 400, message); }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
