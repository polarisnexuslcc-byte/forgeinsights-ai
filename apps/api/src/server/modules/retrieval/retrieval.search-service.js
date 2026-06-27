import { env } from '../../config/env.js';
import { maybeRewriteQuery } from './retrieval.query-rewriter.js';
import { searchChunks } from './retrieval.repository.js';

function dedupeChunks(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

export async function runRetrievalSearch({
  organizationId,
  query,
  limit = 5,
  documentId = null,
  sourceId = null
}) {
  const rewrite = await maybeRewriteQuery(query);

  const originalResults = searchChunks({
    organizationId,
    query: rewrite.originalQuery,
    limit: env.RETRIEVAL_MAX_CANDIDATES,
    documentId,
    sourceId
  });

  const rewrittenResults = rewrite.usedRewrite
    ? searchChunks({
        organizationId,
        query: rewrite.rewrittenQuery,
        limit: env.RETRIEVAL_MAX_CANDIDATES,
        documentId,
        sourceId
      })
    : [];

  const merged = dedupeChunks(
    [...originalResults, ...rewrittenResults].sort((a, b) => a.score - b.score)
  ).slice(0, limit);

  return {
    query: rewrite.originalQuery,
    rewrittenQuery: rewrite.rewrittenQuery,
    usedRewrite: rewrite.usedRewrite,
    items: merged
  };
}
