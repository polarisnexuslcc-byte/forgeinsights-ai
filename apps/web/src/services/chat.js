import { apiFetch } from '../lib/api';

export async function sendChatQuery(input) {
  return apiFetch('/query', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
