# 2026-08-03-tower-page-data-model-audit — Tower Page And Data-Model Audit

## Release ID

`2026-08-03-tower-page-data-model-audit`

## Status

`candidate`

## Plain-English Summary

Audits the current Tower command center against the local governed Tower schema and hardens the Tower shell so the page can shrink horizontally instead of clipping content on authenticated desktop widths.

## Layer Impact

Lane: `global-control-lane`.

Products: Tower command center presentation and documentation only. The change updates CSS layout safety, command-center wording, aVa context metadata, and audit reports. It does not alter source intake, canonical data, schema, loaders, tenant data, prompts, or claim calculations.

## Client Applicability

- All clients: Yes, for users who can access Tower.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.module.css`
- `src/components/tower/command-center/__tests__/css-contract.test.ts`
- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`
- `src/components/tower/command-center/views/EvidenceView.tsx`
- `src/lib/tower/command-center/derive.ts`
- `src/lib/tower/command-center/types.ts`
- `src/lib/tower/command-center/view-model.ts`
- `src/lib/tower/command-center/__fixtures__/design-fixture.ts`
- `src/lib/tower/command-center/__tests__/view-model.test.ts`
- `reports/TOWER_ACTUAL_DATA_MODEL_AUDIT.md`
- `reports/TOWER_CURRENT_PAGE_AUDIT.md`
- `reports/TOWER_DATA_QUALITY_AND_RECONCILIATION.md`

## QA / Validation

- Pass: `npx jest src/components/tower/command-center/__tests__/css-contract.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/tower/command-center/__tests__/view-model.test.ts --runInBand`
- Pass: `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/views/EvidenceView.tsx src/lib/tower/command-center/derive.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts src/components/tower/command-center/__tests__/css-contract.test.ts src/lib/tower/command-center/__tests__/view-model.test.ts`
- Pass: `npm run release:check`
- Pending: ACA deployment evidence after merge.
- Pending: signed-in browser proof for the Tower route after deployment.

## Rollout Plan

Merge the PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime. No migration, data build, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route visual check after deployment.

## Rollback Plan

Revert the CSS and metadata/report changes and merge through the same repo-owned deployment workflow. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5890
- Local DB evidence: `reports/TOWER_ACTUAL_DATA_MODEL_AUDIT.md`, `reports/TOWER_CURRENT_PAGE_AUDIT.md`, and `reports/TOWER_DATA_QUALITY_AND_RECONCILIATION.md`.
- CI/release validation: Local focused Tower tests, targeted lint, and release gate passed.
- ACA deployment run: Pending.
- Signed-in Tower route proof: Pending.

## Known Gaps

The branch fixes the immediate horizontal shell contract and records the page/data-model audit. It does not complete the larger Tower redesign. The audit identifies that the current local Tower value-claim layer has no calculated value, baseline, target, actual, Finance attestation, or business attestation rows, so the Tower surface still needs a page-by-page sparse-state redesign before it can feel executive-grade.
