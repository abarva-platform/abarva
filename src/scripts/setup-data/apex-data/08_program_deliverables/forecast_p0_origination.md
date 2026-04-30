# Demand Forecasting Modernization 2026 — P0 Origination Document

**Program ID:** apex-forecast-2026
**Phase:** P0 Originate (closing)
**Document version:** 1.0
**Author:** Michael Tanaka (sponsor) + James Wright (program lead)
**Date:** 2026-04-25

## 1. What triggered this program

Three pressures, in order of urgency:

1. **Inventory turn has degraded** from 4.2x in FY2023 to 3.6x in FY2025. Margaret Chen has flagged this in two consecutive board meetings; capital tied up in inventory is a margin headwind.
2. **Stockout rate is up** from 3.1% to 4.2%, with the worst impact in promotional periods. Lost sales associated with stockouts estimated at $14M annually.
3. **Forecast accuracy has degraded** from 24% MAPE in FY2023 to 28.4% in FY2025, at SKU-store-week granularity. Multiple downstream initiatives (labor optimization, marketing planning, replenishment) are limited by forecast quality.

The OVAA Demand Planning system (incumbent) was implemented in 2018 and predates current promotional dynamics. Critical observers (Michael Tanaka, James Wright) identify it as architecturally limited rather than just under-tuned.

## 2. First cohort

**Selected first cohort:** Women's apparel core, SKU-store-week granularity.

Rationale:
- Single product family with sufficient transaction volume to support meaningful baseline measurement and post-implementation comparison
- Promotional sensitivity present (good test of new system's responsiveness)
- Merchandising cooperation high (Angela Foster has agreed to be co-sponsor for this cohort)
- Excludes harder cases (new SKUs, end-of-life clearance) appropriately

Excluded from first cohort:
- Home and lifestyle (different demand patterns; later)
- Men's apparel (different seasonality pattern; later)
- New SKU introduction (separate problem; later)
- Final markdown / clearance (separate problem; later)

## 3. Value hypothesis

**Hypothesis:** Replacing OVAA with a modern forecasting capability (vendor or internal-build TBD) at SKU-store-week granularity for women's apparel core will reduce MAPE from 28.4% to 18% within 12 months of go-live for that cohort. The improved accuracy will translate to:

- Inventory turn for the cohort improving from 3.6x to 4.0x within 18 months of go-live
- Stockout rate for the cohort improving from 4.2% to 3.0%
- Annual margin lift for the cohort estimated at $4.2M

**Causal mechanism:** Better forecasts → tighter allocation → less safety stock for low-velocity items + more stock for higher-velocity items → fewer markdowns + fewer stockouts → better margin.

**What we are explicitly NOT promising:**
- Same accuracy improvement on new SKUs (out of scope)
- Same accuracy improvement during major promotional events without explicit retraining (acknowledged limitation)
- Inventory turn improvement faster than 18 months (allocation system retraining is downstream)

## 4. Sponsor commitment

**Sponsor:** Michael Tanaka (Chief Supply Chain Officer)
**Co-sponsor:** Angela Foster (Chief Merchandising Officer)

The sponsor 1:1 was conducted on 2026-04-15 (notes on file). Michael Tanaka has committed:

- 6 hours per month calendar time for program reviews
- Decision authority within program budget
- Active engagement with merchandising on first-cohort scope
- Personal credibility on the line — first major IT modernization program in supply chain in 18 months; he has staked his FY2026 priority focus on this

Angela Foster (co-sponsor) has committed to:
- Merchandising team participation in P1 Discovery workshops
- Acceptance of human-in-the-loop design (her stated condition; not full automation in initial deployment)
- Co-defense of program at Investment Committee

## 5. Bench / SMEs needed for P1

| Role | Person | Status |
|---|---|---|
| Demand planning lead | Michael Tanaka (sponsor) + Sr. Mgr Demand Planning | Confirmed |
| Data engineering | James Wright (VP Data Eng) | Confirmed (program lead) |
| Merchandising business owner | Angela Foster (co-sponsor) + women's apparel buyer team | Confirmed |
| S&OP cadence owner | (TBD — Sr. Director S&OP, role currently rotating) | At risk — needs assignment |
| Finance partner | Margaret Chen's office (named: Director FP&A — Eric Tanenbaum) | Confirmed |
| Architecture review | Linda Mwangi (VP EA) | Confirmed for P1 entry |
| Privacy / data governance | Lynne Stratham (CDO) — data governance | Confirmed |

**Open issue:** S&OP cadence ownership is currently rotating. Need a stable owner before P1 design workshops.

## 6. Discovery envelope

**P1 Discovery proposed budget:** $90K (already consumed)
**P1 Discovery proposed duration:** 16 weeks (target completion 2026-09-15)
**P1 Discovery deliverables:**

- Distribution analysis of MAPE (not just average) — bias detection
- Granularity decision (SKU-store-week confirmed, but validate on bias profile)
- Baseline pull at the cohort level
- S&OP cadence inventory — who currently consumes the forecast and at what cadence
- Data quality assessment for forecast inputs (POS sales history, inventory positions, promotional calendar)
- Vendor longlist (RELEX, ToolsGroup, OVAA extension, Blue Yonder, internal Databricks build)

## 7. Discovery evidence family selected

This program is anchored on:
- Forecast-source inventory (planning systems + POS + promotional calendar)
- Historical demand and error trace at the target granularity
- S&OP decision cadence inventory

These are the pattern-specific evidence types that the Demand Forecasting archetype requires.

## 8. Risks identified at P0

| Risk | Severity | Mitigation |
|---|---|---|
| Granularity vs. scope tradeoff | High | Locked at SKU-store-week for cohort; explicit |
| MAPE distribution may have structural bias | Medium | P1 will analyze distribution, not just average |
| S&OP consumption commitment from business | Medium | Co-sponsor (Angela) committed; S&OP owner pending |
| Vendor lock-in risk | Medium | Internal build option being weighed alongside vendors |

## 9. Submitted for IC approval

**Submitted:** 2026-04-25
**IC review scheduled:** 2026-05-08
**Estimated IC outcome:** Approval expected; CFO has noted timing concern (FY2026 cost discipline) but supports the multi-year value case.

**Required IC approvals:**
- Robert Vance (CEO)
- Margaret Chen (CFO) — with noted timing concern
- David Okonjo (COO)
- Rebecca Singh (GC)

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.90
- Status: Submitted for IC approval
- File location: PMO archive
- Next review: at IC decision (2026-05-08)
