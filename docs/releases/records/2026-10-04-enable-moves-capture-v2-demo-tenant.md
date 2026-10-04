# 2026-10-04-enable-moves-capture-v2-demo-tenant — Enable moves_capture_v2 for the demo tenant

## Release ID

`2026-10-04-enable-moves-capture-v2-demo-tenant`

## Status

`candidate`

## Plain-English Summary

Turns the `moves_capture_v2` AND `moves_home_v2` feature flags on for the
single synthetic demo tenant so the redesigned 3-step phase capture can be reviewed signed-in. The
flag stays off for every other tenant. The underlying code shipped (flag off)
in the prior release; this only flips `includeTenants` for the demo tenant.

## Layer Impact

Release lane: `global-control-lane` — a control-plane flag enablement, scoped to
one synthetic tenant.

- `4 PRODUCTS` (Moves): the demo tenant's phase screens (1–5) now render the
  3-step capture instead of the contract-steps canvas. No data/model change.

## Client Applicability

- All clients: No.
- Specific clients: the synthetic demo tenant only.
- Internal only: No.
- Public/demo only: Yes (demo tenant).
- Feature flags: `moves_capture_v2` and `moves_home_v2` (`includeTenants` now lists the demo tenant).

## Changes Included

- `src/lib/features/registry.ts` — `moves_capture_v2` and `moves_home_v2`
  `includeTenants` set to the demo tenant.
- Nexus manual refreshed.

## QA / Validation

- `tsc --noEmit` — **PASS**: no type errors.
- `release:check` — **PASS** (all gates).
- Signed-in walk — **NOT RUN** here; this release exists precisely so the demo
  tenant can be walked signed-in. Not claimed live-proven.

## Rollout Plan

Merge to `main`; ships via the repo-owned `aca-main-deploy`. Once live, the demo
tenant sees the new capture; everyone else is unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none
- Live signed-in proof required: Yes — the demo-tenant walk this enables.

## Rollback Plan

Revert the one-line `includeTenants` change (back to empty). Pure flag.

## Audit Evidence

- PR URL / CI run: added on open.

## Known Gaps

- Visual not yet verified; the demo-tenant signed-in walk is the verification.
