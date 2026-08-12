import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';

let authPromise;
let nodeHandlerPromise;

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_SECRET);
}

export async function getAuth() {
  if (!isAuthConfigured()) {
    const error = new Error('Authentication is not configured.');
    error.code = 'auth_not_configured';
    error.status = 503;
    throw error;
  }
  authPromise ||= import('./authConfig.js').then((module) => module.auth);
  return authPromise;
}

export async function authNodeHandler(request, response) {
  if (!nodeHandlerPromise) {
    nodeHandlerPromise = getAuth().then((auth) => toNodeHandler(auth));
  }
  try {
    const handler = await nodeHandlerPromise;
    return handler(request, response);
  } catch (error) {
    nodeHandlerPromise = undefined;
    if (error.code === 'auth_not_configured' || error.code === 'auth_configuration_error') {
      return response.status(503).json({ success: false, error: 'Authentication is not available.' });
    }
    throw error;
  }
}

export async function getRequestSession(request) {
  const auth = await getAuth();
  return auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
}
