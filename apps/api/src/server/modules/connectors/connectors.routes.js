import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  createConnectorHandler,
  listConnectorRunsHandler,
  listConnectorsHandler,
  syncConnectorHandler
} from './connectors.controller.js';

export const connectorsRouter = Router();

connectorsRouter.get('/', requireAuth, listConnectorsHandler);
connectorsRouter.post('/', requireAuth, createConnectorHandler);
connectorsRouter.post('/:id/sync', requireAuth, syncConnectorHandler);
connectorsRouter.get('/:id/runs', requireAuth, listConnectorRunsHandler);
