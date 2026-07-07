# 2026-06-09-ws-b-idempotent-fact-identity — Idempotent fact identity + supersede (Context Framework WS-B)

## Release ID

`2026-06-09-ws-b-idempotent-fact-identity`

## Status

`candidate`

## Plain-English Summary

Fixes the duplication defects the WS0 discovery found in the governed Admin
ingestion path so that re-uploading or updating a dimension **updates the
existing facts instead of writing duplicate rows**. Two concrete bugs are
addressed: (1) a changed fact value used to insert a second row while the old
one stayed active (two active rows for one logical fact), and (2) chunks used a
per-upload id, so every re-upload created a fresh duplicate chunk set. Now: a
pure, tested supersede planner defines the update semantics; the structured-fact
loader supersedes the prior active fact before writing the new value (one active
row per logical fact, enforced by a partial unique index); chunks use a
content+location-stable id and upsert; a migration adds load lineage, collapses
any pre-existing duplicate active facts, and adds the uniqueness guard; and a
`validate:fact-duplication` CI gate detects regressions.

## Layer Impact

- `client-data-lane`: migration on `enterprise_context_facts` /
  `enterprise_context_chunks` (additive column + idempotent dedup + partial
  unique index) and changes to the structured-fact + chunk write paths in the
  Admin ingestion loader. No tenant data is destroyed — duplicates are
  superseded (auditable), not deleted.

## Client Applicability

- All clients: Yes — every governed upload (synthetic + pilot) uses this path.
- Specific clients: n/a
- Internal only: n/a
- Public/demo only: n/a
- Feature flag: none.

## Changes Included

- `src/lib/context-ingestion/fact-identity.ts` — pure identity + supersede planner.
- `src/lib/context-ingestion/csv-upload-connector.ts` — stable chunk id + upsert.
- `src/lib/context-ingestion/admin-structured-context-promotion.ts` —
  supersede-before-insert for facts.
- `supabase/migrations/20260609180000_ws_b_fact_identity_supersede.sql` —
  load_batch_id, idempotent dedup, partial unique active-fact index.
- `src/scripts/governance/validate-fact-duplication.ts` + npm
  `validate:fact-duplication`.
- `src/__tests__/behaviors/fact-identity.test.ts` — 10 cases.

## QA / Validation

- `npx jest src/__tests__/behaviors/fact-identity.test.ts` → 10/10 pass
  (idempotent no-op, changed→supersede with no duplicate active, new-fact insert,
  partial_update vs replace_dimension vs deprecate_fact, stable chunk/batch ids).
- `npm run validate:fact-duplication` → lab-mode skip (no live DB) — correct;
  authoritative run is on ACA.
- `npx tsc --noEmit` / `npx eslint` → clean on touched files.
- `npm run audit:architecture-rules` / `npm run release:check` → green.
- **ACA-gated:** the migration replay and the loader write-path under real data
  (idempotent re-upload, changed-value supersede, no duplicate active rows) must
  be validated on Azure Container Apps — the private DB is unreachable from a
  workstation. Not faked here.

## Rollout Plan

1. Merge to `main` after CI is green.
2. On ACA: `npm run db:migrate` applies the migration (idempotent; dedups any
   existing duplicate active facts before creating the unique index, so it is
   safe on dirty data).
3. Deploy the loader image; re-uploads now supersede-and-update.
4. Run `npm run validate:fact-duplication` on ACA as the authoritative gate.

## Rollback Plan

- Revert the PR (loader reverts to prior behavior). The migration's added column
  and index are additive; the index can be dropped
  (`DROP INDEX enterprise_context_facts_one_active_per_fact_key`). Superseded
  rows remain auditable; no data is lost.

## Audit Evidence

- PR URL: (filled on open).
- Test log: 10/10 planner cases pass.
- Migration: `supabase/migrations/20260609180000_ws_b_fact_identity_supersede.sql`.

## Context Ingestion Evidence

Applicable. This changes the governed Admin structured-context ingestion write
path. States reported separately: local artifact generated ✓; parse/preflight ✓
(unchanged); **loader commit semantics changed to supersede-and-update**;
Azure Blob staging / queue handoff unchanged; index refresh handled by the
existing embedding job; **live retrieval/citation proof is an ACA step**. No new
ZIP/unzip claims (ZIP already existed). The fact/chunk identity is deterministic;
the partial unique index is the DB-level guarantee of one active row per fact.

## Known Gaps

- The planner's no-op optimization (skip unchanged facts without a supersede
  churn) is available in `fact-identity.ts` but the loader currently supersedes
  then revives/upserts; wiring the full read-plan-apply is a follow-up.
- Azure AI Search document dedup on re-index is not yet wired (chunks are stable
  now; the search-doc id alignment is a follow-up in WS-C).
- Live ACA validation of the migration + loader is pending.
