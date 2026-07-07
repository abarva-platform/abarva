# 2026-07-06-source-analytics-live-adapter — real computed value on the Source canvas

## Release ID

`2026-07-06-source-analytics-live-adapter`

## Status

`candidate`

## Plain-English Summary

The **"make it real" wiring** for the Source value-analytics layer. The merged slices were inert:
the canvas rendered only the honestly-marked SAMPLE view-model. This slice reads an event's
committed `source_event_facts`, runs the deterministic evaluators for the event's archetype, and
feeds a **live** `StageAnalyticsView` — a cited value waterfall built from real facts — to the
canvas. Dark behind `source_analytics` (off for all).

- **`src/lib/source/facts/event-facts-reader.ts`** — reads the newest, non-stale, numeric
  `source_event_facts` rows for an event (tenant-scoped by `client_key`) into BOTH the evaluators'
  `EvaluatorInputs` map (factKey → value) AND a `factKey → citation` map. Goes through the same
  data-plane seam Door 1 uses (`getAzureWriteFluentClient`), NOT the AgentContextBroker. Empty
  table → empty maps → the caller falls back to sample.
- **`src/lib/source/facts/view/waterfall-view-adapter.ts`** — pure functions mapping the evaluators'
  `ValueLeverResult[]` → the UI's `ValueWaterfallBandView[]` / `ValueWaterfallView`. Field mapping:
  `low`→`amountLow`, `high`→`amountHigh`, `insufficientEvidence`→`state:'insufficient_evidence'`
  (else `'quantified'`), `confidence`/`valueType`/`name` carry through; each band's `citation` is
  recovered by **joining the lever's `evidenceRefs[].factKey` back to the facts reader's citation
  map**. Sets `provenance:'live'`. `quantifiedRollup` totals ONLY quantified bands.
- **`src/lib/source/facts/view/stage-analytics-builder.ts`** — composes the live `StageAnalyticsView`:
  resolve archetype → `evaluateValueLevers(archetype, facts)` → `buildValueWaterfall` → adapter.
  Gate: goes live only when `computedLeverCount >= 1`, else returns null (route shows sample). The
  value beat is fully live + cited; the intake beats (intel/tasks/gate) reuse the sample scaffold's
  structure, and the intel lead is rewritten to state the real computed / needs-evidence counts.
- **`src/app/(maestro)/source/events/[eventId]/page.tsx`** — inside the existing `source_analytics`
  branch, loads the event facts and passes a live `stageView` when one is built; on any read/build
  error it logs and passes nothing so the canvas shows the honestly-marked sample. The flag-OFF
  path (untouched `UniversalCanvasShell`) is unchanged.

## Honesty invariants (made executable)

- A lever with insufficient evidence renders `state:'insufficient_evidence'` with **no amount and no
  citation** — never a fabricated $0 finding.
- Every rendered amount traces to a committed fact via its joined citation.
- The roll-up sums **only quantified** bands.
- `provenance:'live'` is set ONLY on views built from real facts; absent facts → the sample view
  (`provenance:'sample'`, honesty note shown).

## Layer Impact

- `experimental` lane: the live adapter runs only when `source_analytics` is on (off for all).
- `client-data-lane`: reads the tenant-scoped `source_event_facts` table (no writes) when the flag
  is on. No schema change here; the table's migration is a prior slice.
- `global-control-lane`: the adapter/builder/reader libraries (inert unless the flag is on); the
  gated branch in the event page reads facts only when the flag is on.

## Client Applicability

- All clients: no behavior change — the flag is off; the existing `UniversalCanvasShell` renders.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/lib/source/facts/event-facts-reader.ts` (new — facts read adapter).
- `src/lib/source/facts/view/waterfall-view-adapter.ts` (new — pure evaluator→view adapter).
- `src/lib/source/facts/view/stage-analytics-builder.ts` (new — live StageAnalyticsView composer).
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — live-facts wiring inside the existing flag branch.
- `src/lib/source/facts/__tests__/waterfall-view-adapter.test.ts` (new — 4 tests).
- `src/lib/source/facts/__tests__/stage-analytics-builder.test.ts` (new — 4 tests).

## QA / Validation

- `npx jest` on the two new suites → **8 tests pass**: computed lever → quantified band with right
  amounts + joined citation; insufficient lever → `insufficient_evidence` band with **no amount, no
  $0-finding, no citation**; `provenance:'live'`; roll-up totals only quantified bands; end-to-end
  through the real AMS value-lever rules; empty facts → null (sample fallback). **pass.**
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) → **exit 0**. **pass.**
- `npx eslint` on all changed files → clean. **pass.**
- Migration `20260706120000_source_event_facts.sql` — **NOT run** in any environment. The facts
  reader returns empty maps against an absent/empty table, so the canvas falls back to sample.
- Not live-proven: the flag is off and no tenant is enrolled; the canvas renders sample
  intelligence only. **inert by design.** A live signed-in proof (facts present → live cited
  waterfall) is required at first enablement.

## Rollout Plan

Merge to `main` via PR + squash. Stays dark (`source_analytics` off). First enablement requires:
(1) the `source_event_facts` migration run in the target env, (2) committed facts for the event, and
(3) a live signed-in proof that the canvas renders the live cited waterfall (not sample) and that an
evidence-thin event still shows the honest sample. Until then the default `UniversalCanvasShell`
path is untouched.

## Rollback Plan

Turn the `source_analytics` flag off (default) — the branch is unreachable and the untouched
`UniversalCanvasShell` renders. Full revert: `git revert` the squash commit; the adapter/reader
libraries are dead code with no other importers.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — the live branch is unreachable while the flag is off; the default
  path is the untouched existing canvas. The facts read is tenant-scoped and read-only.
- Migration run path: `20260706120000_source_event_facts.sql` via the private-VNet migrate job
  (prior slice); not run here.
- Feature/env flag update path: `includeTenants` in `src/lib/features/registry.ts` or
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.

## Audit Evidence

- Tests: `src/lib/source/facts/__tests__/waterfall-view-adapter.test.ts`,
  `src/lib/source/facts/__tests__/stage-analytics-builder.test.ts` (8 tests, green).
- Every rendered amount carries a `FactSourceCitation` recovered from the `source_event_facts` row
  the evaluator read; insufficient bands carry none and show no amount.

## Known Gaps

- **Intake beats not fact-derived.** Only the value-waterfall beat is live. The intel/tasks/gate
  beats reuse the sample scaffold's structure (the intel *lead* is rewritten to state the real
  computed / needs-evidence counts). Making tasks + gate fact-derived is a later slice.
- **Archetype resolution falls back to AMS.** `resolveValueArchetype` prefers the event's
  `event_type`-mapped archetype only when it declares value-lever rules; today only
  `AMS_MANAGED_SERVICES` has rules, so every event with facts evaluates against AMS. This is correct
  now (AMS is the authored library) but must revisit as more archetypes gain rules — and the event
  page resolves via the fallback because `getSourcingEvent` does not surface the raw `event_type`.
- **Baseline is the event value estimate.** The waterfall baseline uses `event.valueAtStakeUsd`, not
  a fact-derived incumbent run-rate. A committed-fact baseline is a later refinement.
- **Not live-proven.** Flag off, no tenant enrolled, migration not run. First-enablement proof
  pending.
