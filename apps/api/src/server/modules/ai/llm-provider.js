/**
 * LLM Provider Adapter
 * Supports OpenAI-compatible APIs and a deterministic fallback for dev/demo.
 * Set env vars to enable a real provider:
 *   LLM_PROVIDER=openai  LLM_API_KEY=sk-...  LLM_MODEL=gpt-4o-mini
 *   LLM_BASE_URL=https://api.openai.com/v1  (optional, for Azure or proxies)
 */

const PROVIDER = process.env.LLM_PROVIDER || 'stub';
const API_KEY = process.env.LLM_API_KEY || '';
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '1024', 10);
const TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.2');

function buildSystemPrompt(contextChunks) {
  const context = contextChunks.map((c, i) => {
    const label = '[' + (i + 1) + ']';
    const source = c.documentTitle || c.documentId || 'source';
    const page = c.pageLabel ? ' p.' + c.pageLabel : '';
    return label + ' ' + source + page + '\n' + c.content;
  }).join('\n\n');

  return 'You are a precise enterprise knowledge assistant. ' +
    'Answer ONLY based on the provided context. ' +
    'Cite sources inline using [1], [2], etc. matching the numbered context blocks. ' +
    'If the context does not contain the answer, say so clearly.\n\n' +
    'Context:\n' + context;
}

async function* streamOpenAI(messages) {
  const body = {
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true
  };

  const response = await fetch(BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('LLM provider error ' + response.status + ': ' + errText.slice(0, 200));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
        if (delta && delta.content) {
          yield delta.content;
        }
      } catch (_) {}
    }
  }
}

function* streamStub(question, contextChunks) {
  const hasChunks = contextChunks && contextChunks.length > 0;
  if (!hasChunks) {
    const words = ('No relevant documents were found to answer your question. ' +
      'Please upload and process documents first, then try again.').split(' ');
    for (const word of words) {
      yield word + ' ';
    }
    return;
  }

  const intro = 'Based on the available documentation';
  const parts = intro.split('');
  for (const ch of parts) yield ch;
  yield ' [1]';

  const mid = ', the following information is relevant to your query about ' + question.slice(0, 40) + ': ';
  for (const ch of mid) yield ch;

  const excerpt = contextChunks[0].content.slice(0, 120).replace(/\n/g, ' ');
  for (const ch of excerpt) yield ch;
  yield '...';

  if (contextChunks.length > 1) {
    const more = ' Additional context [2] confirms this finding.';
    for (const ch of more) yield ch;
  }
}

export async function streamAnswerFromProvider({ question, contextChunks, history }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(contextChunks) }
  ];

  if (Array.isArray(history)) {
    for (const turn of history.slice(-6)) {
      if (turn.role && turn.content) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
  }

  messages.push({ role: 'user', content: question });

  if (PROVIDER === 'openai' && API_KEY) {
    return streamOpenAI(messages);
  }

  return (function*() { yield* streamStub(question, contextChunks); })();
}

export async function completeFromProvider({ question, contextChunks, history }) {
  const tokens = [];
  for await (const token of await streamAnswerFromProvider({ question, contextChunks, history })) {
    tokens.push(token);
  }
  return tokens.join('');
}
