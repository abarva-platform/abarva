# 2026-06-21-ava-rebrand-setup — Ava on Setup (Steward → Ava)

## Release ID

`2026-06-21-ava-rebrand-setup`

## Status

`candidate`

## Plain-English Summary

Completes the voice-only Ava rebrand on the last surface — Setup (was "Steward"). The Setup dock agent, the tenant-orientation skeleton, the Users & Access guidance block, and the loader's "Ask Steward" action now read "Ava". The shell `DEFAULT_AGENT` map's final two entries (setup / setup-detail) flip to "Ava", so the map is now uniformly "Ava" for every surface. Internal identifiers (StewardDockPane, StewardSetupControlCenter, steward-setup-readiness, the `steward` role-map keys) are unchanged. The specialist-roster heading ("Nexus · Sentinel · Atlas · Steward") and the admin owner/role attributions (`owner: 'Steward'`, role maps) stay as named-specialist/trace surfaces — consistent with how the other modules keep specialist names in audit views.

## Layer Impact

- **internal-admin + global-control-lane:** user-visible Steward labels on the Setup/Admin surface (`src/components/admin/*`, `src/components/setup/*`) → "Ava"; the shell `DEFAULT_AGENT` map setup/setup-detail → "Ava". No identifiers, ids, routes, telemetry, or contracts changed.

## Client Applicability

- All clients: The shell agent name on Setup reads "Ava" (Setup is AbarVa-only admin, so this is primarily internal).
- Specific clients: None.
- Internal only: Yes — Setup/Admin is an internal-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/StewardDockPane.tsx` — dock agent name/initials → Ava/Av.
- `src/components/admin/skeletons.tsx` — orientation label + aria → Ava.
- `src/components/admin/UsersAccessSurface.tsx` — "Steward guidance" eyebrow/aria → "Ava guidance".
- `src/components/admin/ExperienceGallery.tsx` — agent card name → Ava (roster h2 left as the specialist catalog).
- `src/components/setup/loader/AdminLoaderClient.tsx` — "Ask Steward" → "Ask Ava".
- `src/components/shell/AtlasPageStateProvider.tsx` — setup/setup-detail → "Ava" (map now all-Ava).
- `src/components/admin/__tests__/skeletons.test.tsx` — assertion updated to "Ava · Tenant orientation".

## QA / Validation

Validation: Pass. `tsc --noEmit` clean (0 errors) on the touched files. Rigorous isolation: ran the admin+setup suites with the change AND on pristine `main`, diffed the failing sets — NEW failures = EMPTY (31 vs 31; all admin failures are pre-existing — hard-gate reasons, hex/font visual locks, readiness depth, TenantSwitcher error paths — unrelated to agent names). One stale assertion updated. Live signed-in re-proof (Setup dock reads "Ava") runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Re-prove the Setup dock/labels read "Ava".

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves the updated client bundle after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Setup agent label reads "Ava".

## Rollback Plan

Revert the PR — restores "Steward" display. Display strings + one test; no data/migration.

## Known Gaps

- `learn/` training sections (Moves + Source) still narrate the old multi-agent model — a CONTENT rewrite, deferred.
- Specialist-roster heading + admin owner/role attributions intentionally retain specialist names (trace/catalog).
- Visual re-proof pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/ava-rebrand-setup` → `main`.
- CI: `npm run release:check`, `tsc` clean, admin/setup mine-vs-main failing-set diff = 0 new failures.
