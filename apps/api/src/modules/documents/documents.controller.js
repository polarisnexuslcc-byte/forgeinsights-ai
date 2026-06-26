import { created, fail, ok } from '../../server/utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  createDocument,
  createDocumentVersion,
  getDocumentById,
  listDocuments,
  markDocumentForReindex,
  organizationExists,
  sourceExists
} from './documents.repository.js';
import {
  validateCreateDocumentInput,
  validateCreateDocumentVersionInput
} from './documents.validators.js';

export function listDocumentsHandler(_req, res) {
  const items = listDocuments();
  return ok(res, { items });
}

export function getDocumentHandler(req, res) {
  const item = getDocumentById(req.params.id);

  if (!item) {
    return fail(res, 404, 'Document not found');
  }

  return ok(res, { item });
}

export function createDocumentHandler(req, res) {
  const parsed = validateCreateDocumentInput(req.body);

  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }

  if (!organizationExists(parsed.value.organizationId)) {
    return fail(res, 404, 'Organization not found');
  }

  if (!sourceExists(parsed.value.sourceId)) {
    return fail(res, 404, 'Source not found');
  }

  const item = createDocument(parsed.value);

  writeAuditLog({
    organizationId: item.organizationId,
    sourceId: item.sourceId,
    eventType: 'document.created',
    entityType: 'document',
    entityId: item.id,
    message: `Document created: ${item.title}`,
    metadata: {
      documentType: item.documentType,
      visibility: item.visibility
    },
    req
  });

  return created(res, { item });
}

export function createDocumentVersionHandler(req, res) {
  const document = getDocumentById(req.params.id);

  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const parsed = validateCreateDocumentVersionInput(req.body);

  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }

  const item = createDocumentVersion(req.params.id, parsed.value);

  writeAuditLog({
    organizationId: document.organizationId,
    sourceId: document.sourceId,
    eventType: 'document.version_created',
    entityType: 'document_version',
    entityId: item.id,
    message: `Document version created for: ${document.title}`,
    metadata: {
      documentId: document.id,
      versionNumber: item.versionNumber,
      storagePath: item.storagePath
    },
    req
  });

  return created(res, { item });
}

export function reindexDocumentHandler(req, res) {
  const document = getDocumentById(req.params.id);

  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const item = markDocumentForReindex(req.params.id);

  writeAuditLog({
    organizationId: document.organizationId,
    sourceId: document.sourceId,
    eventType: 'document.reindex_requested',
    entityType: 'document',
    entityId: document.id,
    message: `Document reindex requested: ${document.title}`,
    metadata: {
      previousStatus: document.status
    },
    req
  });

  return ok(res, { item });
}
