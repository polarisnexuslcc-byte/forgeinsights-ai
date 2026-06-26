import crypto from 'crypto';
import { db } from '../../server/db/index.js';

export function listDocuments() {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      source_id as sourceId,
      title,
      document_type as documentType,
      status,
      visibility,
      checksum,
      metadata_json as metadataJson,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
    ORDER BY created_at DESC
  `).all();
}

export function getDocumentById(id) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      source_id as sourceId,
      title,
      document_type as documentType,
      status,
      visibility,
      checksum,
      metadata_json as metadataJson,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
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

export function sourceExists(sourceId) {
  if (!sourceId) return true;

  const row = db.prepare(`
    SELECT id
    FROM sources
    WHERE id = ?
  `).get(sourceId);

  return Boolean(row);
}

export function createDocument(data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO documents (
      id,
      organization_id,
      source_id,
      title,
      document_type,
      status,
      visibility,
      metadata_json,
      created_by_user_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.sourceId,
    data.title,
    data.documentType,
    'uploaded',
    data.visibility,
    data.metadata ? JSON.stringify(data.metadata) : null,
    data.createdByUserId,
    now,
    now
  );

  return getDocumentById(id);
}

export function getLatestDocumentVersionNumber(documentId) {
  const row = db.prepare(`
    SELECT MAX(version_number) as maxVersion
    FROM document_versions
    WHERE document_id = ?
  `).get(documentId);

  return row?.maxVersion || 0;
}

export function createDocumentVersion(documentId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const nextVersion = getLatestDocumentVersionNumber(documentId) + 1;

  db.prepare(`
    INSERT INTO document_versions (
      id,
      document_id,
      version_number,
      storage_path,
      mime_type,
      size_bytes,
      checksum,
      extracted_text,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    documentId,
    nextVersion,
    data.storagePath,
    data.mimeType,
    data.sizeBytes,
    data.checksum,
    data.extractedText,
    now
  );

  db.prepare(`
    UPDATE documents
    SET checksum = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.checksum,
    'processed',
    now,
    documentId
  );

  return db.prepare(`
    SELECT
      id,
      document_id as documentId,
      version_number as versionNumber,
      storage_path as storagePath,
      mime_type as mimeType,
      size_bytes as sizeBytes,
      checksum,
      extracted_text as extractedText,
      created_at as createdAt
    FROM document_versions
    WHERE id = ?
  `).get(id);
}

export function markDocumentForReindex(documentId) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE documents
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run('uploaded', now, documentId);

  return getDocumentById(documentId);
}
