# 2026-09-11-moves-premium-evidence-carryforward — Moves Premium Evidence Carry-Forward

## Release ID

`2026-09-11-moves-premium-evidence-carryforward`

## Status

`candidate`

## Plain-English Summary

Strategic Moves premium artifact generation now preserves exact captured evidence across phases instead of letting generated phase digests collapse it into broad narrative. Later phase artifacts receive the recorded baseline metrics in the prompt and the quality bar requires those exact evidence terms when they are available.

## Layer Impact

Products (`global-control-lane`): Strategic Moves artifact generation, prompt construction, generated phase digest persistence, and premium artifact quality validation are updated for the shared product path.

Canonical model (`global-control-lane`): No schema or tenant-data model change. Existing captured phase data and generated deliverable structured data are read and carried forward more faithfully.

## Client Applicability

- All clients: Applies to Strategic Moves premium artifact generation.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Preserve baseline metrics, extracted metrics, evidence taxonomy, and client-actionable missing inputs in generated phase digests.
- Re-promote carried evidence specificity for later phase artifacts when exact structured evidence is already present.
- Add a recorded-baseline-metrics prompt block so exact phase-capture values are visible to the premium artifact model.
- Apply exact-evidence-term validation to the generic premium artifact branch, including later phase and terminal artifact types.
- Add focused regression coverage for digest carry-forward, prompt binding, terminal-phase re-promotion, and golden-bar enforcement.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/__tests__/generated-phase-digest.test.ts src/lib/programs/__tests__/assemble-solution-context.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand` — passed.

## Rollout Plan

Merge through pull request, then deploy through the repo-owned Azure Container Apps main deployment workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Determined by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because generated artifact workers must run the same image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, run a signed-in Strategic Moves generation smoke and artifact content audit after deployment.

## Rollback Plan

Revert this change and redeploy through the repo-owned Azure Container Apps main deployment workflow. No migration rollback is required.

## Audit Evidence

- Pull request for this release.
- Focused Jest output listed above.
- Azure Container Apps deployment run and runtime invariant proof after merge.
- Signed-in product smoke output and generated artifact content audit after deploy.

## Known Gaps

No schema or data cleanup is included.
