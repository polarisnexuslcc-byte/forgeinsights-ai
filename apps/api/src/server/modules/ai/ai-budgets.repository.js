import crypto from 'crypto';
import { db } from '../../db/index.js';

export function getOrganizationBudget(organizationId) {
  return db.prepare(`
    SELECT
      id,
      organization_id as organizationId,
      scope_type as scopeType,
      scope_id as scopeId,
      monthly_budget_usd as monthlyBudgetUsd,
      soft_limit_percent as softLimitPercent,
      hard_limit_percent as hardLimitPercent,
      created_at as createdAt,
      updated_at as updatedAt
    FROM ai_budgets
    WHERE organization_id = ?
      AND scope_type = 'organization'
    LIMIT 1
  `).get(organizationId);
}

export function upsertOrganizationBudget({
  organizationId,
  monthlyBudgetUsd,
  softLimitPercent = 0.8,
  hardLimitPercent = 1.0
}) {
  const existing = getOrganizationBudget(organizationId);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE ai_budgets
      SET
        monthly_budget_usd = ?,
        soft_limit_percent = ?,
        hard_limit_percent = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      monthlyBudgetUsd,
      softLimitPercent,
      hardLimitPercent,
      now,
      existing.id
    );

    return getOrganizationBudget(organizationId);
  }

  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO ai_budgets (
      id,
      organization_id,
      scope_type,
      scope_id,
      monthly_budget_usd,
      soft_limit_percent,
      hard_limit_percent,
      created_at,
      updated_at
    )
    VALUES (?, ?, 'organization', NULL, ?, ?, ?, ?, ?)
  `).run(
    id,
    organizationId,
    monthlyBudgetUsd,
    softLimitPercent,
    hardLimitPercent,
    now,
    now
  );

  return getOrganizationBudget(organizationId);
}
