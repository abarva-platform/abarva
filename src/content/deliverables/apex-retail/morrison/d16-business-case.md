---
deliverableCode: D16
deliverableSlug: d16-business-case
title: Business Case · Morrison Owned Brand Margin Recovery
phase: 3
tier: rich
author: Claude Opus 4.7 · Agent C3
timestamp: 2026-04-23
program: APX-01 · Morrison Owned Brand Margin Recovery
tenant: Apex Retail Group
pattern: owned-brand-margin-recovery
sponsor: Marcus T. · CFO
coSponsor: Katherine P. · CMO
---

Apex Retail Group › Programs › Morrison Owned Brand Margin Recovery › Phase 3 › D16

## Executive summary

The Morrison business case asks for a **$6.8M capital commitment** across the 14-month committed envelope and projects **$14-22M/yr steady-state recovery** (low-base-high scenarios) on the owned-brand $2.1B revenue base [E30][E51]. Payback ranges **9-14 months** from Phase 4 open (2026-05-06), IRR projections range **88% (low) to 164% (high)**, and 36-month NPV ranges **$24M (low) to $47M (high)** at Apex's 8.5% cost of capital [E51][E55]. The case is sized deliberately conservative: the base scenario assumes closure of **40-55% of the gap-to-cohort-median** (D10) — not gap-to-top-quartile — and treats the portfolio-compounding lift (+30-40%) as upside-only, with the low scenario assuming additive-only recovery [E32][E52]. Capital phasing is **55% H1 (2026-05 to 2026-10)** to front-load the critical path, **30% H2**, and **15% across H3-H4** [E54]. The CFO sign-off readiness checklist is complete: dual-ledger reconciliation methodology is locked (D24 prerequisite), kill-switch criteria are named (D15), and Phase 5 attestation timing is scheduled [E55].

## Key facts

- **Capital ask · $6.8M** · phased 55/30/15 across H1/H2/H3-H4 [E41][E54]
- **Steady-state impact · $14-22M/yr** · low-base-high scenarios [E30][E51]
- **Payback · 9-14 months** from Phase 4 open (2026-05-06) [E51]
- **36-month NPV · $24-47M** at Apex 8.5% cost of capital [E55]
- **IRR · 88-164%** low-to-high scenarios [E55]

## 36-month financial model

The 36-month model spans 2026-05 (Phase 4 open) through 2029-04 and is structured in four segments. **Segment 1 · Build (2026-05 to 2026-10, months 1-6)** — capital-out dominant; $3.7M of the $6.8M envelope deployed; minimal bps recovery (pattern-library precedent: first 90 days deliver 10-20% of year-one run-rate) [E51]. **Segment 2 · Early harvest (2026-11 to 2027-04, months 7-12)** — first measurable bps recovery on supplier and promo workstreams; $2.0M additional capital; run-rate approaches 50-65% of steady state by month 12 [E51]. **Segment 3 · Steady state (2027-05 to 2028-04, months 13-24)** — full $14-22M/yr run-rate achieved; $1.1M residual capital for platform stabilization and attestation tooling [E51]. **Segment 4 · Continuation (2028-05 to 2029-04, months 25-36)** — attestation year; continuation capital (for H7, H13) is NOT drawn against the $6.8M envelope and is held as a separate Phase 5 decision [E51][E54]. The model uses monthly granularity for months 1-18 and quarterly granularity thereafter; reconciliation to Apex Finance is scheduled monthly beginning month 4.

The recovery curve is not linear. Pattern-library data shows owned-brand margin recovery follows a sigmoidal shape: slow in months 1-6, accelerating through months 7-18, flattening at steady state [E9]. The Morrison model mirrors this shape explicitly — month 6 cumulative recovery is **~15% of year-one run-rate**, month 12 is **~55-65%**, month 18 is **~95%** of steady state [E51]. This shape matters for the payback calculation: payback ranges 9-14 months because the steep recovery segment (months 9-15) crosses the cumulative capital line at that point. A linear-recovery assumption would materially overstate early payback and understate month-6 risk exposure.

## Sensitivity analysis

