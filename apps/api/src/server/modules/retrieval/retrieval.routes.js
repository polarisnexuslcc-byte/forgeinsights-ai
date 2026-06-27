import { Router } from 'express';
import {
  indexDocumentChunksHandler,
  searchRetrievalHandler
} from './retrieval.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';

export const retrievalRouter = Router();

retrievalRouter.post('/documents/:id/index', requireAuth, indexDocumentChunksHandler);
retrievalRouter.get('/search', requireAuth, searchRetrievalHandler);
