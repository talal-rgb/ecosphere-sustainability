import pg from 'pg';

const { Pool } = pg;
let workerPool;

export function getDocumentWorkerPool(environment = process.env) {
  if (workerPool) return workerPool;
  const connectionString = environment.DOCUMENT_WORKER_DATABASE_URL;
  if (!connectionString || connectionString.includes('REPLACE_WITH')) {
    const error = new Error('DOCUMENT_WORKER_DATABASE_URL is not configured.');
    error.code = 'document_worker_not_configured';
    throw error;
  }
  if (connectionString === environment.DATABASE_URL) {
    const error = new Error('Document workers require a separate database role.');
    error.code = 'unsafe_document_worker_role';
    throw error;
  }
  workerPool = new Pool({
    connectionString,
    max: Number(environment.DOCUMENT_WORKER_POOL_MAX || 2),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
    application_name: 'terrnix-document-worker',
    ssl: environment.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined
  });
  workerPool.on('error', (error) => console.error('[DocumentWorker] Idle database client error:', error.message));
  return workerPool;
}

export async function closeDocumentWorkerPool() {
  if (!workerPool) return;
  const activePool = workerPool;
  workerPool = undefined;
  await activePool.end();
}
