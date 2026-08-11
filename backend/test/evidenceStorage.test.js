import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceStorage, createS3EvidenceStorage } from '../services/evidenceStorage.js';

const sha256 = 'a'.repeat(64);

test('S3 evidence storage signs immutable encrypted uploads and verifies object identity', async () => {
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command.input);
      return {
        ContentLength: 1024,
        ContentType: 'application/pdf',
        ChecksumSHA256: Buffer.from(sha256, 'hex').toString('base64'),
        Metadata: { sha256 }
      };
    }
  };
  let signedInput;
  const storage = createS3EvidenceStorage({
    client,
    bucket: 'private-evidence',
    uploadSeconds: 300,
    signer: async (_client, command, options) => {
      signedInput = { ...command.input, expiresIn: options.expiresIn };
      return 'https://storage.example/signed';
    }
  });
  const intent = await storage.createUploadIntent({
    objectKey: 'org/quarantine/upload', mediaType: 'application/pdf', byteSize: 1024, sha256
  });
  assert.equal(intent.url, 'https://storage.example/signed');
  assert.equal(signedInput.IfNoneMatch, '*');
  assert.equal(signedInput.ServerSideEncryption, 'AES256');
  assert.equal(intent.requiredHeaders['if-none-match'], '*');
  assert.equal(intent.requiredHeaders['content-length'], '1024');
  await storage.verifyObject({ objectKey: 'org/quarantine/upload', mediaType: 'application/pdf', byteSize: 1024, sha256 });
  assert.equal(commands[0].ChecksumMode, 'ENABLED');
});

test('evidence storage rejects missing configuration and mismatched uploaded objects', async () => {
  assert.throws(
    () => createEvidenceStorage({ EVIDENCE_STORAGE_BUCKET: '', EVIDENCE_STORAGE_REGION: 'eu-west-3' }),
    (error) => error.code === 'evidence_storage_not_configured'
  );
  const storage = createS3EvidenceStorage({
    client: { async send() { return { ContentLength: 2, ContentType: 'application/pdf', Metadata: { sha256 } }; } },
    bucket: 'private-evidence',
    signer: async () => 'unused'
  });
  await assert.rejects(
    storage.verifyObject({ objectKey: 'org/quarantine/upload', mediaType: 'application/pdf', byteSize: 1, sha256 }),
    (error) => error.code === 'evidence_upload_verification_failed' && error.status === 422
  );
});
