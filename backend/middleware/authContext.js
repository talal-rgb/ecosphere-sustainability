import { getRequestSession } from '../services/auth.js';
import { assertUuid, getDatabasePool } from '../services/database.js';
import { provisionPlatformUser, resolveTenantMembership } from '../services/platformIdentityService.js';

export function createSessionContextMiddleware(dependencies = {}) {
  const sessionResolver = dependencies.sessionResolver || getRequestSession;
  const identityProvisioner = dependencies.identityProvisioner || provisionPlatformUser;
  const databasePool = dependencies.databasePool;

  return async function sessionContext(request, response, next) {
    try {
      const session = await sessionResolver(request);
      if (!session?.user?.id || !session.user.platformUserId) {
        return response.status(401).json({ success: false, error: 'authentication_required' });
      }
      if (session.user.emailVerified !== true) {
        return response.status(403).json({ success: false, error: 'email_verification_required' });
      }
      assertUuid(session.user.platformUserId, 'platformUserId');
      const pool = databasePool || getDatabasePool();
      const platformUser = await identityProvisioner(pool, {
        userId: session.user.platformUserId,
        authSubject: session.user.id,
        email: session.user.email,
        displayName: session.user.name
      });
      request.authContext = {
        authSubject: session.user.id,
        userId: platformUser.id,
        email: platformUser.email,
        displayName: platformUser.display_name,
        sessionId: session.session?.id || null
      };
      return next();
    } catch (error) {
      if (error.code === 'auth_not_configured' || error.code === 'auth_configuration_error') {
        return response.status(503).json({ success: false, error: 'authentication_unavailable' });
      }
      return next(error);
    }
  };
}

export function createTenantContextMiddleware(dependencies = {}) {
  const membershipResolver = dependencies.membershipResolver || resolveTenantMembership;
  const databasePool = dependencies.databasePool;

  return async function tenantContext(request, response, next) {
    const organizationId = request.get('X-Terrnix-Organization-ID');
    if (!organizationId) return response.status(400).json({ success: false, error: 'organization_required' });
    try {
      assertUuid(organizationId, 'organizationId');
      const context = { userId: request.authContext.userId, organizationId };
      const pool = databasePool || getDatabasePool();
      const membership = await membershipResolver(pool, context);
      if (!membership) return response.status(403).json({ success: false, error: 'organization_access_denied' });
      request.platformContext = { ...context, role: membership.role_code };
      return next();
    } catch (error) {
      if (error.code === 'invalid_identifier') {
        return response.status(400).json({ success: false, error: 'invalid_organization' });
      }
      return next(error);
    }
  };
}
