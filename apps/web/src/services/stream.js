const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Stream a query to the backend SSE endpoint.
 * onEvent({ event, data }) is called for each SSE event.
 * Returns a cancel function.
 */
export function streamQuery(input, { onEvent, onError }) {
  const token = localStorage.getItem('auth_token') || '';
  const controller = new AbortController();

  const run = async () => {
    let response;
    try {
      response = await fetch(API_BASE_URL + '/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(input),
        signal: controller.signal
      });
    } catch (e) {
      if (e.name !== 'AbortError') {
        onError && onError(e.message || 'Network error');
      }
      return;
    }

    if (!response.ok) {
      let msg = 'Server error ' + response.status;
      try {
        const j = await response.json();
        msg = j.error || msg;
      } catch (_) {}
      onError && onError(msg);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      let result;
      try {
        result = await reader.read();
      } catch (e) {
        if (e.name !== 'AbortError') {
          onError && onError('Stream interrupted');
        }
        break;
      }

      if (result.done) break;

      buffer += decoder.decode(result.value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        const eventLine = lines.find(l => l.startsWith('event:'));
        const dataLine = lines.find(l => l.startsWith('data:'));
        if (!eventLine || !dataLine) continue;
        const event = eventLine.replace('event:', '').trim();
        let data = null;
        try {
          data = JSON.parse(dataLine.replace('data:', '').trim());
        } catch (_) { continue; }
        onEvent({ event, data });
      }
    }
  };

  run();

  return () => controller.abort();
}

export async function getInternalOverview() {
  const token = localStorage.getItem('auth_token') || '';
  const res = await fetch(API_BASE_URL + '/internal/overview', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Failed to load internal overview');
  const j = await res.json();
  return j.data && j.data.item ? j.data.item : j;
}

export async function runInternalEvals() {
  const token = localStorage.getItem('auth_token') || '';
  const res = await fetch(API_BASE_URL + '/internal/evals/run', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Eval run failed');
  const j = await res.json();
  return j.data && j.data.item ? j.data.item : j;
}
