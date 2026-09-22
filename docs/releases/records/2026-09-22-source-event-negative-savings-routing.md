# 2026-09-22 Source Event Negative Savings Routing

## Release ID

`2026-09-22-source-event-negative-savings-routing`

## Status

`candidate`

## Plain-English Summary

Source aVa event-stage questions that prohibit savings estimates should stay on the event readiness path instead of being treated as value-ledger or savings requests solely because the prompt contains the word savings.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product projection: Source aVa prompt routing is narrowed so an event-scoped blocker/next-action question remains scoped to event readiness.
- Data layers: no tenant data, source adapter, canonical model, migration, or data-plane changes.

## Client Applicability

- All clients: Source aVa prompt routing behavior after the release reaches the shared app runtime.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add behavioral coverage for the exact negative-savings event-stage prompt.
- Preserve positive coverage for genuine savings/value-ledger questions.
- Narrow Source aVa routing so prohibition language does not override event readiness intent.

## QA / Validation

- Pass: red-first focused behavior test failed because the exact event-scoped blocker prompt returned the generic Source answer instead of the stage-readiness answer.
- Pass: focused Source answer-engine suite passed with the new negative-savings blocker regression and explicit value-ledger artifact-standard coverage.
- Pass: mutation check failed the focused suite when the new event-advancement guard was temporarily removed, then passed after restoration.
- Pass: `npm run typecheck`.
- Pass: `npx eslint src/` completed with existing warnings and no errors.
- Pass: `npm run release:check`.
- Pending: pull-request CI.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned Azure Container Apps main deploy workflow handles runtime rollout after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded by the repo-owned deploy workflow.
- ACA runtime invariant: required before calling the merge deployed.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming signed-in acceptance.

## Rollback Plan

Revert the squash commit through a pull request. No data rollback is required.

## Audit Evidence

- Pull request, focused test output, mutation-check output, static checks, release check, CI status, and repo-owned deploy proof after merge.

## Known Gaps

No tenant data mutation, no live signed-in acceptance, and no deployment/runtime proof are claimed by this candidate record.