The model is stress-tested against five sensitivity drivers. **Driver 1 · Supplier unit-cost recovery** — the largest single driver; ±100 bps movement on Lever 1 recovery shifts 36-month NPV by ~$9M [E52]. **Driver 2 · Assortment brand-equity drag** — if consumer-perception drag materialises and forces a pause on Lever 2 Wave 2, 36-month NPV shifts by ~-$6M (downside only; there is no symmetric upside because the brand-equity fence already caps Lever 2) [E52]. **Driver 3 · Promo depth-cap override rate** — if override events exceed 3 in the first 60 days, the kill-switch triggers and NPV shifts by ~-$4M [E52]. **Driver 4 · Portfolio-compounding lift** — the +30-40% pattern-library estimate; if actual compounding is 0% (additive-only), NPV shifts by ~-$7M relative to the base case [E32][E52]. **Driver 5 · T+7 reporting rebuild latency** — if the data-engineering dependency slips, Lever 3 recovery delays by 60-120 days, shifting NPV by ~-$3M [E52]. The sensitivity table is the backbone of the scenario framing below; it also structures the D18 risk register's mitigation prioritisation.

The cumulative sensitivity — all five drivers stressed simultaneously to their downside — produces a **floor case of ~$9M/yr steady-state impact** with a 36-month NPV of ~$8M and payback extending to 20-24 months. The floor case is **above** the $6.8M capital envelope by roughly break-even NPV; Marcus T.'s 2026-03-18 framing was that this floor is the minimum defensible commitment the program can make to sponsor attestation [E52]. The business case does not present the floor as the base scenario; it presents it as the **kill-switch criterion at Phase 4 exit (G5)** — if month-9 cumulative recovery projects into the floor case, the governance forum ratifies either a rescope or a Phase 5 continuation replan before proceeding.

## Downside + base + upside cases

Three scenarios structure the case. **Downside ($14M/yr steady-state)** — additive-only recovery (no portfolio-compounding); Lever 2 at lower bound of brand-equity fence; Lever 3 with one 60-day reporting slip. Expected recovery contribution: Lever 1 at 140 bps, Lever 2 at 80 bps, Lever 3 at 80 bps. Total 300 bps; gap-to-median closure 45%. Payback 14 months; 36-month NPV $24M; IRR 88% [E51][E53]. **Base ($18M/yr steady-state)** — partial portfolio-compounding (~+15%); Lever 2 at midpoint of brand-equity fence; Lever 3 on-plan. Expected recovery: Lever 1 at 170 bps, Lever 2 at 100 bps, Lever 3 at 95 bps. Total 365 bps; gap-to-median closure 55%. Payback 11 months; 36-month NPV $35M; IRR 122% [E51][E53]. **Upside ($22M/yr steady-state)** — full portfolio-compounding (+30-40%); Lever 2 at upper bound of brand-equity fence; Lever 3 with margin-gated calendar suppressing override events. Expected recovery: Lever 1 at 200 bps, Lever 2 at 120 bps, Lever 3 at 110 bps. Total 430 bps; gap-to-median closure 65%. Payback 9 months; 36-month NPV $47M; IRR 164% [E51][E53]. The base case is what Marcus T. is signing for on 2026-03-24 [E51]; the downside case is the floor of the kill-switch; the upside case is held as a Phase 5 continuation hypothesis rather than as a commitment.

## Capital deployment schedule

The $6.8M envelope is phased against the D12 gate calendar. **Months 1-6 (H1 · $3.7M, 55%)** — supplier contract legal ($0.9M), tier-2 supplier due diligence ($0.5M), assortment analytics tooling ($0.6M), T+7 reporting rebuild ($0.8M), margin-gated calendar implementation ($0.4M), program management + change management ($0.5M) [E54]. **Months 7-12 (H2 · $2.0M, 30%)** — dual-sourcing enablement ($0.4M), assortment Wave 2 rollout ($0.5M), competitive price monitoring platform ($0.3M), category lead add ($0.3M annualised), governance forum tooling + dual-ledger setup ($0.5M) [E54]. **Months 13-24 (H3 · $0.8M, 12%)** — platform stabilization, supplier relationship maintenance, reporting refinement. **Months 25-36 (H4 · $0.3M, 3%)** — attestation tooling, Phase 5 continuation scoping [E54]. The phasing is deliberately front-loaded because the critical-path work (supplier contract redraft, T+7 reporting) consumes most of the H1 envelope and because H2 onwards is primarily steady-state operating cost rather than build cost [E54]. No capital is drawn after month 18 except for attestation tooling.

## Payback + IRR + NPV

