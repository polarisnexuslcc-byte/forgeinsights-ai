import { Router } from 'express';
import {
  createOrganizationHandler,
  getOrganizationHandler,
  listOrganizationsHandler
} from './organizations.controller.js';

export const organizationsRouter = Router();

organizationsRouter.get('/', listOrganizationsHandler);
organizationsRouter.get('/:id', getOrganizationHandler);
organizationsRouter.post('/', createOrganizationHandler);
