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
      metadata,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
    ORDER BY created_at DESC
  `).all();
}

export function listDocumentsByOrganization(organizationId) {
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
      metadata,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
    WHERE organization_id = ?
    ORDER BY created_at DESC
  `).all(organizationId);
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
      metadata,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
    WHERE id = ?
  `).get(id);
}

export function getDocumentByIdForOrganization(id, organizationId) {
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
      metadata,
      created_by_user_id as createdByUserId,
      created_at as createdAt,
      updated_at as updatedAt
    FROM documents
    WHERE id = ? AND organization_id = ?
  `).get(id, organizationId);
}

export function organizationExists(organizationId) {
  return db.prepare(`
    SELECT id FROM organizations WHERE id = ?
  `).get(organizationId);
}

export function sourceExists(sourceId) {
  return db.prepare(`
    SELECT id FROM sources WHERE id = ?
  `).get(sourceId);
}

export function sourceExistsInOrganization(sourceId, organizationId) {
  return db.prepare(`
    SELECT id FROM sources WHERE id = ? AND organization_id = ?
  `).get(sourceId, organizationId);
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
      metadata,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.sourceId || null,
    data.title,
    data.documentType,
    'uploaded',
    data.visibility || 'private',
    data.metadata ? JSON.stringify(data.metadata) : null,
    data.createdByUserId || null,
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

export function createDocumentVersion(documentId, _organizationId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const versionNumber = getLatestDocumentVersionNumber(documentId) + 1;

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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    documentId,
    versionNumber,
    data.storagePath,
    data.mimeType || null,
    data.sizeBytes || null,
    data.checksum || null,
    data.extractedText || null,
    now
  );

  db.prepare(`
    UPDATE documents SET status = 'processed', updated_at = ? WHERE id = ?
  `).run(now, documentId);

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
    UPDATE documents SET status = 'uploaded', updated_at = ? WHERE id = ?
  `).run(now, documentId);
  return getDocumentById(documentId);
}

export function createUploadedFile(data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO uploaded_files (
      id,
      organization_id,
      document_id,
      original_name,
      storage_path,
      mime_type,
      size_bytes,
      uploaded_by_user_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.documentId,
    data.originalName,
    data.storagePath,
    data.mimeType || null,
    data.sizeBytes || null,
    data.uploadedByUserId || null,
    now
  );

  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      document_id as documentId,
      original_name as originalName,
      storage_path as storagePath,
      mime_type as mimeType,
      size_bytes as sizeBytes,
      uploaded_by_user_id as uploadedByUserId,
      created_at as createdAt
    FROM uploaded_files
    WHERE id = ?
  `).get(id);
}

export function getLatestUploadedFileForDocument(documentId, organizationId) {
  return db.prepare(`
    SELECT
      uploaded_files.id,
      uploaded_files.organization_id as organizationId,
      uploaded_files.document_id as documentId,
      uploaded_files.original_name as originalName,
      uploaded_files.storage_path as storagePath,
      uploaded_files.mime_type as mimeType,
      uploaded_files.size_bytes as sizeBytes,
      uploaded_files.uploaded_by_user_id as uploadedByUserId,
      uploaded_files.created_at as createdAt
    FROM uploaded_files
    WHERE uploaded_files.document_id = ?
      AND uploaded_files.organization_id = ?
    ORDER BY uploaded_files.created_at DESC
    LIMIT 1
  `).get(documentId, organizationId);
}

export function updateDocumentVersionExtractedText(versionId, extractedText) {
  db.prepare(`
    UPDATE document_versions
    SET extracted_text = ?
    WHERE id = ?
  `).run(extractedText, versionId);

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
  `).get(versionId);
}

export function getLatestDocumentVersion(documentId, organizationId) {
  return db.prepare(`
    SELECT
      document_versions.id,
      document_versions.document_id as documentId,
      document_versions.version_number as versionNumber,
      document_versions.storage_path as storagePath,
      document_versions.mime_type as mimeType,
      document_versions.size_bytes as sizeBytes,
      document_versions.checksum,
      document_versions.extracted_text as extractedText,
      document_versions.created_at as createdAt
    FROM document_versions
    INNER JOIN documents ON documents.id = document_versions.document_id
    WHERE documents.id = ?
      AND documents.organization_id = ?
    ORDER BY document_versions.version_number DESC
    LIMIT 1
  `).get(documentId, organizationId);
}

export function markDocumentAsProcessed(documentId, organizationId, checksum) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE documents
    SET status = ?, checksum = ?, updated_at = ?
    WHERE id = ? AND organization_id = ?
  `).run(
    'processed',
    checksum,
    now,
    documentId,
    organizationId
  );

  return getDocumentByIdForOrganization(documentId, organizationId);
}

export function markDocumentAsNeedsReview(documentId, organizationId) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE documents
    SET status = ?, updated_at = ?
    WHERE id = ? AND organization_id = ?
  `).run(
    'uploaded',
    now,
    documentId,
    organizationId
  );

  return getDocumentByIdForOrganization(documentId, organizationId);
}
