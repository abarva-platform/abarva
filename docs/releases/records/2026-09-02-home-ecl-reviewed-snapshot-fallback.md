# 2026-09-02-home-ecl-reviewed-snapshot-fallback — Home ECL Reviewed Snapshot Fallback

## Release ID

`2026-09-02-home-ecl-reviewed-snapshot-fallback`

## Status

`candidate`

## Plain-English Summary

Default Home can now render the reviewed Home bundle when the optional ECL serving projection is temporarily unavailable. The strict ECL reader remains available for diagnostics and proof paths, but the client-facing Home route no longer replaces an approved reviewed bundle with an empty-state page solely because the newer serving projection has no rows.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Home route selection changes only the fallback path used by the client-facing route.

Layer 3 Canonical Enterprise Model: No canonical data, serving tables, migrations, or tenant records are changed.

## Client Applicability

All clients: No.

Specific clients: ECL-enabled Home route cohort configured in the Home route.

Internal only: No.

Public/demo only: No.

Feature flag: None.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`: adds a safe reader that falls back to the reviewed Home bundle when the strict ECL projection reader fails.
- `src/app/(maestro)/home/page.tsx`: uses the safe reader for the ECL-enabled Home route path.
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`: pins the empty-projection fallback behavior.

## QA / Validation

- `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand` passed.
- `npx eslint src/app/'(maestro)'/home/page.tsx src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts` passed.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting main commit.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: Determined by the repo-owned deploy workflow.
- ACA runtime invariant: Must be proven by the deploy workflow/live proof after merge.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Home route renders the reviewed bundle when the ECL projection is unavailable.

## Rollback Plan

Revert the PR or redeploy the previous known-good main digest through the repo-owned deploy workflow.

## Audit Evidence

- PR diff and CI run for this release.
- Focused Jest and ESLint output listed above.
- Post-deploy signed-in Home route proof.

## Known Gaps

This does not repair an empty ECL serving projection. It prevents that optional projection gap from blanking the default Home route while the reviewed bundle is available.
