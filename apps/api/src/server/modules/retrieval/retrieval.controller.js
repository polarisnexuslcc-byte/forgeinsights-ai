import { fail, ok } from '../../utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  getDocumentByIdForOrganization,
  getLatestDocumentVersion
} from '../documents/documents.repository.js';
import { indexDocumentText } from './retrieval.service.js';
import { runRetrievalSearch } from './retrieval.search-service.js';

export function indexDocumentChunksHandler(req, res) {
  const document = getDocumentByIdForOrganization(req.params.id, req.auth.organizationId);

  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const version = getLatestDocumentVersion(document.id, req.auth.organizationId);

  if (!version) {
    return fail(res, 404, 'Document version not found');
  }

  if (!version.extractedText) {
    return fail(res, 400, 'Document has no extracted text');
  }

  const result = indexDocumentText({
    organizationId: req.auth.organizationId,
    documentId: document.id,
    documentVersionId: version.id,
    extractedText: version.extractedText
  });

  writeAuditLog({
    organizationId: document.organizationId,
    userId: req.auth.userId,
    sourceId: document.sourceId || null,
    eventType: 'document.chunks_indexed',
    entityType: 'document_version',
    entityId: version.id,
    message: `Chunks indexed for document: ${document.title}`,
    metadata: {
      documentId: document.id,
      versionNumber: version.versionNumber,
      chunkCount: result.chunkCount,
      totalChars: result.totalChars,
      totalTokens: result.totalTokens
    },
    req
  });

  return ok(res, {
    item: {
      documentId: document.id,
      versionId: version.id,
      versionNumber: version.versionNumber,
      ...result
    }
  });
}

export async function searchRetrievalHandler(req, res, next) {
  try {
    const query = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit || 5), 20);
    const documentId = req.query.documentId ? String(req.query.documentId) : null;
    const sourceId = req.query.sourceId ? String(req.query.sourceId) : null;

    if (!query) {
      return fail(res, 400, 'q is required');
    }

    const result = await runRetrievalSearch({
      organizationId: req.auth.organizationId,
      query,
      limit,
      documentId,
      sourceId
    });

    return ok(res, result);
  } catch (error) {
    next(error);
  }
}
