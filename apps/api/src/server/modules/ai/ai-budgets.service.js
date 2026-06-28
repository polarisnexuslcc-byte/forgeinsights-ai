import { db } from '../../db/index.js';
import { getOrganizationBudget } from './ai-budgets.repository.js';

function getMonthStartUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function getOrganizationBudgetStatus(organizationId) {
  const budget = getOrganizationBudget(organizationId);

  if (!budget) {
    return {
      hasBudget: false,
      spentUsd: 0,
      ratio: 0,
      state: 'no-budget'
    };
  }

  const row = db.prepare(`
    SELECT COALESCE(SUM(estimated_cost_usd), 0) as spentUsd
    FROM rag_runs
    WHERE organization_id = ?
      AND created_at >= ?
  `).get(organizationId, getMonthStartUtc());

  const spentUsd = Number(row?.spentUsd || 0);
  const ratio = budget.monthlyBudgetUsd > 0 ? spentUsd / budget.monthlyBudgetUsd : 0;

  let state = 'ok';
  if (ratio >= budget.hardLimitPercent) {
    state = 'hard-limit';
  } else if (ratio >= budget.softLimitPercent) {
    state = 'soft-limit';
  }

  return {
    hasBudget: true,
    monthlyBudgetUsd: budget.monthlyBudgetUsd,
    spentUsd,
    ratio,
    softLimitPercent: budget.softLimitPercent,
    hardLimitPercent: budget.hardLimitPercent,
    state
  };
}
