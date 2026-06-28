import { apiFetch } from '../lib/api';

export async function getOverview() {
  return apiFetch('/overview', { method: 'GET' });
}
