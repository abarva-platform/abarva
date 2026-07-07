# 2026-06-12-docgen-source-label-hygiene — internal→human source-label mapper + extended leak scan

## Release ID

`2026-06-12-docgen-source-label-hygiene`

## Status

`candidate`

## Plain-English Summary

PR-4 of the high-quality-document program. Internal source ids must never appear
in a client-facing document. This adds a shared `humanizeSourceLabel` that maps
known internal ids to clean source names (e.g. `document_extract:stakeholder_map`
→ "Stakeholder Map", `tower_dora_metrics` → "Engineering Delivery Baseline / DORA
Metrics") and de-identifies unmapped ids heuristically (strip internal prefixes
and trailing ids, Title Case, fall back to "Source" for bare id fragments). The
source-register builder applies it defensively so a raw id can never leak into
the register. The internal-leak scanner is extended to also catch
`document_extract:`, `tower_*`, and `source_segment_id`.

## Layer Impact

- `global-control-lane`: `src/lib/deliverables/orchestrator/source-register.ts`
  only. No schema/API change. Behavior change: register labels are now humanized.

## Client Applicability

- All clients: applies to any orchestrated deliverable's source register.
- Feature flag: none.

## Changes Included

- `source-register.ts`: `humanizeSourceLabel` + `SOURCE_LABEL_MAP`; applied in
  `buildSourceRegister`; `INTERNAL_LEAK_PATTERNS` extended with
  `document_extract`, `tower_ref`, and `source_segment_id`.
- Tests: `__tests__/source-register.test.ts` (mapping, heuristic de-id,
  already-human passthrough, register humanization, full forbidden-set scan).

## QA / Validation

- `npx tsc --noEmit` clean; `npx eslint` clean; 52 orchestrator tests pass
  (8 suites) incl. the new 5 source-register tests.

## Rollout Plan

Merge and deploy. Additive + defensive; no migration.

## Rollback Plan

Revert the file. No data change.

## Audit Evidence

- Branch: `feat/docgen-source-label-hygiene`. Implements audit PR-4.

## Known Gaps

- The mapper covers the audit's named examples + a heuristic; extend
  `SOURCE_LABEL_MAP` as new internal families appear. The quality validator
  already blocks export on any leak the scanner catches (PR-C hardens the rest).
