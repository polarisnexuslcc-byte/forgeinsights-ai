import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { compareRetrievalHandler } from './evals.controller.js';

export const evalsRouter = Router();

evalsRouter.get('/retrieval/compare', requireAuth, compareRetrievalHandler);
