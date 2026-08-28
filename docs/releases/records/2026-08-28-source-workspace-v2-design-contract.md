# 2026-08-28-source-workspace-v2-design-contract - Source Workspace V2 Design Contract

## Release ID

`2026-08-28-source-workspace-v2-design-contract`

## Status

`candidate`

## Plain-English Summary

Source workspace now uses the compact V2 executive shell as the standard product surface. The first screen shows a small set of cross-contract facts, vendor concentration, action posture, and evidence readiness instead of a long audit page.

The design intentionally hides claims that are not supported across the governed contract book. Savings realized, risk score, category spend charts, and portfolio-wide performance claims are not rendered unless the underlying projection provides defensible rows for them.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Updates the Source workspace presentation and navigation over existing governed Source read models. No schema, loader, adapter, tenant-routing, evidence-ingestion, or canonical data changes are included.

## Client Applicability

- All clients: Source workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Confirmed the current governed workspace data supports contract count, vendor count, recorded annual value, decision-set framing, vendor rollups, loaded spend-row count, loaded performance-row count, and a quantified service-credit finding where those rows exist.
- Confirmed the current governed workspace data does not support vendor-wide SLA percentage, savings realized, category spend chart, risk score, or portfolio-wide performance claims as first-screen facts.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` - pass.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` - pass.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` - pass.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deployment workflow builds and deploys the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Must be checked after deploy before claiming production live-proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, open Source workspace after deploy and confirm the V2 shell renders without preview/debug panels and without unsupported executive claims.

## Rollback Plan

Revert the UI/test/release-record commit through a PR and allow the repo-owned deploy workflow to publish the previous Source workspace rendering. No migration or data rollback is required.

## Audit Evidence

- Pull request and CI run for this release candidate.
- Post-deploy ACA runtime invariant output.
- Post-deploy signed-in Source workspace screenshot or browser proof.

## Known Gaps

This release does not create new evidence rows, opportunity calculations, contract loader behavior, or per-vendor data depth. It standardizes the workspace UI over the governed read models that already exist.
