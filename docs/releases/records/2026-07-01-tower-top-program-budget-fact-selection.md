# 2026-07-01-tower-top-program-budget-fact-selection — Tower Budget Ranking Fact Selection

## Release ID

`2026-07-01-tower-top-program-budget-fact-selection`

## Status

`candidate`

## Plain-English Summary

Tower top-program budget questions now load only program budget facts. This prevents value facts from crowding out budget facts and causing Claude to answer a budget-ranking question as a forecasted-value ranking.

## Layer Impact

- `global-control-lane`: Updates Tower answer retrieval behavior for all tenants.
- `runtime answer contract`: Reinforces the Tower rule that Tower owns numbers and Claude owns narrative only when synthesis is required.

## Client Applicability

- All clients: yes, for Tower top-program budget ranking questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`: narrows `tower_top_it_programs_by_budget` fact selection to `initiative_budget`.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds a regression asserting budget rankings do not retrieve the value view.

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
