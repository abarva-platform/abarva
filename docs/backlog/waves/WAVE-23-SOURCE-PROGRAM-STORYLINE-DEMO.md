# Wave 23 — Source + Program Storyline Demo

_Status: PLANNING | Estimated wave date: May 2026 (after Wave 22)_

---

## Wave Goal

Complete the AMS sourcing event → CDP program storyline so the 30-minute demo has a coherent narrative. The advisor starts in the AMS event, sees vendor pricing, reads Sentinel intelligence patterns, then navigates to the CDP program and sees the downstream impact.

---

## Pre-Flight Dependencies

- Wave 22 must be merged
- APX-CDP-2026 must have full tab data (Workshops, Deliverables, Evidence, Intelligence, Missions)
- AMS event must have 4 vendors with pricing data

---

## Scenario Anchors (Deterministic)

The AMS→CDP storyline uses these fixed anchor data points:

| Anchor | Value | Source |
|---|---|---|
| AMS event name | AMS Outsourcing 2026 | Seeded |
| Vendor count | 4 (Northstar, BlueMaster, DataPeak, ArcVault) | Seeded |
| Pricing divergence pattern | PAT-AMS-001: significant pricing spread across vendors | Seeded (not fabricated $) |
| CDP linkage | AMS implementation work feeds into CDP data migration | Seeded |
| Sentinel signal | "AMS scope and CDP integration timeline risk are correlated" | Seeded |

**No-fabrication rule**: The pricing divergence must be expressed as "significant spread observed across vendor proposals" — NEVER as a dollar amount or percentage.

---

## Lanes

### LANE-A — SRC11-15: AMS Vendor Storyline Enrichment

**Goal**: Enrich all 4 AMS vendor records with:
- Proposal status (received / under review / BAFO requested)
- Key differentiators for each vendor
- Risk flags (from Sentinel patterns)
- Source-to-program bridge chip (links to APX-CDP-2026)

**Acceptance criteria**:
- Vendors tab shows 4 vendor cards with rich data
- Each vendor has a risk signal badge
- Proposal status is realistic for an active RFP

---

### LANE-B — SRC16-20: AMS Pricing Tab Completion

**Goal**: Complete the pricing tab with a normalized comparison view across 4 vendors

**Key rule**: Pricing values are relative (Vendor A is lower than Vendor B) — NEVER absolute dollar amounts unless client has provided them (they haven't in the demo).

**Display format**: Relative pricing band visualization (low/medium/high) per vendor, per pricing component.

---

### LANE-C — SRC21-25: AMS Intelligence Bridge

**Goal**: Wire the Intelligence tab on the AMS source event to Sentinel pattern signals

**Sentinel signals to show for AMS event**:
1. PAT-AMS-001: AMS Vendor Pricing Divergence (high confidence, 4 evidence docs)
2. PAT-AMS-002: AMS Scope Creep in SLAs (medium confidence, 2 evidence docs)
3. Cross-reference: "AMS implementation timeline affects CDP data migration window" (medium confidence)

---

### LANE-D — SRC26-30: BAFO Tab

**Goal**: Build the BAFO (Best and Final Offer) tab showing the BAFO negotiation round

**BAFO data**:
- 2 vendors invited to BAFO: Northstar, ArcVault
- BAFO round status: In Progress
- BAFO deadline: May 15, 2026 (seeded)
- Selection committee: 3 members (seeded names)

---

### LANE-E — LINK1: Source → Program Bridge

**Goal**: Add the source-to-program bridge chip on the AMS event page that links to APX-CDP-2026

**Bridge chip spec**:
- Location: Top of AMS event detail page, below the event title
- Text: "This event feeds into: CDP Implementation (APX-CDP-2026)"
- Click behavior: Navigate to APX-CDP-2026 program detail

**Reverse link**:
- On APX-CDP-2026 program detail, show: "Source event: AMS Outsourcing 2026"
- Click behavior: Navigate to AMS event

---

### LANE-F — DEMO7 Update: 30-Min Complete Storyline

**Goal**: Update the 30-minute Apex Retail demo script to include the AMS→CDP narrative flow

**New script flow**:
1. [min 0-3] Programs list — show 4 programs, highlight APX-CDP-2026
2. [min 3-8] APX-CDP-2026 detail — overview, workshops, deliverables
3. [min 8-12] Navigate to AMS source event via bridge chip
4. [min 12-18] AMS event — vendors, pricing, intelligence
5. [min 18-22] Return to CDP program — intelligence tab shows correlated patterns
6. [min 22-27] Tower — portfolio scorecard, Atlas executive brief
7. [min 27-30] Q&A / wrap

---

## Acceptance Criteria

- [ ] AMS event → CDP program bridge chip is clickable and navigates correctly
- [ ] AMS Intelligence tab shows 3 Sentinel signals with source citations
- [ ] BAFO tab shows 2 vendors in BAFO round
- [ ] CDP Intelligence tab shows cross-reference to AMS signals
- [ ] 30-minute demo script walks end-to-end without data gaps
- [ ] No fabricated dollar amounts or percentages
- [ ] All 16 routes return 200
