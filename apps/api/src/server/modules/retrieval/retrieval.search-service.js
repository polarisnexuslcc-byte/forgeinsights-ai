import { env } from '../../config/env.js';
import { withTimeout } from '../../utils/async.js';
import { maybeRewriteQuery } from './retrieval.query-rewriter.js';
import { searchChunks } from './retrieval.repository.js';
import { applyPerDocumentCap, rerankWithDiversity } from './retrieval.rerank.js';
import { searchSemanticChunks } from './retrieval.semantic.js';
import { reciprocalRankFusion } from './retrieval.hybrid.js';

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
  useReranking = env.RETRIEVAL_ENABLE_DIVERSITY_RERANK,
  useHybrid = env.HYBRID_ENABLE_SEMANTIC
}) {
  const retrievalStartedAt = performance.now();

  const rewrite = await maybeRewriteQuery(query);

  const lexicalOriginal = searchChunks({
    organizationId,
    query: rewrite.originalQuery,
    limit: env.RETRIEVAL_MAX_CANDIDATES,
    documentId,
    sourceId
  });

  const lexicalRewrite = rewrite.usedRewrite
    ? searchChunks({
        organizationId,
        query: rewrite.rewrittenQuery,
        limit: env.RETRIEVAL_MAX_CANDIDATES,
        documentId,
        sourceId
      })
    : [];

  const lexicalMerged = dedupeChunks(
    [...lexicalOriginal, ...lexicalRewrite].sort((a, b) => a.score - b.score)
  );

  let semantic = {
    items: [],
    embeddingLatencyMs: 0,
    rankingLatencyMs: 0
  };

  let degradedToLexical = false;
  let degradationReason = null;

  if (useHybrid) {
    try {
      semantic = await withTimeout(
        searchSemanticChunks({
          organizationId,
          query: rewrite.rewrittenQuery || rewrite.originalQuery,
          limit: env.HYBRID_SEMANTIC_CANDIDATES,
          documentId,
          sourceId
        }),
        env.RETRIEVAL_SEMANTIC_TIMEOUT_MS,
        'Semantic retrieval timed out'
      );
    } catch (error) {
      if (env.RETRIEVAL_FORCE_LEXICAL_ON_TIMEOUT) {
        degradedToLexical = true;
        degradationReason = error.message || 'Semantic retrieval failed';
      } else {
        throw error;
      }
    }
  }

  const hybrid = useHybrid && !degradedToLexical
    ? reciprocalRankFusion([lexicalMerged, semantic.items], env.RETRIEVAL_MAX_CANDIDATES)
    : lexicalMerged.slice(0, env.RETRIEVAL_MAX_CANDIDATES);

  const capped = applyPerDocumentCap(
    hybrid,
    env.RETRIEVAL_MAX_CHUNKS_PER_DOCUMENT
  );

  const reranked = rerankWithDiversity(capped, limit, {
    enabled: useReranking
  });

  const retrievalLatencyMs = Math.round(performance.now() - retrievalStartedAt);

  return {
    query: rewrite.originalQuery,
    rewrittenQuery: rewrite.rewrittenQuery,
    usedRewrite: rewrite.usedRewrite,
    lexicalCount: lexicalMerged.length,
    semanticCount: semantic.items.length,
    useHybrid,
    useReranking,
    degradedToLexical,
    degradationReason,
    metrics: {
      retrievalLatencyMs,
      semanticEmbeddingLatencyMs: semantic.embeddingLatencyMs,
      semanticRankingLatencyMs: semantic.rankingLatencyMs,
      semanticLatencyMs: semantic.embeddingLatencyMs + semantic.rankingLatencyMs
    },
    items: reranked
  };
}
