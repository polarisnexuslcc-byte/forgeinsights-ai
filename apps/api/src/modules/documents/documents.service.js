import crypto from 'crypto';

import {
  createDocument,
  createDocumentVersion,
  createUploadedFile,
  getDocumentByExternalId,
  getLatestDocumentVersion,
  getNextDocumentVersionNumber,
  updateDocumentMetadata
} from './documents.repository.js';

export async function createDocumentWithVersion({
  organizationId,
  userId,
  sourceId = null,
  title,
  originalName,
  mimeType,
  sizeBytes,
  checksum,
  storagePath,
  externalId = null,
  publishedAt = null
}) {
  const document = createDocument({
    id: crypto.randomUUID(),
    organizationId,
    sourceId,
    title,
    status: 'uploaded',
    checksum,
    externalId,
    publishedAt
  });

  const version = createDocumentVersion({
    id: crypto.randomUUID(),
    documentId: document.id,
    versionNumber: 1,
    storagePath,
    mimeType,
    sizeBytes,
    checksum,
    extractedText: null
  });

  createUploadedFile({
    id: crypto.randomUUID(),
    organizationId,
    documentId: document.id,
    originalName,
    storagePath,
    mimeType,
    sizeBytes,
    uploadedByUserId: userId
  });

  return { document, version };
}

export async function upsertConnectedDocument({
  organizationId,
  userId,
  sourceId,
  title,
  originalName,
  mimeType,
  sizeBytes,
  checksum,
  storagePath,
  externalId,
  publishedAt = null
}) {
  const existing = getDocumentByExternalId({
    organizationId,
    sourceId,
    externalId
  });

  if (!existing) {
    const document = createDocument({
      id: crypto.randomUUID(),
      organizationId,
      sourceId,
      title,
      status: 'uploaded',
      checksum,
      externalId,
      publishedAt
    });

    const version = createDocumentVersion({
      id: crypto.randomUUID(),
      documentId: document.id,
      versionNumber: 1,
      storagePath,
      mimeType,
      sizeBytes,
      checksum,
      extractedText: null
    });

    createUploadedFile({
      id: crypto.randomUUID(),
      organizationId,
      documentId: document.id,
      originalName,
      storagePath,
      mimeType,
      sizeBytes,
      uploadedByUserId: userId
    });

    return {
      action: 'created',
      document,
      version
    };
  }

  const latestVersion = getLatestDocumentVersion(existing.id, organizationId);

  if (latestVersion && latestVersion.checksum === checksum) {
    const document = updateDocumentMetadata({
      id: existing.id,
      organizationId,
      title,
      checksum,
      publishedAt,
      status: existing.status || 'uploaded'
    });

    return {
      action: 'unchanged',
      document,
      version: latestVersion
    };
  }

  const versionNumber = getNextDocumentVersionNumber(existing.id);

  const version = createDocumentVersion({
    id: crypto.randomUUID(),
    documentId: existing.id,
    versionNumber,
    storagePath,
    mimeType,
    sizeBytes,
    checksum,
    extractedText: null
  });

  createUploadedFile({
    id: crypto.randomUUID(),
    organizationId,
    documentId: existing.id,
    originalName,
    storagePath,
    mimeType,
    sizeBytes,
    uploadedByUserId: userId
  });

  const document = updateDocumentMetadata({
    id: existing.id,
    organizationId,
    title,
    checksum,
    publishedAt,
    status: 'uploaded'
  });

  return {
    action: 'updated',
    document,
    version
  };
}
