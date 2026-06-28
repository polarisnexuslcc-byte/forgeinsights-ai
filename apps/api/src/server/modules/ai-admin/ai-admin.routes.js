import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { getAIAdminHandler } from './ai-admin.controller.js';

export const aiAdminRouter = Router();

aiAdminRouter.get('/', requireAuth, getAIAdminHandler);
