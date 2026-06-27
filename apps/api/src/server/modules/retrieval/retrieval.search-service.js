import { env } from '../../config/env.js';
import { maybeRewriteQuery } from './retrieval.query-rewriter.js';
import { searchChunks } from './retrieval.repository.js';
import { applyPerDocumentCap, rerankWithDiversity } from './retrieval.rerank.js';

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
  sourceId = null,
  useReranking = env.RETRIEVAL_ENABLE_DIVERSITY_RERANK
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
  );

  const capped = applyPerDocumentCap(
    merged,
    env.RETRIEVAL_MAX_CHUNKS_PER_DOCUMENT
  );

  const reranked = rerankWithDiversity(capped, limit, {
    enabled: useReranking
  });

  return {
    query: rewrite.originalQuery,
    rewrittenQuery: rewrite.rewrittenQuery,
    usedRewrite: rewrite.usedRewrite,
    items: reranked
  };
}
