import crypto from 'crypto';
import { db } from '../../server/db/index.js';

export function getUserByEmail(email) {
  return db.prepare(`
    SELECT
      id,
      email,
      password_hash as passwordHash,
      full_name as fullName,
      status,
      created_at as createdAt,
      updated_at as updatedAt
    FROM users
    WHERE email = ?
  `).get(email);
}

export function getUserById(id) {
  return db.prepare(`
    SELECT
      id,
      email,
      password_hash as passwordHash,
      full_name as fullName,
      status,
      created_at as createdAt,
      updated_at as updatedAt
    FROM users
    WHERE id = ?
  `).get(id);
}

export function organizationExists(organizationId) {
  if (!organizationId) return true;

  const row = db.prepare(`
    SELECT id
    FROM organizations
    WHERE id = ?
  `).get(organizationId);

  return Boolean(row);
}

export function createUser({ email, passwordHash, fullName }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (
      id,
      email,
      password_hash,
      full_name,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    email,
    passwordHash,
    fullName,
    'active',
    now,
    now
  );

  return getUserById(id);
}

export function createMembership({ userId, organizationId, role = 'member' }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO memberships (
      id,
      organization_id,
      user_id,
      role,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    organizationId,
    userId,
    role,
    createdAt
  );
}

export function listMembershipsByUserId(userId) {
  return db.prepare(`
    SELECT
      memberships.id,
      memberships.organization_id as organizationId,
      memberships.user_id as userId,
      memberships.role,
      organizations.name as organizationName,
      organizations.slug as organizationSlug
    FROM memberships
    INNER JOIN organizations ON organizations.id = memberships.organization_id
    WHERE memberships.user_id = ?
    ORDER BY memberships.created_at ASC
  `).all(userId);
}

export function createSession({ userId, organizationId, tokenHash, expiresAt }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (
      id,
      user_id,
      organization_id,
      token_hash,
      expires_at,
      created_at,
      last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    organizationId,
    tokenHash,
    expiresAt,
    now,
    now
  );

  return getSessionByTokenHash(tokenHash);
}

export function getSessionByTokenHash(tokenHash) {
  return db.prepare(`
    SELECT
      id,
      user_id as userId,
      organization_id as organizationId,
      token_hash as tokenHash,
      expires_at as expiresAt,
      created_at as createdAt,
      last_seen_at as lastSeenAt
    FROM sessions
    WHERE token_hash = ?
  `).get(tokenHash);
}

export function touchSession(sessionId) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE sessions
    SET last_seen_at = ?
    WHERE id = ?
  `).run(now, sessionId);
}

export function deleteSessionByTokenHash(tokenHash) {
  db.prepare(`
    DELETE FROM sessions
    WHERE token_hash = ?
  `).run(tokenHash);
}
