# 2026-08-02-home-command-center-polish — Home Command Center Polish

## Release ID

`2026-08-02-home-command-center-polish`

## Status

`candidate`

## Plain-English Summary

Polishes the Home command center after browser review found duplicated navigation, unstable section-click behavior, and oversized editorial typography. The page now uses the single governed product navigation, steadier in-page explorer links, and tighter product-grade typography while preserving the existing data-bound content.

## Layer Impact

- Release lane: `global-control-lane`.
- CLIENT INTAKE: no intake contract changes.
- SOURCE ADAPTERS: no loader, adapter, or source-table changes.
- CANONICAL MODEL: no canonical model mutation.
- PRODUCTS: `/home` presentation, top navigation labeling, and Home in-page navigation behavior are refined.

## Client Applicability

- All clients: yes, for the shared Home shell and `/home` visual presentation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removes the duplicated page-level Home navigation bar so `/home` relies on the single NEXUS product shell.
- Renames the global `/home` nav label from Knowledge to Home while keeping the route stable.
- Replaces smooth programmatic section scrolling with standard hash links for predictable click behavior.
- Tightens Home typography, page spacing, side explorer behavior, and removes the redundant floating Ask aVa tab.
- Updates navigation tests to assert the corrected Home label and single primary nav contract.

## QA / Validation

- Targeted ESLint on changed TypeScript and TSX files passed with no errors.
- Targeted Jest navigation and Home route contract tests passed: 23 tests.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false` passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npm run build` passed.
- Local signed-in browser QA passed 24/24 checks across desktop and mobile: single primary nav, Home label, no Knowledge label in global nav, no duplicate page brand, no vertical Ask aVa tab, no horizontal overflow, section-click hash navigation, no reload on rail click, settled scroll position, active architecture rail state, and controlled sans-serif heading typography.

## Rollout Plan

Merge through PR, then deploy through the approved Azure Container Apps main deploy workflow. Production live status requires signed-in browser proof on the deployed route.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none in this release candidate.
- Approved image digest: not applicable until deploy.
- ACA runtime invariant: must be proven after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the polish commit or restore the prior Home component and nav label through a PR. No database migrations or data changes are included.

## Audit Evidence

- Targeted lint output from local release candidate.
- Targeted Jest output from local release candidate.
- Local browser QA ZIP: `/Users/anand/Downloads/home-command-center-polish-qa-20260802T1909.zip`
- PR, merge commit, ACA deployment, and signed-in proof to be attached after release.

## Known Gaps

- Release check, deployment, and signed-in production proof are pending for this candidate.
