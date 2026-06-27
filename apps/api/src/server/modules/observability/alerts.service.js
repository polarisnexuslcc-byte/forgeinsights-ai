import { env } from '../../config/env.js';
import { listRagRunsSince } from './rag-runs.repository.js';

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getObservabilitySummary({ organizationId }) {
  const since = new Date(
    Date.now() - env.ALERT_REGRESSION_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const runs = listRagRunsSince(organizationId, since);

  const totalLatencies = runs.map((run) => run.totalLatencyMs).filter(Number.isFinite);
  const costs = runs.map((run) => run.estimatedCostUsd).filter(Number.isFinite);
  const errors = runs.filter((run) => run.error);
  const groundedRuns = runs.filter((run) => run.grounded);

  const summary = {
    windowHours: env.ALERT_REGRESSION_WINDOW_HOURS,
    runCount: runs.length,
    since,
    metrics: {
      avgLatencyMs: Math.round(average(totalLatencies)),
      p95LatencyMs: Math.round(percentile(totalLatencies, 95)),
      avgCostUsd: Number(average(costs).toFixed(6)),
      errorRate: runs.length ? Number((errors.length / runs.length).toFixed(4)) : 0,
      groundedRate: runs.length
        ? Number((groundedRuns.length / runs.length).toFixed(4))
        : 0
    },
    alerts: []
  };

  if (runs.length < env.ALERT_MIN_RUNS) {
    summary.alerts.push({
      type: 'insufficient_data',
      level: 'info',
      message: `Only ${runs.length} runs in window; need ${env.ALERT_MIN_RUNS} for reliable alerts`
    });

    return summary;
  }

  if (summary.metrics.p95LatencyMs > env.ALERT_P95_LATENCY_MS) {
    summary.alerts.push({
      type: 'latency_p95',
      level: 'warning',
      threshold: env.ALERT_P95_LATENCY_MS,
      actual: summary.metrics.p95LatencyMs,
      message: 'P95 latency is above threshold'
    });
  }

  if (summary.metrics.avgCostUsd > env.ALERT_AVG_COST_USD) {
    summary.alerts.push({
      type: 'avg_cost',
      level: 'warning',
      threshold: env.ALERT_AVG_COST_USD,
      actual: summary.metrics.avgCostUsd,
      message: 'Average cost per query is above threshold'
    });
  }

  if (summary.metrics.errorRate > env.ALERT_ERROR_RATE) {
    summary.alerts.push({
      type: 'error_rate',
      level: 'critical',
      threshold: env.ALERT_ERROR_RATE,
      actual: summary.metrics.errorRate,
      message: 'Error rate is above threshold'
    });
  }

  return summary;
}
