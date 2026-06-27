import { db } from '../../db/index.js';
import { getObservabilitySummary } from '../observability/alerts.service.js';
import { listRecentRagRunsByOrganization } from '../observability/rag-runs.repository.js';

function getDocumentStats(organizationId) {
  const row = db.prepare(`
    SELECT
      COUNT(*) as totalDocuments,
      SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processedDocuments,
      SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as uploadedDocuments
    FROM documents
    WHERE organization_id = ?
  `).get(organizationId);

  return {
    totalDocuments: row?.totalDocuments || 0,
    processedDocuments: row?.processedDocuments || 0,
    uploadedDocuments: row?.uploadedDocuments || 0
  };
}

function getChunkStats(organizationId) {
  const row = db.prepare(`
    SELECT COUNT(*) as totalChunks
    FROM document_chunks
    WHERE organization_id = ?
  `).get(organizationId);

  return {
    totalChunks: row?.totalChunks || 0
  };
}

function getRecentUsageStats(organizationId) {
  const row = db.prepare(`
    SELECT
      COUNT(*) as totalRuns,
      SUM(total_tokens) as totalTokens,
      SUM(estimated_cost_usd) as totalCostUsd
    FROM rag_runs
    WHERE organization_id = ?
      AND created_at >= datetime('now', '-24 hours')
  `).get(organizationId);

  return {
    totalRuns24h: row?.totalRuns || 0,
    totalTokens24h: row?.totalTokens || 0,
    totalCostUsd24h: Number((row?.totalCostUsd || 0).toFixed(6))
  };
}

export function getDashboardData({ organizationId }) {
  const observability = getObservabilitySummary({ organizationId });
  const documents = getDocumentStats(organizationId);
  const chunks = getChunkStats(organizationId);
  const usage = getRecentUsageStats(organizationId);
  const recentRuns = listRecentRagRunsByOrganization(organizationId, 10);

  return {
    generatedAt: new Date().toISOString(),
    health: {
      status: observability.alerts.some((alert) => alert.level === 'critical')
        ? 'critical'
        : observability.alerts.some((alert) => alert.level === 'warning')
          ? 'warning'
          : 'healthy',
      alertCount: observability.alerts.length
    },
    documents,
    chunks,
    usage,
    observability,
    recentRuns
  };
}
