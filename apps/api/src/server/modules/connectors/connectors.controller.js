import { fail, ok } from '../../utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  createConnector,
  getConnectorById,
  listConnectorsByOrganization,
  listConnectorSyncRuns
} from './connectors.repository.js';
import { runConnectorSync } from './connectors.sync-service.js';

export function listConnectorsHandler(req, res) {
  const items = listConnectorsByOrganization(req.auth.organizationId);
  return ok(res, { items });
}

export function createConnectorHandler(req, res) {
  const type = String(req.body?.type || '').trim();
  const name = String(req.body?.name || '').trim();
  const config = req.body?.config || {};

  if (!type || !name) {
    return fail(res, 400, 'type and name are required');
  }

  const item = createConnector({
    organizationId: req.auth.organizationId,
    type,
    name,
    config
  });

  writeAuditLog({
    organizationId: req.auth.organizationId,
    userId: req.auth.userId,
    action: 'connector.created',
    resourceType: 'connector',
    resourceId: item.id,
    metadata: { type, name }
  });

  return ok(res, { item });
}

export async function syncConnectorHandler(req, res, next) {
  try {
    const connector = getConnectorById(req.params.id, req.auth.organizationId);

    if (!connector) {
      return fail(res, 404, 'Connector not found');
    }

    const result = await runConnectorSync({
      connector,
      organizationId: req.auth.organizationId,
      userId: req.auth.userId
    });

    writeAuditLog({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      action: 'connector.synced',
      resourceType: 'connector',
      resourceId: connector.id,
      metadata: result
    });

    return ok(res, { item: result });
  } catch (error) {
    next(error);
  }
}

export function listConnectorRunsHandler(req, res) {
  const connector = getConnectorById(req.params.id, req.auth.organizationId);

  if (!connector) {
    return fail(res, 404, 'Connector not found');
  }

  const items = listConnectorSyncRuns(connector.id, req.auth.organizationId);
  return ok(res, { items });
}
