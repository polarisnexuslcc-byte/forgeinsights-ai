import { Router } from 'express';
import { auditRouter } from '../../modules/audit/audit.routes.js';
import { documentsRouter } from '../../modules/documents/documents.routes.js';
import { organizationsRouter } from '../../modules/organizations/organizations.routes.js';
import { sourcesRouter } from '../../modules/sources/sources.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ForgeInsights AI API'
  });
});

apiRouter.use('/organizations', organizationsRouter);
apiRouter.use('/sources', sourcesRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/audit-logs', auditRouter);
