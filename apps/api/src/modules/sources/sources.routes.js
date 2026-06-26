import { Router } from 'express';
import {
  connectSourceHandler,
  createSourceHandler,
  getSourceHandler,
  listSourcesHandler,
  sourceStatusHandler,
  syncSourceHandler
} from './sources.controller.js';

export const sourcesRouter = Router();

sourcesRouter.get('/', listSourcesHandler);
sourcesRouter.get('/:id', getSourceHandler);
sourcesRouter.post('/', createSourceHandler);
sourcesRouter.post('/:id/connect', connectSourceHandler);
sourcesRouter.post('/:id/sync', syncSourceHandler);
sourcesRouter.get('/:id/status', sourceStatusHandler);
