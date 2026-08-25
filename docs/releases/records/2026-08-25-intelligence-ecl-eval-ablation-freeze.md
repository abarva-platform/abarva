# 2026-08-25-intelligence-ecl-eval-ablation-freeze — Intelligence ECL Eval Ablation Freeze

## Release ID

`2026-08-25-intelligence-ecl-eval-ablation-freeze`

## Status

`candidate`

## Plain-English Summary

This release stops the Intelligence ECL live-eval alias loop. It freezes the validator alias policy, caps the F10 refusal aliases, adds a live ablation mode that withholds the ECL evidence packet, and wires the eval contract into the local ECL pre-deploy gate.

Follow-up correction: live capture now passes the precomputed surface context into the browser execution context instead of calling a Node-only helper from `page.evaluate`, and emits a compact summary line so ACA's bounded log tail preserves the baseline/ablation counts.

## Layer Impact

- `global-control-lane` / QA and proof: eval quality is measured with baseline and evidence-withheld runs.
- `global-control-lane` / Layer 4 Products: no product route, default provider, schema, or data-plane behavior changes.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: current proof coverage is for the synthetic healthcare fixture.
- Internal only: private-operator eval execution and proof diagnostics.
- Public/demo only: none.
- Feature flag: no flag change.

## Changes Included

- `scripts/ecl/run_ecl_ava_consultant_eval.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `package.json`

Follow-up correction:

- `scripts/ecl/run_ecl_ava_consultant_eval.mjs`

## QA / Validation

- `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs` — pass.
- `npm run ecl:ava-consultant-eval` — pass.
- `npm run ecl:product-browser:predeploy-gate` — pass, including `intelligence_ava_eval_contract`.
- `npx eslint scripts/ecl/run_ecl_ava_consultant_eval.mjs scripts/ecl/run_product_ecl_predeploy_gate.mjs` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — pass.
- `npm run release:check` — pass.

Follow-up correction:

- `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs` — pass.
- `npm run ecl:ava-consultant-eval` — pass.
- `npm run ecl:product-browser:predeploy-gate` — pass.
- `npx eslint scripts/ecl/run_ecl_ava_consultant_eval.mjs` — pass.

## Rollout Plan

Merge to `main`. No live success claim is made from this PR. The next private-operator proof must use `ecl:ava-consultant-eval:capture-live-ablation` and report baseline accepted count beside evidence-withheld accepted count.

## Deployment Authority

- Repo-owned deploy workflow: required if this PR is deployed.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before any post-deploy proof.
- Worker image invariant: required if worker jobs are updated.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming eval success.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned deployment workflow. Since this release does not change schema, data, traffic routing, or default provider selection, rollback is code-only.

## Audit Evidence

- PR URL and merge commit.
- Local validation output.
- Any post-merge ACA deployment run and runtime invariant.
- Private-operator live eval proof bundle, including ablation.

## Known Gaps

Run-10 remains the current live result: 12 of 13 accepted, F10 failed on the evidence-needed requirement, and the private operator restored idle. This release does not reclassify run-10 as a pass.

Run-11 initial attempts identified a capture harness defect: the browser-context fetch returned error events with empty answers because `page.evaluate` referenced a Node-only helper. Those runs are harness failures, not aVa reasoning results. Idle restoration was verified.
