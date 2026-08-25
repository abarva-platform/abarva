# 2026-08-25-intelligence-ecl-proof-answer-grounding — Intelligence ECL Proof Answer Grounding

## Release ID

`2026-08-25-intelligence-ecl-proof-answer-grounding`

## Status

`candidate`

## Plain-English Summary

This release adds a bounded answer path for Intelligence questions that are explicitly grounded in ECL product-serving evidence. When a question maps to a governed ECL demo finding and the relevant serving view evidence is present, aVa now answers from that proof contract instead of relying on free-form synthesis to infer the required consultant framing. The eval validator aliases remain frozen; this change improves the answer path, not the scoring gate.

## Layer Impact

- Release lane: `global-control-lane` because the Intelligence answer path is shared runtime behavior, but activation is limited to ECL provider context.
- Layer 3 canonical model: no schema, data, migration, or load change.
- Layer 4 products: Intelligence answer generation can use ECL serving sources to produce a proof-shaped answer for ECL-backed consultant findings. Existing non-ECL and evidence-withheld paths are unchanged.

## Client Applicability

- All clients: no default-provider or broad answer behavior change outside ECL provider context.
- Specific clients: applies to the current synthetic ECL proof tenant when `provider=ecl_projection_db` evidence is present.
- Internal only: yes, for proof/eval hardening before default cutover.
- Public/demo only: no public-route change.
- Feature flag: none.

## Changes Included

- Added `src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`.
- Wired the ECL proof-answer path into `src/lib/intelligence/ask/index.ts` after serving evidence retrieval and product-truth validation.
- Added `src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`.

## QA / Validation

- PASS — `node --check src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`
- PASS — `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs`
- PASS — `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`
- PASS — `npm run ecl:ava-consultant-eval`
- PASS — `npm run ecl:product-browser:predeploy-gate`
- PASS — `npx eslint src/lib/intelligence/ask/ecl-consultant-proof-answer.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`
- NOT RUN — post-deploy live baseline/ablation eval; requires merged commit and ACA deployment.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow must build and deploy the merged commit before live eval proof can be rerun. No data-plane mutation, default-provider cutover, or route repointing is included.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be captured by the deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming improved live Intelligence eval results.

## Rollback Plan

Revert this PR and redeploy the prior digest through the repo-owned ACA main deploy workflow. Because no schema or data changes are included, rollback is code-only.

## Audit Evidence

- PR for this release.
- Local unit, ECL eval-contract, predeploy, eslint, and release-check output.
- Post-merge ACA deploy run and runtime invariant.
- Follow-up live baseline/ablation eval report.

## Known Gaps

- This release does not claim browser/live proof. The live 13-case baseline and ablation must be rerun after deployment.
- It does not loosen the eval alias list.
- It does not mutate ECL data or serving views.
