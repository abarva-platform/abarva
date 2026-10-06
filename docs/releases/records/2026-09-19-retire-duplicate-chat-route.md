# 2026-09-19-retire-duplicate-chat-route — Retire Duplicate Chat Route

## Release ID

`2026-09-19-retire-duplicate-chat-route`

## Status

`candidate`

## Plain-English Summary

Remove an unused generic chat endpoint that duplicated the governed agent-chat path. Mounted product experiences already use the authenticated agent endpoint, so retaining the second handler created unnecessary context, policy, and maintenance risk.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, products: removes an unmounted API surface. Mounted product chat remains on the existing governed agent endpoint.
- Control plane: adds a regression guard that rejects a new direct client of the retired path.

## Client Applicability

- All clients: the unmounted duplicate endpoint is removed.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Remove `src/app/api/chat/route.ts` and its obsolete route-specific test.
- Add a behavior guard proving the route is absent and mounted source files do not call it.
- Update the Anthropic-only guard and architecture inventory to reflect the single mounted agent path.

## QA / Validation

- PASS: focused retirement and Anthropic-only guard suites, 6 tests.
- PASS: scoped ESLint.
- PASS: TypeScript validation with an 8 GB Node heap.
- PASS: release-control check.
- NOT RUN: pull-request CI; required before merge.

## Rollout Plan

Squash-merge through the protected branch and let the repository-owned ACA main deploy workflow publish the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: template, 100%-traffic revision, and required workers must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: verify mounted chat surfaces still post through the governed agent endpoint; the retired route itself should return not found.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned workflow. Do not restore request-body-derived tenant context.

## Audit Evidence

- Pull request diff and CI checks.
- ACA deployment run and digest readback after merge.
- Route-not-found check for the retired endpoint and a signed-in mounted-chat smoke.

## Known Gaps

External callers outside this repository cannot be enumerated. Repository search found no mounted client; any undocumented caller receives a not-found response after deployment.
