import { created, fail, ok } from '../../server/utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  connectSource,
  createManualSyncJob,
  createSource,
  getSourceById,
  listSources,
  organizationExists
} from './sources.repository.js';
import {
  validateConnectSourceInput,
  validateCreateSourceInput
} from './sources.validators.js';

export function listSourcesHandler(_req, res) {
  const items = listSources();
  return ok(res, { items });
}

export function getSourceHandler(req, res) {
  const item = getSourceById(req.params.id);

  if (!item) {
    return fail(res, 404, 'Source not found');
  }

  return ok(res, { item });
}

export function createSourceHandler(req, res) {
  const parsed = validateCreateSourceInput(req.body);

  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }

  if (!organizationExists(parsed.value.organizationId)) {
    return fail(res, 404, 'Organization not found');
  }

  try {
    const item = createSource(parsed.value);

    writeAuditLog({
      organizationId: item.organizationId,
      sourceId: item.id,
      eventType: 'source.created',
      entityType: 'source',
      entityId: item.id,
      message: `Source created: ${item.name}`,
      metadata: {
        provider: item.provider,
        category: item.category
      },
      req
    });

    return created(res, { item });
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return fail(res, 409, 'Source key already exists for this organization');
    }

    throw error;
  }
}

export function connectSourceHandler(req, res) {
  const source = getSourceById(req.params.id);

  if (!source) {
    return fail(res, 404, 'Source not found');
  }

  const parsed = validateConnectSourceInput(req.body);

  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }

  const item = connectSource(
    req.params.id,
    parsed.value.credentialType,
    parsed.value.payload
  );

  writeAuditLog({
    organizationId: item.organizationId,
    sourceId: item.id,
    eventType: 'source.connected',
    entityType: 'source',
    entityId: item.id,
    message: `Source connected: ${item.name}`,
    metadata: {
      credentialType: parsed.value.credentialType
    },
    req
  });

  return ok(res, { item });
}

export function syncSourceHandler(req, res) {
  const source = getSourceById(req.params.id);

  if (!source) {
    return fail(res, 404, 'Source not found');
  }

  const job = createManualSyncJob(source.id, source.organizationId);

  writeAuditLog({
    organizationId: source.organizationId,
    sourceId: source.id,
    eventType: 'source.sync_requested',
    entityType: 'sync_job',
    entityId: job.id,
    message: `Manual sync requested for source: ${source.name}`,
    metadata: {
      jobType: job.jobType,
      sourceId: source.id
    },
    req
  });

  return created(res, {
    job
  });
}

export function sourceStatusHandler(req, res) {
  const item = getSourceById(req.params.id);

  if (!item) {
    return fail(res, 404, 'Source not found');
  }

  return ok(res, {
    item: {
      id: item.id,
      status: item.status,
      lastSyncedAt: item.lastSyncedAt
    }
  });
}
