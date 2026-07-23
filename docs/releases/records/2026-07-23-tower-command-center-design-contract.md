# 2026-07-23-tower-command-center-design-contract — Tower Command Center Design Contract

## Release ID

`2026-07-23-tower-command-center-design-contract`

## Status

`candidate`

## Plain-English Summary

Tower's mart-backed command center is reshaped to follow the supplied Tower Command Center design contract more closely. The first screen now leads with spend posture, value posture, risk posture, decision posture, a "This week's read" value-proof story, and decisions waiting on the executive, rather than a generic technical dashboard.

## Layer Impact

- Lane: `global-control-lane`.
- Presentation layer: replaces the Tower mart command surface with the contract-style CXO command-center layout.
- Data/read-model layer: no schema, ingestion, mart, or runtime data mutation. The page continues to read the existing Tower mart view model.
- Agent layer: no prompt or aVa generation change.

## Client Applicability

- All clients: Tower clients that receive a `towerMartView` use this command-center surface.
- Specific clients: Meridian/Healthcare Demo benefits immediately where the Tower mart is populated.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerCommandCenterContract.tsx`
- No migrations.
- No data writes.
- No feature flags.

## QA / Validation

- Pass: focused Tower surface test: `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed 17/17.
- Pass: `git diff --check`.
- Pass: static visual render of the supplied design contract: `/tmp/tower-contract-design.png`.
- Pass: static visual render of the implementation component: `/tmp/tower-contract-implementation.png`.
- Blocked: full TypeScript validation is currently blocked by unrelated Home dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned ACA main deploy workflow will build and deploy the merged SHA. Signed-in Tower browser proof is required before calling the change live-proven.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending main deploy.
- ACA runtime invariant: pending main deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Tower `/tower` with a mart-backed tenant.

## Rollback Plan

Revert the PR or redeploy the prior ACA image digest. No data rollback is required because this release is presentation-only.

## Audit Evidence

- PR URL: pending.
- Screenshot evidence: `/tmp/tower-contract-design.png` and `/tmp/tower-contract-implementation.png` in the local proof workspace.
- Focused Jest output from Tower surface tests.

## Known Gaps

This PR does not change the Tower mart, telemetry ingest, aVa prompt path, or ACA data-build jobs. Production/live proof is pending until after merge and ACA deploy.
