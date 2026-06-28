CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_version_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  section_label TEXT,
  page_label TEXT,
  lexical_text TEXT,
  embedding_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_org_id ON document_chunks(organization_id);
