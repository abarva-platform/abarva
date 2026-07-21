# 2026-07-21-moves-ui-flags-cross-prove — Cross-tenant proof for MOVES-UI-001/002 flags

## Release ID

`2026-07-21-moves-ui-flags-cross-prove`

## Status

`candidate`

## Plain-English Summary

Enables `moves_finder_shell_v1` (Finder-style visual polish on the live Moves phase
workspace, MOVES-UI-001) and `moves_approvals_overview_v1` (cross-phase Approvals overview,
MOVES-UI-002) for two proof tenants — Lakeshore and SkyHarbor — the same tenants used for
prior Moves cross-tenant proofs this program. No code change; this is the next rollout step
already named in both flags' own release records ("enable for 1-2 proof tenants, live-verify
signed-in, then consider default-on").

## Layer Impact

- **Config only.** `src/lib/features/registry.ts` `includeTenants` arrays updated for two
  existing, already-deployed, presentation-only flags. No code path changed.

## Client Applicability

- All clients: no
- Specific clients: Lakeshore, SkyHarbor
- Internal only: no
- Public/demo only: no
- Feature flags: `moves_finder_shell_v1`, `moves_approvals_overview_v1`

## Changes Included

- `src/lib/features/registry.ts` — `includeTenants: ["lakeshore", "skyharbor"]` for both flags

## QA / Validation

- `npx eslint` clean on the changed file
- No test changes needed — both flags' behavior was already fully tested in their respective
  merged PRs (#5185, #5188); this only changes which tenants see the already-tested code path

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. Immediately after deploy, live-verify signed-in as Lakeshore and SkyHarbor on the real
   `/strategic-moves/[id]/phase/[n]` route.
3. If clean, consider default-on for all tenants in a follow-up release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: `includeTenants` array change, code-level (no env var needed
  since `policy: "tenant"` resolves from the registry directly)
- Live signed-in proof required: **yes** — required before this release is considered proven,
  since it changes real tenant-visible behavior for the first time

## Rollback Plan

Revert `includeTenants` back to `[]` for either or both flags (one-line change), or revert
the merge commit.

## Audit Evidence

- PR: (added at merge time)
- Prior release records: `docs/releases/records/2026-07-20-moves-finder-shell-live-polish.md`,
  `docs/releases/records/2026-07-21-moves-approvals-overview.md`
