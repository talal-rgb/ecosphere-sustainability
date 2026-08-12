import test from 'node:test';
import assert from 'node:assert/strict';

import { getDocumentWorkerPool } from '../services/documentWorkerDatabase.js';
import { getBillingPool } from '../services/billingDatabase.js';
import { getReportWorkerPool } from '../services/reportWorkerDatabase.js';

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

test('billing synchronization requires a distinct dedicated role', () => {
  assert.throws(() => getBillingPool({}), (error) => error.code === 'billing_not_configured');
  assert.throws(
    () => getBillingPool({ DATABASE_URL: 'postgres://shared', BILLING_DATABASE_URL: 'postgres://shared' }),
    (error) => error.code === 'unsafe_billing_role'
  );
});

test('report rendering requires a distinct dedicated role', () => {
  assert.throws(() => getReportWorkerPool({}), (error) => error.code === 'report_worker_database_not_configured');
  assert.throws(
    () => getReportWorkerPool({ DATABASE_URL: 'postgres://shared', REPORT_WORKER_DATABASE_URL: 'postgres://shared' }),
    (error) => error.code === 'unsafe_report_worker_role'
  );
});
