# 2026-07-23-source-transition-artifact-prompts — Source Transition artifact prompt maturity

## Release ID

`2026-07-23-source-transition-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Adds governed Source artifact-generation prompt support for the Transition-stage artifacts: Transition Plan, Checkpoint Log, and Knowledge-Transfer Evidence. The change makes these artifacts prompt-backed in the Files lifecycle/standards matrix and prevents transition drafts from inventing selected vendors, contract dates, completed go/no-go checkpoints, KT sessions, runbook verification, or receiving-team sign-offs.

## Layer Impact

- `global-control-lane` — Source agent-generation layer: adds d29/d30/d31 prompt templates, upstream dependencies, and evidence-bound user-message assembly.
- `global-control-lane` — Source artifact lifecycle/read-model layer: lifecycle and standards export now derive prompt-backed labels for d29/d30/d31 from the generation registry.
- `global-control-lane` — Documentation/release-control layer: updates the Source backlog row for the artifact prompt/workflow maturity sequence.

## Client Applicability

- All clients: yes, wherever Source Transition artifact generation and Files lifecycle matrix surfaces are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `d29_transition_plan`, `d30_checkpoint_log`, and `d31_kt_evidence` prompt templates to `src/lib/source/agent-generation/prompt-registry.ts`.
- Adds prompt-registry regression coverage for Transition workflow sequencing, upstream blocking, uploaded transition evidence binding, checkpoint honesty, and KT evidence honesty.
- Adds lifecycle/standards CSV regression coverage so d29/d30/d31 project as prompt-backed with Claude model labels and no `No dedicated prompt` fallback.
- Updates `docs/backlog/source-product-backlog.md` to mark Pricing, Responses, and Evaluation as completed/proven and Transition as the active item #9 slice.

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
- Live signed-in proof required: yes, read-only proof on `app.abarva.ai` that d29/d30/d31 no longer show `No dedicated prompt`.

## Rollback Plan

Revert the merge commit. This removes Transition-stage prompt templates and lifecycle prompt-backed projection for d29/d30/d31. No migration rollback or data repair is required.

## Audit Evidence

- PR URL: TBD.
- Merge SHA: TBD.
- ACA deploy run: TBD.
- Independent ACA invariant: TBD.
- Signed-in proof: TBD.

## Known Gaps

Value prompt/workflow maturity remains open in SOURCE-ARTIFACT-AUTHORITY-001 item #9. This slice does not generate or mutate production artifacts during proof.
