import crypto from 'crypto';
import { db } from '../../server/db/index.js';

export function listSources() {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      key,
      name,
      category,
      provider,
      status,
      sync_mode as syncMode,
      last_synced_at as lastSyncedAt,
      metadata_json as metadataJson,
      created_at as createdAt,
      updated_at as updatedAt
    FROM sources
    ORDER BY created_at DESC
  `).all();
}

export function getSourceById(id) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      key,
      name,
      category,
      provider,
      status,
      sync_mode as syncMode,
      last_synced_at as lastSyncedAt,
      metadata_json as metadataJson,
      created_at as createdAt,
      updated_at as updatedAt
    FROM sources
    WHERE id = ?
  `).get(id);
}

export function organizationExists(organizationId) {
  const row = db.prepare(`
    SELECT id
    FROM organizations
    WHERE id = ?
  `).get(organizationId);

  return Boolean(row);
}

export function createSource(data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sources (
      id,
      organization_id,
      key,
      name,
      category,
      provider,
      status,
      sync_mode,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.key,
    data.name,
    data.category,
    data.provider,
    'disconnected',
    data.syncMode,
    now,
    now
  );

  return getSourceById(id);
}

export function connectSource(sourceId, credentialType, payload) {
  const now = new Date().toISOString();
  const existingCredential = db.prepare(`
    SELECT id
    FROM source_credentials
    WHERE source_id = ?
  `).get(sourceId);

  db.prepare(`
    UPDATE sources
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run('connected', now, sourceId);

  if (existingCredential) {
    db.prepare(`
      UPDATE source_credentials
      SET credential_type = ?, encrypted_payload = ?, last_validated_at = ?, updated_at = ?
      WHERE source_id = ?
    `).run(
      credentialType,
      JSON.stringify(payload),
      now,
      now,
      sourceId
    );
  } else {
    db.prepare(`
      INSERT INTO source_credentials (
        id,
        source_id,
        credential_type,
        encrypted_payload,
        last_validated_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      sourceId,
      credentialType,
      JSON.stringify(payload),
      now,
      now,
      now
    );
  }

  return getSourceById(sourceId);
}

export function createManualSyncJob(sourceId, organizationId) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sync_jobs (
      id,
      organization_id,
      source_id,
      job_type,
      status,
      started_at,
      records_processed,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    organizationId,
    sourceId,
    'manual_sync',
    'running',
    now,
    0,
    now,
    now
  );

  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      source_id as sourceId,
      job_type as jobType,
      status,
      started_at as startedAt,
      finished_at as finishedAt,
      records_processed as recordsProcessed,
      error_message as errorMessage,
      created_at as createdAt,
      updated_at as updatedAt
    FROM sync_jobs
    WHERE id = ?
  `).get(id);
}
