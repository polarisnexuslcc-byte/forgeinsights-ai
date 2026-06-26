# Database Package

Database schema, migrations, and seed data for ForgeInsights AI.

## Scope in Phase 1

- users
- organizations
- memberships
- sources
- source_credentials
- sync_jobs
- documents
- document_versions
- uploaded_files
- audit_logs

## Notes

The initial implementation uses SQLite for fast iteration. Later phases can migrate to PostgreSQL without changing the core platform model.
