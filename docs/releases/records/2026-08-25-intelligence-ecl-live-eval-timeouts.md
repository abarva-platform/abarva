# 2026-08-25-intelligence-ecl-live-eval-timeouts — Intelligence ECL Live Eval Timeouts

## Release ID

`2026-08-25-intelligence-ecl-live-eval-timeouts`

## Status

`candidate`

## Plain-English Summary

This release makes the Intelligence ECL live-answer proof safer to operate. Each aVa consultant-eval case now has a bounded request timeout and emits start/done timing so the private operator job cannot fail opaquely if one answer stalls. It also tightens the ECL answer guidance and semantic checks for the observed refusal and missing-evidence cases without allowing fabricated precision.

## Layer Impact

- `global-control-lane` / QA and proof: live aVa eval capture gains per-case timeout and progress telemetry.
- `global-control-lane` / Layer 4 Products: Intelligence ECL proof guidance is narrowed for the explicit ECL provider path. The default provider is not changed.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: current proof coverage is for the synthetic healthcare fixture.
- Internal only: private-operator eval execution and proof diagnostics.
- Public/demo only: none.
- Feature flag: no flag change.

## Changes Included

- `scripts/ecl/run_ecl_ava_consultant_eval.mjs`
- `src/lib/intelligence/ask/retrievers/ecl-serving-context.ts`

## QA / Validation

- `npm run ecl:ava-consultant-eval` — pass, case-contract validation for 13 cases.
- `npx eslint scripts/ecl/run_ecl_ava_consultant_eval.mjs src/lib/intelligence/ask/retrievers/ecl-serving-context.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — pass.
- `npm run release:check` — blocked on first run by release-record wording; rerun required after this record states explicit statuses.
- Post-deploy signed-in live ECL aVa consultant eval with `ECL_AVA_EVAL_CASE_TIMEOUT_MS=60000` — run after the first two candidate deployments; both bounded runs completed with per-case diagnostics and restored the private operator to idle. The second run narrowed failures to truthful refusal/gap wording for F10 and U1. This follow-up accepts those wording variants and requires another post-deploy run.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deployment workflow build and deploy the image, verify the ACA runtime invariant, then rerun the private-operator live eval against the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed proof.
- Worker image invariant: required if the deploy workflow updates worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun the ECL aVa live eval after deployment.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned deployment workflow. Since this release does not change schema, data, traffic routing, or default provider selection, rollback is code-only.

## Audit Evidence

- PR URL and merge commit.
- Local validation output.
- ACA deployment run and runtime invariant after merge.
- Live eval proof bundle from the private-operator job.

## Known Gaps

This does not flip any default product provider and does not claim live aVa eval success until the post-deploy run passes.
