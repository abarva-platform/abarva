# 2026-09-19 QA inventory Tower route parity

## Release ID

`2026-09-19-qa-inventory-tower-route-parity`

## Status

`candidate`

## Plain-English Summary

Two internal QA inventories named a legacy Tower component that no route mounts. One of them also described that stale surface as ready with no caveat. This release makes both inventories name the current Tower command-center shell and keeps authenticated current-data acceptance explicit.

## Layer Impact

Release lane: `internal-admin`.

- Product runtime: no change.
- Canonical data: no change.
- QA authority: two deterministic inventories now match the mounted Tower route.
- Release control: the stale-claim burn-down loses the two corrected entries.

## Client Applicability

- All clients: no runtime change.
- Internal operators: corrected route-smoke and demo-walk instructions.
- Tenant data: none read or written.

## Changes Included

- Point the route-smoke inventory at the mounted Tower command-center shell.
- Correct the founder checklist's component, talking point, readiness state, and caveat.
- Add behavior coverage that executes both inventory builders and fails if either returns to the orphaned component or drifts from the mounted route shell.
- Refresh the governed stale-claim burn-down after resolving these two entries.

## QA / Validation

- Focused behavior coverage executes both deterministic builders and checks the mounted route source.
- The QA inventory claim audit must pass after the burn-down refresh.
- TypeScript, scoped ESLint, release control, and diff hygiene run before review.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. No schema, tenant row, feature flag, or runtime state requires restoration.

## Audit Evidence

- Pull-request checks and focused test output.
- `docs/architecture/qa-inventory-stale-claims.json`, whose resolved entries are removed by the existing generator.

## Known Gaps

The inventories remain static authority files. Other entries on the stale-claim burn-down require separate route-by-route correction; this release resolves only the two Tower claims it proves.
