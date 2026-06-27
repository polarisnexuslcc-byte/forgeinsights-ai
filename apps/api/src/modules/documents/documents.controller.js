import path from 'path';
import { writeAuditLog } from '../audit/audit.service.js';
import { extractTextFromFile } from '../../server/modules/ingestion/text-extractor.js';
import {
  createDocument,
  createDocumentVersion,
  createUploadedFile,
  getDocumentById,
  getDocumentByIdForOrganization,
  getLatestDocumentVersion,
  getLatestUploadedFileForDocument,
  listDocuments,
  listDocumentsByOrganization,
  markDocumentAsNeedsReview,
  markDocumentAsProcessed,
  markDocumentForReindex,
  organizationExists,
  sourceExists,
  updateDocumentVersionExtractedText
} from './documents.repository.js';
import {
  validateCreateDocumentInput,
  validateCreateDocumentVersionInput
} from './documents.validators.js';
import { created, fail, ok } from '../../server/utils/response.js';
import { sha256File } from '../../server/utils/file.js';

export function listDocumentsHandler(req, res) {
  const organizationId = req.auth?.organizationId;
  const documents = organizationId
    ? listDocumentsByOrganization(organizationId)
    : listDocuments();
  return ok(res, { items: documents });
}

export function getDocumentHandler(req, res) {
  const document = getDocumentById(req.params.id);
  if (!document) {
    return fail(res, 404, 'Document not found');
  }
  return ok(res, { item: document });
}

export function createDocumentHandler(req, res) {
  const { value, error } = validateCreateDocumentInput(req.body);
  if (error) {
    return fail(res, 400, error);
  }

  if (!organizationExists(value.organizationId)) {
    return fail(res, 404, 'Organization not found');
  }

  if (value.sourceId && !sourceExists(value.sourceId)) {
    return fail(res, 404, 'Source not found');
  }

  const document = createDocument(value);

  writeAuditLog({
    organizationId: document.organizationId,
    userId: value.createdByUserId || null,
    sourceId: document.sourceId || null,
    eventType: 'document.created',
    entityType: 'document',
    entityId: document.id,
    message: `Document created: ${document.title}`,
    metadata: {
      documentType: document.documentType,
      visibility: document.visibility
    },
    req
  });

  return created(res, { item: document });
}

export function createDocumentVersionHandler(req, res) {
  const document = getDocumentById(req.params.id);
  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const { value, error } = validateCreateDocumentVersionInput(req.body);
  if (error) {
    return fail(res, 400, error);
  }

  const version = createDocumentVersion(document.id, document.organizationId, value);

  writeAuditLog({
    organizationId: document.organizationId,
    userId: null,
    sourceId: document.sourceId || null,
    eventType: 'document.version_created',
    entityType: 'document_version',
    entityId: version.id,
    message: `Document version ${version.versionNumber} created for: ${document.title}`,
    metadata: {
      documentId: document.id,
      versionNumber: version.versionNumber
    },
    req
  });

  return created(res, { item: version });
}

export function reindexDocumentHandler(req, res) {
  const document = getDocumentById(req.params.id);
  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const updated = markDocumentForReindex(document.id);

  writeAuditLog({
    organizationId: document.organizationId,
    userId: null,
    sourceId: document.sourceId || null,
    eventType: 'document.reindex_requested',
    entityType: 'document',
    entityId: document.id,
    message: `Document reindex requested: ${document.title}`,
    metadata: {},
    req
  });

  return ok(res, { item: updated });
}

export async function uploadDocumentFileHandler(req, res, next) {
  try {
    const document = getDocumentByIdForOrganization(req.params.id, req.auth.organizationId);
    if (!document) {
      return fail(res, 404, 'Document not found');
    }

    if (!req.file) {
      return fail(res, 400, 'No file uploaded');
    }

    const checksum = sha256File(req.file.path);
    const storagePath = path.normalize(req.file.path);

    const uploadedFile = createUploadedFile({
      organizationId: req.auth.organizationId,
      documentId: document.id,
      originalName: req.file.originalname,
      storagePath,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedByUserId: req.auth.userId
    });

    const version = createDocumentVersion(document.id, document.organizationId, {
      storagePath,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      checksum
    });

    writeAuditLog({
      organizationId: document.organizationId,
      userId: req.auth.userId,
      sourceId: document.sourceId || null,
      eventType: 'document.file_uploaded',
      entityType: 'document',
      entityId: document.id,
      message: `File uploaded for document: ${document.title}`,
      metadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        checksum
      },
      req
    });

    return ok(res, { item: { uploadedFile, version } });
  } catch (error) {
    next(error);
  }
}

export async function ingestDocumentHandler(req, res, next) {
  try {
    const document = getDocumentByIdForOrganization(req.params.id, req.auth.organizationId);

    if (!document) {
      return fail(res, 404, 'Document not found');
    }

    const uploadedFile = getLatestUploadedFileForDocument(
      document.id,
      req.auth.organizationId
    );

    if (!uploadedFile) {
      return fail(res, 404, 'Uploaded file not found for document');
    }

    const version = getLatestDocumentVersion(
      document.id,
      req.auth.organizationId
    );

    if (!version) {
      return fail(res, 404, 'Document version not found');
    }

    const extractedText = await extractTextFromFile({
      filePath: uploadedFile.storagePath,
      mimeType: uploadedFile.mimeType,
      originalName: uploadedFile.originalName
    });

    if (extractedText === null) {
      markDocumentAsNeedsReview(document.id, req.auth.organizationId);

      writeAuditLog({
        organizationId: document.organizationId,
        userId: req.auth.userId,
        sourceId: document.sourceId || null,
        eventType: 'document.ingestion_unsupported',
        entityType: 'document',
        entityId: document.id,
        message: `Unsupported ingestion type for document: ${document.title}`,
        metadata: {
          mimeType: uploadedFile.mimeType,
          originalName: uploadedFile.originalName
        },
        req
      });

      return fail(res, 415, 'Unsupported file type for text extraction');
    }

    const updatedVersion = updateDocumentVersionExtractedText(version.id, extractedText);
    const updatedDocument = markDocumentAsProcessed(
      document.id,
      req.auth.organizationId,
      version.checksum
    );

    writeAuditLog({
      organizationId: document.organizationId,
      userId: req.auth.userId,
      sourceId: document.sourceId || null,
      eventType: 'document.ingested',
      entityType: 'document_version',
      entityId: updatedVersion.id,
      message: `Document ingested: ${document.title}`,
      metadata: {
        documentId: document.id,
        versionNumber: updatedVersion.versionNumber,
        extractedChars: extractedText.length,
        extractedWords: extractedText.split(/\s+/).filter(Boolean).length
      },
      req
    });

    return ok(res, {
      item: {
        document: updatedDocument,
        version: {
          id: updatedVersion.id,
          versionNumber: updatedVersion.versionNumber,
          extractedChars: extractedText.length,
          extractedWords: extractedText.split(/\s+/).filter(Boolean).length,
          hasExtractedText: Boolean(extractedText)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export function getDocumentTextHandler(req, res) {
  const document = getDocumentByIdForOrganization(req.params.id, req.auth.organizationId);

  if (!document) {
    return fail(res, 404, 'Document not found');
  }

  const version = getLatestDocumentVersion(document.id, req.auth.organizationId);

  if (!version) {
    return fail(res, 404, 'Document version not found');
  }

  return ok(res, {
    item: {
      documentId: document.id,
      versionId: version.id,
      versionNumber: version.versionNumber,
      extractedText: version.extractedText || null
    }
  });
}
