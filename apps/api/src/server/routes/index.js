import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { apiRouter } from './api.routes.js';

export const router = Router();

router.use('/health', healthRouter);
router.use('/api', apiRouter);
