# 2026-09-10-source-canonical-route - Source Canonical Route

## Release ID

`2026-09-10-source-canonical-route`

## Status

`candidate`

## Plain-English Summary

Source now treats `/source` as the product-facing command center route. Historical `/source/workspace` links remain available as a compatibility alias, but visible product navigation, handoffs, and back links point users to `/source`.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source routing and presentation links only. This release changes page mounting, loading state reuse, and visible navigation targets. It does not add migrations, canonical fields, loaders, tenant data, Azure jobs, or model behavior.

## Client Applicability

- All clients: Source users land on `/source` for the command center.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Mounts the governed Source command center directly at `/source` instead of redirecting users to `/source/workspace`.
- Reuses the command-center loading shell for the canonical `/source` route.
- Updates visible Source navigation, contract handoffs, and back links to target `/source`.
- Keeps `/source/workspace` and `/api/source/workspace/*` intact for compatibility and API stability.
- Adds route regression coverage so `/source` remains the canonical product entry.

## QA / Validation

- pass: Focused Source route and navigation tests, 5 suites / 64 tests.
- pass: Broader Source workspace Jest proof, 12 suites / 129 tests.
- pass: TypeScript `tsc --noEmit`.
- pass: ESLint on touched Source and Tower files. Existing warnings remain in unrelated broad Source files.
- pass: Production `next build` with Turbopack. The build emitted existing broad-file-pattern warnings outside this Source change.
- pass: `git diff --check`.
- pass: Release control check.
- not-run: Deployed ACA workflow and runtime invariant.
- not-run: Live signed-in Source proof at `/source`.

## Rollout Plan

Open a pull request, merge through the protected repository workflow, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA traffic mutation, direct Container App update, database migration, data-build job, or feature-flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required before the change is live.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Not available until the repo-owned deploy workflow builds the merged SHA.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: `/source` command center, main app nav, command tabs, selected contract tabs, and legacy `/source/workspace` compatibility.

## Rollback Plan

Revert this route/link presentation change or roll production back to the previous healthy ACA revision. No data rollback is required because this release does not mutate tenant data or schema.

## Audit Evidence

Pull request, CI checks, release-control output, targeted Jest output, TypeScript output, ESLint output, ACA deploy workflow output, runtime-invariant output, and live signed-in `/source` smoke notes after deployment.

## Known Gaps

This release does not reload, reparse, or enrich contract data. It only makes `/source` the canonical Source command-center route.
