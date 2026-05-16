# Tower Outcome Taxonomy

**Slice:** Wave 0, Slice 0.3 (`ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md`)
**Surface:** Tower — the Atlas-fronted CXO portfolio command room
**Status:** Contracts + builders shipped; executive-action *queue UI* deferred to Slice 3.2

---

## 1. Purpose

Tower must be able to do two things a portfolio operator does instinctively:
explain **why a metric matters** and name **which executive action it
implies**. This document is the canonical, encoded definition of the
portfolio outcome concepts Tower reasons over. Every concept here is
mirrored by a typed contract and a pure builder in
`src/lib/tower/taxonomy/outcome-taxonomy.ts`.

The taxonomy gives Source, Moves, and Tower shared outcome language so each
module does not invent its own value model.

---

## 2. The value-confidence ladder

A value claim is not a single number — it has a confidence rung. A claim
climbs the ladder only as evidence strengthens. Evidence can never inflate
a claim above the rung it supports.

### 2.1 Projected value

- **What it means:** The modelled benefit a program is expected to deliver,
  estimated before any instrumented evidence exists.
- **Computed / sourced from:** `program_inventory` — the business case
  captured at origination.
- **Why it matters to a CXO:** It sets the investment thesis. An unverified
  projection that is never re-tested silently becomes an inflated value
  claim the CXO ends up defending to the board.
- **Implied executive action:** `verify_value_claim` — commission a value
  verification before the projection is reported as fact.

### 2.2 Tracked value

- **What it means:** Benefit observed through live operating telemetry
  during a pilot — instrumented, but not yet audited or reconciled.
- **Computed / sourced from:** `operating_telemetry` joined to
  `program_inventory`.
- **Why it matters to a CXO:** It shows whether the thesis is holding in
  the field *before* spend is scaled.
- **Implied executive action:** `verify_value_claim` — promote to verified
  via the evidence ledger before it is treated as defensible.

### 2.3 Verified value

- **What it means:** Benefit confirmed against the `evidence_ledger` and
  reconciled to finance — a production-grade value fact.
- **Computed / sourced from:** `evidence_ledger` corroborated by
  `operating_telemetry`.
- **Why it matters to a CXO:** It is the only rung a CXO can defend to the
  board or the CFO without a caveat.
- **Implied executive action:** `no_action` while on track — verified value
  is the destination of the ladder.

---

## 3. Adoption

- **What it means:** The share of the eligible population actively using a
  deployed AI capability in real workflows.
- **Computed / sourced from:** `operating_telemetry` — active users over
  eligible population.
- **Why it matters to a CXO:** Value cannot be realized without adoption. A
  high-projected, low-adoption program strands the entire investment.
- **Implied executive action:** `drive_adoption` — fund an adoption push.
  A **critical** adoption gap escalates to `sponsor_intervention`, because
  at that depth the blocker is organizational, not tooling.

---

## 4. Spend at risk

- **What it means:** Committed program and consumption spend that is not
  currently backed by tracked or verified value.
- **Computed / sourced from:** `vendor_contracts` and `program_inventory`
  for commitments, netted against `evidence_ledger` value.
- **Why it matters to a CXO:** It quantifies the budget that should be
  considered for reallocation away from non-earning bets.
- **Implied executive action:** `reallocate_spend` — review whether the
  committed spend should move to a higher-earning program.

---

## 5. Renewal risk

- **What it means:** Exposure that a vendor contract will auto-renew or
  lapse on unfavourable terms before a value decision is made.
- **Computed / sourced from:** `vendor_contracts` (renewal dates, notice
  windows) against `evidence_ledger` value status.
- **Why it matters to a CXO:** A renewal window that closes without review
  locks in cost and forfeits negotiation leverage.
- **Implied executive action:** `open_renewal_review`. A renewal inside the
  90-day urgent window escalates even when the health band is only
  **watch** — time, not severity, is the trigger here.

---

## 6. Dependency risk

- **What it means:** Exposure from an upstream dependency — data, platform,
  sponsor, or another program — that can block delivery.
- **Computed / sourced from:** `program_inventory` (declared dependencies)
  and `org_directory` (sponsor chain).
- **Why it matters to a CXO:** A blocked dependency stalls value
  realization regardless of how well the program itself is run.
- **Implied executive action:** `escalate_dependency` — escalate the
  blocking dependency to the accountable owner.

---

## 7. Executive-action triggers

Every classified reading resolves to exactly one action from the closed
set below. The executive-action **queue** that ranks live instances of
these actions is Slice 3.2 — out of scope here.

| Action | Triggered when |
|---|---|
| `no_action` | Reading is `on_track` and (if a value claim) already `verified`. |
| `verify_value_claim` | A value concept whose rung is `projected` or `tracked`. |
| `drive_adoption` | Adoption below the on-track band, not yet critical. |
| `reallocate_spend` | Spend-at-risk below the on-track band. |
| `open_renewal_review` | Renewal risk below on-track, or inside the 90-day window. |
| `escalate_dependency` | Dependency risk below the on-track band. |
| `sponsor_intervention` | Adoption gap classified `critical`. |

### Severity bands

All score-driven concepts share one set of band edges on a 0..1 health
score (1 = healthy):

| Band | Score | Meaning |
|---|---|---|
| `on_track` | ≥ 0.75 | No executive action required. |
| `watch` | 0.50–0.75 | Monitor; action implied but not urgent. |
| `at_risk` | 0.25–0.50 | Executive action implied. |
| `critical` | < 0.25 | Escalated action implied. |

---

## 8. No-fabrication contract

The builders classify a **caller-supplied** reading. They never invent
dollar amounts, adoption percentages, or vendor outcomes. A reading whose
evidence does not support a value claim is classified as `projected`
value — never `verified`. This keeps Tower honest: it can explain and
escalate, but it cannot manufacture a value fact.

---

## 9. Deferred

- Executive-action **queue UI** (ranking, dedup, rendering) — Slice 3.2.
- Outcome **ledger schema / persistence** — Slice 3.1.
- Binding readings to live tenant telemetry — later Wave 3 slices.
