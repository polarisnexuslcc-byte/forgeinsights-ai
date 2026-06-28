import { apiFetch } from '../lib/api';

export async function getDashboardSummary() {
  return apiFetch('/dashboards/summary', { method: 'GET' });
}
