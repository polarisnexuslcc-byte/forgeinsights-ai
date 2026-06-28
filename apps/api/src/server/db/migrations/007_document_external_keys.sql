CREATE INDEX IF NOT EXISTS idx_documents_org_source_external
  ON documents(organization_id, source_id, external_id);
