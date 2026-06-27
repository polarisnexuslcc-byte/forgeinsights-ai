import { Router } from 'express';
import {
  createDocumentHandler,
  createDocumentVersionHandler,
  getDocumentHandler,
  listDocumentsHandler,
  reindexDocumentHandler,
  uploadDocumentFileHandler
} from './documents.controller.js';
import { requireAuth } from '../../server/middleware/require-auth.js';
import { uploadSingleDocument } from '../../server/storage/upload.js';

export const documentsRouter = Router();

documentsRouter.get('/', requireAuth, listDocumentsHandler);
documentsRouter.get('/:id', requireAuth, getDocumentHandler);
documentsRouter.post('/', requireAuth, createDocumentHandler);
documentsRouter.post('/:id/versions', requireAuth, createDocumentVersionHandler);
documentsRouter.post('/:id/reindex', requireAuth, reindexDocumentHandler);
documentsRouter.post(
  '/:id/upload',
  requireAuth,
  uploadSingleDocument,
  uploadDocumentFileHandler
);
