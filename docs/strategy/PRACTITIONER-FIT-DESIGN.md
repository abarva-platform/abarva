# Practitioner-Fit Design — turning the workflow OS into a triggered decision OS

**Date:** 2026-05-17
**Status:** design spec — proposal for review by a design-partner IT sourcing VP before build.
**Pairs with:** `ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md` (the capability program), `SOURCE-SOURCING-METHODOLOGY.md`.

---

## 1. Why this exists

The product enhancement program built genuine expert capability across Source, Moves, and Tower. But it was verified *structurally* (tests, CI, wired hand-offs) — never tested for **usability** or **fit with how a practitioner's day actually runs**, and never validated by a real IT sourcing VP.

The honest gap: AbarVa is a **linear workflow OS** (originate → shape → source → track). An IT sourcing VP's reality is **interrupt-driven and mid-stream** — a renewal bearing down, a stakeholder fast-track request, a vendor escalation, a CFO spend question, an RFP response due. They rarely originate a clean greenfield event; they get *triggered*, enter *mid-stream*, and work *time-boxed*.

This spec proposes the **practitioner-fit layer**: the same engine, re-fronted around how the role actually works. The keystone insight — **most of it is an aggregation/re-presentation over modules that already shipped**, not net-new capability.

**This is a proposal.** It must be reviewed by a design-partner IT sourcing VP before build. The build then runs as one thin vertical slice put in front of that partner — validate-then-build, not validate-after.

---

## 2. The reframe

| Today — workflow OS | Proposed — triggered decision OS |
|---|---|
| Four surfaces you navigate | A queue that tells you what to decide today |
| You originate a clean event | You enter mid-stream on an existing vendor/contract/RFP |
| Depth-first output | Answer-first, depth on demand |
| You visit the tool | The tool runs your sourcing function |

---

## 3. The keystone — the Decision Queue

A new home surface. Replaces "start a workflow" with **"here is what needs your decision."** Each item is a typed card that opens the right existing workflow with context pre-loaded.

### 3.1 Trigger model

Each queue item is a `DecisionTrigger` produced by a detector. Detectors are pure functions over already-shipped data/modules:

| Trigger | Detector source (already built) | Phase |
|---|---|---|
| `renewal_approaching` | `vendor_contracts` end dates + date math | 1 — data exists |
| `auto_renewal_trap` | contract auto-renew clauses + notice-window math | 1 |
| `gate_approval_pending` | the gate-criteria model | 1 |
| `overlapping_spend` / `shelfware` | `it_financials` + `vendor_contracts` (Source demand-challenge logic) | 1 |
| `context_stale_blocking` | the freshness/trust model (Slice 4.1) | 1 |
| `rfp_response_due` | Source event stage machine | 1 |
| `outcome_remeasurement_due` | the outcome ledger (Slice 3.1) | 1 |
| `vendor_delivery_escalation` | external — needs a connector | 2 — live data |
| `stakeholder_fast_track_request` | external — inbound channel | 2 |

**Phase 1 is buildable now** — seven of nine triggers are pure computations over existing substrate. Phase 2 triggers arrive with the connector roadmap.

### 3.2 Card contract

```ts
interface DecisionTrigger {
  id: string;
  tenantClientKey: string;
  kind: DecisionTriggerKind;        // the table above
  urgency: 'today' | 'this_week' | 'this_month' | 'watch';
  headline: string;                 // "Adobe contract auto-renews in 11 days"
  whyItMatters: string;             // one line of expert framing
  recommendedAction: string;        // "Open the renewal decision" / "Decline auto-renewal"
  deepLink: string;                 // into the relevant Source/Moves/Tower workflow, pre-loaded
  evidenceRefs: string[];           // contract id, segment id, ledger entry id
  surfacedAt: string;
}
```

### 3.3 Queue behavior

