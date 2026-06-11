# 2026-06-11-ai-egress-tenant-uuid-class-fix — AI egress audit tenant identity: uuid-first across the generate class

## Release ID

`2026-06-11-ai-egress-tenant-uuid-class-fix`

## Status

`candidate`

## Plain-English Summary

Generating a deliverable for a tenant whose app client key is not the canonical tenant key (for example `skyharbor` vs `skyharbor-air`) failed inside the run with `AI egress audit write failed: invalid input syntax for type uuid: "skyharbor"`. The audited AI egress path was being handed the tenant's string key as its `tenantId`; when the key could not be resolved to a `clients` row it fell through as a raw string and the audit insert (a uuid column) rejected it, killing the run.

This is the same bug class previously fixed elsewhere, so the fix is a class sweep, not a single instance: every call site that passed a tenant _key_ into the egress identity now passes the tenant's uuid (`clientId`) directly. The tenant key remains in use where it belongs — retrieval scoping — but never as the egress audit identity.

## Layer Impact

- `global-control-lane`: shared AI egress audit identity behavior on four generate/draft routes used by all tenants. No schema change.

## Client Applicability

- All clients: yes — fixes generation for any tenant whose client key differs from its canonical tenant key; no behavior change for tenants where the two coincide (uuid was already the resolved value).
- Feature flag: none

## Changes Included

- PR #3403 (branch `fix-egress-tenant-uuid-class`)
- `src/lib/deliverables/orchestrator/generate-service.ts` — egress identity `tenantId: input.tenantClientKey` → `tenantId: input.clientId` (uuid); `tenantClientKey` retained for retrieval only.
- `src/app/api/v1/programs/[programId]/nexus/draft/route.ts` — `tenantId: ctx.clientKey ?? ctx.clientId` → `tenantId: ctx.clientId`.
- `src/app/api/v1/programs/[programId]/generate/route.ts` — same fix.
- `src/app/api/programs/workspace/[moveId]/artifact/route.ts` — same fix.

## QA / Validation

- Bug reproduced live on app.abarva.ai: Source deliverable Generate run accepted (202 + runId) then failed with the uuid audit error captured verbatim.
- Class sweep performed across the repo for egress `tenantId:` assignments sourced from client keys; all four instances fixed in this PR.
- Unit/behavior suites green locally; full PR CI green except this release gate prior to adding this record.

## Rollout Plan

Squash-merge to main, then standard Azure control-lane web image roll (`az acr build` → `az containerapp update` → traffic shift). No migration required.

## Rollback Plan

Revert the squash commit and shift traffic back to the prior revision. No data cleanup — audit rows written with uuids are the correct desired state; no rows were written in the failing path (the insert rejected).

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3403
- Live error capture (`invalid input syntax for type uuid: "skyharbor"`) in the Source pre-flight evidence set.
- Post-deploy verification: a Source Generate run completing past the egress audit on the deployed revision.

## Context Ingestion Evidence

Not applicable — no ingestion, parsing, embedding, or retrieval path changed. Retrieval scoping still uses the tenant client key; only the egress audit identity changed.

## Known Gaps

- A lint rule or type-level guard preventing string tenant keys from entering `tenantId` egress fields would prevent recurrence of this class; not included here.
