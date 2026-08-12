import { assertUuid, withPlatformContext, withUserContext } from './database.js';

export async function provisionPlatformUser(databasePool, input) {
  assertUuid(input.userId, 'userId');
  const authSubject = requiredText(input.authSubject, 'authSubject', 255);
  const email = normalizeEmail(input.email);
  const displayName = requiredText(input.displayName, 'displayName', 200);

  return withUserContext(databasePool, input.userId, async (client) => {
    const result = await client.query(
      `INSERT INTO platform.app_users (id, auth_subject, email, display_name, status, last_active_at)
       VALUES ($1, $2, $3, $4, 'active', now())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         last_active_at = now()
       WHERE platform.app_users.auth_subject = EXCLUDED.auth_subject
       RETURNING id, auth_subject, email, display_name, status`,
      [input.userId, authSubject, email, displayName]
    );
    if (!result.rows[0]) {
      const error = new Error('The authenticated subject does not match the platform identity.');
      error.code = 'identity_mismatch';
      error.status = 403;
      throw error;
    }
    return result.rows[0];
  });
}

export async function resolveTenantMembership(databasePool, context) {
  assertUuid(context.userId, 'userId');
  assertUuid(context.organizationId, 'organizationId');
  return withPlatformContext(databasePool, context, async (client) => {
    const result = await client.query(
      `SELECT organization_id, user_id, role_code, status
       FROM platform.organization_memberships
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [context.organizationId, context.userId]
    );
    return result.rows[0] || null;
  });
}

function normalizeEmail(value) {
  const email = requiredText(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw identityError('email must be valid.');
  return email;
}

function requiredText(value, fieldName, maxLength) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) throw identityError(`${fieldName} is required and must be at most ${maxLength} characters.`);
  return text;
}

function identityError(message) {
  const error = new Error(message);
  error.code = 'invalid_identity';
  error.status = 400;
  return error;
}
