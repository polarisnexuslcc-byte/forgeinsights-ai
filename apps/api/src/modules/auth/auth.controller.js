import { created, fail, ok } from '../../server/utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  deleteSessionByTokenHash,
  getUserByEmail,
  organizationExists
} from './auth.repository.js';
import {
  authenticateUser,
  hashSessionToken,
  registerUser
} from './auth.service.js';
import {
  validateLoginInput,
  validateRegisterInput
} from './auth.validators.js';

export async function registerHandler(req, res, next) {
  try {
    const parsed = validateRegisterInput(req.body);

    if (parsed.error) {
      return fail(res, 400, parsed.error);
    }

    if (getUserByEmail(parsed.value.email)) {
      return fail(res, 409, 'User email already exists');
    }

    if (!organizationExists(parsed.value.organizationId)) {
      return fail(res, 404, 'Organization not found');
    }

    const result = await registerUser(parsed.value);

    writeAuditLog({
      organizationId: parsed.value.organizationId,
      userId: result.user.id,
      eventType: 'auth.user_registered',
      entityType: 'user',
      entityId: result.user.id,
      message: `User registered: ${result.user.email}`,
      req
    });

    return created(res, {
      item: {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          status: result.user.status
        },
        memberships: result.memberships
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const parsed = validateLoginInput(req.body);

    if (parsed.error) {
      return fail(res, 400, parsed.error);
    }

    const result = await authenticateUser(parsed.value);

    if (!result) {
      return fail(res, 401, 'Invalid credentials');
    }

    writeAuditLog({
      organizationId: result.organizationId,
      userId: result.user.id,
      eventType: 'auth.login',
      entityType: 'session',
      entityId: result.user.id,
      message: `User logged in: ${result.user.email}`,
      req
    });

    return ok(res, {
      item: result
    });
  } catch (error) {
    next(error);
  }
}

export function meHandler(req, res) {
  return ok(res, {
    item: {
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
      sessionId: req.auth.sessionId
    }
  });
}

export function logoutHandler(req, res) {
  const rawToken = req.auth.rawToken;
  const tokenHash = hashSessionToken(rawToken);

  deleteSessionByTokenHash(tokenHash);

  writeAuditLog({
    organizationId: req.auth.organizationId,
    userId: req.auth.userId,
    eventType: 'auth.logout',
    entityType: 'session',
    entityId: req.auth.sessionId,
    message: 'User logged out',
    req
  });

  return ok(res, {
    item: {
      loggedOut: true
    }
  });
}
