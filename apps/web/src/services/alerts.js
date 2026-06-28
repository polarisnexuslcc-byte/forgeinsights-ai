import { apiFetch } from '../lib/api';

export async function listAlerts() {
  return apiFetch('/alerts', { method: 'GET' });
}
