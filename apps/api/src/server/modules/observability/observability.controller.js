import { ok } from '../../utils/response.js';
import { listRecentRagRunsByOrganization } from './rag-runs.repository.js';
import { getObservabilitySummary } from './alerts.service.js';

export function listRagRunsHandler(req, res) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const items = listRecentRagRunsByOrganization(req.auth.organizationId, limit);
  return ok(res, { items });
}

export function observabilitySummaryHandler(req, res) {
  const item = getObservabilitySummary({
    organizationId: req.auth.organizationId
  });

  return ok(res, { item });
}
