import { created, fail, ok } from '../../server/utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import {
  createOrganization,
  getOrganizationById,
  listOrganizations
} from './organizations.repository.js';
import { validateCreateOrganizationInput } from './organizations.validators.js';

export function listOrganizationsHandler(_req, res) {
  const items = listOrganizations();
  return ok(res, { items });
}

export function getOrganizationHandler(req, res) {
  const item = getOrganizationById(req.params.id);

  if (!item) {
    return fail(res, 404, 'Organization not found');
  }

  return ok(res, { item });
}

export function createOrganizationHandler(req, res) {
  const parsed = validateCreateOrganizationInput(req.body);

  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }

  try {
    const item = createOrganization(parsed.value);

    writeAuditLog({
      organizationId: item.id,
      eventType: 'organization.created',
      entityType: 'organization',
      entityId: item.id,
      message: `Organization created: ${item.name}`,
      metadata: {
        slug: item.slug
      },
      req
    });

    return created(res, { item });
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return fail(res, 409, 'Organization slug already exists');
    }

    throw error;
  }
}
