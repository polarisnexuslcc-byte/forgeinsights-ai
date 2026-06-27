import { Router } from 'express';
import { answersRouter } from '../modules/answers/answers.routes.js';
import { auditRouter } from '../../modules/audit/audit.routes.js';
import { authRouter } from '../../modules/auth/auth.routes.js';
import { documentsRouter } from '../../modules/documents/documents.routes.js';
import { evalsRouter } from '../modules/evals/evals.routes.js';
import { organizationsRouter } from '../../modules/organizations/organizations.routes.js';
import { retrievalRouter } from '../modules/retrieval/retrieval.routes.js';
import { sourcesRouter } from '../../modules/sources/sources.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ForgeInsights AI API'
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationsRouter);
apiRouter.use('/sources', sourcesRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/retrieval', retrievalRouter);
apiRouter.use('/answers', answersRouter);
apiRouter.use('/evals', evalsRouter);
