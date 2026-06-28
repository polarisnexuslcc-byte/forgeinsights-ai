const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiFetch(path, options = {}) {
  const token = window.localStorage.getItem('auth_token');

  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}
