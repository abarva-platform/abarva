# 2026-07-02-source-deterministic-sourcing-analytics — Source Deterministic Sourcing Analytics

## Release ID

`2026-07-02-source-deterministic-sourcing-analytics`

## Status

`candidate`

## Plain-English Summary

Adds the first deterministic Source analytics layer. Source now has typed utilities for evidence readiness, contract optimization exposure, vendor response MVE analytics, weighted vendor scoring, BAFO leverage, and executive story payloads. This keeps commercial math and evidence boundaries inside AbarVa instead of asking Claude/aVa to calculate scores or invent missing evidence.

## Layer Impact

- `global-control-lane`: Adds shared Source library code and tests. No runtime route, UI, data-plane, or deployment behavior changes in this slice.

## Client Applicability

- All clients: The library is shared and tenant-neutral.
- Specific clients: SkyHarbor fixtures are synthetic demo fixtures only.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Not wired to runtime in this slice.

## Changes Included

- New Source analytics package under `src/lib/source/analytics/`
- Focused Jest coverage for evidence-rich, evidence-partial, evidence-light, contract exposure, vendor response analytics, evaluation ranking, BAFO scenario, and executive story payloads
- Architecture documentation under `docs/architecture/source/`

## QA / Validation

- Focused Jest: passed after fixing the vendor-readiness rule (`9` tests).
- Scoped ESLint: passed with documentation files ignored by config as expected.
- TypeScript: passed (`NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`).
- `git diff --check`: passed.
- `npm run release:check`: passed.

## Rollout Plan

No production deploy for this slice unless explicitly approved. This is a library/test/docs foundation for a later runtime wiring slice.

## Deployment Authority

- Repo-owned deploy workflow: Not used for this slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this library-only slice.

## Rollback Plan

Revert the PR. No migrations, data changes, route changes, or deployed runtime changes are included.

## Audit Evidence

- PR URL once opened
- Focused Jest output
- Scoped ESLint output
- TypeScript output
- Release check output

## Known Gaps

Runtime UI/export/aVa wiring is intentionally out of scope for this slice.
