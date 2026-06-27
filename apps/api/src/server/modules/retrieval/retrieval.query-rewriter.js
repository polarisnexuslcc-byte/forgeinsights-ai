import { env } from '../../config/env.js';
import { openai } from '../../lib/openai.js';

function shouldRewriteQuery(query) {
  const normalized = String(query || '').trim();

  if (!normalized) return false;
  if (normalized.length < 8) return false;
  if (normalized.split(/\s+/).length >= 14) return false;

  return true;
}

export async function maybeRewriteQuery(query) {
  const originalQuery = String(query || '').trim();

  if (!env.RETRIEVAL_ENABLE_QUERY_REWRITE || !openai || !shouldRewriteQuery(originalQuery)) {
    return {
      originalQuery,
      rewrittenQuery: null,
      usedRewrite: false
    };
  }

  const prompt = [
    'Rewrite the user query only to improve retrieval.',
    'Preserve the exact intent.',
    'Do not answer the question.',
    'Do not add facts, names, versions, dates, or entities not present in the query.',
    'Expand abbreviations only if obviously implied by the wording.',
    'Return a single rewritten search query as plain text.',
    '',
    `USER QUERY: ${originalQuery}`
  ].join('\n');

  const completion = await openai.responses.create({
    model: env.RETRIEVAL_REWRITE_MODEL,
    temperature: 0,
    input: prompt
  });

  const rewrittenQuery = String(completion.output_text || '').trim();

  if (!rewrittenQuery || rewrittenQuery.toLowerCase() === originalQuery.toLowerCase()) {
    return {
      originalQuery,
      rewrittenQuery: null,
      usedRewrite: false
    };
  }

  return {
    originalQuery,
    rewrittenQuery,
    usedRewrite: true
  };
}
