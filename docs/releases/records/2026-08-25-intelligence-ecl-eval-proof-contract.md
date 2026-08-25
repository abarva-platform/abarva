# 2026-08-25-intelligence-ecl-eval-proof-contract — Intelligence ECL Eval Proof Contract

## Release ID

`2026-08-25-intelligence-ecl-eval-proof-contract`

## Status

`candidate`

## Plain-English Summary

This release tightens the Intelligence ECL proof path. The ECL serving-context retriever now carries explicit proof-boundary guidance alongside real serving-view rows so aVa can answer from the new ECL surfaces with the right business terms, refusal language, and evidence caveats. The consultant-eval harness also accepts business-safe missing-evidence wording and fixes an impossible refusal check that could reject a correct answer for naming the unavailable concept it was refusing to calculate.

## Layer Impact

- `global-control-lane` / Layer 4 Products: Intelligence Ask gains a stronger ECL serving-context source for provider-scoped ECL answers. The default provider is not changed.
- `global-control-lane` / QA and proof: the ECL aVa consultant eval remains strict about required findings, no fabricated precision, and no builder vocabulary, while avoiding false failures on semantically correct refusal wording.

## Client Applicability

- All clients: no default behavior change unless the caller explicitly requests the ECL projection provider.
- Specific clients: the current eval coverage is for the synthetic healthcare fixture.
- Internal only: proof-harness behavior and live-eval diagnostics.
- Public/demo only: none.
- Feature flag: no flag change.

## Changes Included

- `src/lib/intelligence/ask/retrievers/ecl-serving-context.ts`
- `scripts/ecl/run_ecl_ava_consultant_eval.mjs`

## QA / Validation

- `npm run ecl:ava-consultant-eval` — passed case-contract validation for 13 cases, including F1-F10 and 3 planted unanswerables.
- `npx eslint scripts/ecl/run_ecl_ava_consultant_eval.mjs src/lib/intelligence/ask/retrievers/ecl-serving-context.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — required before merge.
- Post-deploy requirement: rerun the signed-in live ECL aVa consultant eval against `?provider=ecl_projection_db`.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps deployment workflow to build and deploy the image, verify the ACA runtime invariant, then rerun the private-operator live eval against the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed proof.
- Worker image invariant: required if the deploy workflow updates worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the ECL aVa live eval must be rerun after deployment.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned deployment workflow. Since this release does not change schema, data, traffic routing, or default provider selection, rollback is code-only.

## Audit Evidence

- PR URL and merge commit.
- Local validation output from the commands above.
- ACA deployment run and runtime invariant after merge.
- Live eval proof bundle from the private-operator job.

## Known Gaps

This does not flip any default product provider and does not claim live aVa eval success until the post-deploy run passes.
