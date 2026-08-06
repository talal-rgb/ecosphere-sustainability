import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';

import app from '../server.js';

const allowedOrigin = 'https://terrnix.com';

test('backend logging does not interpolate contact PII', () => {
  const files = [
    'server.js',
    'services/leadStore.js',
    'services/email.js',
    'services/brevoEmail.js',
    'services/brevo.js',
    'services/certificateStore.js'
  ];
  const source = files.map(file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).join('\n');

  assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^\n]*(?:\$\{email\}|\$\{fullName\}|\$\{participantName\})/);
  assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^\n]*text\.substring/);
});

test('health endpoint returns security headers without exposing diagnostics', async () => {
  const response = await request(app).get('/health').expect(200);

  assert.equal(response.body.ok, true);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.match(response.headers['strict-transport-security'], /max-age=31536000/);
});

test('temporary diagnostic endpoints are not reachable', async () => {
  for (const endpoint of [
    '/api/debug-echo',
    '/api/debug-validation',
    '/api/debug-savelead',
    '/api/debug-smtp'
  ]) {
    const response = await request(app)
      .post(endpoint)
      .set('Origin', allowedOrigin)
      .send({ probe: true });

    assert.equal(response.status, 404, `${endpoint} must not be exposed`);
  }
});

test('CORS rejects untrusted browser origins', async () => {
  const response = await request(app)
    .get('/api/factors/status')
    .set('Origin', 'https://attacker.example');

  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'Origin not allowed');
});

test('ordinary API payloads are capped at 32 KiB', async () => {
  const response = await request(app)
    .post('/api/chat')
    .set('Origin', allowedOrigin)
    .send({ message: 'x'.repeat(40 * 1024) });

  assert.equal(response.status, 413);
  assert.equal(response.body.error, 'Internal server error');
});

test('chat metadata and prompt lengths are validated before provider calls', async () => {
  const messageResponse = await request(app)
    .post('/api/chat')
    .set('Origin', allowedOrigin)
    .send({ message: 'x'.repeat(4001) });
  assert.equal(messageResponse.status, 400);

  const contextResponse = await request(app)
    .post('/api/chat')
    .set('Origin', allowedOrigin)
    .send({ message: 'Hello', pageContext: 'x'.repeat(501) });
  assert.equal(contextResponse.status, 400);
});

test('API endpoints enforce per-IP and per-endpoint rate limits', async () => {
  let response;
  for (let index = 0; index < 11; index += 1) {
    response = await request(app)
      .get('/api/rate-limit-probe')
      .set('Origin', allowedOrigin);
  }

  assert.equal(response.status, 429);
  assert.equal(response.body.error, 'Too Many Requests');
  assert.ok(response.headers['retry-after']);
});
