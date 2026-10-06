# 2026-09-13 - Source detail hydration overlay

## Release ID

`2026-09-13-source-detail-hydration-overlay`

## Status

`candidate`

## Plain-English Summary

Contract 360 now trusts a populated selected-contract detail payload during the
short transition before its loading status changes to ready. This prevents
loaded evidence from being hidden by a stale zero in the portfolio summary.

## Layer Impact

- **Products:** Contract 360 Story and evidence surfaces use populated detail
  rows consistently during hydration.
- **client-data-lane:** no data-plane mutation or schema change.

## Client Applicability

- All clients: generic read-path behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.evidence.test.tsx`

## QA / Validation

- Detail coverage tests: passed, including populated payload with transitional
  loading status.
- Targeted ESLint: passed.
- `git diff --check`: passed.
- Signed-in Contract 360 proof required after ACA deployment.

## Rollout Plan

Merge through the protected main PR lane, deploy the exact merge SHA through
`.github/workflows/aca-main-deploy.yml`, verify the digest-pinned runtime
invariant, and repeat the signed-in Contract 360 smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: record the exact final deploy digest.
- ACA runtime invariant: template, 100% traffic revision, and required worker
  images must match the approved digest.
- Worker image invariant: required worker images must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through the protected PR lane and redeploy the prior approved digest.
No data rollback is required.

## Audit Evidence

- PR and CI checks.
- ACA deployment artifact and runtime invariant.
- Signed-in Story and all-tab Contract 360 smoke output.

## Known Gaps

Portfolio aggregate freshness and denominator reconciliation remain separate
from this selected-contract hydration fix. No contract classification is
invented without an authoritative mapping source.
