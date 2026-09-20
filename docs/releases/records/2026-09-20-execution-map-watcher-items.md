# 2026-09-20-execution-map-watcher-items - Place new watcher findings

## Release ID

`2026-09-20-execution-map-watcher-items`

## Status

`candidate`

## Plain-English Summary

Six newly filed execution findings and this mapping repair are now placed in the platform-integrity track, allowing the strict generated queue to expose them instead of refusing an incomplete view.

## Layer Impact

`internal-admin`: internal execution tooling only. No product, data, schema, or tenant behavior changes.

## Client Applicability

- All clients: no client-facing change.
- Specific clients: none.
- Internal only: execution-board and queue operators.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Place `T-404` through `T-409` and `T-603` in platform integrity.
- Preserve the structure-only map contract and existing status-key refusal.

## QA / Validation

- PASS: before the change, the live board refused six unmapped items.
- PASS: after the change, the live board reports zero unmapped items.
- PASS: the execution queue behavior suite passes 24/24 checks.
- PASS: removing a new mapping makes live generation fail and name the missing item.
- PASS: TypeScript, focused ESLint, release control, and zero-deletion checks run before push.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned main deploy may publish the repository revision, although the map is consumed only by internal operator tooling.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if triggered.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolved by the workflow if it runs.
- ACA runtime invariant: read-only verification after deploy if it runs.
- Worker image invariant: read-only verification after deploy if it runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no product behavior changed; none claimed.

## Rollback Plan

Revert the merge commit. The strict generator will again refuse until every backlog item is placed.

## Audit Evidence

Inspect the pull request, live before/after board output, queue behavior suite, and focused mapping-removal mutation.

## Known Gaps

The mapped findings remain open work. This release assigns structure only and does not claim any finding is resolved.
