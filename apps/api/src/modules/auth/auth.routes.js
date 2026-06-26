import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler
} from './auth.controller.js';
import { requireAuth } from '../../server/middleware/require-auth.js';

export const authRouter = Router();

authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.post('/logout', requireAuth, logoutHandler);