- **Sorted by urgency**, then by value-at-stake. Deterministic order (the QA discipline from the execution plan).
- **Never empty-and-silent** — if nothing is urgent, it says so plainly rather than showing a blank.
- **Each card deep-links into the pre-loaded workflow** — no re-originating. The card *is* the mid-stream entry (§4).
- **No fabrication** — a trigger only appears when its detector has real grounding; absent data = no card, never a guessed one.

### 3.4 Why it's high-leverage

The Decision Queue is mostly an **aggregation layer** over `vendor_contracts`, the freshness model, the gate model, the outcome ledger, and Source event stages. Small build, but it changes what AbarVa *is* — from "a tool you visit" to "the operating surface of the sourcing function."

---

## 4. Mid-stream entry

A VP rarely originates greenfield. Today origination assumes it. Proposed: an alternate entry point — **"I have this vendor / contract / RFP"** — that:

1. Takes an existing object (a `vendor_contracts` row, a Source event, a Move).
2. Skips origination; pre-loads the object into the relevant machinery — the Source classifier, delivery-model gate, should-cost estimator, proposal normalization all already operate on a populated event.
3. Drops the VP straight at the decision, not at a blank form.

Every Decision Queue card (§3) is itself a mid-stream entry — the card carries the object reference and deep-links in pre-loaded. Mid-stream entry is a new *door*, not a new engine.

---

## 5. Fast-answer mode

The Source/Moves/Tower modules already produce structured output. A VP often needs the 30-second version, not the decision pack.

Proposed: a **progressive-disclosure** presentation pattern applied across the expert surfaces —
- **Tier 1 (always first):** the headline answer + the single recommended action + a confidence/freshness tag.
- **Tier 2 (on demand):** the reasoning — should-cost iceberg, normalization matrix, negotiation levers.
- **Tier 3 (on demand):** the full evidence trail (the cross-module trace viewer).

No new analysis — a re-layering of output the modules already generate. Measure success as **time-to-defensible-answer**: target under one minute, or it loses to a spreadsheet.

---

## 6. Supporting layer (later phases)

- **Live freshness / connectors** — contract repository first (it powers `renewal_approaching`, `auto_renewal_trap`, and mid-stream entry). The one genuinely new build; integration work, Codex-lane. Without it "real-time" is hollow.
- **Collaboration** — sourcing is a team sport (legal, finance, the sponsor). Assignable decision items, comments, a shared decision record.
- **Notification / mobile surface** — a digest + urgency alerts; VPs act between meetings, from a phone.

---

## 7. Build discipline — validate, then build

The capability program was blind-built (~65 PRs) before any practitioner saw it. The practitioner-fit layer must not repeat that.

1. **This spec** is reviewed by a design-partner IT sourcing VP (and, for the Moves equivalent, an agentic-delivery lead). Their redlines change this document before any code.
2. **Build the Decision Queue as one thin vertical slice** — Phase-1 triggers only, demoable in ~a week, computed from existing modules — and put it in front of that VP.
3. **Iterate from observed behavior** — watch them use it; do not assume.
4. **Then** fan out mid-stream entry, fast-answer, connectors.

Validate-then-build, on a thin slice. Not validate-after.

---

## 8. Definition of done

The practitioner-fit layer succeeds when a real IT sourcing VP, watched, can:

1. Open AbarVa and see — without navigating — what needs their decision today.
2. Act on a renewal/escalation/spend trigger by clicking the card straight into a pre-loaded workflow.
3. Get a defensible headline answer in under a minute, with depth available but not forced.
4. Never be blindsided by an auto-renewal the product could have flagged.
5. Say, unprompted, "this is how my job actually works."

Point 5 is the only one that matters, and only the design partner can confirm it.

---

## 9. What this spec does NOT cover

- The connector engineering (contract repo, ServiceNow) — separate infra track.
- The Moves-side practitioner fit (an agentic-delivery lead's day) — a sibling spec, same shape, validated by a different practitioner.
- Pricing/packaging of a "decision OS" vs a "workflow tool" — GTM, not product.
