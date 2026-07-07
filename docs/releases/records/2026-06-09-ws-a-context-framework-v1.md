# 2026-06-09-ws-a-context-framework-v1 — Lock CONTEXT_FRAMEWORK_v1 (WS-A, light)

## Release ID

`2026-06-09-ws-a-context-framework-v1`

## Status

`candidate`

## Plain-English Summary

Locks a single versioned "what good looks like" contract for the 12 canonical
context dimensions (organization/leadership, financials/KPIs, systems,
cloud/infra, vendors/contracts, initiatives/moves, operating model,
process/workflow, risks/controls, artifacts/evidence, data platforms/domains,
value ledger/baselines). Each dimension declares required entities/fields,
allowed source types, citation/source-basis/confidence requirements, default
classification, the natural idempotency key (so updates supersede rather than
duplicate — WS-B), the agents it serves, and the per-dimension promotion
eligibility. Intentionally light: it is the spec that the existing upload
templates conform to and the basis for derived answerability (WS-D) and
promotion (WS-F) — it does not re-implement the upload registry/UI.

## Layer Impact

- `global-control-lane`: new pure spec module `src/lib/context-framework/` +
  doc. No runtime/answer-path change, no migration.

## Client Applicability

- All clients: Yes — the canonical dimensions every client template conforms to.
- Internal only: governance spec. Flag: none.

## Changes Included

- `src/lib/context-framework/{context-framework-v1,index}.ts`
- `src/__tests__/behaviors/context-framework-v1.test.ts` — 6 cases.
- `docs/governance/CONTEXT_FRAMEWORK_v1.md`

## QA / Validation

- `npx jest src/__tests__/behaviors/context-framework-v1.test.ts` → 6/6 pass
  (12 dimensions; no value field in any idempotency key; full evidence chain
  required for promotion; unique keys; brief-required dimensions covered).
- `npx tsc --noEmit` / `npx eslint` → clean.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.

## Rollout Plan

Merge to `main` after CI green. No migration, no runtime change — a locked spec
consumed by templates, answerability, and promotion.

## Rollback Plan

Revert the PR. Pure spec module; no data effect.

## Audit Evidence

- PR URL: (filled on open). Test log: 6/6.

## Context Ingestion Evidence

Not applicable. This is the dimension contract spec; it loads/parses nothing.

## Known Gaps

- Per-template field catalogs (full column lists per dimension) and the canonical
  synthetic templates are layered on in WS-C/WS-E; v1 locks the contract shape.
