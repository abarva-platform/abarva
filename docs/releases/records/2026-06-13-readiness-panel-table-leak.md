# 2026-06-13-readiness-panel-table-leak — Humanize raw backing-table ids in the Current-State Readiness panel

## Release ID

`2026-06-13-readiness-panel-table-leak`

## Status

`candidate`

## Plain-English Summary

Third and final follow-up to the charter source-label leak work, found by live end-to-end testing on production (`app.abarva.ai`). The Current-State Readiness panel rendered the raw internal backing-table id in two places: the per-instrument source chip (`{backingTable ?? "charter"}`) and the rationale suffix (`· committed to ${backingTable}`) — so a CIO/CFO viewing the P1 readiness panel saw `tower_cmdb_cis` / `tower_workforce` verbatim. This routes both through `resolveSourceLabel`, so they read "Application & Systems Inventory" / "IT / Engineering Organization Evidence".

## Layer Impact

- `global-control-lane`: shared Move readiness UI for all tenants. Display-only change in `CurrentStateReadinessPanel.tsx`; no data/schema/auth change.

## Client Applicability

- All clients: Yes — any tenant viewing the P1 current-state readiness panel for a Move with table-backed evidence families.
- Feature flag: None — correctness fix.

## Changes Included

- `src/components/strategic-moves/CurrentStateReadinessPanel.tsx` — both `backingTable` render sites (instrument source chip + rationale suffix) now use `resolveSourceLabel(...).title`.

## QA / Validation

- ESLint on the changed file: **pass** (clean).
- `resolveSourceLabel` unit tests (deliverable-quality.test.ts): **pass**.
- CI typecheck + reasoning-layer tests: **pass** (enforced on the PR).
- Live readiness-panel re-verification on `app.abarva.ai` (served by the ACA app `ca-abarva-web-lab-eastus`) after the ACA image rebuild: **not-run yet** — performed immediately after the ACA deploy; expected zero `tower_*` on the panel.

## Rollout Plan

`app.abarva.ai` is served by the Azure Container App `ca-abarva-web-lab-eastus` (CNAME), NOT Vercel. Merge to main → `az acr build` a new web image from main → `containerapp update` the ACA app with the new image (feature-flag env vars carried forward) → shift 100% traffic → verify the readiness panel on `app.abarva.ai`.

## Rollback Plan

Display-only change, no migration. Roll the ACA app back to the prior revision (`az containerapp ingress traffic set`).

## Audit Evidence

- PR URL + CI run.
- Live production screenshot of the clean readiness panel after the ACA deploy.

## Known Gaps

- Completes the trio: `charter-source-label-leak` (citation + scrub), `charter-digest-table-leak` (digest source + card text), and this (readiness panel). Together they remove every known client-visible raw-table leak on the Move charter/readiness surfaces.
- The ingest-doc API error detail (`'<family>' is backed by <table>`) still names the table in a developer-facing 4xx error body — out of scope (not a deliverable surface).
