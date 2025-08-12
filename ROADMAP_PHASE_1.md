# Phase 1 Roadmap (Reliability and Contracts)

## Goals (2–4 weeks)
- Persist analysis lifecycle in SQLite (no in-memory Maps)
- Enforce JWT auth on all sensitive endpoints (not just artifacts)
- JSON schema validation for request/response contracts
- Integration tests for routes (no SSE; use polling)
- Containerization and basic CI checks

## Work items
1) Persistence
- Create tables: `analyses`, `artifacts`, `synthesis`, `events`
- Store analysis requests, model statuses, results; GC policies
- Migrate from Maps → DB reads/writes

2) Auth and access control
- Require JWT on `/analyze`, `/analysis/*`, `/artifacts/*` (except `/health`, `/login`)
- Scope by `userId` in DB; forbid cross-user access

3) Contracts and validation
- Add JSON schemas (zod or fastify-json-schema)
- Validate uploads: file count/size/MIME; sanitize names
- Version API responses and generate TS types for FE

4) Integration tests
- Use Fastify `inject` with mocks; test `/analyze`, `/analysis/:id/status`, `/results`
- Mock OpenRouter client; ensure no external calls

5) Observability and configuration
- Add structured logging with request IDs
- Healthcheck for DB connectivity
- Config via env with safe defaults; centralize config module

6) Containerization and CI
- Add `Dockerfile` for API and frontend; simple `docker-compose.yml`
- GitHub Actions: build, unit tests, lint, typecheck

## Deliverables
- Code: persistence layer, auth hooks, validators, tests, Dockerfiles
- Docs: updated README (polling, auth), DB schema, runbook
- CI: passing checks on PRs to main

## Definition of done
- All endpoints protected (non-dev); contracts validated; integration tests green
- Analyses survive restarts; no reliance on in-memory Maps
- CI pipeline enforces build/test/lint
