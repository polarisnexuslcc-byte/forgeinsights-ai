import { ok } from '../../utils/response.js';
import { getAIAdminData } from './ai-admin.service.js';

export function getAIAdminHandler(req, res) {
  const item = getAIAdminData({
    organizationId: req.auth.organizationId
  });

  return ok(res, { item });
}
