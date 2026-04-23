---
deliverableCode: D16
deliverableSlug: d16-business-case
title: Business Case · Meridian Ambient Clinical Value Chain
phase: 3
tier: rich
author: Claude Opus 4.7 · Agent C7
timestamp: 2026-04-23
program: MRD-01 · Ambient Clinical Value Chain Activation
tenant: Meridian Health System
pattern: ambient-clinical-value-chain
sponsor: Sarah Chen · CIO
coSponsor: Dr. Larsson · CMO
---

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 3 › D16

## Executive summary

The Meridian ambient business case asks for a **$4.2M capital commitment** across the 14-month Phase 4 envelope and projects **$8-14M/yr steady-state value-at-stake** (low-base-high scenarios) against the $7.8B revenue base and the 55% MA-and-commercial-risk payer mix [E9][E18][E50]. Payback ranges **12-18 months** from Phase 4 open (2026-05-27), IRR projections range **72% (low) to 148% (high)**, and 36-month NPV ranges **$14M (low) to $32M (high)** at Meridian's 7.5% cost of capital [E50][E51]. The case is sized deliberately conservative: the base scenario assumes closure of **55-70% of the gap to cohort-median integration maturity** (D10) — not gap to top-quartile — and treats the portfolio-compounding lift (+25-35%) as upside-only, with the low scenario assuming additive-only outcome realisation [E28][E32][E49]. Capital phasing is **50% H1 (2026-06 to 2026-11)** to front-load the CDI-telemetry critical path, **28% H2**, and **22% across H3-H4** [E41]. The CIO/CMO sign-off readiness checklist is complete: dual-ledger reconciliation methodology is locked (D24 prerequisite), kill-switch criteria are named per lever (D15), and Phase 5 attestation timing is scheduled [E45][E51]. The business case explicitly separates **clinician-outcome value** ($3-5M/yr steady-state in cognitive-load recovery, locum avoidance, retention) from **documentation-quality value** ($5-9M/yr steady-state across HCC recapture, DRG specificity, and quality-measure performance), reflecting Dr. Larsson's north-star framing that cognitive load is the outcome and documentation quality is a coherent co-benefit, not the reverse [E4][E9].

## Key facts

- **Capital ask · $4.2M** · phased 50/28/14/8 across H1/H2/H3/H4 [E41][E50]
- **Steady-state value-at-stake · $8-14M/yr** · low-base-high scenarios [E9][E50]
- **Payback · 12-18 months** from Phase 4 open (2026-05-27) [E9][E50]
- **36-month NPV · $14-32M** at Meridian 7.5% cost of capital [E51]
- **IRR · 72-148%** low-to-high scenarios [E51]
- **Value decomposition** · cognitive-load recovery $3-5M/yr · documentation quality $5-9M/yr [E9]

## 36-month model

The 36-month model spans 2026-06 (Phase 4 open) through 2029-05 and is structured in four segments. **Segment 1 · Build (2026-06 to 2026-11, months 1-6)** — capital-out dominant; $2.1M of the $4.2M envelope deployed on CDI-telemetry commissioning, HCC-feedback-loop specification, and quality-measure pipeline rebuild; minimal pajama-time reduction signal (pattern-library precedent: first 90 days deliver 8-15% of year-one run-rate) [E50]. **Segment 2 · Early harvest (2026-12 to 2027-05, months 7-12)** — first measurable pajama-time reduction on primary care; CDI-queue routing approaches 140-180/week cohort median; $1.2M additional capital; run-rate approaches 45-60% of steady state by month 12 [E50]. **Segment 3 · Steady state (2027-06 to 2028-05, months 13-24)** — full $8-14M/yr run-rate achieved; $0.6M residual capital for Epic middleware stabilisation, vendor-council tooling, and attestation readiness [E50]. **Segment 4 · Continuation (2028-06 to 2029-05, months 25-36)** — attestation year and Phase 5 rationalisation ratification; continuation capital (for H3 specialty consolidation, H8 in-basket coverage) is NOT drawn against the $4.2M envelope and is held as a separate Phase 5 decision alongside the vendor-rationalisation ratification [E50][E54]. The model uses monthly granularity for months 1-18 and quarterly granularity thereafter; reconciliation to Meridian Finance is scheduled monthly beginning month 4.

