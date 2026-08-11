import test from 'node:test';
import assert from 'node:assert/strict';

import { getDocumentWorkerPool } from '../services/documentWorkerDatabase.js';

test('document worker database requires a distinct dedicated role', () => {
  assert.throws(
    () => getDocumentWorkerPool({}),
    (error) => error.code === 'document_worker_not_configured'
  );
  assert.throws(
    () => getDocumentWorkerPool({ DATABASE_URL: 'postgres://shared', DOCUMENT_WORKER_DATABASE_URL: 'postgres://shared' }),
    (error) => error.code === 'unsafe_document_worker_role'
  );
});
