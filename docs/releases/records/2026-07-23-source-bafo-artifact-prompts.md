# 2026-07-23-source-bafo-artifact-prompts — Source BAFO artifact prompt maturity

## Release ID

`2026-07-23-source-bafo-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Adds governed Source artifact-generation prompt support for the BAFO-stage artifacts: BAFO Question Pack and BAFO Round Log. The change makes these artifacts prompt-backed in the Files lifecycle/standards matrix and prevents BAFO drafts from inventing finalists, concessions, price deltas, written acceptances, closed clarifications, due dates, legal terms, or walk-away positions.

## Layer Impact

- `global-control-lane` — Source agent-generation layer: adds d22/d23 prompt templates, upstream dependencies, and evidence-bound user-message assembly.
- `global-control-lane` — Source artifact lifecycle/read-model layer: lifecycle and standards export now derive prompt-backed labels for d22/d23 from the generation registry.
- `global-control-lane` — Documentation/release-control layer: updates the Source backlog row for the artifact prompt/workflow maturity sequence.

## Client Applicability

- All clients: yes, wherever Source BAFO artifact generation and Files lifecycle matrix surfaces are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `d22_bafo_question_pack` and `d23_bafo_round_log` prompt templates to `src/lib/source/agent-generation/prompt-registry.ts`.
- Adds prompt-registry regression coverage for BAFO workflow sequencing, upstream blocking, uploaded BAFO evidence binding, P0/P1 trap-to-question controls, and BAFO round honesty.
- Adds lifecycle/standards CSV regression coverage so d22/d23 project as prompt-backed with Claude model labels and no `No dedicated prompt` fallback.
- Updates `docs/backlog/source-product-backlog.md` to mark the already-deployed Pricing, Responses, Evaluation, Transition, and Value prompt slices and identify BAFO as the active item #9 slice.

## QA / Validation

- `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — pass, 43 tests.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — pass.
- `npm run release:check` — pass.

## Rollout Plan

Merge through a governed PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image to `app.abarva.ai`. After deploy, run the independent ACA runtime invariant and signed-in read-only Source Files proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow and independent invariant check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, read-only proof on `app.abarva.ai` that d22/d23 no longer show `No dedicated prompt`.

## Rollback Plan

Revert the merge commit. This removes BAFO-stage prompt templates and lifecycle prompt-backed projection for d22/d23. No migration rollback or data repair is required.

## Audit Evidence

- PR URL: TBD.
- Merge SHA: TBD.
- ACA deploy run: TBD.
- Independent ACA invariant: TBD.
- Signed-in proof: TBD.

## Known Gaps

Earlier ungrafted artifact families remain open after this BAFO slice (for example d06/d08/d10/d12 and d25-d28). This slice does not generate or mutate production artifacts during proof.
