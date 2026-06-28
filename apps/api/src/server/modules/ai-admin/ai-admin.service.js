import { db } from '../../db/index.js';
import { env } from '../../config/env.js';
import { getOrganizationBudgetStatus } from '../ai/ai-budgets.service.js';

function getGatewayOverview(organizationId) {
  const last24h = db.prepare(`
    SELECT
      COUNT(*) as totalRuns,
      AVG(total_latency_ms) as avgLatencyMs,
      SUM(estimated_cost_usd) as totalCostUsd,
      SUM(total_tokens) as totalTokens
    FROM rag_runs
    WHERE organization_id = ?
      AND created_at >= datetime('now', '-24 hours')
  `).get(organizationId);

  return {
    mode: env.AI_GATEWAY_MODE,
    provider: env.AI_PROVIDER,
    embeddingProvider: env.AI_EMBEDDING_PROVIDER,
    chatModel: env.LITELLM_CHAT_MODEL || env.AI_CHAT_MODEL,
    embeddingModel: env.LITELLM_EMBEDDING_MODEL || env.AI_EMBEDDING_MODEL,
    totalRuns24h: last24h?.totalRuns || 0,
    avgLatencyMs24h: Math.round(last24h?.avgLatencyMs || 0),
    totalCostUsd24h: Number((last24h?.totalCostUsd || 0).toFixed(6)),
    totalTokens24h: last24h?.totalTokens || 0
  };
}

function getRecentGatewayTraces(organizationId) {
  return db.prepare(`
    SELECT
      id,
      question,
      status,
      provider,
      model,
      total_latency_ms as totalLatencyMs,
      retrieval_latency_ms as retrievalLatencyMs,
      generation_latency_ms as generationLatencyMs,
      estimated_cost_usd as estimatedCostUsd,
      total_tokens as totalTokens,
      created_at as createdAt
    FROM rag_runs
    WHERE organization_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(organizationId);
}

function getProviderBreakdown(organizationId) {
  return db.prepare(`
    SELECT
      provider,
      model,
      COUNT(*) as runCount,
      AVG(total_latency_ms) as avgLatencyMs,
      SUM(estimated_cost_usd) as totalCostUsd,
      SUM(total_tokens) as totalTokens
    FROM rag_runs
    WHERE organization_id = ?
      AND created_at >= datetime('now', '-30 days')
    GROUP BY provider, model
    ORDER BY runCount DESC, totalCostUsd DESC
  `).all(organizationId);
}

function getBudgetAlerts(organizationId) {
  const status = getOrganizationBudgetStatus(organizationId);
  const alerts = [];

  if (!status.hasBudget) {
    alerts.push({
      level: 'warning',
      message: 'No AI budget configured for this organization'
    });
    return { status, alerts };
  }

  if (status.state === 'hard-limit') {
    alerts.push({
      level: 'critical',
      message: 'Monthly AI budget hard limit reached'
    });
  } else if (status.state === 'soft-limit') {
    alerts.push({
      level: 'warning',
      message: 'Monthly AI budget soft limit exceeded'
    });
  }

  return { status, alerts };
}

export function getAIAdminData({ organizationId }) {
  const gateway = getGatewayOverview(organizationId);
  const traces = getRecentGatewayTraces(organizationId);
  const providers = getProviderBreakdown(organizationId);
  const budget = getBudgetAlerts(organizationId);

  return {
    generatedAt: new Date().toISOString(),
    gateway,
    budget,
    providers,
    traces
  };
}
