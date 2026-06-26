export function validateCreateSourceInput(body) {
  const organizationId = String(body?.organizationId || '').trim();
  const key = String(body?.key || '').trim();
  const name = String(body?.name || '').trim();
  const category = String(body?.category || '').trim();
  const provider = String(body?.provider || '').trim();
  const syncMode = body?.syncMode ? String(body.syncMode).trim() : 'manual';

  if (!organizationId) {
    return { error: 'organizationId is required' };
  }

  if (!key) {
    return { error: 'key is required' };
  }

  if (!name) {
    return { error: 'name is required' };
  }

  if (!category) {
    return { error: 'category is required' };
  }

  if (!provider) {
    return { error: 'provider is required' };
  }

  return {
    value: {
      organizationId,
      key,
      name,
      category,
      provider,
      syncMode
    }
  };
}

export function validateConnectSourceInput(body) {
  const credentialType = String(body?.credentialType || '').trim();
  const payload = body?.payload ?? null;

  if (!credentialType) {
    return { error: 'credentialType is required' };
  }

  if (!payload) {
    return { error: 'payload is required' };
  }

  return {
    value: {
      credentialType,
      payload
    }
  };
}
