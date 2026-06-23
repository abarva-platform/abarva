# 2026-06-22-home-react-surface-all-tenants — React Home enabled for all 5 binding-backed tenants

## Release ID

`2026-06-22-home-react-surface-all-tenants`

## Status

`candidate`

## Plain-English Summary

Enables the React Home surface (`home_react_surface`) for **all 5 binding-backed tenants** — `apexretail` (already live), `arcturus` (First Capital), `skyharbor`, `meridian`, `lakeshore` — after Apex proved out live (real Context Explorer rail, canonical ask, correct retail experts, no fabricated chart). Each tenant has 8 loaded context dimensions plus signals and corpus in the binding, so the explorer renders populated for all of them. **Northstar is intentionally excluded** (no binding payload → would render an empty explorer). The static `public/home-v2` iframe stays as the code fallback for any tenant not in the list.

## Layer Impact

`global-control-lane` — flips the `home_react_surface` control-plane flag from a single-tenant pilot to all 5 binding-backed tenants. UI surface selection only; no client-data-lane, schema, engine, or answer-quality change (those land separately).

## Client Applicability

Specific clients — `apexretail`, `arcturus` (First Capital), `skyharbor`, `meridian`, `lakeshore`. Northstar is excluded. Enabled via `includeTenants`; each can also be toggled without a deploy via the `ABARVA_FEATURE_HOME_REACT_SURFACE_TENANTS` env override.

- All clients: no
- Specific clients: **the 5 binding-backed tenants** (Northstar excluded)
- Internal only: no
- Public/demo only: all 5 are synthetic demo tenants
- Feature flag: `home_react_surface`

## Changes Included

- `src/lib/features/registry.ts` — `home_react_surface` `includeTenants` → `["apexretail", "arcturus", "skyharbor", "meridian", "lakeshore"]`.

## QA / Validation

- **Apex proven live signed-in**: React `/home` Context Explorer, synthesized honest answer (no `Also:` row-dump, no raw IDs), correct retail experts, no scraped chart.
- Superseded by `2026-06-22-home-intelligence-19-dimension-binding`: this record originally described **8 context roll-up buckets** in the binding. That was not the canonical product dimension roster. Home and Intelligence must expose the 19 enterprise context dimensions; per-tenant signed-in confirmation is one command each via `scripts/qa/home-live-gate.mjs` / `scripts/qa/tenant-matrix-gate.mjs`.
- Feature-flag registry tests pass. Status: **passed** (Apex live + all-5 binding verified) / pending (other-4 signed-in spot-check).

## Rollout Plan

Merge to `main` → `aca-main-deploy` → React Home live for all 5 binding-backed tenants. No migration, no worker/job change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`)
- Shared runtime mutators: none
- Approved image digest: produced by CI on merge
- ACA runtime invariant: web revision only
- Worker image invariant: unchanged
- Feature/env flag update path: `home_react_surface` `includeTenants` or the env override
- Live signed-in proof required: per-tenant `home-live-gate.mjs` spot-check for the 4 newly-enabled tenants

## Rollback Plan

Remove a tenant from `includeTenants` (or unset it in the env list) → that tenant reverts to the static iframe **instantly**, no deploy. Revert the PR to drop all four new tenants back to the Apex-only pilot.

## Audit Evidence

- PR URL + CI runs.
- Apex live `/home` capture (React explorer + correct experts + clean engine).
- Per-tenant `home-live-gate.mjs` output for the four newly-enabled tenants.

## Known Gaps

- The retrieval-grounding gap — an answer can hedge "context not loaded" even though dimensions are loaded — is an **engine / Azure data-plane** concern owned separately; Home renders faithfully and is not the cause. Tracked on the engine thread.
- `public/home-v2` is **not yet retired** (kept as the fallback). Retire it once all 5 tenants are signed-in-verified.
