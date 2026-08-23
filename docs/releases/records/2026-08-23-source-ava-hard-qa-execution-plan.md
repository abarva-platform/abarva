# 2026-08-23-source-ava-hard-qa-execution-plan — Source aVa Hard-QA Execution Plan

## Release ID

`2026-08-23-source-ava-hard-qa-execution-plan`

## Status

`candidate`

## Plain-English Summary

Documents the execution plan for the existing Source aVa 50-question hard-QA harness. This adds no
runtime behavior, no prompt changes, no routes, no data access changes, and no tenant-data mutation.
It clarifies how the existing harness should be run, scored, and packaged so future live proof can
separate question-bank validity, captured-response scoring, API proof, and signed-in browser proof.

## Layer Impact

- Release lane: `global-control-lane`.
- QA / controls only: Source aVa audit execution guidance.
- Product runtime: no change.
- Data plane: no change.

## Client Applicability

- All clients: yes, because the QA harness is tenant-agnostic and uses runtime parameters for client,
  contract, event, and forbidden vendor terms.
- Specific clients: none.
- Internal only: yes.
- Feature flag: none.

## Changes Included

- `docs/testing/source-ava-hard-qa-execution-plan-2026-08-23.md`
- `docs/releases/records/2026-08-23-source-ava-hard-qa-execution-plan.md`

## QA / Validation

- `npm run audit:source-ava-hard-qa -- --out-dir /tmp/source-ava-hard-qa-lane-b-check --fail-on-question-bank` passed.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/audit/__tests__/source-ava-hard-qa.test.ts` passed.

## Rollout Plan

Merge through the standard pull-request lane if this documentation should be preserved in the repo.
No deployment, migration, feature flag, or data-plane action is required for this documentation-only
slice.

## Deployment Authority

- Repo-owned deploy workflow: not required for this documentation-only QA plan.
- Shared runtime mutators: none.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Live signed-in proof required: no, because this slice does not claim answer quality; it defines how
  to prove answer quality in a later run.

## Rollback Plan

Revert the documentation commit if the plan is superseded.

## Audit Evidence

- Local question-bank validation output at `/tmp/source-ava-hard-qa-lane-b-check`.
- Native Node test output for `scripts/audit/__tests__/source-ava-hard-qa.test.ts`.

## Known Gaps

This does not execute the 50 live questions. It prepares the execution protocol and confirms the
existing harness and question bank are runnable.

