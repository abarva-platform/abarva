# First Capital Loop — In-Product Wiring Gaps

**Slice:** Wave 5, Slice 5.3 — First Capital end-to-end path (FedNow / model-risk).
**Companion spec:** `tests/e2e/firstcapital-end-to-end-loop.spec.ts`
**Scenario:** `docs/strategy/scenarios/SCENARIO-FIRSTCAPITAL-MODEL-RISK.md`

This is an honest inventory of where the scripted North-Star loop
(Context → Intelligence → Move → Source → Tower → Outcome) has **no
in-product handoff** today. It was assembled while authoring the
Slice 5.3 Playwright spec. **Nothing here is fixed in this slice** — the
spec asserts what the product renders today, and these gaps are why
several of its loop-coherence assertions are soft probes (annotations)
rather than hard `expect`s.

Surfaces involved: Intelligence (Sentinel) · Moves = `/strategic-moves`
(Nexus) · Source = `/source` (Sentinel) · Tower (Atlas).

---

## GAP-1 · No FedNow / real-time-payments seed segment

**Where:** Context / Intelligence.
**What:** The First Capital intelligence overlay seeds the genuine
AML/BSA modernization reality (Pattern 3.1, the 2.8 Risk & Compliance
KPIs, SR 11-7 maturity, consent-order context, the AML vendor
landscape) but has **no explicit FedNow / real-time-payments segment**.
The scenario layers FedNow on as a plausible business trigger.
**Impact:** Intelligence cannot ground the "real-time settlement
compresses the fraud window" framing in a seeded segment; the bet is
inferred, not surfaced.
**Already acknowledged** in the scenario doc ("Gap noted").

## GAP-2 · No Intelligence → Move "promote bet brief" handoff

**Where:** Intelligence → Moves.
**What:** Step 1 of the script produces a *legal-privileged
pressure-tested bet brief* that is "promoted into Moves." There is no
in-product control that carries an Intelligence pattern/brief into the
`/strategic-moves/new` origination flow as pre-filled 2D context. The
only Move-origination handoff that exists is the AI-initiative
"Shape into a Move →" CTA (see `moves-castillo-journey.spec.ts`), which
is keyed off `/home/ai-initiatives/*`, not Intelligence patterns.
**Impact:** The Intelligence → Move leg is a manual re-entry. The CXO
must start a New Move from scratch; the bet brief is not carried.

## GAP-3 · No first-class regulatory-gate / SR 11-7 control-matrix deliverable

**Where:** Moves.
**What:** Step 2 makes an SR 11-7 control matrix and a
regulator-engagement plan first-class P3 deliverables, and the P3 gate
is "hard" — it cannot pass without MRM validation readiness. The Move
phase trace has generic deliverables and gates but **no regulatory-gate
deliverable type** and no gate that encodes a model-risk /
MRM-readiness pass condition.
**Impact:** The "hard gate" that is the heart of the scenario cannot be
represented; the regulatory-gating step is narrative-only in-product.

## GAP-4 · No Move → Source "sourcing-strategy deliverable" handoff

**Where:** Moves → Source.
**What:** Step 3 is "entered from the Move's sourcing-strategy
deliverable" — opening that deliverable is meant to trigger a Source
event. There is no in-product link from a Move deliverable to
`/source/new` (or to an auto-created sourcing event) carrying the Move
context.
**Impact:** The Move → Source leg is a manual re-entry; the sourcing
event is not bound back to the originating Move.

## GAP-5 · No MRM-readiness pass/fail vendor-screen primitive

**Where:** Source.
**What:** Step 3 makes MRM-readiness a **hard pass/fail gate** applied
*before* TCO comparison — vendors that cannot support SR 11-7 are
screened out up front. Source has vendor scorecards and compare views
but no pass/fail screening primitive, and no model-risk/explainability/
drift-monitoring criteria as a gating (not weighted) screen.
**Impact:** The decisive vendor-risk gate of the scenario cannot be
modelled; MRM-readiness would have to be a soft scorecard line.

## GAP-6 · No Source-event → Tower-card dependency link

**Where:** Source → Tower.
**What:** Step 4 shows the Move as a Tower portfolio card with an
explicit *dependency on the Source event* (the MRM-gate). Tower cards
do not carry a typed dependency edge to a Source event.
**Impact:** Atlas cannot surface "the SR 11-7 MRM validation gate is the
gating dependency" as a structured portfolio risk — it would be free
text. (Slice 3.3, PR #2102, added *Source risk in Tower*; whether it
covers a typed Source-event dependency edge should be confirmed before
this gap is actioned.)

## GAP-7 · Tower risk lens is not regulatory-scoped

**Where:** Tower.
**What:** Step 4's executive headline is that the MRM validation gate is
a *regulatory* control gap, not a schedule slip. `/tower/lens/risk`
renders portfolio risk but has no regulatory-risk classification and no
legal-privileged disclosure scoping on the risk line.
**Impact:** The scenario's distinction between a regulatory control gap
and a delivery risk cannot be expressed; privileged disclosure scoping
of the risk/ELT brief line is not enforced in-product.

## GAP-8 · No outcome-ledger → context-segment write-back

**Where:** Tower Outcome → Context.
**What:** Step 5 closes the loop: verified-value and MRM-maturity
readings are "written back as fresh context segments," updating the
Pattern 3.1 evidence baseline and the consent-order remediation trace.
The Tower outcomes ledger records outcomes but there is **no write-back
path** from a verified outcome into the context/intelligence layer.
**Impact:** The loop does not close in-product — the "next regulated-AI
bet starts from a stronger model-risk baseline" promise is not wired.

## GAP-9 · No regulatory dual-scope (legal-privileged) disclosure enforcement on the loop

**Where:** Cross-cutting (Context, Intelligence, Source, Tower).
**What:** The script states AML KPIs carry *legal-privileged +
program-scoped* disclosure throughout, and that every downstream
artifact must be flagged. There is no in-product disclosure-scope
attribute that travels with an artifact from Intelligence → Move →
Source → Tower; disclosure scoping is per-surface RLS at best, not an
artifact-level legal-privileged flag.
**Impact:** The "legal-privileged handling flagged for every downstream
artifact" guarantee is not enforced as the artifact moves around the
loop.

---

## Loop coherence summary

| Leg | In-product handoff today | Gap |
|---|---|---|
| Context → Intelligence | Tenant overlay loads; pattern packs seeded | GAP-1 (no FedNow segment) |
| Intelligence → Move | None — manual New Move start | GAP-2 |
| Within Move (regulatory gate) | Generic deliverables/gates only | GAP-3 |
| Move → Source | None — manual `/source/new` | GAP-4 |
| Within Source (vendor gate) | Weighted scorecards only | GAP-5 |
| Source → Tower | Card exists; no typed dependency edge | GAP-6 |
| Within Tower (regulatory risk) | Generic risk lens | GAP-7 |
| Tower Outcome → Context | None — ledger is terminal | GAP-8 |
| Cross-cutting disclosure | Per-surface RLS, no artifact flag | GAP-9 |

**Bottom line:** every individual surface (Intelligence, Moves, Source,
Tower) renders for the First Capital CIO and the regulated-AI substance
is present in the seed — so the loop is *navigable* and the spec's
hard render assertions hold. But **none of the five cross-surface
handoffs is wired**, and the two regulatory-gate primitives (Move SR
11-7 gate, Source MRM pass/fail screen) do not exist. The loop is
coherent as a *navigable demo path* and incoherent as an *automated
hand-off chain*. Closing GAP-2, GAP-4, GAP-6 and GAP-8 is the minimum
to make the end-to-end loop real rather than scripted.
