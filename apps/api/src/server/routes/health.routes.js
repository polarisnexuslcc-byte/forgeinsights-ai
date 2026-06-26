import { Router } from 'express';
import { getDatabaseHealth } from '../db/health.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    database: getDatabaseHealth()
  });
});
