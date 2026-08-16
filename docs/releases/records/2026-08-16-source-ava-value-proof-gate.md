# 2026-08-16-source-ava-value-proof-gate — Source aVa Value-Proof Language Guard

## Release ID

`2026-08-16-source-ava-value-proof-gate`

## Status

`candidate`

## Plain-English Summary

This release tightens Source aVa contract answers so pending Finance/Tower evidence is not described as approved realized value. aVa can still explain that finance evidence exists, but it must say approved realized value remains zero until the Finance/Tower confirmation request is approved.

## Layer Impact

- `global-control-lane`: Updates the Source aVa grounding and answer-quality guard used by contract optimization answers for every tenant.
- Layer 4 Products: Source aVa answer behavior changes on contract optimization surfaces.
- Layer 3 Canonical Enterprise Model: No canonical data shape or stored value changes.

## Client Applicability

- All clients: Source contract optimization aVa answers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/facts/view/ava-contract-grounding-context.ts`
- `src/lib/source/ava/answer-quality-gate.ts`
- Focused regression tests for the grounding block and answer-quality repair.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/answer-quality-gate.test.ts --runInBand` — passed.
- Wider lint, typecheck, release check, PR CI, ACA deploy, and live proof are required before this can be marked released.

## Rollout Plan

Merge through pull request to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared Product/Lab runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the realized-value aVa question and confirm pending Finance/Tower evidence is not stated as approved realized value.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps main workflow. No data migration rollback is required.

## Audit Evidence

- Pull request URL and CI run once opened.
- Focused Jest output for the two Source aVa regression suites.
- ACA runtime invariant proof after deployment.
- Signed-in aVa response capture for the realized-value question after deployment.

## Known Gaps

- This does not complete the remaining full aVa question battery. It only fixes the realized-value wording defect found by the captured-response run.
