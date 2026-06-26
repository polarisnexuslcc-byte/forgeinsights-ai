import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../server/config/env.js';
import {
  createMembership,
  createSession,
  createUser,
  getSessionByTokenHash,
  getUserByEmail,
  listMembershipsByUserId,
  touchSession
} from './auth.repository.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function registerUser({ email, password, fullName, organizationId }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ email, passwordHash, fullName });

  if (organizationId) {
    createMembership({
      userId: user.id,
      organizationId,
      role: 'member'
    });
  }

  const memberships = listMembershipsByUserId(user.id);

  return {
    user,
    memberships
  };
}

export async function authenticateUser({ email, password }) {
  const user = getUserByEmail(email);

  if (!user || user.status !== 'active') {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  const memberships = listMembershipsByUserId(user.id);
  const organizationId = memberships[0]?.organizationId || null;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  createSession({
    userId: user.id,
    organizationId,
    tokenHash,
    expiresAt
  });

  return {
    token: rawToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status
    },
    memberships,
    organizationId
  };
}

export function resolveSessionFromToken(rawToken) {
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const session = getSessionByTokenHash(tokenHash);

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }

  touchSession(session.id);

  return session;
}

export function hashSessionToken(rawToken) {
  return hashToken(rawToken);
}
