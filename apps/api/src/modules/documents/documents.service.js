import crypto from 'crypto';

import {
  createDocument,
  createDocumentVersion,
  createUploadedFile
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
