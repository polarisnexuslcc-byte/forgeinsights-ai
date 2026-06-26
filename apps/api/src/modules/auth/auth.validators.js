export function validateRegisterInput(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const fullName = body?.fullName ? String(body.fullName).trim() : null;
  const organizationId = body?.organizationId ? String(body.organizationId).trim() : null;

  if (!email) {
    return { error: 'email is required' };
  }

  if (!password || password.length < 8) {
    return { error: 'password must be at least 8 characters' };
  }

  return {
    value: {
      email,
      password,
      fullName,
      organizationId
    }
  };
}

export function validateLoginInput(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email) {
    return { error: 'email is required' };
  }

  if (!password) {
    return { error: 'password is required' };
  }

  return {
    value: {
      email,
      password
    }
  };
}
