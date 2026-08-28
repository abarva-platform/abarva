# 2026-08-28-tower-cxo-truth-regression-fix — Tower presentation truth repair

## Release ID

`2026-08-28-tower-cxo-truth-regression-fix`

## Status

`candidate`

## Plain-English Summary

Tower now keeps approved investment, asserted benefit, value claims, review queues, and evidence actions distinct in the executive presentation. Missing approved-investment data is shown as not loaded rather than substituted from another metric, and the supporting ECL diagnostics no longer occupy the first viewport ahead of the Tower experience.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Tower presentation logic and route composition only. The change consumes existing governed read-model fields and does not mutate tenant data, adapters, canonical objects, or mart readers.

## Client Applicability

- All clients: Tower users receive the corrected executive truth rules and the four-tab surface wording.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower Executive View reads `approvedInvestmentUsd` directly and renders `not loaded` when it is absent.
- Tower value-claim counts read `valueClaimCount` directly instead of mixing claim, program, and review-queue populations.
- Gate prose now follows the live proof gate and reconciles visible usage signals with gate-cleared value.
- ECL projection and serving-surface diagnostics render after the Tower Command Center instead of before it.
- Tower serving-surface diagnostics use the active four-tab contract labels.

## QA / Validation

- Pass: `npx eslint src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/ecl/EclServingSurfaceCoverage.tsx 'src/app/(maestro)/tower/page.tsx' src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/tower/__tests__/tower-freshness-provenance.test.ts tests/e2e/tower-command-center.spec.ts`
- Pass: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/tower/__tests__/tower-freshness-provenance.test.ts --runInBand`
- Note: Jest emitted existing duplicate manual-mock warnings before reporting all targeted suites passing.

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. After deployment, run signed-in Tower browser proof for the affected tenant route and confirm the executive headline, claim counts, gate prose, freshness line, tab labels, and diagnostic panel order.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route after ACA deployment.

## Rollback Plan

Revert the PR and let the repo-owned Azure Container Apps main deploy workflow publish the prior Tower presentation behavior. No data rollback is required because this release does not write tenant data.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI run: To be added after PR creation.
- ACA revision and digest: To be captured after merge/deploy.
- Signed-in browser proof: To be captured after deployment.

## Known Gaps

This release fixes the truth-regression path and legacy diagnostic labels. It does not re-run a full pixel-diff against the external HTML design contract.
