# 2026-06-29-tower-budget-slice-contract-fix — Tower budget-slice answer routing

## Release ID

`2026-06-29-tower-budget-slice-contract-fix`

## Status

`candidate`

## Plain-English Summary

Tower now treats questions like "What is the IT budget for each function?" and "What is the IT budget for each portfolio company?" as IT-budget slice questions, not as generic top-program questions. The Claude prompt now tells the model to use the governed `it_budget` facts and emit a compact table when the user asks for each/by/per/list/table.

## Layer Impact

- `global-control-lane`: shared Tower answer routing and prompt contract for all tenants using the CIO Tower answer path.
- `client-data-lane`: no schema or data change; the fix changes how already-loaded Tower budget facts are selected and instructed.

## Client Applicability

- All clients: yes, Tower answer routing is shared.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/4178

- `src/lib/cio-tower/answer.ts`
  - expands IT-budget contract matching for budget slice questions.
  - adds budget-slice table instructions for "each/by/per/list/table" wording.
  - increases Claude visible-answer JSON budget from 900 to 1400 tokens.
- `src/lib/cio-tower/__tests__/answer.test.ts`
  - adds canaries for whole-portfolio, portfolio-company, and IT-function budget questions.
  - asserts that top-program questions still route to the program contract.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`: passed, 16 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts`: passed.
- `git diff --check`: passed.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new image, then rerun the private-VNet Tower answer executor against SkyHarbor's 18-question sample.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual runtime mutation planned outside the approved main deploy workflow.
- Approved image digest: populated by the main ACA deploy workflow after merge.
- ACA runtime invariant: active revision, template image, and 100% traffic must match the main deploy image.
- Worker image invariant: private operator job must be restored to the idle image/command after VNet proof runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no browser UI change; VNet answer-trace proof required.

## Rollback Plan

Revert this PR on `main` and redeploy through the approved ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4178
- CI run: to be added.
- Deploy revision/digest: to be added after merge.
- VNet executor result: to be added after deploy.

## Known Gaps

- This does not solve the shared `ai_egress_audit.tenant_mismatch` UUID/key logging warning.
- Real Claude metric questions still take materially longer than deterministic boundary responses; latency optimization is separate from this routing fix.
