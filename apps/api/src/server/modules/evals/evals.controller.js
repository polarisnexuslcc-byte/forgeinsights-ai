import { fail, ok } from '../../utils/response.js';
import { compareRetrievalVariants } from './retrieval.eval-service.js';

export async function compareRetrievalHandler(req, res, next) {
  try {
    const k = Math.min(Number(req.query.k || 5), 20);

    if (!req.auth.organizationId) {
      return fail(res, 400, 'organization context is required');
    }

    const result = await compareRetrievalVariants({
      organizationId: req.auth.organizationId,
      k
    });

    return ok(res, { item: result });
  } catch (error) {
    next(error);
  }
}
