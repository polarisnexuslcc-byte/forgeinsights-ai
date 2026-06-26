import { fail } from '../utils/response.js';
import { resolveSessionFromToken } from '../modules/auth/auth.service.js';

function extractBearerToken(req) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

export function requireAuth(req, res, next) {
  const rawToken = extractBearerToken(req);

  if (!rawToken) {
    return fail(res, 401, 'Authorization token is required');
  }

  const session = resolveSessionFromToken(rawToken);

  if (!session) {
    return fail(res, 401, 'Invalid or expired session');
  }

  req.auth = {
    rawToken,
    sessionId: session.id,
    userId: session.userId,
    organizationId: session.organizationId
  };

  next();
}
