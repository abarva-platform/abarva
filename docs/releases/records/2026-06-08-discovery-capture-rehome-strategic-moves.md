# 2026-06-08-discovery-capture-rehome-strategic-moves — Discovery capture re-home onto live Originate

## Release ID

`2026-06-08-discovery-capture-rehome-strategic-moves`

## Status

`candidate`

## Plain-English Summary

The discovery-intake capture panel was originally wired into the old `/programs/new`
origination workspace (`ProgramOriginationWorkspace`), which the routing cutover now
redirects to `/strategic-moves/new`. That live page renders a different component
(`StrategicMoveOriginateClient`), so the panel never appeared for signed-in users. This
change re-homes the discovery capture onto the live surface as a flag-gated **Brief |
Discovery** sub-tab in the originate canvas, fed by a new pure adapter that projects the
7-field originate scaffold into the discovery shape. With the flag off, the surface is
byte-for-byte unchanged.

## Layer Impact

Affects the **global-control-lane** app tier (shared origination UI), but the new behavior
is held behind the **experimental lane** feature flag `discovery_intake_v2`. No data-plane,
schema, migration, broker, or auth change. Pure client + server-component prop wiring plus a
pure adapter.

## Client Applicability

- All clients: no change while the flag is off (default).
- Feature flag: `discovery_intake_v2` — enabled for `meridian` and `apexretail` in the Azure
  lab runtime only; off for every other tenant and off in Vercel production.
- Internal only: effectively internal/lab until the flag is widened.

## Changes Included

- PR #3315.
- `src/components/strategic-moves/strategicMoveBriefToDiscoveryShape.ts` (+ test) — new pure adapter.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — flag-gated Brief|Discovery sub-tab.
- `src/app/(maestro)/strategic-moves/new/page.tsx` — compute `discovery_intake_v2`, pass prop.

## QA / Validation

- `jest` adapter suite: 3/3 **passed**.
- `tsc --noEmit`: **passed** (0 errors in changed files).
- `eslint`: **passed**.
- CI: all checks **green** except this release record gate.
- Live verification on Azure Container Apps (revision `ca-abarva-web-lab-eastus--0000061`),
  signed in as Meridian: the DISCOVERY sub-tab renders, and a live Nexus conversation
  populated PROBLEM / USE CASE → "Discovery shape · 1 of 8 captured" tagged CHAT. **Pass.**

## Rollout Plan

Merge to `main`. Flag stays off in Vercel production, so there is no user-visible production
rollout. On the Azure lab the change is already live on ACA revision `--0000061` (100%
traffic) with `ABARVA_FEATURE_DISCOVERY_INTAKE_V2_TENANTS=meridian,apexretail`.

## Rollback Plan

Fastest: disable the flag (remove the tenants from `ABARVA_FEATURE_DISCOVERY_INTAKE_V2_TENANTS`)
— the sub-tab disappears with zero other impact. On ACA, also available: shift ingress traffic
back to revision `--0000059`. Code rollback: revert PR #3315 (no migrations, no data changes).

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3315
- ACA URL: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/strategic-moves/new`
- Image: `acrabarvalab001.azurecr.io/abarva/web:rehome-discovery-5d7a44bcbc`; revision `--0000061`.
- Screenshots: signed-in Meridian DISCOVERY sub-tab (empty) and populated (1/8, CHAT-tagged).
- `/api/health` → `{ok:true, checks:{postgres:true}}` on the same revision.

## Known Gaps

Tier B is out of scope here and still open: persisting `discoveryShape` on Promote (the live
`promote()` → `origination-submit` currently omits it) and wiring the upload → extraction →
DiscoveryReceiptCard and the assessment-template download onto the live surfaces.
