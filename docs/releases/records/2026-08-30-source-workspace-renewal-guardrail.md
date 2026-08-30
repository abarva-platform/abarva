# 2026-08-30-source-workspace-renewal-guardrail — Source Workspace Renewal Guardrail

## Release ID

`2026-08-30-source-workspace-renewal-guardrail`

## Status

`candidate`

## Plain-English Summary

The Source workspace portfolio strip now separates active renewal exposure from stale date exclusions. It shows lapsed auto-renew exposure, cancellable value, and excluded stale renewal rows instead of presenting a generic deadline metric as an executive claim.

## Layer Impact

Layer 4 Products. Lane: `global-control-lane`.

This is a presentation and deterministic cockpit-shaping change for the Source workspace. It does not change tenant data, loaders, Azure/Postgres tables, schema, or production data-plane jobs.

## Client Applicability

- All clients: Source workspace users on `/source/workspace`.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

Candidate validation:

- PASS: Focused Source workspace browser-style component test.
- PASS: Source workspace portfolio adapter test suite.
- PENDING: ESLint for touched Source workspace files.
- PENDING: TypeScript compile check.
- PENDING: Release check.
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
- Live signed-in proof required: Yes, Source workspace should show active renewal exposure, cancellable value, and stale-date exclusions without old proof scaffolding.

## Rollback Plan

Revert the Source workspace renewal guardrail change and redeploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL after opening.
- Focused Source workspace component and adapter test output.
- ACA deploy workflow output after merge.
- Signed-in route proof after deploy.

## Known Gaps

None known for this scoped renewal-guardrail change.
