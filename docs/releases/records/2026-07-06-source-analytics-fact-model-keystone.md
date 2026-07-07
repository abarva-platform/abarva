# 2026-07-06-source-analytics-fact-model-keystone — the fact model + the source_analytics flag

## Release ID

`2026-07-06-source-analytics-fact-model-keystone`

## Status

`candidate`

## Plain-English Summary

The keystone of the Source value-analytics layer. Source computes value from typed, cited
facts via the archetype `valueLeverRules`; this adds the **canonical fact model** every
downstream analytics slice (extraction, value-lever evaluators, the value-type waterfall, the
redesigned intelligence UI, Door-1 diagnose→recover) will build on:

- **`src/lib/source/facts/fact-catalog.ts`** — a versioned catalog **derived** from the
  registry: it sweeps `computation.inputs[].key` across every archetype's `valueLeverRules`
  and joins each with hand-authored enrichment (label · entityKind · description). It **throws
  at build** if a lever input has no enrichment, or if a key appears with a conflicting
  unit/source — so the fact model can never silently drift from the levers.
- **`src/lib/source/facts/fact-types.ts` + migration `20260706120000_source_event_facts.sql`**
  — the persisted `source_event_facts` row: fact_key · entity (event/tower/app/vendor) ·
  value_numeric XOR value_text · unit · source_method (structured_map/parsed/analyst_entered)
  · source_citation (doc + locator) · confidence · staleness. RLS-scoped by `client_key`.
- **`src/lib/source/facts/template-fact-map.ts`** — the deterministic template→fact intake
  contract (app-inventory + volumetrics worked examples), extensible to every input template.
- **The `source_analytics` feature flag (off for all)** — the master switch every analytics
  slice gates behind, so the layer ships dark until flipped per tenant and live-proven.

This slice is **inert**: no code calls the fact model yet, the migration is **not run**, and
the flag is off. It is the contract the fan-out builds against.

## Layer Impact

- `experimental`: the `source_analytics` flag (off) — the master switch for the whole layer.
- `client-data-lane`: the `source_event_facts` table + RLS (migration authored, **not run**).
- `global-control-lane`: the `src/lib/source/facts/` library (code constants + types) — inert
  until a downstream slice consumes it; changes no existing behavior.

## Client Applicability

- All clients: no behavior change — the flag is off and nothing calls the fact model yet.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off; env override `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`).

## Changes Included

- `src/lib/source/facts/{fact-catalog,fact-types,template-fact-map,index}.ts` + `__tests__/` (25 tests).
- `supabase/migrations/20260706120000_source_event_facts.sql` (RLS-scoped; not run).
- `src/lib/features/registry.ts` — the `source_analytics` flag + type-union entry.

## QA / Validation

- `npx jest src/lib/source/facts` → **3 suites / 25 tests pass** (incl. the no-orphan-input
  invariant: catalog key set === lever input key set). **pass.**
- `npx tsc --noEmit` (full project, exit-code gated, 8 GB heap) → **0 errors.** **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: nothing consumes the model yet; the migration is not run. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. The migration is committed but **not run** — it will be
applied via the ACA VNet db-migrate job when the first slice that writes facts lands. No
runtime behavior ships in this slice.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — inert library + flag + un-run migration.
- Migration run path: ACA VNet db-migrate job (separate, when a writer slice lands).
- Feature/env flag update path: `includeTenants` in registry or `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: not for this slice (inert); required when the first consuming slice ships.

## Rollback Plan

Revert the PR. Removing the `facts/` library + the flag has no runtime effect (nothing consumes
them). The un-run migration file is inert; if already applied, `DROP TABLE source_event_facts`.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint, architecture-rules.
- The catalog is derived from the registry (versioned, reviewable); the build-time invariant +
  the no-orphan test keep the fact model in lockstep with the value levers.

## Known Gaps

- Consuming slices (extraction, evaluators, waterfall, UI, Door 1) are the fan-out that follows;
  each gates behind `source_analytics` and carries its own record.
