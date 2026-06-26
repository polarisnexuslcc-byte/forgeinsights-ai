# ForgeInsights AI

ForgeInsights AI is a B2B SaaS platform designed to unify company information across APIs, documents, local files, and internal systems to generate strategic insights, detect failures, improve workflows, and answer user questions through a grounded enterprise chat experience.

## Vision

The platform has two operating modes:

1. Silent intelligence mode: continuously monitors data sources, detects issues, correlates signals, and proposes actions.
2. Conversational mode: lets users ask questions about company data, connected systems, and uploaded documents.

## Core product goals

- Connect multiple business APIs.
- Connect local files and uploaded documents.
- Build a unified internal data model.
- Generate signals, insights, and recommended actions.
- Provide enterprise chat grounded in company data.
- Maintain security, auditability, and traceability.

## Product loops

1. Account risk detection.
2. Revenue leakage detection.
3. Operational efficiency improvement.
4. Support and quality monitoring.
5. Executive planning and decision support.

## Monorepo structure

```txt
forgeinsights-ai/
├── docs/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── shared/
│   └── database/
├── infra/
└── storage/
```

## Workspace layout

- docs/: architecture, API contracts, data model, roadmap.
- apps/api/: user-facing backend API.
- apps/web/: frontend application.
- packages/shared/: shared types, constants, utilities, schemas.
- packages/database/: schema, migrations, seed data.
- infra/: deployment and environment tooling.
- storage/: local storage for uploads and processed assets.

## Initial roadmap

### Phase 1 - Platform base
- Organizations
- Sources
- Source credentials
- Sync jobs
- Documents
- Audit logs

### Phase 2 - Knowledge ingestion
- Chunking
- Embeddings
- Retrieval
- Chat with citations

### Phase 3 - First real integrations
- First signal loop
- Account-level insights

## Getting started

### Requirements
- Node.js 22+
- pnpm 9+

### Install
```bash
pnpm install
```

### Run workspace checks
```bash
pnpm lint
pnpm test
```

## Status

This repository is currently in architecture-first setup mode. The initial goal is to establish repository structure, platform documentation, and the backend foundation before scaling integrations and intelligence modules.
