import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  listRagRunsHandler,
  observabilitySummaryHandler
} from './observability.controller.js';

export const observabilityRouter = Router();

observabilityRouter.get('/rag-runs', requireAuth, listRagRunsHandler);
observabilityRouter.get('/summary', requireAuth, observabilitySummaryHandler);
