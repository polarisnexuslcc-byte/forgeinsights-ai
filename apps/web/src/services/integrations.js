import { apiFetch } from '../lib/api';

export async function listIntegrations() {
  return apiFetch('/integrations', { method: 'GET' });
}
