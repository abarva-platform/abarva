# 2026-07-06-source-analytics-door1 — Door 1 existing-contract optimization (Diagnose→Recover)

## Release ID

`2026-07-06-source-analytics-door1`

## Status

`candidate`

## Plain-English Summary

**Door 1** of the Source value-analytics layer — optimize an EXISTING contract without running a
full RFP. Where Door 2 is the 11-stage new-event path (~20%+), Door 1 is the fast Diagnose→Recover
play against an incumbent contract (~10–20%): read the contract's facts, diagnose leakage against
the value levers, and produce a defensible recovery bridge. Dark behind `source_analytics`.

- **`src/lib/source/door1/`** — the orchestration. `diagnose.ts` reads the event's facts
  (`facts-reader.ts`) and runs the value levers to find leakage; `evaluate.ts` is a self-contained
  reference evaluator that emits the value-lever result shape so the flow is testable today;
  `run-cost.ts`/`optimize.ts` size the recoverable pool; `play.ts` sequences the recover plays;
  `bridge.ts` classifies the result into the value-type bridge; `types.ts` declares the contracts.
- **Reconciliation note corrected** — Door 1 declares its own `ValueLeverResult` (a sibling of the
  now-merged `facts/evaluators` `ValueLeverResult`). The two do **not** unify structurally; the
  `types.ts` reconciliation note now carries the **accurate field-by-field adapter map**
  (`key→ruleKey`, `insufficientEvidence→status`, `missingEvidence→missingFactKeys`,
  `evidenceRefs→citations` via a join to `source_event_facts` for doc/locator, `category`/`unit`
  read from the rule/FactSpec) so the future integration is not misled.
- **`src/app/api/v1/source/[eventId]/door1/diagnose/route.ts`** — the diagnose route, **dark behind
  `source_analytics`** (404 when the flag is off for the tenant).

Honesty preserved end-to-end: a lever with a missing `citationRequired` input abstains
(`status: 'insufficient_evidence'`) and routes to the "needs evidence" list — never into the
recoverable dollars.

## Layer Impact

- `experimental`: the Door 1 library + route are reachable only when `source_analytics` is on (off
  for all) — no default behavior changes.
- `client-data-lane`: reads `source_event_facts` (keystone migration `20260706120000`); no new
  tables in this slice.
- `global-control-lane`: the `source/door1/` library (inert until the flag is on).

## Client Applicability

- All clients: no behavior change — the flag is off; the route 404s and nothing calls Door 1.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/lib/source/door1/{types,diagnose,evaluate,facts-reader,run-cost,optimize,play,bridge,index}.ts`.
- `src/lib/source/door1/__tests__/door1-{play,flag-gate,flow}.test.ts` (11 tests).
- `src/app/api/v1/source/[eventId]/door1/diagnose/route.ts`.

## QA / Validation

- `npx jest src/lib/source/door1` → **3 suites / 11 tests pass** (play sequencing, flag-gate,
  end-to-end diagnose→bridge flow incl. insufficient-evidence routing). **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors** (Door 1's sibling `ValueLeverResult`
  coexists with the merged evaluators type — no collision). **pass.**
- `npx eslint` on the slice → clean. **pass.**
- Not live-proven: the flag is off; the route 404s. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. The route stays dark (`source_analytics` off). Door 1 currently
runs its reference evaluator; wiring the merged `facts/evaluators` output through the documented
adapter is the integration step before a tenant is enabled. The keystone migration
`20260706120000_source_event_facts.sql` must be applied via the ACA VNet db-migrate job before any
live fact read. A live signed-in proof is required at first enablement.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: the diagnose route reads facts — but only under an enabled flag (off for
  all), so no shared runtime behavior ships.
- Migration run path: ACA VNet db-migrate job (keystone `source_event_facts`).
- Feature/env flag update path: `includeTenants` in registry or `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: at first tenant enablement (not this slice — inert).

## Rollback Plan

Revert the PR. The Door 1 library is reachable only through the flag-gated route; removing it has no
runtime effect while the flag is off.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint, architecture-rules.
- The flow test asserts insufficient-evidence levers never enter the recoverable dollars; the
  corrected reconciliation note documents the exact evaluator→Door 1 adapter map.

## Known Gaps

- The **evaluator→Door 1 adapter** (merged `facts/evaluators` output → Door 1's `ValueLeverResult`)
  is the integration step; Door 1 runs its reference evaluator until then.
- Door 1's recover plays are the AMS-archetype set; extending to other archetypes follows as their
  `valueLeverRules` are authored.
