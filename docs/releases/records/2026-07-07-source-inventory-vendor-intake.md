# 2026-07-07-source-inventory-vendor-intake — Source canvas app-inventory + vendor-commercials fact intake

## Release ID

`2026-07-07-source-inventory-vendor-intake`

## Status

`candidate`

## Plain-English Summary

Slice 2 of the Source file-intake feature. Slice 1 wired one Scope upload point
(volumetrics → `VOLUMETRICS_V1`, 5 facts). Volumetrics alone lands enough facts for
some AMS levers but not all six. This release adds the two remaining upload points on
the Scope stage so a real file upload can flip ALL SIX AMS value levers from their
illustrative MODEL reading to a LIVE, fact-derived number:

- A new **application inventory** upload (bound to the already-shipped
  `APP_INVENTORY_V1` template) lands per-app annual run cost, loaded FTE cost, and the
  variable-cost share — the facts the volume-band pricing and retained-cost levers need.
- A new **vendor commercials / contract terms** upload (bound to a new
  `CONTRACT_TERMS_V1` template) lands the eight vendor/benchmark scalars the SLA
  economics, productivity-credit, transition-risk, retained-cost, and volume-band
  levers need: transition fee, overrun probability, overrun cost multiple, SLA credit
  cap, at-risk fee pool, committed productivity credit, retained-FTE delta, and the
  contract term.

No new route, component, or engine change was needed — both upload points reuse the
exact Slice-1 dropzone flow (`factTemplateCode` on the task → `/facts/ingest-file` →
the shared deterministic map/validate/write core). The new template is a pure data
declaration; its column→fact bindings are validated against the canonical fact catalog
at runtime and in tests, so a unit/entity mismatch is rejected loudly rather than
seeding a bad fact.

## Layer Impact

- `global-control-lane`: shared Source app behavior. One new intake template
  (`CONTRACT_TERMS_V1`) in `template-fact-map.ts` and two new `provide` tasks on the
  Scope stage view-model. Everything stays dark behind the existing `source_analytics`
  feature flag; un-enrolled tenants see no change. No new route, no schema/data-plane
  change — reuses the existing `source_event_facts` table, `sourceFactWriteAdapter`
  write seam, and the Slice-1 `/facts/ingest-file` route.

## Client Applicability

- All clients: no. The intake path is gated by the `source_analytics` feature flag and
  is inert (404) for tenants without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/template-fact-map.ts` — new `CONTRACT_TERMS_V1` template
  (`rowEntity: 'vendor'`, entityRefColumn `Vendor`) binding 8 columns to the vendor /
  contract fact keys, registered in `TEMPLATE_FACT_MAPS`. Every binding's unit +
  entityKind matches the fact catalog (derived from the AMS lever `computation.inputs`).
- `src/components/source/canvas/analytics/sample-view-model.ts` — two new Scope
  `provide` tasks: `scope.app-inventory` (bound `APP_INVENTORY_V1`) and
  `scope.vendor-commercials` (bound `CONTRACT_TERMS_V1`). Existing tasks intact. The
  live `stage-analytics-builder` reuses `SAMPLE_SCOPE_STAGE.tasks` verbatim, so both
  the sample and live canvas paths get the two upload points.
- Tests: extended `structured-map.test.ts` (valid `CONTRACT_TERMS_V1` row → 8 facts,
  no drift; whole-number pct/ratio/count preserved; vendor vs event entity_ref split;
  missing-vendor-id and uncoercible-cell rejections) and `template-fact-map.test.ts`
  (ships CONTRACT_TERMS_V1; pins its 8 fact keys + per-column unit/entity match).

## QA / Validation

- Unit/behavior jest: `template-fact-map.test.ts`, `structured-map.test.ts`,
  `fact-types.test.ts`, `TaskChecklist.upload.test.tsx` — all green (43 tests). The
  ingest lib + both fact routes re-run green (54 tests) proving the new template is
  fully exercised end-to-end by the existing route path. `Status: pass`.
- Typecheck: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` run to completion (log 167 lines, 131 `error TS` lines) — net-new errors
  = 0. The branch error log is byte-identical to the origin/main baseline (131
  pre-existing errors from the 6ebe6d4a9 canvas workstream); none of the four changed
  files appears in the error list.
- ESLint on all changed files — clean (0 errors).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to main via squash PR. No migration. No runtime env/flag change: the intake path
is already gated by the pre-existing `source_analytics` flag, so it activates only for
tenants already enrolled. Standard ACA main deploy workflow picks up the merge; no
manual runtime mutation required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to main.
- Shared runtime mutators: none — no feature-branch/local Azure commands.
- Approved image digest: produced by the main deploy workflow at merge time.
- ACA runtime invariant: unchanged by this PR; verify template image, 100%-traffic
  revision image, and worker images match the approved digest post-deploy per runbook.
- Worker image invariant: not affected (no worker job change).
- Feature/env flag update path: none — reuses existing `source_analytics`.
- Live signed-in proof required: yes, before claiming `live-proven`: as a
  `source_analytics`-enrolled tenant, upload an `APP_INVENTORY_V1`-shaped and a
  `CONTRACT_TERMS_V1`-shaped CSV/XLSX at the two new Scope tasks and confirm the "N
  facts written" chips and all six AMS levers flipping to LIVE.

## Rollback Plan

Revert the squash commit. No migration to roll back, no data written by the deploy
itself (facts are only written by an authenticated, flag-enrolled user upload). Worst
case reverts to the Slice-1 state where only volumetrics is a bound upload point.

## Audit Evidence

- PR URL: see the PR opened for branch `feat/source-inventory-vendor-intake`.
- CI: release-check + jest + tsc as recorded in QA / Validation above.
- No deployment URL yet (candidate; not deployed by this record).

## Known Gaps

- Live signed-in browser proof for an enrolled tenant is not captured in this record
  (candidate status); it is required before `live-proven`.
- Stages other than Scope remain registry-only uploads (no bound template). All facts
  are event-scoped and every stage's insight reads all event facts, so co-locating the
  three intake points on Scope is sufficient for all six AMS levers; per-stage intake
  is a future refinement, not a gap in lever coverage.
