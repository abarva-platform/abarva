# Meridian End-to-End Loop — In-Product Wiring Gap Inventory

**Slice:** Wave 5, Slice 5.2 — Meridian end-to-end path
**Companion:** `tests/e2e/meridian-end-to-end-loop.spec.ts`
**Scenario script:** `docs/strategy/scenarios/SCENARIO-MERIDIAN-AMBIENT-CLINICAL.md`
**Date:** 2026-05-16

## Purpose

Slice 5.2 authors an E2E spec that walks the Meridian Health ambient
clinical-documentation decision through the North-Star loop
(Context → Intelligence → Move → Source → Tower → Outcome). While
authoring the spec, every place where the loop is coherent **in the
strategy doc but not yet wired as a traversable in-product affordance**
was recorded here.

This is an honest gap inventory only. Slice 5.2 does **not** fix product
wiring — no `src/**` changes. Fixes belong to later Wave 5 slices
(notably 5.4, the cross-module trace viewer) and the Source/Moves/Tower
tracks.

## How to read the gap severity

- **Blocking** — the loop transition has no product-side affordance at
  all; a user cannot traverse it without manually changing the URL.
- **Partial** — an affordance exists but does not carry the decision
  context (e.g. a generic link, not a deep link scoped to this Move).
- **Cosmetic** — the wire exists and carries context; only labelling or
  discoverability is weak.

## Gap inventory

### Gap 1 — Context → Intelligence (Partial)

**Loop transition:** Setup / Data Trust (Steward) → Intelligence (Sentinel).

The scenario's Step 0 establishes the context readiness snapshot
(workforce KPIs green, clinical-data hard-limit enforced). Step 1 expects
the burnout pattern to be surfaced as the lead pattern *because of* that
context. There is no asserted affordance on the Setup surface that hands
the user directly into the relevant Intelligence pattern (Pattern 3.6).
The transition works by independent navigation, not by a loop wire.

**Spec handling:** Step 0 and Step 1 are asserted as independent surface
loads; the spec does not assert a Setup→Intelligence deep link.

### Gap 2 — Intelligence → Move (Partial)

**Loop transition:** Intelligence bet brief → Moves `/strategic-moves`.

The scenario's Step 1 produces a "pressure-tested bet brief … promoted
into Moves." A promote-to-Move affordance exists in the product
(`shape-into-move-cta`, exercised by `moves-castillo-journey.spec.ts`),
but it is wired from the **AI-initiatives** detail page, not from the
Intelligence pattern-to-Move funnel for this scenario. There is no
asserted affordance that promotes *Pattern 3.6 / the ambient-documentation
bet brief* directly into a new Move with the bet context attached.

**Spec handling:** Step 2 asserts the Moves portfolio renders; it does
not assert an Intelligence→Moves promote affordance scoped to this bet.

### Gap 3 — Move → Source (Blocking for this scenario)

**Loop transition:** Move sourcing-strategy deliverable → Source event.

The scenario's Step 2 says the "sourcing strategy deliverable opened …
triggers Source," and Step 3 enters Source "from the Move's
sourcing-strategy deliverable." The Move→Source trigger exists as a
track item (plan §3, Source 2.6 "Move-to-Source trigger"), but there is
no asserted in-product affordance that opens the Source event **from the
ambient-documentation Move's sourcing-strategy deliverable**. A user
traverses Move→Source by independent navigation to `/source`.

**Spec handling:** Step 3 asserts the Source portfolio renders; it does
not assert a deliverable→Source deep link. Flagged inline in the spec at
the Step 3 comment block.

### Gap 4 — Source → Tower (Partial — the one wired transition)

**Loop transition:** Source event → Tower portfolio card.

This is the **only** loop transition with a product-side wire: Tower
exposes a Source handoff panel (`tower-source-handoff-panel`, shipped by
Slice 3.3, PR #2102). The spec asserts that panel renders. The gap is
partial: the panel surfaces Source risk into Tower, but there is no
asserted reverse affordance (Tower card → the originating Source event)
and the panel is not scoped/asserted to the ambient-documentation Source
event specifically.

**Spec handling:** Step 4 and the loop-coherence test both assert
`tower-source-handoff-panel` is visible — the spec's strongest loop-wire
assertion.

### Gap 5 — Tower Outcome → Context Layer (Blocking)

**Loop transition:** Tower outcome ledger → Context Layer segments.

The scenario's Step 5 closes the loop: Tower records projected → tracked
→ verified value and "writes back fresh context segments, updating the
Pattern 3.6 evidence baseline." There is no single in-product surface
that represents the outcome-ledger → Context-Layer write-back as a
traversable affordance. The outcome ledger itself (plan §3, Tower 3.1)
and the outcome-feedback-to-pattern-graph item (Tower 3.6) are tracked,
but the loop-closing write-back is not a surface a user can walk.

**Spec handling:** Step 5 is an explicit `test.fixme` — it is recorded
as a known gap rather than asserted. When the wire lands, the fixme
should assert: Tower outcome ledger entry → Context segment update.

## Loop coherence summary

| Transition | Status | Product-side wire |
|---|---|---|
| Context → Intelligence | Partial | None asserted; independent nav |
| Intelligence → Move | Partial | Promote CTA exists, not wired from this bet |
| Move → Source | Blocking | No deliverable→Source affordance asserted |
| Source → Tower | Partial (wired) | `tower-source-handoff-panel` (Slice 3.3) |
| Tower Outcome → Context | Blocking | No write-back surface |

**Verdict:** The loop is **coherent as a narrative and as a set of
independently-rendering surfaces** — each surface loads for the Meridian
CDIO persona and carries the ambient clinical-documentation decision
recognisably (the spec's loop-coherence test proves this). The loop is
**not yet coherent as a continuously-traversable product flow**: four of
five transitions lack a decision-scoped affordance, and only Source→Tower
is wired. Closing Gaps 3 and 5 is the highest-leverage work to make the
loop feel like one system; the cross-module trace viewer (Slice 5.4) is
the natural home for surfacing the full evidence trail.

**No PHI dependency:** consistent with the scenario guardrail, every gap
above concerns workflow, sponsor, and vendor-logic wiring — none touches
patient-record reasoning.
