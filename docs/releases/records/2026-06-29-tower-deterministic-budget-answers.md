# 2026-06-29-tower-deterministic-budget-answers — deterministic Tower IT-budget answers

## Release ID

`2026-06-29-tower-deterministic-budget-answers`

## Status

`candidate`

## Plain-English Summary

Exact Tower IT-budget questions now answer from governed Tower metric and fact packets without calling Claude. This covers questions such as "What is my IT budget?", "What is the current loaded IT budget for each portfolio company?", and "What is the current loaded IT budget for each IT function?" The response is still a visible-answer contract and the renderer still places it unchanged.

## Layer Impact

- `global-control-lane`: shared Tower answer behavior for all tenants using the CIO Tower answer path.
- `public-demo`: public logged-out homepage eyebrow contrast fix so the required axe gate remains green.
- `client-data-lane`: no schema or data change; the path consumes already-loaded `cio_tower.measure_results` and `cio_tower.facts`.

## Client Applicability

- All clients: yes, the exact IT-budget answer path is tenant-agnostic.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/cio-tower/answer.ts`
  - adds a deterministic visible-answer builder for `tower_total_it_spend`.
  - emits a budget-slice table from `view=it_budget` facts for each/by/per/list/table questions.
  - records prompt packages and answer traces with `deterministic-cio-tower-boundary-v1` so proof still captures raw output and rendered parity.
- `src/lib/cio-tower/__tests__/answer.test.ts`
  - asserts exact IT-budget slice questions emit a visible table from governed facts without Claude.
- `src/components/marketing/LoggedOutLandingPage.tsx`
  - darkens light-section eyebrow text and marker colors to meet accessible contrast on the public homepage.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`: passed, 17 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts`: passed.
- `git diff --check`: passed.
- `npm run release:check`: passed.
- Public axe accessibility: expected to pass after the contrast-only public homepage fix.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then rerun the private-VNet Tower answer executor and strict server-side scorer against the SkyHarbor 18-question sample.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual runtime mutation planned outside the approved main deploy workflow.
- Approved image digest: populated by the main ACA deploy workflow after merge.
- ACA runtime invariant: active revision, template image, and 100% traffic must match the main deploy image.
- Worker image invariant: private operator job must be restored to the idle image/command after VNet proof runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no UI change; private-VNet answer-trace proof required.

## Rollback Plan

Revert this PR on `main` and redeploy through the approved ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: to be added.
- CI run: to be added.
- Deploy revision/digest: to be added after merge.
- VNet executor result: to be added after deploy.
- Strict scorer result: to be added after deploy.

## Known Gaps

- This does not solve the shared `ai_egress_audit.tenant_mismatch` UUID/key logging warning.
- This moves exact IT-budget envelope/slice lookups to deterministic contracts. Other non-budget metric/advisory questions may still use Claude and need separate latency tuning.
