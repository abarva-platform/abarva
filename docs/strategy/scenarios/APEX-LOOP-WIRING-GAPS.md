# Apex End-to-End Loop — Wiring Gap Inventory

**Slice:** Wave 5, Slice 5.1 (Apex end-to-end path)
**Scenario:** `SCENARIO-APEX-CONTACT-CENTER.md` — Contact Centre AI Routing
**Companion spec:** `tests/e2e/apex-end-to-end-loop.spec.ts`
**Date:** 2026-05-16

## Purpose

The 0.4 scenario script describes the North-Star loop —
Context → Intelligence → Move → Source → Tower → Outcome — as a single
coherent decision. While authoring the Slice 5.1 Playwright spec, each
loop hand-off was checked against what is actually wired in product.
This note is the honest inventory: the **surfaces** all exist and load
coherently for the Apex tenant, but several **hand-off links** between
them are not yet wired. Fixing them is follow-on work (Slices 5.x / Wave
1–3 remainders) — Slice 5.1 ships the spec and this inventory only.

## Summary

| Loop hand-off | Status | Gap |
|---|---|---|
| Context → Intelligence | Coherent | — |
| Intelligence → Move | Partial | GAP-1 |
| Move → Source | Partial | GAP-2, GAP-3 |
| Source → Tower | Partial | GAP-4 |
| Tower → Outcome | Partial | GAP-5 |
| Outcome → Context | Not wired | GAP-5 |

**Verdict:** The loop is **coherent surface-by-surface** — every surface
renders for the Apex tenant with the right identity, and the central
object (the Contact Center AI Routing Move at P3) is real and seeded.
The loop is **not yet coherent hand-off-by-hand-off**: a user cannot
click straight through from the Intelligence bet to the Move, from the
Move to a Source event, or from a Source event to a Tower portfolio
card. The story is true in the strategy doc and in the seed data; it is
not yet a single navigable path in product.

## Gaps

### GAP-1 — Intelligence bet brief does not deep-link into the Move
**Scenario step:** Step 1.
The scenario promotes a pressure-tested bet brief ("Govern and modernise
contact-centre AI routing as one initiative") from the Intelligence
pattern-to-Move funnel into Moves. In product, the `/intelligence` V4
Brief renders for the correct tenant, but there is no discrete,
clickable bet-brief artifact that deep-links to the seeded
`Contact Center AI Routing` Move. The funnel → Move promotion is not a
navigable hand-off.
**Follow-on:** Wire a bet-brief artifact in the Intelligence funnel that
carries a `fromBet` deep-link into `/strategic-moves`.

### GAP-2 — Move "Sourcing strategy decision" deliverable has no Source CTA
**Scenario step:** Step 2.
`scripts/seed-apex-demo-move.ts` seeds a `sourcing_strategy` deliverable
(`p3_sourcing_strategy`, status `not_started`) on the P3 Move. The
scenario says opening this deliverable "triggers the handoff to Source".
In product the deliverable is named on the Move but exposes no CTA or
deep-link that opens or creates a Source event.
**Follow-on:** Add a Move-deliverable → Source-event CTA (the Wave 2.6
"Move-to-Source trigger" slice).

### GAP-3 — No seeded Source event for the contact-centre decision
**Scenario step:** Step 3.
The scenario's Step 3 expects "a sourcing event seeded from the Move
with the should-cost and delivery-model frame" and a three-lane
decomposition. No such Source event exists in seed data —
`seed-apex-demo-move.ts` stops at the Move, squad, deliverables and
milestones. The three-lane sourcing strategy has no in-product home, so
the Move → Source hand-off cannot be exercised end-to-end.
**Follow-on:** Extend the Apex seed with a contact-centre Source event
linked back to the Move (depends on GAP-2's link contract).

### GAP-4 — Contact-centre Move is absent from the Tower portfolio
**Scenario step:** Step 4.
The scenario expects the Move to appear as a Tower portfolio card with
projected value, risk posture, adoption readiness and a dependency link
to the Source event. Tower's only contact-centre reference in seed data
(`scripts/seed/tower/data.ts`) is a paused telemetry integration
(`integration_type: 'contact_center'`) — not a portfolio line item. The
Move does not surface in Tower, so the Source → Tower dependency link
cannot be asserted.
**Follow-on:** Seed/derive a Tower portfolio card for the Move with the
Source-event dependency edge (Wave 3.3 "Source risk in Tower" landed the
risk surfacing — PR #2102 — but not the Apex card itself).

### GAP-5 — Outcome ledger has no contact-centre evidence and no write-back
**Scenario step:** Step 5.
Step 5 expects the Tower outcome ledger to record projected → tracked →
verified value for the Move, then write verified evidence back as fresh
context segments — closing the loop into Step 0. Neither half is wired:
no contact-centre outcome evidence is seeded, and there is no
in-product path from the outcome ledger back to the Context Layer. The
loop's final hand-off (Outcome → Context) is unwired.
**Follow-on:** Seed outcome evidence for the Move and design the
outcome-ledger → context-segment write-back (Wave 4 context-layer work).

## How the spec handles these gaps

`apex-end-to-end-loop.spec.ts` traverses all six steps in loop order.
For each unwired hand-off it asserts the **surface loads coherently**
for the Apex tenant (correct identity, no auth bounce) and treats the
missing artifact link as a **soft, conditional check** — if a future
seed adds the artifact, the assertion strengthens automatically; until
then the step still passes on surface coherence. Every such step carries
an inline `GAP-n` comment cross-referencing this document.