The outcome-realisation curve is not linear. Pattern-library data for ambient-clinical-value-chain programs shows a sigmoidal recovery shape: slow in months 1-6 while CDI-telemetry commissions, accelerating through months 7-18 as the HCC feedback loop closes and clinician adoption stabilises, flattening at steady state [E7]. The Meridian model mirrors this shape explicitly — month 6 cumulative value is **~12% of year-one run-rate**, month 12 is **~50-60%**, month 18 is **~90%** of steady state [E50]. This shape matters for the payback calculation: payback ranges 12-18 months because the steep outcome-realisation segment (months 10-16) crosses the cumulative capital line at that point. A linear-outcome-realisation assumption would materially overstate early payback and understate month-9 risk exposure.

## Sensitivity · vendor cost vs. burnout impact

The model is stress-tested against five sensitivity drivers [E51]. **Driver 1 · CDI-queue ramp rate** — the largest single driver of documentation-quality value; ±20% on the CDI-queue routing volume trajectory shifts 36-month NPV by ~$4.5M [E51]. If Meridian reaches only ~100/week by G2 (vs. 140-180/week target), HCC feedback loop closure delays and the entire Segment 2 early-harvest run-rate slips by 45-75 days. **Driver 2 · Clinician adoption at pilot sites** — if D13 pilot month-3 signal shows clinician-friction, adoption coefficients fall across the portfolio and cognitive-load recovery undershoots; NPV shifts by ~-$3M [E21][E23][E51]. **Driver 3 · Vendor-council commissioning cadence** — Abridge, DAX Copilot, and Suki each have distinct vendor-council rhythms; if any one vendor's HCC feedback-loop commissioning slips beyond G3+30 days, Lever 2's signal thins and NPV shifts by ~-$2M per vendor-slip [E12][E13][E14][E51]. **Driver 4 · Portfolio-compounding lift** — the +25-35% pattern-library estimate; if actual compounding is 0% (additive-only), NPV shifts by ~-$4M relative to the base case [E32][E51]. **Driver 5 · MBI-HSS burnout conversion into retention and locum savings** — emotional-exhaustion reduction has to convert into measurable retention lift and locum avoidance to register in the $3-5M/yr cognitive-load value; if conversion coefficient undershoots (pattern-library bounds 45-70% of MBI improvement translates into measurable HR impact), NPV shifts by ~-$2.5M [E29][E51].

The cumulative sensitivity — all five drivers stressed simultaneously to their downside — produces a **floor case of ~$5.5M/yr steady-state value** with a 36-month NPV of ~$6M and payback extending to 22-28 months [E51]. The floor case is **above** the $4.2M capital envelope by roughly break-even NPV; Sarah Chen's 2026-03-18 framing was that this floor is the minimum defensible commitment the program can make to sponsor attestation [E40][E51]. The business case does not present the floor as the base scenario; it presents it as the **kill-switch criterion at Phase 4 exit (G5)** — if month-9 cumulative run-rate projects into the floor case, the governance triad ratifies either a Phase 4 re-scope or a Phase 5 continuation replan before proceeding to attestation [E45][E49][E51].

The vendor-cost-vs-burnout-impact trade-off is structurally framed in this case. **Vendor cost is a fixed input** to the model — Abridge, DAX Copilot, and Suki licensing + integration cost is substantially locked for Phase 4 regardless of rationalisation path, because the vendor-rationalisation decision is deferred to Phase 5 [E6][E42]. **Burnout impact is the variable output** that the model's most material sensitivity drivers (Drivers 1, 2, 5) bear on. This asymmetry is what makes the program a CMO-CIO joint case, not a CFO-only case: the value at stake is primarily clinician outcome, measured against a fixed vendor cost floor [E4][E16].

## Base / upside / downside cases

