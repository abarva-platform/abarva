# 2026-07-06-source-analytics-extraction — structured-map fact extraction + the fact write seam

## Release ID

`2026-07-06-source-analytics-extraction`

## Status

`candidate`

## Plain-English Summary

The **intake edge** of the Source value-analytics layer. The fact-model keystone
(`2026-07-06-source-analytics-fact-model-keystone`) defined the canonical fact catalog and the
`source_event_facts` table; this slice adds the deterministic path that turns our own structured
templates into typed, cited fact rows and persists them:

- **`src/lib/source/facts/extraction/structured-map.ts`** — the **structured-map** extractor.
  Given a filled template payload and the deterministic `template-fact-map`, it emits
  `SourceEventFactInsert` rows keyed to the canonical catalog: every value is typed against its
  `FactSpec` (unit/entityKind), carries `source_method = 'structured_map'` and a
  `source_citation` (template + locator), and an unknown or mistyped key is rejected — never
  coerced. **No LLM, no inference** — this is the "our templates" path, so the mapping is a pure
  function of the template contract.
- **`src/lib/data-plane/write-adapters/sourceFactWriteAdapter.ts`** — the fact **write seam**.
  Persists a typed batch through the data plane (Azure tx-session path + a Postgres-compat path,
  matching the sibling write adapters), **rejects a mixed-tenant batch before opening the
  session**, JSON-serializes the citation, and no-ops an empty batch. Every row is written
  tenant-scoped (`client_key`).
- **`src/app/api/v1/source/[eventId]/facts/ingest/route.ts`** — the ingest route, **dark behind
  the `source_analytics` flag** (returns 404 `{ error: 'not_found' }` when the flag is off for the
  tenant, so the surface does not exist until the layer is switched on).

## Layer Impact

- `experimental`: the ingest route + extractor are reachable only when `source_analytics` is on
  (off for all tenants) — no default behavior changes.
- `client-data-lane`: writes to `source_event_facts` (keystone migration `20260706120000`, **not
  run**); tenant-scoped by `client_key`.
- `global-control-lane`: the `facts/extraction/` library + write adapter (inert until the route is
  called under an enabled flag).

## Client Applicability

- All clients: no behavior change — the flag is off; the ingest route 404s and nothing calls the
  extractor.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/lib/source/facts/extraction/{structured-map,index}.ts` + `__tests__/structured-map.test.ts`.
- `src/lib/data-plane/write-adapters/sourceFactWriteAdapter.ts` + `__tests__/sourceFactWriteAdapter.test.ts`.
- `src/app/api/v1/source/[eventId]/facts/ingest/route.ts` + `__tests__/route.test.ts`.

## QA / Validation

- `npx jest` (slice) → **2 suites / 23 tests pass** (structured-map typing + rejection, write-seam
  tenant-guard + citation serialization, route flag-gate + happy path). **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors** (fixed the test mock's `SqlRunner`
  generic typing to match `TxSessionRunner`). **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: the flag is off; the migration is not run. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. The route stays dark (`source_analytics` off). Before any tenant
is enabled, the keystone migration `20260706120000_source_event_facts.sql` must be applied via the
ACA VNet db-migrate job, then a live signed-in ingest proof captured.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: the ingest route writes `source_event_facts` — but only under an enabled
  flag (off for all), so no shared runtime behavior ships.
- Migration run path: ACA VNet db-migrate job (keystone `source_event_facts` table).
- Feature/env flag update path: `includeTenants` in registry or `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: when the first tenant is enabled (not this slice — inert).

## Rollback Plan

Revert the PR. The extractor + adapter are unreferenced except by the flag-gated route; removing
them has no runtime effect while the flag is off. The un-run migration is inert.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint, architecture-rules.
- The extractor maps only catalog keys (build-time invariant from the keystone); the write seam is
  tenant-guarded and citation-preserving; the route is flag-gated with a test asserting the 404.

## Known Gaps

- The **parse-and-validate** path (vendor documents → facts, `source_method = 'parsed'`) is the
  next intake slice; this slice is the deterministic "our templates" path only.
- Facts are not yet consumed by the value-lever evaluators at runtime — that wiring
  (orchestrator → waterfall → UI) is the remaining fan-out, each behind `source_analytics`.
