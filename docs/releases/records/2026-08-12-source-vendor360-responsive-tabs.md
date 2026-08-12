# 2026-08-12-source-vendor360-responsive-tabs — Source Vendor 360 Responsive Cockpit Tabs

## Release ID

`2026-08-12-source-vendor360-responsive-tabs`

## Status

`candidate`

## Plain-English Summary

This release corrects the Source Vendor 360 cockpit layout so the governed executive surface uses the available browser width, exposes section tabs, and avoids wide fixed-row composition that can make the page appear cut off.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source workspace presentation only. The change does not alter Source reads, governed aggregates, tenant routing, canonical data, loaders, adapters, or write paths.

## Client Applicability

- All clients: Any tenant using the Source workspace Vendor 360 cockpit route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts`
- Follow-up: adjusted the Top contracts table width allocation after production Chrome proof showed the confidence column wrapping too aggressively.
- Follow-up: reserved right-side clearance for Vendor 360 action buttons so the fixed aVa launcher does not obscure workflow controls.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts'`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`
- PASS: Local dev server launched with webpack for layout smoke setup.
- PASS: Production signed-in Chrome proof after first deploy confirmed section tabs, no old Explore/Concentration page content, no horizontal viewport overflow, and a full-width cockpit.
- FOLLOW-UP: Production signed-in Chrome proof also identified narrow confidence-cell wrapping in Top contracts and a fixed launcher overlap on action controls; this candidate includes both visual polish items.
- BLOCKED: Local signed-in visual proof, because localhost redirected to the guarded sign-in surface.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image to the shared Product/Lab web Container App.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/preview/workspace` in Chrome.

## Rollback Plan

Revert this candidate and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR and merge commit for this candidate.
- Local validation commands listed above.
- Repo-owned ACA deploy run and runtime-invariant artifact after merge.
- Signed-in Chrome screenshots after production deployment.

## Known Gaps

- Production signed-in visual proof remains required after deployment.
