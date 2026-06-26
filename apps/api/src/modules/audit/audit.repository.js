import crypto from 'crypto';
import { db } from '../../server/db/index.js';

export function insertAuditLog(data) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO audit_logs (
      id,
      organization_id,
      user_id,
      source_id,
      event_type,
      severity,
      route,
      method,
      entity_type,
      entity_id,
      message,
      ip_address,
      metadata_json,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId || null,
    data.userId || null,
    data.sourceId || null,
    data.eventType,
    data.severity || 'info',
    data.route || null,
    data.method || null,
    data.entityType || null,
    data.entityId || null,
    data.message,
    data.ipAddress || null,
    data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt
  );

  return getAuditLogById(id);
}

export function getAuditLogById(id) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      user_id as userId,
      source_id as sourceId,
      event_type as eventType,
      severity,
      route,
      method,
      entity_type as entityType,
      entity_id as entityId,
      message,
      ip_address as ipAddress,
      metadata_json as metadataJson,
      created_at as createdAt
    FROM audit_logs
    WHERE id = ?
  `).get(id);
}

export function listAuditLogsByOrganization(organizationId, limit = 100) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      user_id as userId,
      source_id as sourceId,
      event_type as eventType,
      severity,
      route,
      method,
      entity_type as entityType,
      entity_id as entityId,
      message,
      ip_address as ipAddress,
      metadata_json as metadataJson,
      created_at as createdAt
    FROM audit_logs
    WHERE organization_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(organizationId, limit);
}
