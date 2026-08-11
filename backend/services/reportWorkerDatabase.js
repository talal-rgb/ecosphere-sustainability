import pg from 'pg';

const { Pool } = pg;
let pool;

export function getReportWorkerPool(env = process.env) {
  if (pool) return pool;
  const connectionString = env.REPORT_WORKER_DATABASE_URL;
  if (!connectionString) throw configurationError('REPORT_WORKER_DATABASE_URL is not configured.');
  for (const [name, value] of Object.entries({ DATABASE_URL: env.DATABASE_URL,
    DOCUMENT_WORKER_DATABASE_URL: env.DOCUMENT_WORKER_DATABASE_URL,
    BILLING_DATABASE_URL: env.BILLING_DATABASE_URL })) {
    if (value && value === connectionString) throw configurationError(`REPORT_WORKER_DATABASE_URL must not reuse ${name}.`, 'unsafe_report_worker_role');
  }
  pool = new Pool({ connectionString, max: Number(env.REPORT_WORKER_POOL_MAX || 2),
    idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000, statement_timeout: 30_000,
    application_name: 'terrnix-report-worker', ssl: env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined });
  pool.on('error', (error) => console.error('[Report worker database] Idle client error:', error.message));
  return pool;
}

export async function closeReportWorkerPool() { if (!pool) return; const active = pool; pool = undefined; await active.end(); }
function configurationError(message, code = 'report_worker_database_not_configured') { const error = new Error(message); error.code = code; error.status = 503; return error; }
