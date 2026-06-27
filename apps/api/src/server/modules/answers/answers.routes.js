import { Router } from 'express';
import { askAnswerHandler } from './answers.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';

export const answersRouter = Router();

answersRouter.post('/ask', requireAuth, askAnswerHandler);
