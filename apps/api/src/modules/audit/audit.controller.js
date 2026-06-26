import { fail, ok } from '../../server/utils/response.js';
import { listAuditLogsByOrganization } from './audit.repository.js';

export function listAuditLogsHandler(req, res) {
  const organizationId = String(req.query.organizationId || '').trim();
  const limit = Number(req.query.limit || 100);

  if (!organizationId) {
    return fail(res, 400, 'organizationId query param is required');
  }

  const items = listAuditLogsByOrganization(organizationId, Math.min(limit, 200));

  return ok(res, { items });
}
