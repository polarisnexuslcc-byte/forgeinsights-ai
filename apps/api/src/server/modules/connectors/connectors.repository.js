import crypto from 'crypto';
import { db } from '../../db/index.js';

export function createConnector({
  organizationId,
  type,
  name,
  config
}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO connectors (
      id,
      organization_id,
      type,
      name,
      status,
      config_json,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(
    id,
    organizationId,
    type,
    name,
    JSON.stringify(config || {}),
    now,
    now
  );

  return getConnectorById(id, organizationId);
}

export function listConnectorsByOrganization(organizationId) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      type,
      name,
      status,
      config_json as configJson,
      last_synced_at as lastSyncedAt,
      created_at as createdAt,
      updated_at as updatedAt
    FROM connectors
    WHERE organization_id = ?
    ORDER BY created_at DESC
  `).all(organizationId);
}

export function getConnectorById(id, organizationId) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      type,
      name,
      status,
      config_json as configJson,
      last_synced_at as lastSyncedAt,
      created_at as createdAt,
      updated_at as updatedAt
    FROM connectors
    WHERE id = ? AND organization_id = ?
  `).get(id, organizationId);
}

export function updateConnectorLastSyncedAt(id, organizationId) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE connectors
    SET last_synced_at = ?, updated_at = ?
    WHERE id = ? AND organization_id = ?
  `).run(now, now, id, organizationId);

  return getConnectorById(id, organizationId);
}

export function createConnectorSyncRun({
  connectorId,
  organizationId,
  status = 'running'
}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO connector_sync_runs (
      id,
      connector_id,
      organization_id,
      status,
      imported_count,
      skipped_count,
      error_count,
      started_at
    )
    VALUES (?, ?, ?, ?, 0, 0, 0, ?)
  `).run(id, connectorId, organizationId, status, now);

  return id;
}

export function finishConnectorSyncRun({
  id,
  status,
  importedCount = 0,
  skippedCount = 0,
  errorCount = 0,
  details = {}
}) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE connector_sync_runs
    SET
      status = ?,
      imported_count = ?,
      skipped_count = ?,
      error_count = ?,
      finished_at = ?,
      details_json = ?
    WHERE id = ?
  `).run(
    status,
    importedCount,
    skippedCount,
    errorCount,
    now,
    JSON.stringify(details || {}),
    id
  );
}

export function listConnectorSyncRuns(connectorId, organizationId) {
  return db.prepare(`
    SELECT
      id,
      connector_id as connectorId,
      organization_id as organizationId,
      status,
      imported_count as importedCount,
      skipped_count as skippedCount,
      error_count as errorCount,
      started_at as startedAt,
      finished_at as finishedAt,
      details_json as detailsJson
    FROM connector_sync_runs
    WHERE connector_id = ? AND organization_id = ?
    ORDER BY started_at DESC
    LIMIT 20
  `).all(connectorId, organizationId);
}
