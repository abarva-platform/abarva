# 2026-07-23 Tower AI Portfolio Search And Table

## Release ID

`2026-07-23-tower-ai-portfolio-search-table`

## Status

`candidate`

## Plain-English Summary

Tower Command Center now keeps the executive AI portfolio view dense by default while still making the full governed initiative list reachable. The bubble and candidate views remain capped for executive scanning, and the AI Portfolio tab adds search plus an uncapped `All initiatives` table so tenants with hundreds of initiatives can inspect rows beyond the top ten without changing the underlying mart.

## Layer Impact

- `global-control-lane`: Updates the shared Tower Command Center UI and view model shape used by the platform Tower route.
- `client-data-lane`: No data-plane mutation, schema change, mart build, or tenant load. Existing governed Tower mart rows are read and filtered client-side after the server read model is built.

## Client Applicability

- All clients: Tower Command Center users receive the AI Portfolio search and uncapped table once the change is deployed.
- Specific clients: Demo tenants with large AI portfolios, including Airline Demo and FS Demo, are the primary proof targets because their active Tower marts contain more than ten AI portfolio rows.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the already-governed Tower Command Center route; this PR does not introduce a new flag.

## Changes Included

- PR: `#5487`
- Adds AI Portfolio search across initiative name, vendor, system, and category.
- Adds a full `All initiatives` sub-view backed by the uncapped `allInitiatives` view-model field.
- Preserves top-ten caps for executive chart and candidate-pipeline views.
- Updates Tower Command Center behavior tests and render harness coverage for the new view.

## QA / Validation

- Local validation reported by the implementation lane: 103 Tower Command Center tests passing, ESLint clean, TypeScript clean, and harness verification of the full table with search/type chips/row count.
- GitHub PR checks must pass before merge, including release control, lint, typecheck, browser matrix smoke, hygiene gate, production readiness, accessibility, and route integrity.
- Post-deploy proof required: ACA runtime invariant and signed-in `/tower` proof for at least Airline Demo and FS Demo showing the Command Center AI Portfolio remains tenant-scoped and the full initiative list is reachable.

## Rollout Plan

Merge through a protected PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to the lab/product web Container App, shifts 100% traffic only after the revision is healthy, and records deployment evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned ACA main deploy workflow.
- Approved image digest: Resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None in this PR.
- Live signed-in proof required: Yes, `/tower` AI Portfolio for Airline Demo and FS Demo after deploy.

## Rollback Plan

Revert PR `#5487` through a new PR and allow the ACA main deploy workflow to publish the reverted image. The rollback returns AI Portfolio to the top-ten-only capped views while preserving all Tower mart data; no database rollback is required.

## Audit Evidence

- PR `#5487`
- Release Control Gate and GitHub checks for the PR.
- ACA main deploy run after merge.
- ACA runtime invariant output after deploy.
- Signed-in browser proof screenshots/results for demo tenants after deploy.

## Known Gaps

Budget, spend, and owner attribution gaps in the current demo Tower marts are not fixed by this UI release. This release makes large AI portfolios reachable; it does not add missing budget or owner data.
