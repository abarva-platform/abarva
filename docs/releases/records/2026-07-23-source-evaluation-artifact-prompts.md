# 2026-07-23-source-evaluation-artifact-prompts — Source Evaluation artifact prompt maturity

## Release ID

`2026-07-23-source-evaluation-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Adds governed Source artifact-generation prompt support for the Evaluation-stage artifacts: Evaluation Scorecard, Weight Governance Record, and Disqualification Rationale. The change makes these artifacts prompt-backed in the Files lifecycle/standards matrix and prevents evaluation drafts from inventing locked weights, scores, vendor rankings, or disqualification decisions.

## Layer Impact

- `global-control-lane` — Source agent-generation layer: adds d16/d17/d18 prompt templates, upstream dependencies, and evidence-bound user-message assembly.
- `global-control-lane` — Source artifact lifecycle/read-model layer: lifecycle and standards export now derive prompt-backed labels for d16/d17/d18 from the generation registry.
- `global-control-lane` — Documentation/release-control layer: updates the Source backlog row for the artifact prompt/workflow maturity sequence.

## Client Applicability

- All clients: yes, wherever Source Evaluation artifact generation and Files lifecycle matrix surfaces are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `d17_weight_log`, `d16_scorecard`, and `d18_disqualification_log` prompt templates to `src/lib/source/agent-generation/prompt-registry.ts`.
- Adds prompt-registry regression coverage for Evaluation workflow sequencing, upstream blocking, uploaded evidence binding, and no-invented-disqualification behavior.
- Adds lifecycle/standards CSV regression coverage so d16/d17/d18 project as prompt-backed with Claude model labels and no `No dedicated prompt` fallback.
- Updates `docs/backlog/source-product-backlog.md` to mark Pricing and Responses as completed/proven and Evaluation as the active item #9 slice.

## QA / Validation

- `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` — pass.
- `npm test -- --runInBand --runTestsByPath src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — pass.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — required before PR.
- `npm run release:check` — required before PR.

## Rollout Plan

Merge through a governed PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image to `app.abarva.ai`. After deploy, run the independent ACA runtime invariant and signed-in read-only Source Files proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow and independent invariant check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, read-only proof on `app.abarva.ai` that d16/d17/d18 no longer show `No dedicated prompt`.

## Rollback Plan

Revert the merge commit. This removes Evaluation-stage prompt templates and lifecycle prompt-backed projection for d16/d17/d18. No migration rollback or data repair is required.

## Audit Evidence

- PR URL: TBD.
- Merge SHA: TBD.
- ACA deploy run: TBD.
- Independent ACA invariant: TBD.
- Signed-in proof: TBD.

## Known Gaps

Transition and Value prompt/workflow maturity remain open in SOURCE-ARTIFACT-AUTHORITY-001 item #9. This slice does not generate or mutate production artifacts during proof.
