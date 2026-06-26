import { Router } from 'express';
import { listAuditLogsHandler } from './audit.controller.js';
import { requireAuth } from '../../server/middleware/require-auth.js';

export const auditRouter = Router();

auditRouter.get('/', requireAuth, listAuditLogsHandler);
