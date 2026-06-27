import crypto from 'crypto';
import { env } from '../../config/env.js';

const store = new Map();

function nowMs() {
  return Date.now();
}

function normalizeQuery(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function makeKey({
  organizationId,
  question,
  documentId,
  sourceId,
  model,
  retrievalConfig
}) {
  const payload = JSON.stringify({
    organizationId,
    question: normalizeQuery(question),
    documentId: documentId || null,
    sourceId: sourceId || null,
    model,
    retrievalConfig
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

function pruneIfNeeded() {
  if (store.size <= env.CACHE_MAX_ENTRIES) return;

  const entries = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const overflow = store.size - env.CACHE_MAX_ENTRIES;

  for (let i = 0; i < overflow; i += 1) {
    store.delete(entries[i][0]);
  }
}

export function getCachedAnswer(input) {
  if (!env.CACHE_ENABLE_EXACT_QUERY) return null;

  const key = makeKey(input);
  const item = store.get(key);

  if (!item) return null;

  if (item.expiresAt <= nowMs()) {
    store.delete(key);
    return null;
  }

  return item.value;
}

export function setCachedAnswer(input, value) {
  if (!env.CACHE_ENABLE_EXACT_QUERY) return;

  const key = makeKey(input);

  store.set(key, {
    value,
    createdAt: nowMs(),
    expiresAt: nowMs() + env.CACHE_TTL_SECONDS * 1000
  });

  pruneIfNeeded();
}
