import { ok } from '../../server/utils/response.js';
import { listAuditLogsByOrganization } from './audit.repository.js';

export function listAuditLogsHandler(req, res) {
  const organizationId = req.auth.organizationId;
  const limit = Number(req.query.limit || 100);
  const items = listAuditLogsByOrganization(organizationId, Math.min(limit, 200));

  return ok(res, { items });
}
