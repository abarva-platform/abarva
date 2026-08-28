# 2026-08-28-tower-value-proof-evidence-state-label — Tower Value Proof Evidence-State Label

## Release ID

`2026-08-28-tower-value-proof-evidence-state-label`

## Status

`candidate`

## Plain-English Summary

Tower Value Proof now labels the conversion chart as evidence states instead of implying the visible bars are an ordered waterfall. The wording better matches the screen behavior: planned value, support, measurement, finance validation and realized value are separate proof states.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Tower UI copy only. No source data, canonical model, loader, adapter, projection, cube, or runtime environment setting changes.

## Client Applicability

- All clients: Tower users receive the clearer label after the normal web deploy.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/ContractTabs.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- PASS: `npx eslint src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; the approved Azure Container Apps main deploy workflow builds and deploys the web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow when worker jobs are updated.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify `/tower?tab=funnel` renders `Seven evidence states`.

## Rollback Plan

Revert the UI copy commit and redeploy through the approved ACA main deploy workflow.

## Audit Evidence

- Pull request for this release candidate.
- CI and release gate output.
- Post-deploy ACA runtime invariant and signed-in Tower route proof.

## Known Gaps

The chart remains a state comparison rather than a cumulative waterfall. Deeper value-model changes are out of scope for this wording-only release.
