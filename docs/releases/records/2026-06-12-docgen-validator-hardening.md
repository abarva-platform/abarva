# 2026-06-12-docgen-validator-hardening — quality validator: truncation + tenant-casing blockers

## Release ID

`2026-06-12-docgen-validator-hardening`

## Status

`candidate`

## Plain-English Summary

PR-7 (validator hardening) of the high-quality-document program. The deliverable
quality gate already blocked internal-tag leaks, unsupported claims, missing
source register/decision/recommendation/risk table, thin bodies, and tiny fonts.
This adds the two remaining brief conditions: it blocks a deliverable whose
**output appears truncated** (a substantial section that ends mid-sentence — a
token-ceiling symptom) and one whose **tenant display name is a raw slug**
(`skyharbor`, `apex_retail`) instead of a proper client name.

## Layer Impact

- `global-control-lane`: `src/lib/deliverables/orchestrator/quality-validator.ts`
  only. No schema/API change.

## Client Applicability

- All clients; applies to every orchestrated deliverable. Feature flag: none.

## Changes Included

- `quality-validator.ts`: `looksTruncated` + `looksLikeRawSlug` helpers and two
  new blockers.
- Tests: `__tests__/quality-validator-hardening.test.ts` (5 tests; clean doc
  still passes, truncation/slug blocked, short section + proper name not flagged).

## QA / Validation

- `tsc` clean; `eslint` clean; 57 orchestrator tests pass (9 suites).

## Rollout Plan

Merge and deploy. Additive validation; no migration.

## Rollback Plan

Revert the file. No data change.

## Audit Evidence

- Branch: `feat/docgen-validator-hardening`. Implements audit PR-7.

## Known Gaps

- Unifying this validator across the Source route-local path happens in the
  Source migration slice (PR-F).
