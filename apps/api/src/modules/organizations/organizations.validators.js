export function validateCreateOrganizationInput(body) {
  const name = String(body?.name || '').trim();
  const slug = String(body?.slug || '').trim();
  const industry = body?.industry ? String(body.industry).trim() : null;
  const sizeBand = body?.sizeBand ? String(body.sizeBand).trim() : null;

  if (!name) {
    return { error: 'Name is required' };
  }

  if (!slug) {
    return { error: 'Slug is required' };
  }

  return {
    value: {
      name,
      slug,
      industry,
      sizeBand
    }
  };
}
