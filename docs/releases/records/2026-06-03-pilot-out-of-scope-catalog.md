# 2026-06-03-pilot-out-of-scope-catalog - Pilot Out-Of-Scope Catalog

## Release ID

`2026-06-03-pilot-out-of-scope-catalog`

## Status

`candidate`

## Plain-English Summary

Adds a pilot out-of-scope catalog so AbarVa has a pre-written answer for common
"can you also" requests during a client pilot. The catalog gives draft add-on
menu prices, classification rules, approval steps, and guardrails for data,
tenant isolation, and AI decision-support boundaries.

## Layer Impact

- Internal admin: gives founder/operator team a controlled pilot change-request
  artifact.
- Global control lane: reinforces single-client data loading, human approval,
  and customer-safe roadmap discipline across pilot conversations.

## Client Applicability

- All clients: can be used as the starting point for pilot change-request
  conversations.
- Specific clients: none.
- Internal only: final pricing approval and change-order acceptance workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/pilot/OUT_OF_SCOPE_CATALOG.md`

## QA / Validation

- `git diff --check origin/main...HEAD` - passed.
- ASCII scan for `docs/pilot/OUT_OF_SCOPE_CATALOG.md` and this release record
  - passed.
- `npm run release:check -- --base origin/main --head HEAD` - passed.

## Rollout Plan

Merge to `main`. Use the catalog during pilot operations and SOW/change-order
conversations. No runtime deployment, data migration, or feature flag is
required.

## Rollback Plan

Revert this docs PR if the catalog is replaced or rejected. No runtime or data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2973
- CI checks: pending on PR #2973.
- Local validation: diff check, ASCII scan, and release gate passed.

## Known Gaps

- The catalog is a draft menu. Final hourly rate, discounting, and SOW language
  remain founder-approved items and are not closed by this release.
