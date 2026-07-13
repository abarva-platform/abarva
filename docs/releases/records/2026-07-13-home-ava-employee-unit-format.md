# 2026-07-13-home-ava-employee-unit-format — Home aVa Employee Unit Guard

## Release ID

`2026-07-13-home-ava-employee-unit-format`

## Status

`candidate`

## Plain-English Summary

Home aVa now preserves employee/headcount values as counts in enterprise-profile answer packets. This prevents a valid value such as `58,000 employees` from being displayed as a currency value such as `$58K`.

## Layer Impact

- global-control-lane: improves shared Home aVa answer formatting and Claude synthesis instructions for all tenants.
- Data layer: no source data is changed, no candidate is promoted, and no Active Tenant Access update is made.
- Runtime UI: answer packet tables and model instructions preserve units more accurately.

## Client Applicability

- All clients: applies when Home aVa renders enterprise-profile employee/headcount fields.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/home/know/v7-home-ask.ts` appends the `employees` unit to enterprise-profile table values.
- `src/lib/home/know/home-know-claude-synthesis.ts` instructs the model that employee/headcount values are counts, not currency.
- `src/lib/home/know/__tests__/v7-home-ask.test.ts` adds a Meridian regression for `58,000 employees` and blocks `$58K`.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand`
- Pass: `npx eslint src/lib/home/know/v7-home-ask.ts src/lib/home/know/home-know-claude-synthesis.ts src/lib/home/know/__tests__/v7-home-ask.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Not run: signed-in Home crawl.

## Rollout Plan

Merge through the normal PR path. The ACA main workflow deploys the fixed answer packet/prompt. Then run the focused signed-in Home crawl to prove the expanded aVa response no longer renders employee count as currency.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by deployment proof where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, focused Home crawl.

## Rollback Plan

Revert the unit-format and prompt changes if they cause regressions. No data rollback is required because this release does not mutate tenant data.

## Audit Evidence

- PR URL: pending.
- Regression test: pending.
- Deploy run: pending.
- Signed-in Home crawl transcript and screenshot: pending.

## Known Gaps

This release does not change enterprise profile source data, candidate generation, Home page layout, or promotion behavior.
