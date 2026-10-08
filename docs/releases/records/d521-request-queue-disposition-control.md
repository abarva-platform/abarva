# 2026-10-06 Request Queue Disposition Control

## Release ID

`2026-10-06-source-request-queue-disposition-control`

## Status

`candidate`

## Plain-English Summary

The Source request queue now presents an explicit intake decision for each imported request. An operator can accept, return, merge, or decline with a rationale. Decisions are shown separately from requests awaiting a decision; a merged request remains readable and names the request that survives. Event creation from an imported request requires its current-version accepted disposition at both the visible control and API boundary. This is request intake only; the decision does not itself create an event or contact a supplier.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical authority: a tenant-scoped read retrieves request-disposition records already defined by the companion storage release. It does not create or alter canonical supplier or commercial facts.
- Layer 4 Source projection: the request queue displays decisions and sends a version-bound command to the existing governed intake endpoint. If the authority relation is unavailable, the queue remains visible but decision controls fail closed.

## Client Applicability

- All clients: the queue surface is available to signed-in Source operators for their active tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added; the decision control depends on the separately applied request-disposition relation.

## Changes Included

- One tenant-scoped bulk disposition read, server page projection, request-queue decision panel, and a fail-closed imported-request event-creation guard with focused behavior tests.
- No migration or data load in this release. The storage migration remains a separate, authorization-gated operation.

## QA / Validation

- Red-first component behavior tests failed on the missing control and resolved grouping, then passed after implementation.
- Tenant-predicate mutation failed the focused authority test and was restored.
- A route test demonstrated that undecided, returned, merged and declined requests could create events before the guard; the guard now refuses each, and returns an unavailable error when its authority cannot be read.
- Focused unit tests, TypeScript, ESLint, release checks and applicable hosted CI must pass before merge.
- Live signed-in decision and canonical readback remain owed after the relation is separately authorized and applied.

## Rollout Plan

Squash-merge after review and applicable CI. The repo-owned ACA main workflow builds and deploys the exact main SHA. Independently verify immutable digest parity on the web template, sole healthy 100%-traffic revision and both required workers. The control remains disabled when the disposition relation is absent; a separate exact-file authorization and repo-owned apply are needed before a positive signed-in decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: establish after merge and build.
- ACA runtime invariant: establish after deploy; not yet claimed.
- Worker image invariant: establish after deploy; not yet claimed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the separate schema apply.

## Rollback Plan

Revert this UI/read change through a PR and the same ACA main workflow. Do not delete request-disposition records or reverse a shared schema outside its separately approved database runbook.

## Audit Evidence

Focused Jest output, mutation run, TypeScript and ESLint output, PR/CI, official ACA run, independent digest/runtime readback and later signed-in request/version readback.

## Known Gaps

The request-disposition migration is not applied by this release. No request decision, signed-in stage exit, supplier communication, award or contract is inferred from the code change.
