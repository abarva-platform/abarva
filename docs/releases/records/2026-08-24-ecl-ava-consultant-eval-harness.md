# 2026-08-24-ecl-ava-consultant-eval-harness — ECL Consultant Eval Harness

## Release ID

`2026-08-24-ecl-ava-consultant-eval-harness`

## Status

`released`

## Plain-English Summary

Adds the first current ECL-focused consultant evaluation contract for the Intelligence path and stops advertising a historical live-answer evaluation runner that is not implemented in this repository. The new runner starts with the ten Meridian demo findings plus planted unanswerable cases, and can evaluate supplied aVa answer rows when live-answer capture is wired.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: adds an evaluation harness for Intelligence answer quality against ECL-backed findings; no product route is repointed.
- Control / QA: adds a named-ref npm script target reconciliation check so package scripts cannot point at missing repo files.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: evaluation and CI guardrails.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `datasets/evals/meridian-healthcare/ecl-consultant-eval-cases.jsonl`.
- Adds `scripts/ecl/run_ecl_ava_consultant_eval.mjs`.
- Adds `scripts/ecl/__tests__/run-npm-script-target-reconciliation-tests.mjs`.
- Adds `npm run ecl:ava-consultant-eval` and `npm run test:npm-script-targets`.
- Retires the historical SCB live-answer workflow path with an explicit report instead of invoking a missing runner.

## QA / Validation

- `npm run ecl:ava-consultant-eval -- --out reports/ecl-ava-consultant-eval/summary.json` - passed; 13 cases, F1-F10 covered, 3 planted-unanswerable cases, no live aVa answer run claimed.
- `ECL_RECONCILE_REF=<staged-tree> npm run test:npm-script-targets` - passed; 851 scripts checked, 57 inherited missing targets baselined, 0 unbaselined missing targets.
- `ECL_RECONCILE_REF=<staged-tree> npm run test:ecl-projection-schema-reconciliation` - passed; 40 serving surfaces and 12 product projections reconciled.
- `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs && node --check scripts/ecl/__tests__/run-npm-script-target-reconciliation-tests.mjs` - passed.
- `git diff --cached --check` - passed.
- `npm run release:check` - pending final gate before merge.

## Rollout Plan

Merge to `main`. This is a repository QA/evaluation change only. It does not require Azure Container Apps deployment, data-plane mutation, provider cutover, or traffic movement.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the new eval harness and restore the previous workflow/script declarations.

## Audit Evidence

Inspect the PR, local command output, and the generated `reports/ecl-ava-consultant-eval/summary.json` from `npm run ecl:ava-consultant-eval`.

## Known Gaps

This PR validates the ECL consultant-eval case contract and can score supplied answer rows. It does not yet execute signed-in aVa answers against the live Intelligence API, and it does not evaluate Tower, Source, Moves, or Home module banks.
