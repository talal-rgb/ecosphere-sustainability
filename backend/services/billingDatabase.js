import pg from 'pg';

const { Pool } = pg;
let billingPool;

export function getBillingPool(environment = process.env) {
  if (billingPool) return billingPool;
  const connectionString = environment.BILLING_DATABASE_URL;
  if (!connectionString || connectionString.includes('REPLACE_WITH')) throw configurationError('BILLING_DATABASE_URL is not configured.', 'billing_not_configured');
  if (connectionString === environment.DATABASE_URL || connectionString === environment.DOCUMENT_WORKER_DATABASE_URL) {
    throw configurationError('Billing synchronization requires a separate database role.', 'unsafe_billing_role');
  }
  billingPool = new Pool({
    connectionString,
    max: Number(environment.BILLING_POOL_MAX || 2),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
    application_name: 'terrnix-billing-sync',
    ssl: environment.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined
  });
  billingPool.on('error', (error) => console.error('[Billing] Idle database client error:', error.message));
  return billingPool;
}

export async function closeBillingPool() {
  if (!billingPool) return;
  const activePool = billingPool;
  billingPool = undefined;
  await activePool.end();
}

function configurationError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}
