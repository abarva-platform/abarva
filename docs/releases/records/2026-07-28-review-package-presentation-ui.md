# 2026-07-28-review-package-presentation-ui — Review-package presentation (read-only)

## Release ID

`2026-07-28-review-package-presentation-ui`

## Status

`candidate`

## Plain-English Summary

Adds the UI/UX-lane presentation for a governed review dry-run package: a
read-only React view that renders class distribution, counts by
type/domain/source/evidence/confidence, the classification reason distribution,
and per-batch governed dimensions with representative samples and provenance
hashes. It performs no approval and no data-plane action — package generation,
review/apply, publication and baseline activation belong to the foundation lane;
this only displays their output.

## Layer Impact

Release lanes: **`experimental`** (Knowledge vNext product surface, flag-off) and
**`internal-admin`** (review/ops-facing presentation). Not `global-control-lane`,
not `client-data-lane`, not `public-demo`. No schema/runtime/data-plane change.

## Client Applicability

- Internal only. Presentation only; no browser-side mutation or approval.

## Changes Included

- `src/lib/knowledge/consumption-contracts/review-package.ts` — read-only
  `ReviewPackageSummaryV1` contract (mirrors the governed builder's output).
- `src/components/knowledge/vnext/ReviewPackageSummary.tsx` — read-only view (no
  accept/reject controls; explicit dry-run/human-approval banner).
- `src/lib/knowledge/fixtures/review-package-example.ts` — illustrative fixture.
- `src/lib/knowledge/consumption-contracts/__tests__/review-package.test.ts`.

## QA / Validation

- Typecheck clean; ESLint 0; 5 shape tests green.
- Rendered in a temporary dev harness (since removed): read-only banner, refined
  class distribution (auto/batch/individual — not 100% individual), by-type and
  by-domain visible.

## Rollout Plan

Merge to `main`. Dormant until mounted behind the admin-only Knowledge preview;
no tenant activation, no data-plane action from the browser.

## Deployment Authority

- Repo-owned deploy workflow: unchanged. No shared runtime mutation.

## Rollback Plan

Revert the PR; the component has no other importers.

## Audit Evidence

- This record + the shape test.

## Known Gaps

- Not yet mounted into the admin preview route (follow-on). The real package data
  is produced by the foundation lane; this renders whatever it emits.
