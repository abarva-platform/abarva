# 2026-09-11 — Source Canonical Shell Navigation

## Release ID

`2026-09-11-source-canonical-shell-navigation`

## Status

`candidate`

## Plain-English Summary

Source workspace navigation now remains in the canonical `/source` shell when an operator changes a portfolio tab. The selected workspace, contract, and contract tab are reflected in the URL without a full navigation that can flash a competing shell. Refreshes and shared links retain the same Source selection. A missing contract detail remains an explicit unavailable state; the UI does not substitute another contract.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Source navigation and loading-state presentation only.
- **Canonical model:** No change.
- **Source adapters:** No change.
- **Client intake:** No change.

## Client Applicability

- All clients using the Source product shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Canonical URL builder for Source workspace and Contract 360 selections.
- Client-side portfolio tab navigation that prevents competing full-shell transitions.
- Contract-aware loading state for direct links.
- Focused navigation tests.

## QA / Validation

- `git diff --check` passed.
- ESLint passed for all changed TypeScript files.
- `workspaceNavigation.test.ts`: 2 tests passed.
- `page-tenant-routing.test.ts`: 13 tests passed.
- `workspace-explicit-client-api-routing.test.ts`: 3 tests passed.
- `WorkspaceClient.ecl-browser.test.tsx`: 8 tests passed.
- Live browser investigation confirmed the prior failure mode: portfolio tab navigation and contract deep links could expose different shell/data states. The loaded register does not currently include the rich contract identity used by the deep-link proof, so no fallback contract is permitted.

## Rollout Plan

Merge the protected PR to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the exact merge SHA, then verify the ACA revision and 100% traffic assignment. Run authenticated Source browser checks for `/source`, portfolio tabs, a contract deep link, refresh, and return navigation after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned ACA main deploy workflow only.
- Approved image digest: Recorded by the deploy workflow for the merge SHA.
- ACA runtime invariant: Required before claiming live-proven; template image, 100% traffic revision image, and required worker images must match the approved digest.
- Worker image invariant: Required if a worker image is changed; none changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Source navigation and refresh behavior.

## Rollback Plan

Revert the merged PR through the protected PR lane and deploy the resulting exact `main` SHA using the repo-owned workflow. No schema or data migration is included.

## Audit Evidence

- Pull request and merge commit for this release.
- Focused Jest output listed above.
- ACA workflow run and digest-pinned runtime invariant.
- Authenticated Source browser proof covering click, URL, refresh, and missing-detail refusal behavior.

## Known Gaps

The UI release does not reload or enrich the data plane. The currently loaded portfolio package and the separate dense evidence package must be reconciled and loaded through the ACA data-build job contract before document, invoice, change-order, or performance rows can appear for every intended contract.
