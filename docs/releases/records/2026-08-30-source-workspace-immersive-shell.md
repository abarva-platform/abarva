# 2026-08-30-source-workspace-immersive-shell — Source Workspace Immersive Shell

## Release ID

`2026-08-30-source-workspace-immersive-shell`

## Status

`candidate`

## Plain-English Summary

The Source workspace now uses its own immersive product shell instead of rendering below the shared product toolbar. This gives the contract workspace the full viewport and avoids duplicate navigation around the Source-specific tabs.

## Layer Impact

Layer 4 Products. Lane: `global-control-lane`.

Source workspace presentation only. The change affects route chrome around the existing Source workspace component; it does not alter loaders, adapters, canonical objects, read models, or tenant resolution.

## Client Applicability

- All clients: Source workspace users on `/source/workspace`.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/chrome/MaestroChrome.tsx`
- `src/components/chrome/__tests__/MaestroChrome.test.tsx`

## QA / Validation

Candidate validation:

- PASS: Focused unit test for immersive Source workspace chrome.
- PASS: ESLint for touched chrome files.
- PASS: TypeScript compile check.
- NOT RUN: Live signed-in proof; to be performed after merge and ACA deployment.

## Rollout Plan

Merge through the protected main branch and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/source/workspace` should render without the shared Nexus toolbar while regular Source routes keep it.

## Rollback Plan

Revert the chrome route exception and redeploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL after opening.
- Unit test output for `MaestroChrome`.
- ACA deploy workflow output after merge.
- Signed-in route proof after deploy.

## Known Gaps

None known for this scoped chrome change.
