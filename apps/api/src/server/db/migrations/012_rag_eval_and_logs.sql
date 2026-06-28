CREATE TABLE IF NOT EXISTS rag_eval_cases (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  question TEXT NOT NULL,
  expected_document_id TEXT,
  expected_answer_contains TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rag_eval_runs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  answer_text TEXT,
  retrieved_document_ids_json TEXT,
  retrieved_chunk_ids_json TEXT,
  citation_count INTEGER NOT NULL DEFAULT 0,
  hit_expected_document INTEGER NOT NULL DEFAULT 0,
  answer_contains_expected INTEGER NOT NULL DEFAULT 0,
  recall_at_k REAL,
  mrr REAL,
  latency_ms REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rag_query_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT,
  question TEXT NOT NULL,
  answer_preview TEXT,
  retrieved_chunk_ids_json TEXT,
  retrieved_document_ids_json TEXT,
  citations_json TEXT,
  retrieval_count INTEGER NOT NULL DEFAULT 0,
  latency_ms REAL,
  retrieval_latency_ms REAL,
  generation_latency_ms REAL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_eval_cases_org_id ON rag_eval_cases(organization_id);

CREATE INDEX IF NOT EXISTS idx_rag_eval_runs_org_id ON rag_eval_runs(organization_id);

CREATE INDEX IF NOT EXISTS idx_rag_query_logs_org_id ON rag_query_logs(organization_id);
