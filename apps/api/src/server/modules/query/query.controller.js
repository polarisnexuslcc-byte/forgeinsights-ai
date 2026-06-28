import { ok, fail } from '../../lib/http.js';
import { answerQuery } from './query.service.js';

export async function queryHandler(req, res, next) {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return fail(res, 400, 'Question is required');
    }

    const result = await answerQuery({
      organizationId: req.auth.organizationId,
      question
    });

    return ok(res, { item: result });
  } catch (error) {
    next(error);
  }
}
