# API Base

## Auth
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Organizations
- GET /api/organizations
- GET /api/organizations/:id

## Sources
- GET /api/sources
- POST /api/sources
- GET /api/sources/:id
- POST /api/sources/:id/connect
- POST /api/sources/:id/sync
- GET /api/sources/:id/status

## Documents
- GET /api/documents
- POST /api/documents/upload
- GET /api/documents/:id
- POST /api/documents/:id/reindex

## Accounts / Signals / Insights
- GET /api/accounts
- GET /api/accounts/:id
- GET /api/signals
- GET /api/insights
- GET /api/actions

## Chat
- GET /api/chat/sessions
- POST /api/chat/sessions
- POST /api/chat/query
- GET /api/chat/sessions/:id/messages
- POST /api/chat/sessions/:id/messages

## Observability
- GET /api/audit-logs
- GET /api/system/health
- GET /api/sync-jobs
