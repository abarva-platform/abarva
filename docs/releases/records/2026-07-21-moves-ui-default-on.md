# 2026-07-21-moves-ui-default-on — Promote MOVES-UI-001/002 to default-on for all tenants

## Release ID

`2026-07-21-moves-ui-default-on`

## Status

`candidate`

## Plain-English Summary

Flips `moves_finder_shell_v1` and `moves_approvals_overview_v1` from a tenant allowlist
(Lakeshore, SkyHarbor, Meridian, First Capital) to `platform` policy — default ON for every
tenant, with an empty `excludeTenants` (the rollback lever if a problem surfaces on a tenant
not yet exercised). Owner directive: "fix it - I need to see the new shell and after a week we
will delete" (the legacy code). This release does the flip only; the legacy
`MovePhaseExplorerLegacy` component and flag-off branches are deliberately NOT removed yet —
they remain as the rollback path for a ~1-week soak, per the owner's own stated plan.

## Layer Impact

- **Config only.** `src/lib/features/registry.ts` — both flags' `policy` changed from
  `"tenant"` to `"platform"`, `includeTenants` replaced with an empty `excludeTenants`. No
  component code changed in this release; all four already-proven tenants keep working
  identically, every other tenant now sees the same shell for the first time.

## Client Applicability

- All clients: **yes** — this is the point of the change
- Specific clients: n/a (was Lakeshore/SkyHarbor/Meridian/First Capital, now everyone)
- Internal only: no
- Public/demo only: no
- Feature flags: `moves_finder_shell_v1`, `moves_approvals_overview_v1`

## Changes Included

- `src/lib/features/registry.ts` — policy flip for both flags

## QA / Validation

- `npx eslint`: clean
- Scoped `tsc --noEmit`: no errors referencing the changed file
- No existing test asserts on `includeTenants` for either key (checked before merging)
- This is a config-only change to two flags whose code paths were already fully tested and
  live-verified on 4 tenants earlier the same day (see prior MOVES-UI-001/002/003/004 release
  records) — no new code risk, only a wider blast radius for already-proven code

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. All tenants see the new shell immediately on deploy.
3. **Do not remove `MovePhaseExplorerLegacy` or any flag-off branch for at least one week**
   (target: 2026-07-28) — this is the owner's explicit soak window before cleanup.
4. After the soak window, if no tenant reports a regression, open a dedicated cleanup PR
   (tracked as MOVES-UI-005 in the backlog) to remove the legacy rail component, the flag-off
   JSX branches in `MovesPhaseStandaloneClient.tsx`/`StrategicMoveOriginateClient.tsx`, and the
   now-dead CSS — as its own reviewed change, not bundled with anything else.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: policy flip only, no env var change needed
- Live signed-in proof required: yes — verify at least one tenant NOT previously on the
  allowlist now sees the new shell correctly, in addition to re-confirming the four
  already-proven tenants are unaffected

## Rollback Plan

Fastest rollback: add the specific problem tenant to `excludeTenants` (one line, no full
revert needed) if an issue surfaces on a tenant not previously exercised. Full rollback: revert
this commit, restoring the `tenant`/`includeTenants` allowlist state.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-001/002 (flag policy update)
- Prior proof: `proof/moves-ui-001-002-e2e-20260721/`, live signed-in verification this session
