# 2026-07-01-tower-top-program-aggregate-budget-visible — Tower Top Program Aggregate Budget

## Release ID

`2026-07-01-tower-top-program-aggregate-budget-visible`

## Status

`candidate`

## Plain-English Summary

Tower top-program budget answers now include the governed aggregate FY26 initiative budget value in the visible answer. This keeps deterministic budget-ranking answers aligned with the same metric packet the dashboard uses and allows the visible-answer contract to prove the required metric value is present.

## Layer Impact

- `global-control-lane`: Updates Tower answer behavior for all signed-in tenants.
- `runtime answer contract`: Strengthens Tower metric parity by requiring the aggregate budget packet value to appear in deterministic ranking answers.

## Client Applicability

- All clients: yes, for Tower top-program budget ranking questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`: adds the aggregate `initiative_budget_fy26` display value to deterministic top-program budget answers.
- `src/lib/cio-tower/__tests__/answer.test.ts`: asserts the aggregate metric value is visible and the full visible-answer validation passes.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`
  - Result: 24 tests passed.
  - Notes: existing duplicate Jest manual mock warnings and localstorage warning are unrelated to this change.
- Pass: `git diff --check`
- Not run yet: signed-in ACA proof. This requires merge and deployment to production ACA first.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun the focused Airline Demo top-program proof and the 30-question cross-surface smoke gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web app and worker job image update through the approved main deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this commit or roll back ACA traffic to the previous healthy revision. No schema or data migration is included.

## Audit Evidence

- PR URL: pending.
- Local QA, CI, ACA invariant, and signed-in smoke outputs pending.

## Known Gaps

The broader 30-question production smoke gate remains open until this hotfix is deployed and rerun.
