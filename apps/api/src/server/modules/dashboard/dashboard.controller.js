import { ok } from '../../utils/response.js';
import { getDashboardData } from './dashboard.service.js';

export function getDashboardHandler(req, res) {
  const item = getDashboardData({
    organizationId: req.auth.organizationId
  });

  return ok(res, { item });
}