Three scenarios structure the case. **Downside ($8M/yr steady-state)** — additive-only outcome realisation (no portfolio-compounding); CDI-queue ramp undershooting at ~100/week at G2; clinician-adoption coefficient at pattern-library lower bound; one vendor-council commissioning slip. Expected contribution: Lever 1 delivers 18 min pajama-time reduction, Lever 2 delivers 2-point HCC capture lift + 4% quality-measure lift, Lever 3 pilot returns mixed signal. 36-month NPV $14M; IRR 72%; payback 18 months [E49][E50][E51]. **Base ($11M/yr steady-state)** — partial portfolio-compounding (~+15%); CDI-queue at G2 target; clinician-adoption at pattern-library midpoint; all three vendors commissioning feedback loops on G3 timeline. Expected contribution: Lever 1 delivers 26 min pajama-time reduction, Lever 2 delivers 3.5-point HCC capture lift + 18% quality-measure lift, Lever 3 pilot returns moderate positive signal. 36-month NPV $23M; IRR 112%; payback 14 months [E49][E50][E51]. **Upside ($14M/yr steady-state)** — full portfolio-compounding (+25-35%); CDI-queue at or above cohort median by G5; clinician-adoption at pattern-library upper bound; MBI-HSS burnout conversion at upper-bound HR impact. Expected contribution: Lever 1 delivers 35 min pajama-time reduction, Lever 2 delivers 5-point HCC capture lift + 27% quality-measure lift, Lever 3 pilot returns strong positive signal feeding "Option A scale" into Phase 5. 36-month NPV $32M; IRR 148%; payback 12 months [E49][E50][E51]. The base case is what Sarah Chen and Dr. Larsson are signing for on 2026-04-08 [E9][E50]; the downside case is the floor of the kill-switch; the upside case is held as a Phase 5 continuation hypothesis rather than as a commitment.

## Capital deployment

The $4.2M envelope is phased against the D12 gate calendar [E41]. **Months 1-6 (H1 · $2.1M, 50%)** — CDI-telemetry commissioning ($0.7M Epic integration-engineering labor + middleware), HCC feedback-loop specification and Abridge commissioning ($0.4M), DAX Copilot feedback-loop commissioning ($0.3M), specialty-specific template governance platform ($0.25M), quality-measure pipeline rebuild ($0.25M), unified vendor-council coordination tooling ($0.1M), program management + change management ($0.1M) [E41]. **Months 7-12 (H2 · $1.2M, 28%)** — Suki HCC feedback-loop commissioning ($0.2M), shift-specific clinician coaching program ($0.3M), D13 ambient consolidation pilot operational cost ($0.4M), Phase 5 transition planning reserve ($0.2M), governance triad tooling + dual-ledger setup ($0.1M) [E41]. **Months 13-24 (H3 · $0.6M, 14%)** — Epic middleware stabilisation, vendor-council coordination platform operating cost, D24 outcome-measurement pipeline refinement, Phase 4 exit attestation readiness [E41]. **Months 25-36 (H4 · $0.3M, 8%)** — Phase 5 attestation tooling, rationalisation ratification workshop preparation, D13 pilot retrospective packaging [E41]. The phasing is deliberately front-loaded because the critical-path work (CDI-telemetry commissioning, HCC feedback-loop build) consumes most of the H1 envelope and because H2 onwards is primarily pilot operation and clinician-coaching cost rather than engineering build cost [E41]. No capital is drawn after month 18 except for Phase 5 attestation and rationalisation tooling, which is structurally separate from the Phase 4 commitment.

## Payback + IRR

The three headline financial metrics are the sign-off basis. **Payback (12-18 months)** — calculated from Phase 4 open (2026-05-27) as the month at which cumulative value realisation equals cumulative capital deployment; the sigmoidal outcome curve drives the 6-month range across scenarios [E50][E51]. **IRR (72-148%)** — 36-month IRR calculated monthly on net cash flows; the range is dominated by the CDI-queue ramp rate (Driver 1) and the portfolio-compounding sensitivity (Driver 4) [E51]. **NPV (36-month, $14-32M)** — discounted at Meridian's 7.5% cost of capital; the NPV range combines scenario outcome envelope with capital-phasing timing [E51]. For context: the cohort gap-to-median closure (equivalent to a fully integrated single-vendor deployment) would generate a 36-month NPV of ~$45M at upper-bound sensitivity settings; the Meridian base case at $23M NPV is approximately 51% of that gap-to-median NPV, which reconciles to the 55-70% gap-to-median closure framing [E28][E51]. The business case is therefore internally consistent between the top-line pajama-time and HCC capture framing and the financial return framing — an integrity check that Sarah Chen specifically asked for at the 2026-04-08 baseline-lock and Dr. Larsson co-signed on the clinician-outcome side [E4][E9].

## Sign-off readiness

