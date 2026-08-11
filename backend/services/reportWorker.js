import crypto from 'node:crypto';

import { assertUuid } from './database.js';
import { appendAuditEvent } from './platformService.js';

const ERROR_CODE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const WORKER_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/;
const HASH = /^[a-f0-9]{64}$/;
const MEDIA_TYPES = {
  pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  dashboard: 'application/json'
};

export async function claimReportJob(databasePool, input = {}) {
  const workerId = workerIdValue(input.workerId);
  const leaseSeconds = integerBetween(input.leaseSeconds ?? 300, 30, 1800);
  return transaction(databasePool, async (client) => {
    const result = await client.query(
      `WITH candidate AS (
         SELECT id FROM platform.report_generation_jobs
         WHERE attempts < max_attempts AND (
           (status IN ('queued','retry') AND available_at <= now())
           OR (status = 'processing' AND lease_expires_at < now())
         ) ORDER BY priority, available_at, queued_at, id FOR UPDATE SKIP LOCKED LIMIT 1
       ), claimed AS (
         UPDATE platform.report_generation_jobs job SET status = 'processing', attempts = attempts + 1,
           started_at = COALESCE(started_at, now()), lease_expires_at = now() + make_interval(secs => $1), locked_by = $2
         FROM candidate WHERE job.id = candidate.id RETURNING job.*
       )
       SELECT claimed.*, report.title, report.report_type, report.template_code, report.locale,
              report.reporting_standard, report.parameters, version.content, version.content_sha256,
              version.source_manifest, template.template_spec
       FROM claimed
       JOIN platform.reports report ON report.organization_id = claimed.organization_id AND report.id = claimed.report_id
       JOIN platform.report_content_versions version ON version.organization_id = claimed.organization_id
         AND version.report_id = claimed.report_id AND version.version = claimed.content_version
       JOIN platform.report_template_definitions template ON template.code = report.template_code`,
      [leaseSeconds, workerId]
    );
    const row = result.rows[0];
    return row ? { id: row.id, organizationId: row.organization_id, reportId: row.report_id,
      contentVersion: row.content_version, outputFormat: row.output_format, rendererVersion: row.renderer_version,
      attempts: row.attempts, title: row.title, reportType: row.report_type, templateCode: row.template_code,
      locale: row.locale, reportingStandard: row.reporting_standard, parameters: row.parameters,
      content: row.content, contentSha256: row.content_sha256, sourceManifest: row.source_manifest,
      templateSpec: row.template_spec } : null;
  });
}

export async function completeReportJob(databasePool, input = {}) {
  const workerId = workerIdValue(input.workerId);
  assertUuid(input.jobId, 'jobId');
  const sha256 = String(input.sha256 || '').toLowerCase();
  if (!HASH.test(sha256)) throw validationError('sha256 is invalid.');
  const byteSize = integerBetween(input.byteSize, 1, Number.MAX_SAFE_INTEGER);
  return transaction(databasePool, async (client) => {
    const job = await lockJob(client, input.jobId, workerId);
    const expectedMediaType = MEDIA_TYPES[job.output_format];
    if (input.mediaType !== expectedMediaType) throw validationError('mediaType does not match the job output format.');
    const objectKey = requiredText(input.objectKey, 'objectKey', 1000);
    if (!objectKey.startsWith(`${job.organization_id}/`)) throw validationError('objectKey must be organization-prefixed.');
    const artifactId = input.artifactId || crypto.randomUUID();
    assertUuid(artifactId, 'artifactId');
    await client.query(
      `INSERT INTO platform.report_artifacts (
         id, organization_id, report_id, generation_job_id, content_version, output_format,
         media_type, byte_size, sha256, storage_provider, storage_bucket, object_key, renderer_version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [artifactId, job.organization_id, job.report_id, job.id, job.content_version, job.output_format,
        input.mediaType, byteSize, sha256, requiredText(input.storageProvider, 'storageProvider', 50),
        requiredText(input.storageBucket, 'storageBucket', 200), objectKey, job.renderer_version]
    );
    await client.query(
      `UPDATE platform.report_generation_jobs SET status = 'completed', completed_at = now(),
         lease_expires_at = NULL, locked_by = NULL WHERE id = $1`, [job.id]
    );
    await client.query(
      `UPDATE platform.reports SET status = CASE WHEN status = 'draft' THEN 'generated' ELSE status END
       WHERE organization_id = $1 AND id = $2`, [job.organization_id, job.report_id]
    );
    await appendAuditEvent(client, { organizationId: job.organization_id, action: 'report.generation_completed',
      entityType: 'report', entityId: job.report_id,
      payload: { jobId: job.id, artifactId, contentVersion: job.content_version, outputFormat: job.output_format, sha256 } });
    return { jobId: job.id, reportId: job.report_id, artifactId, status: 'completed' };
  });
}

export async function failReportJob(databasePool, input = {}) {
  const workerId = workerIdValue(input.workerId);
  assertUuid(input.jobId, 'jobId');
  const errorCode = String(input.errorCode || '');
  if (!ERROR_CODE.test(errorCode) || errorCode.length > 100) throw validationError('errorCode is invalid.');
  return transaction(databasePool, async (client) => {
    const job = await lockJob(client, input.jobId, workerId);
    const retryable = input.retryable !== false && job.attempts < job.max_attempts;
    if (retryable) {
      const retryInSeconds = Math.min(3600, 30 * (2 ** Math.max(0, job.attempts - 1)));
      await client.query(`UPDATE platform.report_generation_jobs SET status = 'retry', last_error_code = $1,
        available_at = now() + make_interval(secs => $2), lease_expires_at = NULL, locked_by = NULL WHERE id = $3`,
      [errorCode, retryInSeconds, job.id]);
      return { jobId: job.id, status: 'retry', retryInSeconds, attempts: job.attempts };
    }
    await client.query(`UPDATE platform.report_generation_jobs SET status = 'failed', last_error_code = $1,
      completed_at = now(), lease_expires_at = NULL, locked_by = NULL WHERE id = $2`, [errorCode, job.id]);
    await appendAuditEvent(client, { organizationId: job.organization_id, action: 'report.generation_failed',
      entityType: 'report', entityId: job.report_id, payload: { jobId: job.id, errorCode, attempts: job.attempts } });
    return { jobId: job.id, status: 'failed', attempts: job.attempts };
  });
}

async function lockJob(client, jobId, workerId) {
  const result = await client.query(`SELECT * FROM platform.report_generation_jobs
    WHERE id = $1 AND status = 'processing' AND locked_by = $2 AND lease_expires_at > now() FOR UPDATE`, [jobId, workerId]);
  if (!result.rows[0]) { const error = new Error('The report job is not owned by this worker or its lease expired.'); error.code = 'report_job_lease_invalid'; error.status = 409; throw error; }
  return result.rows[0];
}
async function transaction(pool, operation) { const client = await pool.connect(); try { await client.query('BEGIN'); const result = await operation(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; } finally { client.release(); } }
function workerIdValue(value) { if (typeof value !== 'string' || !WORKER_ID.test(value)) throw validationError('workerId is invalid.'); return value; }
function integerBetween(value, min, max) { const number = Number(value); if (!Number.isSafeInteger(number) || number < min || number > max) throw validationError('Integer value is out of range.'); return number; }
function requiredText(value, field, max) { const text = String(value || '').trim(); if (!text || text.length > max) throw validationError(`${field} is invalid.`); return text; }
function validationError(message) { const error = new Error(message); error.code = 'validation_error'; error.status = 400; return error; }
