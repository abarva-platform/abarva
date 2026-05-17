# Practitioner-Fit Design — the VP Sourcing Operating Console

**Date:** 2026-05-17
**Status:** concrete design spec. v2 — incorporates design-partner review by an IT sourcing VP.
**Pairs with:** `ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md`, `SOURCE-SOURCING-METHODOLOGY.md`, `VP-SOURCING-USABILITY-TEST-SCRIPT.md`.

---

## 0. The one-line target

> Source should become the **VP Sourcing operating console**: what needs attention, what is the recommended move, what evidence supports it, and how do I act before the window closes.

Source must not feel like an RFP tool. It must feel like a **sourcing command center**. A VP of IT sourcing lives in renewals, vendor risk, spend pressure, stakeholder urgency, and negotiation leverage — and their day starts with *"what needs my decision today?"*, never *"let me originate a sourcing event."*

**Design-partner note (IT sourcing VP):** the expert *logic* built across the enhancement program is enough. Do **not** add more abstract sourcing methodology. The next layer is **practitioner usability** — queues, triggers, decision briefs, real-time operating cadence.

Most of what follows is **re-fronting capability that already shipped** (Source classifier 1.1, delivery-model gate 1.2, should-cost 1.3, proposal normalization 1.4, negotiation posture 1.5, source-risk lens, freshness model) around how the role actually operates.

---

## 1. Source Decision Queue — the front door

Replaces "start a workflow" with **"here is what needs your decision."** This turns AbarVa from "a system I visit" into "the system that runs my day."

### Queue items
- Renewals inside **90 / 60 / 30 days**
- **Notice windows** about to close (auto-renewal risk)
- **RFP responses due**
- **Vendor risk escalations**
- **Stakeholder requests** waiting on sourcing
- **Savings opportunities**
- **Contract overlap / shelfware**
- **Decisions blocked by missing evidence**

### Card contract
```ts
interface SourceDecisionItem {
  id: string;
  tenantClientKey: string;
  kind: 'renewal' | 'notice_window' | 'rfp_response_due' | 'vendor_risk'
      | 'stakeholder_request' | 'savings_opportunity' | 'overlap_shelfware'
      | 'blocked_missing_evidence';
  urgency: 'today' | 'window_30' | 'window_60' | 'window_90' | 'watch';
  headline: string;             // "Adobe ELA — notice window closes in 9 days"
  recommendedMove: string;      // "Renegotiate — usage is 61% of entitlement"
  financialImpact: string;      // "$8.8M annual; ~$1.6M at risk"
  keyRisk: string;
  deepLink: string;             // pre-loaded Renewal Cockpit / Comparator / Negotiation Room
  evidenceRefs: string[];
}
```

### Detector sources (already-shipped substrate)
| Item | Computed from |
|---|---|
| renewal / notice_window | `vendor_contracts` end + notice dates, date math |
| rfp_response_due | Source event stage machine |
| vendor_risk | the source-risk lens + MRM screen |
| savings / overlap_shelfware | `it_financials` + `vendor_contracts` (demand-challenge logic) |
| blocked_missing_evidence | the freshness/trust model (Slice 4.1) |
| stakeholder_request | external — inbound channel (later, with connectors) |

Sorted by urgency then value-at-stake; deterministic; never empty-and-silent; never a fabricated card.

---

## 2. Renewal Cockpit — where a VP sees value first

For each renewal, one screen:

| Section | Content | Source |
|---|---|---|
| Current spend | annual + total contract value | `vendor_contracts` |
| Term & timing | term, notice date, **auto-renewal risk** | `vendor_contracts` + notice-window math |
| Usage / adoption | usage vs entitlement, **shelfware** flag | `operating_telemetry` + `it_financials` |
| Benchmark | should-cost range vs current | should-cost model (1.3) |
| Incumbent leverage | switching cost vs competitive tension | negotiation posture (1.5) |
| Alternatives | viable alternative vendors / paths | category classifier (1.1) + market context |
| **Recommended posture** | **renew · renegotiate · rebid · consolidate · exit** — with rationale | composed |

The recommended posture is the headline; everything else is the evidence behind it. This is the screen a VP will immediately believe.

---

## 3. RFP / Proposal Comparator

Not proposal *scoring* — proposal *interrogation*. Re-fronts the Slice 1.4 normalization matrix as a practitioner surface:
- Apples-to-apples normalization across vendors
- **Hidden cost callouts**
- **Missing contractual protections**
- Pricing inconsistencies
- Risk by clause
- Implementation realism
- **"Vendor says X — evidence suggests Y"**

---

## 4. Negotiation Room

Where Source becomes expert advisor, not workflow software. Re-fronts the Slice 1.5 negotiation posture generator as a negotiation brief:
- Walk-away position
- Must-have terms
- Give / get concessions
- BATNA
- Stakeholder alignment gaps
- Legal / privacy / security clause risks
- **Draft email / meeting-prep text**

---

## 5. Mid-Stream Entry

A VP rarely originates greenfield. Entry points — each routes into the right analysis:

| "I have…" | Routes to |
|---|---|
| a vendor | vendor profile → Renewal Cockpit / source-risk |
| a contract | Renewal Cockpit |
| an RFP response | RFP Comparator |
| a renewal | Renewal Cockpit |
| a business request | category classifier → delivery-model gate |
| "I need to cut spend" | savings / overlap-shelfware analysis |

Every Decision Queue card is itself a mid-stream entry.

---

## 6. Fast Answer Pattern

Every Source answer leads with, before any depth:
1. **Recommended action**
2. **Confidence**
3. **Financial impact**
4. **Key risk**
5. **Next step**

Then the VP drills down. The depth is valuable — but only after the headline is useful. Target: defensible headline in under a minute.

---

## 7. Out of scope (deliberately)

- More abstract sourcing methodology — enough expert logic is built (design-partner directive).
- Connector engineering (contract repo, ServiceNow) — separate infra track; `stakeholder_request` and live escalations wait on it.
- The Moves-side practitioner console — sibling spec, validated by an agentic-delivery lead.

---

## 8. Build sequencing

1. This spec — reviewed by the design-partner VP (done; redlines incorporated in v2).
2. **Thin vertical slice — Decision Queue + Renewal Cockpit.** The most believable VP-sourcing value demo: the inbox that shows what needs a decision, and the cockpit that answers the highest-frequency one (renewals). Built from already-shipped modules.
3. Run the `VP-SOURCING-USABILITY-TEST-SCRIPT.md` against the slice with a real VP; iterate from observed behavior.
4. Then: RFP Comparator, Negotiation Room, full Mid-Stream Entry, Fast Answer rollout.

---

## 9. Definition of done

A real IT sourcing VP, watched, can: open AbarVa and see what needs a decision today without navigating; click a renewal card straight into a pre-loaded cockpit; read a recommended posture with the evidence behind it; act before the notice window closes; and say, unprompted, *"this is how my job actually works."* Point five is the only one that counts.
