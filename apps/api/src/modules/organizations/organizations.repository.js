import crypto from 'crypto';
import { db } from '../../server/db/index.js';

export function listOrganizations() {
  return db.prepare(`
    SELECT
      id,
      name,
      slug,
      industry,
      size_band as sizeBand,
      created_at as createdAt,
      updated_at as updatedAt
    FROM organizations
    ORDER BY created_at DESC
  `).all();
}

export function getOrganizationById(id) {
  return db.prepare(`
    SELECT
      id,
      name,
      slug,
      industry,
      size_band as sizeBand,
      created_at as createdAt,
      updated_at as updatedAt
    FROM organizations
    WHERE id = ?
  `).get(id);
}

export function createOrganization(data) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO organizations (
      id,
      name,
      slug,
      industry,
      size_band,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.slug,
    data.industry,
    data.sizeBand,
    now,
    now
  );

  return getOrganizationById(id);
}
