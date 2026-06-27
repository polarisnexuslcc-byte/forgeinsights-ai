import crypto from 'crypto';
import { db } from '../../db/index.js';

export function createRagRun(data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO rag_runs (
      id,
      organization_id,
      user_id,
      route,
      question,
      retrieval_query,
      rewritten_query,
      used_rewrite,
      use_hybrid,
      use_reranking,
      retrieval_count,
      citation_count,
      grounded,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      estimated_cost_usd,
      total_latency_ms,
      retrieval_latency_ms,
      semantic_latency_ms,
      generation_latency_ms,
      error,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.userId || null,
    data.route,
    data.question || null,
    data.retrievalQuery || null,
    data.rewrittenQuery || null,
    data.usedRewrite ? 1 : 0,
    data.useHybrid ? 1 : 0,
    data.useReranking ? 1 : 0,
    data.retrievalCount || 0,
    data.citationCount || 0,
    data.grounded ? 1 : 0,
    data.promptTokens || 0,
    data.completionTokens || 0,
    data.totalTokens || 0,
    data.estimatedCostUsd || 0,
    data.totalLatencyMs || 0,
    data.retrievalLatencyMs || 0,
    data.semanticLatencyMs || 0,
    data.generationLatencyMs || 0,
    data.error ? 1 : 0,
    data.status || 'success',
    now
  );

  return id;
}

export function listRecentRagRunsByOrganization(organizationId, limit = 50) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      user_id as userId,
      route,
      question,
      retrieval_query as retrievalQuery,
      rewritten_query as rewrittenQuery,
      used_rewrite as usedRewrite,
      use_hybrid as useHybrid,
      use_reranking as useReranking,
      retrieval_count as retrievalCount,
      citation_count as citationCount,
      grounded,
      prompt_tokens as promptTokens,
      completion_tokens as completionTokens,
      total_tokens as totalTokens,
      estimated_cost_usd as estimatedCostUsd,
      total_latency_ms as totalLatencyMs,
      retrieval_latency_ms as retrievalLatencyMs,
      semantic_latency_ms as semanticLatencyMs,
      generation_latency_ms as generationLatencyMs,
      error,
      status,
      created_at as createdAt
    FROM rag_runs
    WHERE organization_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(organizationId, limit);
}

export function listRagRunsSince(organizationId, sinceIso) {
  return db.prepare(`
    SELECT
      id,
      total_latency_ms as totalLatencyMs,
      retrieval_latency_ms as retrievalLatencyMs,
      semantic_latency_ms as semanticLatencyMs,
      generation_latency_ms as generationLatencyMs,
      estimated_cost_usd as estimatedCostUsd,
      total_tokens as totalTokens,
      grounded,
      error,
      status,
      created_at as createdAt
    FROM rag_runs
    WHERE organization_id = ?
      AND created_at >= ?
    ORDER BY created_at ASC
  `).all(organizationId, sinceIso);
}
