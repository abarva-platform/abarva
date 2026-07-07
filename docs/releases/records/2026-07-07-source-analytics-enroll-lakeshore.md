# 2026-07-07-source-analytics-enroll-lakeshore — flip the value-analytics layer on for Lakeshore

## Release ID

`2026-07-07-source-analytics-enroll-lakeshore`

## Status

`candidate`

## Plain-English Summary

Enrolls **Lakeshore** as the first tenant of the Source value-analytics layer by adding
`"lakeshore"` to the `source_analytics` flag's `includeTenants`. The whole layer — the fact model
(`source_event_facts`), the value-lever evaluators, the value-type waterfall, the redesigned
three-beat canvas, Door-1 diagnose→recover, and the vendor parse-and-validate intake — was merged
dark behind this flag across the prior records (keystone, evaluators, extraction, UI, door1,
door1-adapter, live-adapter, parse-validate). This record is the switch-on for one tenant.

Prerequisites already satisfied when this lands:
- The two migrations (`20260706120000_source_event_facts.sql`, `20260706160000_source_value_levers.sql`)
  are **applied** on the lab data plane via the ACA VNet db-migrate job (execution
  `job-abarva-db-migrate-lab-eastus-wx574rf`, status Succeeded).
- The live-adapter wiring on the event page **falls back to honestly-marked sample intelligence**
  when an event has no committed facts (or the read errors), so enrolling before any Lakeshore
  facts are ingested cannot break the Source event surface — the worst case is the redesigned
  canvas rendering `provenance:'sample'`.

What a Lakeshore user sees after this lands: a Source event opens the **redesigned three-beat
canvas** instead of the legacy `UniversalCanvasShell`. Until real facts are ingested, the value
waterfall shows sample intelligence (labeled). The ingest / parse / door1 routes stop returning 404
for Lakeshore. No other tenant is affected.

## Layer Impact

- `experimental` → **tenant-scoped enablement**: `source_analytics` flips on for `lakeshore` only.
- `client-data-lane`: Lakeshore's Source events now read `source_event_facts` (table applied);
  reads are tenant-scoped by `client_key` via RLS.
- `global-control-lane`: no shared behavior change — every other tenant stays on the flag's default
  (off) and the legacy canvas.

## Client Applicability

- **Lakeshore**: enrolled — redesigned canvas + analytics routes live (sample intelligence until
  facts are ingested).
- All other tenants: unchanged (flag off).
- Feature flag: `source_analytics` (now `includeTenants: ["lakeshore"]`; env override
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS` still available).

## Changes Included

- `src/lib/features/registry.ts` — `source_analytics.includeTenants: []` → `["lakeshore"]` + summary note.

## QA / Validation

- `npx tsc --noEmit` (8 GB heap) → 0 errors. `npx eslint` on the file → clean. `release:check` → pass.
- Migrations applied (VNet job Succeeded). Deploy pipeline recovered and live on the current main
  digest (`sha256:8f689e0c…`); `app.abarva.ai` health + homepage verified 200.
- **Not yet live-proven at the UI level**: the final visual proof (a signed-in Lakeshore user
  opening a Source event and seeing the redesigned canvas, then a real computed waterfall after fact
  ingest) requires a signed-in Lakeshore session and is the next step. Per doctrine this record is
  `merged`/`deployed`, **not** `live-proven`, until that signed-in proof is captured.

## Rollout Plan

Merge to `main` via PR + squash → ACA main deploy. After deploy, confirm the runtime invariant
(template image = 100%-traffic revision image = approved digest) and that a Lakeshore Source event
renders the new canvas. Then ingest a first batch of Lakeshore facts (structured-map from the
app-inventory / volumetrics templates) to move the waterfall from sample to real computed value.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- NOTE: the shared web environment recently hit the ACA 100-revision cap (subnet/IP exhaustion),
  which fails the deploy's health-wait even for a good image. Recovery is to deactivate stale
  zero-traffic revisions and manually pin 100% traffic to the new revision. A durable workflow fix
  (post-deploy revision hygiene) is tracked separately.
- Feature flag update path: this record (code) or `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: **yes** — Lakeshore Source event render + real-fact waterfall.

## Rollback Plan

Revert this PR (or remove `"lakeshore"` from `includeTenants`). The layer returns to dark; Lakeshore
falls back to the legacy `UniversalCanvasShell`. The applied migrations are inert empty tables when
the flag is off; no data rollback needed (or `DROP TABLE source_event_facts, source_value_levers`).

## Audit Evidence

- PR URL (added on open). Migration job execution `job-abarva-db-migrate-lab-eastus-wx574rf` = Succeeded.
- Live digest `sha256:8f689e0c…` serving 100% traffic on `ca-abarva-web-lab-eastus`.

## Known Gaps

- No Lakeshore facts ingested yet → the canvas shows sample intelligence until the first
  structured-map ingest.
- Signed-in UI live-proof outstanding (requires a Lakeshore session).