The sign-off readiness checklist has six items, all satisfied by Phase 3 close. **Item 1 · Dual-ledger reconciliation methodology** — locked via D24 prerequisite; Meridian Finance + Nexus reconciled before every Phase 5 attestation; pajama-time measurement anchored to Epic Signal and independently verifiable [E1][E51]. **Item 2 · Kill-switch criteria** — named per lever in D15; governance triad has standing authority to trigger pause-or-replace without waiting for four-principal steering [E45]. **Item 3 · Phase 5 attestation timing** — scheduled 2027-Q1 to 2027-Q3; dual-ledger runbook in D24; attestation against the D16 envelope, not against the cohort [E50]. **Item 4 · Capital phasing alignment** — 50/28/14/8 phasing reconciles to the D12 gate calendar; no phase exceeds its named gate's capital authorisation [E41]. **Item 5 · Scenario calibration** — low/base/high scenarios calibrated to D10 benchmark cohort, not to internal optimism; Sarah Chen's 2026-03-18 framing of 55-70% gap-to-median as the first-cycle envelope is held constant through the case [E28][E40][E49]. **Item 6 · Clinician-outcome primacy** — case explicitly separates cognitive-load recovery ($3-5M/yr) from documentation-quality value ($5-9M/yr); Dr. Larsson's north-star framing is preserved in the model architecture [E4][E9]. The sign-off is therefore conditional on a clean G1 (Phase 4 launch readiness) and on continued four-principal attendance at the monthly governance triad; both conditions are captured in D17.

## Decision log

- **2026-03-18** · Sarah Chen (CIO) + Dr. Larsson (CMO) · **Intervention portfolio selected · 3-lever parallel track.** Pulled from `_timeline.json` Phase 3 entry. Rationale: case built against this portfolio shape; any portfolio change requires a case rebuild [E40].
- **2026-04-08** · Sarah Chen (CIO) + Dr. Larsson (CMO) · **Business case baseline-locked · $4.2M capital · $8-14M/yr · 12-18 mo payback.** Pulled from `_timeline.json` Phase 3 entry. Rationale: base case $11M/yr; downside $8M; upside $14M; sensitivity bounded at $5.5M floor; clinician-outcome $3-5M separated from documentation-quality $5-9M [E9][E49][E50].
- **2026-04-14** · Sarah Chen + Dr. Larsson + Priya Raman · **Decision memo approved · case ratified · CMIO dissent captured on vendor-rationalisation timing.** Pulled from `_timeline.json` Phase 3 entry. Rationale: case survives dissent because vendor rationalisation is deferred to Phase 5 and Phase 4 capital is not contingent on the rationalisation decision [E6][E55].

## Risks and mitigations

- **[High]** **Portfolio-compounding lift (+25-35%) is pattern-library-derived.** If actual compounding is 0%, upside case collapses to base case [E32]. Mitigation: base case does NOT assume compounding; only upside case does; low and base are defensible on additive-only outcome realisation [E49][E51].
- **[High]** **CDI-queue ramp rate dominates NPV sensitivity.** ±20% on ramp trajectory shifts 36-month NPV by ~$4.5M; if Meridian reaches only ~100/week by G2, Segment 2 early-harvest slips 45-75 days. Mitigation: G2 90-day first-signal gate acts as an early indicator; kill-switch triggers replacement-path review before capital H2 deployment; Theo J.'s integration team pre-staffed with three dedicated engineers before G1 [E15][E40][E45][E51].
- **[Medium]** **Payback calculation assumes Phase 4 open on 2026-05-27.** Any G1 slip pushes payback by the slip duration; a 60-day slip moves payback to 14-20 months and weakens IRR by ~25 points. Mitigation: D17 captures G1 readiness as a sponsor-level attestation; Phase 3 gate review on 2026-04-21 is structured to surface any G1 risk before Phase 4 launch [E50][E51].

## Cross-links

- Pattern · `ambient-clinical-value-chain`
- Program · MRD-01 Ambient Clinical Value Chain Activation
- Prerequisite · D06 Documentation-Time Baseline · D10 Benchmark Comparison · D11 Hypothesis Backlog · D15 Intervention Portfolio
- Downstream · D12 Roadmap · D17 Decision Memo · D18 Risk Register · D24 Outcome Measurement Plan
- Evidence base · `_evidence-base.json` (E1, E4, E6, E7, E9, E12, E13, E14, E15, E16, E18, E21, E23, E28, E29, E32, E40, E41, E42, E45, E49, E50, E51, E54, E55)

---

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
