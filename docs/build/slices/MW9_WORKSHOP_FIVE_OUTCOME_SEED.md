# MW9 · Workshop Five Outcome Seed + Gate Narrative

**Wave:** wave-19  
**Lane:** F  
**Status:** code_complete  
**Risk:** low  
**Category:** MW (Maestro Workshop)  
**Depends on:** MW1, MW2, MW8, PROG11

---

## Purpose

Add deterministic Workshop 5 outputs so the Synthesis → Design gate has a narrative
(outcomes captured, remaining blockers) instead of being permanently blocked without
story. Prior to MW9 the phase-gate canvas view listed "Workshop 5 not yet scheduled"
as a gate requirement; this slice plants the seed that the workshop happened and
records what came out of it.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/programs/workshop-five-outcomes.ts` | New — defines `WorkshopFiveOutcomes` types and `buildWorkshopFiveOutcomes()` builder |
| `src/lib/programs/phase-gate-canvas-view.ts` | Updated — `req-synthesis-workshop.detail` now reflects Workshop 5 completion |
| `src/__tests__/integration/programs/workshop-five-outcomes.test.ts` | New — 12 deterministic assertions |

---

## Data Produced (deterministic seed)

| Field | Value |
|---|---|
| workshopId | `workshop-5-synthesis` |
| workshopTitle | Value Hypothesis Validation |
| sessionDate | 2026-04-18 |
| programCode | APX-CDP-2026 |
| tenantSlug | apex-retail |
| decisionsReached | 3 (all status: reached) |
| tensionsResolved | 1 (status: resolved) |
| evidenceCaptured | 2 (1 captured, 1 candidate) |
| remainingMissingEvidence | 3 named gaps |
| deterministicSeed | true |

### Gate Narrative

> Workshop 5 completed on 2026-04-18. Three decisions reached and one tension
> resolved. The Synthesis → Design gate remains pending: two evidence items captured,
> three remain missing. Gate will progress when value baseline is approved, platform
> owner confirmation is received, and final BAFO commercial evidence is available from
> the AMS sourcing event.

---

## Acceptance Criteria

- [x] `buildWorkshopFiveOutcomes()` returns an object
- [x] `workshopId` is `"workshop-5-synthesis"`
- [x] `programCode` is `"APX-CDP-2026"`
- [x] `tenantSlug` is `"apex-retail"`
- [x] `decisionsReached` has 3 items, all status `reached`
- [x] `tensionsResolved` has 1 item with status `resolved`
- [x] `evidenceCaptured` has 2 items
- [x] `remainingMissingEvidence` has 3 items
- [x] `gateNarrative` is non-empty
- [x] `deterministicSeed` is `true`
- [x] No decision has status `"approved"` (not fake-completing anything)
- [x] Repeated calls return byte-identical output

---

## Explicit Deferrals

- No live workshop notes ingestion (MW1 contract: audio + real-time transcription deferred)
- No actual gate transition or phase advance
- No DB writes, no model calls
- Gate approval state machine remains deferred to a future auth + audit + persistence slice
- `evidenceCaptured[1]` is status `"candidate"` — requires approval before gate, never auto-promoted here

---

## Validation Commands

```sh
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/programs/workshop-five-outcomes.test.ts --no-coverage
npx eslint --max-warnings=0 src/lib/programs/workshop-five-outcomes.ts src/__tests__/integration/programs/workshop-five-outcomes.test.ts
```
