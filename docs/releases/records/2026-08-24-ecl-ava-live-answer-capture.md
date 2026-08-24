# 2026-08-24-ecl-ava-live-answer-capture — ECL aVa Live Answer Capture

## Release ID

`2026-08-24-ecl-ava-live-answer-capture`

## Status

`candidate`

## Plain-English Summary

Extends the ECL consultant evaluation runner so it can capture signed-in aVa answers from the Intelligence ask endpoint and score them against the current ECL consultant case bank. The default mode remains a local case-contract check; live answer proof is only claimed when `--capture-live` is run and accepted.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: no route, provider, or page behavior changes.
- QA / Proof: adds live-answer capture support to the ECL consultant eval harness.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: evaluation and proof tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Extends `scripts/ecl/run_ecl_ava_consultant_eval.mjs` with `--capture-live`.
- The live mode signs in through private browser proof or Clerk ticket, captures `/api/intelligence/ask` NDJSON, writes answer JSONL, and evaluates the rows with the same deterministic case checks.

## QA / Validation

- `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs` - passed.
- `npm run ecl:ava-consultant-eval` - passed in case-contract mode; 13 cases, F1-F10 covered, 3 planted-unanswerable cases.
- `npm run test:npm-script-targets` - passed; 851 scripts checked, 57 inherited missing targets baselined, 0 unbaselined missing targets.
- `git diff --check` - passed.
- `npm run release:check` - pending final gate before merge.

## Rollout Plan

Merge to `main`. This is an evaluation-tooling change only. It does not require Azure Container Apps deployment, data-plane mutation, provider cutover, or traffic movement. A governed private operator run can execute the live capture after merge.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming aVa answer quality.

## Rollback Plan

Revert the PR to remove live capture mode. The case-contract eval mode remains available from the previous release if this slice is reverted separately.

## Audit Evidence

Inspect the PR, local command output, and any future `reports/ecl-ava-consultant-eval/live-answers.jsonl` plus `summary.json` produced by `--capture-live`.

## Known Gaps

This PR adds the ability to capture and score live answers. It does not itself execute the governed private operator run, and it does not claim aVa answer quality until that run is accepted.
