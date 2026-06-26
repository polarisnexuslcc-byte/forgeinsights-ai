import { Router } from 'express';
import {
  createDocumentHandler,
  createDocumentVersionHandler,
  getDocumentHandler,
  listDocumentsHandler,
  reindexDocumentHandler
} from './documents.controller.js';

export const documentsRouter = Router();

documentsRouter.get('/', listDocumentsHandler);
documentsRouter.get('/:id', getDocumentHandler);
documentsRouter.post('/', createDocumentHandler);
documentsRouter.post('/:id/versions', createDocumentVersionHandler);
documentsRouter.post('/:id/reindex', reindexDocumentHandler);
