---
deliverableCode: D09
deliverableSlug: d09-root-cause-analysis
title: Root Cause Analysis · Morrison Owned Brand Margin Recovery
phase: 2
tier: rich
author: Claude Opus 4.7 · Agent C2
timestamp: 2026-04-23
program: APX-01 · Morrison Owned Brand Margin Recovery
tenant: Apex Retail Group
pattern: owned-brand-margin-recovery
sponsor: Marcus T. · CFO
coSponsor: Katherine P. · CMO
---

Apex Retail Group › Programs › Morrison Owned Brand Margin Recovery › Phase 2 › D09

## Executive summary

Root cause analysis consolidates the D07 baseline decomposition and the D08 pain point register into **three validated root causes** behind the 340 bps owned-brand margin compression, plus two supporting upstream causes that explain why the primary three converged at Apex in this window. The three validated root causes are (1) **supplier consolidation gap** — top-3 suppliers at 62% of COGS carrying a 6–9% unit cost premium [E5][E26]; (2) **assortment bloat** — owned-brand SKU density at 1.8× the top-decile peer, with the long tail absorbing 28% of markdowns and 38% of returns [E6]; and (3) **promotional depth creep** — average depth on owned-brand expanded from -18% to -27% while price elasticity suggests -22% is the point of diminishing returns [E7]. All three are addressable via the Owned Brand Margin Recovery pattern's lever library. The RCA validation workshop convened 2026-02-19 and the three root causes were ratified with evidence [E26].

## Key facts

- **3 root causes validated** against evidence at medium-to-high confidence; 14 hypotheses tested; 9 validated, 3 rejected, 2 deferred [E26]
- **Root cause 1 · Supplier consolidation gap** — $5-8M/yr recoverable [E5][E26]
- **Root cause 2 · Assortment bloat** — $4-6M/yr recoverable [E6][E26]
- **Root cause 3 · Promotional depth creep** — $3-5M/yr recoverable [E7][E26]

## RCA methodology

The analysis combines three methodological techniques. The **driver tree** traces margin compression from the aggregate -340 bps down through cost-side, mix, and promotional depth nodes until each branch terminates in an operational driver that can be directly addressed. The **5-whys ladder** tests each candidate root cause by asking why five times, with the validation criterion that the fifth why must resolve to either an organizational capability gap, a process discipline gap, or an external market factor; candidates that terminate in "we just haven't done it" are upgraded, and candidates that terminate in "we can't do it" are demoted to constraint status. The **counterfactual model** simulates what the owned-brand margin trajectory would have looked like under alternate supplier structure, SKU density, and promotional depth, using the benchmark cohort median as the counterfactual anchor [E2]. Candidates are validated only when all three methods converge; the 2026-02-19 workshop locked this convergence criterion before reviewing candidates.

## Driver tree · margin compression

The driver tree terminates at five operational drivers, of which three became the validated root causes. Starting from the -340 bps compression at the top node: the first split is cost-side (-220 bps) vs. demand-side (-85 bps depth + -35 bps mix). The cost-side branch splits into supplier cost inflation net of recovery (-180 bps) and non-supplier cost inflation (-40 bps; freight, packaging, contract-manufacturing fees). The supplier cost branch then splits into supplier concentration premium (-120 bps) and negotiated recovery shortfall (-60 bps). The demand-side branch splits into promotional depth creep (-85 bps) and mix drift (-35 bps, driven by long-tail SKUs with 150-200 bps lower margin growing as a share of the basket [E6]). Supplier concentration, long-tail SKU density, and promotional depth together account for **~310 bps of the 340 bps** compression. The residual 30 bps is absorbed by non-supplier cost inflation (freight, packaging) which the RCA classifies as external and not directly addressable by program levers.

## Supplier contract dynamics

The deepest of the three root causes is supplier concentration. The counterfactual model runs a "what if top-3 supplier share were 45% instead of 62%" simulation and projects 120 bps of recoverable margin under the diversified structure [E5]. Five-whys analysis on supplier concentration resolves as follows: Why is the top-3 share so high? Because category-level sourcing decisions defaulted to incumbent suppliers during a 2022-2023 simplification push. Why did simplification choose incumbents? Because the category management team was measured on operating-expense-reduction, not gross-margin. Why does OpEx optimization create a gross-margin drag? Because supplier consolidation without volume-tier restructuring trades supplier-management labor for unit-cost premium. Why wasn't this re-examined? Because the measurement system didn't surface the tradeoff until the 24-month margin trace made it visible. Why did the measurement gap persist? Because category margin reporting closed on T+14 and supplier-level unit-cost reporting closed on T+28 — the two views never met in the same forum [E25]. This terminates at a process/capability gap, upgrading supplier concentration from symptom to root cause.

## Own-brand vs national-brand positioning

A secondary upstream cause, validated at medium confidence, is the **positioning drift** of owned-brand vs. national-brand. Between 2024 and 2026, the owned-brand promotional depth moved -9 percentage points while national-brand depth held flat [E7]. The CMO's team described the depth expansion as competitive response — defending owned-brand share against national-brand trade funding. But the benchmark cohort tells a different story: four of six cohort peers held owned-brand promotional depth within 200 bps of the 2024 level and did not lose share [E2]. The implication is that Apex's depth expansion was not strictly necessary — it was a defensive reflex rather than a strategic choice. This is the finding Katherine P. flagged as a sponsor tension in the intake synthesis [E4]: if the depth creep is strategically optional, the promotional discipline lever is less risky to brand equity than initially feared. The RCA does not treat this as a primary root cause (the promotional depth creep itself is the primary cause; positioning drift is the upstream "why") but it is the cause that most shapes how the Phase 3 intervention should be framed.

