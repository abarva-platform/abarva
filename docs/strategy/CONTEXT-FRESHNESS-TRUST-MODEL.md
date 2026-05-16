# Context Freshness & Trust Model

**Slice 4.1 — Wave 4 (Context Layer Freshness, Confidence, and Trust)**
Status: design + typed model + builders shipped. Agent surfacing is Slice 4.2; Day-1 readiness checklist is Slice 4.3; UI is a later slice.

---

## 1. Problem

AbarVa grounds every CXO answer in a 14-segment enterprise-context model. Today an answer grounded in 14-month-old `org_structure` is delivered with the *same confidence* as one grounded in last-week's `vendor_contracts`. That false confidence is a trust risk: a CXO who catches one stale-but-confident answer discounts every answer after it.

The fix is to make freshness and trust **first-class, computed, and per-segment**, so a later slice can have the agent say:

> "I can answer this from current vendor and KPI data, but org structure is 11 months old, so sponsor-chain confidence is partial."

---

## 2. The 14 segments

`enterprise_profile`, `org_structure`, `it_landscape`, `it_financials`, `kpi_dictionary`, `program_inventory`, `sourcing_artifacts`, `program_deliverables`, `evidence_ledger`, `operating_telemetry`, `vendor_contracts`, `compliance`, `industry_context`, `cross_program_signals`.

The canonical list lives in code as `CONTEXT_SEGMENT_KEYS` (`src/lib/context-trust/freshness-model.ts`).

---

## 3. Freshness model

Each segment carries two pieces of provenance metadata:

| Field | Meaning |
|---|---|
| `lastUpdated` | ISO date the underlying data was last refreshed. `null` => never loaded. |
| `sourceType` | How the data arrived: `verified` / `sourced` / `inferred` / `absent`. |

**Where the metadata lives.** In production, `lastUpdated` and `sourceType` are read from the provenance columns already present on the enterprise-context tables (record/fact `updated_at`, ingestion source). This slice does **not** add a migration — it defines the typed contract (`SegmentMetadata`) that a later read-model adapter populates. For now, callers (tests, fixtures, Slice 4.2 consumers) supply `SegmentMetadata` directly.

### Refresh cadence

Each segment has an expected refresh cadence reflecting how fast its domain actually moves. Age (in whole days) maps to a **freshness state**:

- `fresh` — age ≤ `cadenceDays`
- `aging` — `cadenceDays` < age ≤ `staleDays`
- `stale` — age > `staleDays`
- `unknown` — no `lastUpdated` date

| Segment | cadenceDays | staleDays |
|---|---:|---:|
| `enterprise_profile` | 365 | 540 |
| `org_structure` | 180 | 365 |
| `industry_context` | 180 | 365 |
| `it_landscape` | 120 | 270 |
| `kpi_dictionary` | 120 | 270 |
| `compliance` | 120 | 270 |
| `it_financials` | 90 | 180 |
| `vendor_contracts` | 90 | 180 |
| `program_inventory` | 60 | 120 |
| `sourcing_artifacts` | 60 | 120 |
| `program_deliverables` | 45 | 90 |
| `evidence_ledger` | 45 | 90 |
| `operating_telemetry` | 30 | 60 |
| `cross_program_signals` | 30 | 60 |

Cadence values live in `SEGMENT_CADENCE` and are the single source of truth.

---

## 4. Trust-rung scale

A segment occupies exactly one rung. Rungs, strongest to weakest:

| Rung | Meaning |
|---|---|
| **verified** | Human owner or system-of-record confirmed, **and** within refresh cadence. |
| **sourced** | Imported from a real tenant artifact / connector, fresh enough, not human-confirmed. |
| **inferred** | Modelled or estimated by AbarVa from other segments — or real data whose age cannot be certified (no source date). |
| **stale** | Real data, but older than its staleness window allows. |
| **missing** | No data ever loaded for the segment. |

**Derivation rule.** Source type sets the *ceiling*; freshness can only lower the rung:

- `sourceType = absent` → always `missing`.
- `freshness = stale` → always `stale` (real data, past its grace band).
- `freshness = unknown` (no date) → capped at `inferred` — AbarVa cannot vouch for age.
- otherwise the source-type ceiling applies: `verified` → `verified`, `sourced` → `sourced`, `inferred` → `inferred`.

So a fresh, human-verified segment is `verified`; the same segment 14 months later is `stale`; an AbarVa-modelled estimate is at best `inferred`.

---

## 5. Stale-answer handling

An answer is grounded in a *set* of segments. The verdict is driven by the **weakest backing rung** — a grounding chain is only as strong as its weakest link. Each verdict carries a recommended **agent action** (consumed by Slice 4.2):

| Weakest rung | Grounding confidence | Agent action | Behaviour |
|---|---|---|---|
| `verified` / `sourced` | `high` | `answer` | Answer normally. |
| `inferred` | `partial` | `caveat` | Answer, but caveat that part of the grounding is modelled / undated. |
| `stale` | `low` | `downgrade` | Answer with explicitly downgraded confidence; name the stale segment(s) and their age. |
| `missing` | `insufficient` | `decline` | Do **not** guess. Decline and tell the user which segment(s) to load. |

An empty backing set yields `insufficient` / `decline`.

This is deliberately conservative: one stale or missing segment pulls the whole answer down, because CXO trust is asymmetric — a single confidently-wrong answer costs more than a dozen appropriately-hedged ones.

---

## 6. Typed model & builders

`src/lib/context-trust/freshness-model.ts` — pure, dependency-free:

- **Types:** `ContextSegmentKey`, `ContextSourceType`, `TrustRung`, `FreshnessState`, `SegmentCadence`, `SegmentMetadata`, `SegmentTrustAssessment`, `GroundingConfidence`, `StaleAnswerAction`, `GroundingVerdict`.
- **Data:** `CONTEXT_SEGMENT_KEYS`, `TRUST_RUNGS`, `SEGMENT_CADENCE`.
- **Builders (pure functions):**
  - `computeAgeDays(lastUpdated, asOf?)`
  - `computeFreshnessState(ageDays, cadence)`
  - `computeTrustRung(sourceType, freshness)`
  - `assessSegment(metadata, asOf?)` → `SegmentTrustAssessment`
  - `deriveGroundingVerdict(metadatas, asOf?)` → `GroundingVerdict`

All builders accept an optional `asOf` date so callers and tests are fully deterministic.

---

## 7. Deferred

- **Slice 4.2** — Sentinel / Nexus / Atlas / Source surface the verdict in answers (agent-prompt change).
- **Slice 4.3** — Day-1 load-readiness checklist: minimum segment packs per module / industry.
- **Read-model adapter** — populating `SegmentMetadata` from live enterprise-context provenance columns (no migration needed; columns already exist).
- **UI** — Data Trust surface visualising per-segment freshness.
