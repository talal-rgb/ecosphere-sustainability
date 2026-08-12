import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_UPLOAD_SECONDS = 900;

export function createEvidenceStorage(environment = process.env) {
  const bucket = requiredConfiguration(environment.EVIDENCE_STORAGE_BUCKET, 'EVIDENCE_STORAGE_BUCKET');
  const region = requiredConfiguration(environment.EVIDENCE_STORAGE_REGION, 'EVIDENCE_STORAGE_REGION');
  const provider = environment.EVIDENCE_STORAGE_PROVIDER || 's3';
  if (provider !== 's3') throw configurationError(`Unsupported evidence storage provider: ${provider}`);
  const client = new S3Client({
    region,
    endpoint: environment.EVIDENCE_STORAGE_ENDPOINT || undefined,
    forcePathStyle: environment.EVIDENCE_STORAGE_FORCE_PATH_STYLE === 'true'
  });
  return createS3EvidenceStorage({
    client,
    bucket,
    provider,
    kmsKeyId: environment.EVIDENCE_STORAGE_KMS_KEY_ID || null,
    uploadSeconds: Number(environment.EVIDENCE_UPLOAD_URL_SECONDS || 600)
  });
}

export function createS3EvidenceStorage({ client, bucket, provider = 's3', kmsKeyId = null, uploadSeconds = 600, signer = getSignedUrl }) {
  if (!client || typeof client.send !== 'function') throw new TypeError('An S3-compatible client is required.');
  if (!Number.isInteger(uploadSeconds) || uploadSeconds < 60 || uploadSeconds > MAX_UPLOAD_SECONDS) {
    throw configurationError(`EVIDENCE_UPLOAD_URL_SECONDS must be between 60 and ${MAX_UPLOAD_SECONDS}.`);
  }
  return {
    provider,
    bucket,
    uploadSeconds,
    async createUploadIntent(input) {
      const checksumBase64 = Buffer.from(input.sha256, 'hex').toString('base64');
      const encryption = kmsKeyId
        ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: kmsKeyId }
        : { ServerSideEncryption: 'AES256' };
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: input.objectKey,
        ContentType: input.mediaType,
        ContentLength: input.byteSize,
        ChecksumSHA256: checksumBase64,
        Metadata: { sha256: input.sha256 },
        IfNoneMatch: '*',
        ...encryption
      });
      return {
        method: 'PUT',
        url: await signer(client, command, { expiresIn: uploadSeconds }),
        expiresInSeconds: uploadSeconds,
        requiredHeaders: {
          'content-length': String(input.byteSize),
          'content-type': input.mediaType,
          'x-amz-checksum-sha256': checksumBase64,
          'x-amz-meta-sha256': input.sha256,
          'if-none-match': '*',
          'x-amz-server-side-encryption': encryption.ServerSideEncryption,
          ...(kmsKeyId ? { 'x-amz-server-side-encryption-aws-kms-key-id': kmsKeyId } : {})
        }
      };
    },
    async verifyObject(input) {
      const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: input.objectKey, ChecksumMode: 'ENABLED' }));
      const actualChecksum = object.ChecksumSHA256 || null;
      const expectedChecksum = Buffer.from(input.sha256, 'hex').toString('base64');
      if (Number(object.ContentLength) !== input.byteSize) throw verificationError('Uploaded object size does not match the declared size.');
      if (object.ContentType !== input.mediaType) throw verificationError('Uploaded object media type does not match the declared media type.');
      if (actualChecksum !== expectedChecksum && object.Metadata?.sha256 !== input.sha256) {
        throw verificationError('Uploaded object checksum could not be verified.');
      }
      return { etag: object.ETag || null, checksumSha256: actualChecksum || expectedChecksum };
    }
  };
}

function requiredConfiguration(value, name) {
  if (!value || String(value).includes('REPLACE_WITH')) throw configurationError(`${name} is not configured.`);
  return value;
}

function configurationError(message) {
  const error = new Error(message);
  error.code = 'evidence_storage_not_configured';
  error.status = 503;
  return error;
}

function verificationError(message) {
  const error = new Error(message);
  error.code = 'evidence_upload_verification_failed';
  error.status = 422;
  return error;
}
