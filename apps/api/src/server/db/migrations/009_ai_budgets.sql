CREATE TABLE IF NOT EXISTS ai_budgets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_id TEXT,
  monthly_budget_usd REAL NOT NULL,
  soft_limit_percent REAL NOT NULL DEFAULT 0.8,
  hard_limit_percent REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_budgets_org
  ON ai_budgets(organization_id);
