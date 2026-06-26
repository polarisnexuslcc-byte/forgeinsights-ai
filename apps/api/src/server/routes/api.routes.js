import { Router } from 'express';
import { organizationsRouter } from '../../modules/organizations/organizations.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ForgeInsights AI API'
  });
});

apiRouter.use('/organizations', organizationsRouter);
