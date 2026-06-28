import { Router } from 'express';
import { requireAuth } from '../../server/middleware/require-auth.js';
import { uploadSingleDocument } from '../../server/storage/upload.js';
import {
  createDocumentHandler,
  createDocumentVersionHandler,
  getDocumentHandler,
  getDocumentTextHandler,
  ingestDocumentHandler,
  listDocumentsHandler,
  listDocumentJobsHandler,
  reindexDocumentHandler,
  uploadDocumentFileHandler
} from './documents.controller.js';

export const documentsRouter = Router();

documentsRouter.get('/', requireAuth, listDocumentsHandler);
documentsRouter.get('/:id', requireAuth, getDocumentHandler);
documentsRouter.post('/', requireAuth, createDocumentHandler);
documentsRouter.post('/:id/versions', requireAuth, createDocumentVersionHandler);
documentsRouter.post('/:id/reindex', requireAuth, reindexDocumentHandler);
documentsRouter.post('/:id/upload', requireAuth, uploadSingleDocument, uploadDocumentFileHandler);
documentsRouter.post('/:id/ingest', requireAuth, ingestDocumentHandler);
documentsRouter.get('/:id/text', requireAuth, getDocumentTextHandler);
documentsRouter.get('/:id/jobs', requireAuth, listDocumentJobsHandler);
