import { apiFetch } from '../lib/api';

export async function listSources() {
  return apiFetch('/sources', { method: 'GET' });
}

export async function listDocuments() {
  return apiFetch('/documents', { method: 'GET' });
}