The three headline financial metrics are the sign-off basis. **Payback (9-14 months)** — calculated from Phase 4 open (2026-05-06) as the month at which cumulative recovery equals cumulative capital deployment; the sigmoidal recovery curve drives the 5-month range across scenarios [E55]. **IRR (88-164%)** — 36-month IRR calculated monthly on net cash flows; the range is dominated by the portfolio-compounding sensitivity (Driver 4) [E55]. **NPV (36-month, $24-47M)** — discounted at Apex's 8.5% cost of capital; the NPV range combines scenario recovery envelope with phasing timing [E55]. For context: the cohort gap-to-median recovery (180 bps, ~$38M/yr per D10) would generate a 36-month NPV of ~$85M; the Morrison base case at $35M NPV is approximately 41% of the gap-to-median NPV, which reconciles to the 40-55% gap-to-median closure framing [E30][E55]. The business case is therefore internally consistent between the top-line bps recovery framing and the financial return framing — an integrity check that Marcus T. specifically asked for at the 2026-03-24 baseline-lock [E51].

## CFO sign-off readiness

The CFO sign-off readiness checklist has five items, all satisfied by Phase 3 close. **Item 1 · Dual-ledger reconciliation methodology** — locked via D24 prerequisite; Apex Finance + AbarVa reconciled before every Phase 5 attestation [E55]. **Item 2 · Kill-switch criteria** — named per lever in D15; governance forum has standing authority to trigger pause-or-replace [E49]. **Item 3 · Phase 5 attestation timing** — scheduled 2027-Q1; dual-ledger runbook in D24; attestation against the D16 envelope, not against the cohort [E51]. **Item 4 · Capital phasing alignment** — 55/30/15 phasing reconciles to the D12 gate calendar; no phase exceeds its named gate's capital authorisation [E54]. **Item 5 · Scenario calibration** — low/base/high scenarios calibrated to D10 benchmark cohort, not to internal optimism; Marcus T.'s 2026-02-26 framing of 40-55% of gap-to-median as the first-cycle envelope is held constant through the case [E30][E53]. The sign-off is therefore conditional on a clean G1 (Phase 4 launch readiness) and on continued sponsor attendance at the biweekly governance forum; both conditions are captured in D17.

## Decision log

- **2026-03-18** · Marcus T. (CFO) · **Intervention portfolio selected · 3-lever parallel track.** Pulled from `_timeline.json` Phase 3 entry. Rationale: case built against this portfolio shape; any portfolio change requires a case rebuild.
- **2026-03-24** · Nexus Maestro · **Business case baseline-locked · $6.8M capital · $14-22M/yr · 9-14 mo payback.** Pulled from `_timeline.json` Phase 3 entry. Rationale: base case $18M/yr; downside $14M; upside $22M; sensitivity bounded at $9M floor.
- **2026-04-15** · Marcus T. + Katherine P. · **Decision memo approved · case ratified · CMO dissent captured on assortment brand-equity fence.** Pulled from `_timeline.json` Phase 3 entry. Rationale: case survives dissent because brand-equity fence is already priced into Lever 2 scenario bounds [E47].

## Risks and mitigations

- **[High]** **Portfolio-compounding lift (+30-40%) is pattern-library-derived.** If actual compounding is 0%, upside case collapses to base case. Mitigation: base case does NOT assume compounding; only upside case does; low and base are defensible on additive-only recovery [E32][E52].
- **[High]** **Supplier recovery dominates NPV sensitivity.** ±100 bps on Lever 1 shifts 36-month NPV by ~$9M; if supplier response is materially below 300 bps unit-cost recovery, the case erodes quickly. Mitigation: G2 90-day first-close gate acts as an early signal; kill-switch triggers replacement-path review before capital H2 deployment [E46][E49][E52].
- **[Medium]** **Payback calculation assumes Phase 4 open on 2026-05-06.** Any G1 slip pushes payback by the slip duration; a 90-day slip moves payback to 12-17 months and weakens IRR by ~35 points. Mitigation: D17 captures G1 readiness as a sponsor-level attestation; Phase 3 gate review is structured to surface any G1 risk before Phase 4 launch [E51].

## Cross-links

- Pattern · `owned-brand-margin-recovery`
- Program · APX-01 Morrison Owned Brand Margin Recovery
- Prerequisite · D07 Financial Baseline · D10 Benchmark Comparison · D11 Hypothesis Backlog · D15 Intervention Portfolio
- Downstream · D12 Roadmap · D17 Decision Memo · D18 Risk Register · D24 Outcome Measurement Plan
- Evidence base · `_evidence-base.json` (E30, E32, E41, E46, E47, E49, E51, E52, E53, E54, E55)

---

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
