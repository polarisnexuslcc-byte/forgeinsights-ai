import { insertAuditLog } from './audit.repository.js';

export function writeAuditLog({
  organizationId,
  userId = null,
  sourceId = null,
  eventType,
  severity = 'info',
  entityType = null,
  entityId = null,
  message,
  metadata = null,
  req = null
}) {
  return insertAuditLog({
    organizationId,
    userId,
    sourceId,
    eventType,
    severity,
    entityType,
    entityId,
    message,
    ipAddress: req?.context?.ipAddress || null,
    route: req?.context?.route || null,
    method: req?.context?.method || null,
    metadata: {
      requestId: req?.context?.requestId || null,
      ...(metadata || {})
    }
  });
}