## Category management capability gap

A third upstream cause is a **category management capability gap** that touches all three primary root causes. The pattern library describes this gap as a common antecedent to owned-brand margin compression: category managers measured on sales and share, not on margin; supplier negotiations run by procurement while assortment and pricing decisions run by merchandising, with no single owner of the gross margin number [E9]. At Apex, the 2026-02-19 workshop surfaced the specific instance of this gap: no single executive had the gross-margin KPI on an owned-brand category between the CFO and the individual category manager. Marcus T. named this as the "single structural gap I underestimated going in" in the workshop minutes [E26]. The Phase 3 intervention design will not create a new organizational role to close this gap (deferred to post-Phase 5), but the Phase 4 delivery plan (D19) adds a cross-functional gross-margin governance forum that institutionalizes the missing coordination.

## Promotion calendar inefficiency

The fifth driver-tree branch — promotional calendar inefficiency — was tested as a candidate root cause but **demoted to supporting driver**. Analysis showed that while the promotional calendar has real inefficiencies (Pain #12 in D08: no governance gate; Pain #14: markdown attribution muddle), the inefficiencies amplify the depth creep problem rather than cause it. In counterfactual terms: holding depth at -22% but fixing the calendar governance recovers only ~20 bps, whereas capping depth at -22% regardless of calendar governance recovers the full ~85 bps. The calendar inefficiency is therefore carried as a Phase 4 execution detail (folded into D19) rather than a Phase 3 intervention in its own right [E26]. This demotion matters: it prevents the program from over-scoping the promotional lever and keeps the three-lever portfolio crisp.

## Upstream causes

Synthesizing the upstream layer, **two macro-causes** explain why the three root causes converged at Apex in this window. First, **measurement lag** — the T+14 category margin close and the T+28 supplier unit-cost close meant that the compression was diagnosable only in retrospect, after 24 months. Peer retailers with faster-closing ledgers caught and corrected the same drift before it hit 200 bps [E2][E27]. Second, **incentive misalignment** — category managers were on top-line and share metrics during 2024-2025, not on margin. The compensation change to a margin-weighted category manager scorecard, targeted for 2026-Q2, was already in flight pre-Morrison; the program inherits this tailwind rather than creates it. These upstream causes frame why the intervention portfolio must move in parallel: fixing the supplier side without closing the measurement gap would leave the compression pattern re-emerging elsewhere.

## Decision log

- **2026-02-14** · Nexus Maestro · **Driver tree structure locked.** Cost-side / demand-side / mix split adopted as the canonical decomposition. Rationale: aligned with D07 waterfall and with Apex Finance closing-ledger categories; enables clean mapping from root cause to lever.
- **2026-02-19** · Marcus T. (CFO) · Katherine P. (CMO) · Diane R. (SVP Supply Chain) · **Three root causes validated with evidence.** Supplier consolidation gap, assortment bloat, promotional depth creep ratified. Promotion calendar inefficiency demoted to supporting driver. Rationale: counterfactual model, 5-whys, and driver tree converged on the same three candidates.
- **2026-02-22** · Nexus Maestro · **Category management capability gap added as upstream cause, not primary root cause.** Rationale: the gap explains why the three root causes went uncorrected, but closing it alone would not recover the compression. Addressed via governance forum in D19, not via a Phase 3 intervention.

## Risks and mitigations

- **[High]** **Supplier concentration counterfactual is model-dependent.** The 120 bps recoverable from supplier diversification is estimated, not observed. If actual supplier negotiation wins fall below model projection, ~40% of the cost-side recovery is at risk. Mitigation: Phase 3 business case (D16) uses a scenario band ($14-22M/yr range) rather than a point estimate; the low-scenario assumes only 70% of modeled supplier recovery.
- **[Medium]** **Promotional depth elasticity calibrated on past data.** The -22% point of diminishing returns was estimated on 2023-2025 depth-and-volume data; if consumer sensitivity shifts, the floor moves. Mitigation: D24 outcome measurement plan includes a monthly elasticity re-test against competitor response data.
- **[Medium]** **Upstream capability gap does not close on program timeline.** The category management capability gap is a 12-18 month organizational change; Morrison is a 14-month program. Risk: root causes re-emerge after program closure. Mitigation: D19 delivery plan adds a gross-margin governance forum as a permanent operating construct; this is not disbanded at program close.

## Cross-links

- Pattern · `owned-brand-margin-recovery`
- Program · APX-01 Morrison Owned Brand Margin Recovery
- Prerequisite · D07 Financial Baseline · D08 Pain Point Register
- Downstream · D11 Hypothesis Backlog · D15 Intervention Portfolio · D16 Business Case · D17 Decision Memo · D19 Delivery Plan
- Evidence base · `_evidence-base.json` (E2, E4, E5, E6, E7, E9, E25, E26, E27)

---

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
