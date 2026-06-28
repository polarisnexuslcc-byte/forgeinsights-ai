import { apiFetch } from '../lib/api';

export async function createDocument(input) {
  return apiFetch('/documents', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function uploadDocumentFile(documentId, file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch('/documents/' + documentId + '/upload', {
    method: 'POST',
    body: formData
  });
}

export async function ingestDocument(documentId) {
  return apiFetch('/documents/' + documentId + '/ingest', {
    method: 'POST'
  });
}

export async function getDocument(documentId) {
  return apiFetch('/documents/' + documentId, { method: 'GET' });
}
