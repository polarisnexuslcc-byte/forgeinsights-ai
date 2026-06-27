import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { getDashboardHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, getDashboardHandler);
