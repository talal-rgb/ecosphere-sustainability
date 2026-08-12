import pg from 'pg';

const { Pool } = pg;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let pool;

export function getDatabasePool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error('DATABASE_URL is not configured.');
    error.code = 'database_not_configured';
    throw error;
  }

  pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
    application_name: 'terrnix-platform-api',
    ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined
  });
  pool.on('error', (error) => console.error('[Database] Idle client error:', error.message));
  return pool;
}

export async function withPlatformContext(databasePool, context, operation) {
  assertUuid(context?.organizationId, 'organizationId');
  assertUuid(context?.userId, 'userId');
  if (typeof operation !== 'function') throw new TypeError('operation must be a function');

  const client = await databasePool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_organization_id', $1, true)", [context.organizationId]);
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [context.userId]);
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function getDatabaseHealth(databasePool = getDatabasePool()) {
  const startedAt = Date.now();
  try {
    const result = await databasePool.query('SELECT current_database() AS database_name, now() AS checked_at');
    return { configured: true, connected: true, latencyMs: Date.now() - startedAt, checkedAt: result.rows[0].checked_at };
  } catch {
    return { configured: true, connected: false, latencyMs: Date.now() - startedAt };
  }
}

export async function closeDatabasePool() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

export function assertUuid(value, fieldName) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    const error = new TypeError(`${fieldName} must be a valid UUID.`);
    error.code = 'invalid_identifier';
    throw error;
  }
}
