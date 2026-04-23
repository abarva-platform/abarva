---
deliverableCode: D10
deliverableSlug: d10-benchmark-comparison
title: Benchmark Comparison · Meridian Ambient Clinical Value Chain
phase: 2
tier: rich
author: Claude Opus 4.7 · Agent C6
timestamp: 2026-04-23
program: MRD-01 · Ambient Clinical Value Chain Activation
tenant: Meridian Health System
pattern: ambient-clinical-value-chain
sponsor: Sarah Chen · CIO
coSponsor: Dr. Larsson · CMO
---

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 2 › D10

## Executive summary

Meridian's ambient value-chain position was benchmarked against a **five-peer composite IDN cohort** matched on revenue band ($5.5B-$11B), hospital count (8-19), ambulatory footprint (150-260 sites), and payer-mix weighting (≥45% MA and commercial risk-based) [E27]. Meridian sits in the **4th quartile on ambient-value-chain integration maturity**, with widest gaps on **HCC-capture integration** (cohort median 62% capture on MA panel; Meridian 58%) and **CDI-queue routing volume** (cohort median 165 queries/week/100 ambient-clinicians; Meridian ~40/week) [E25][E28]. On **pajama time**, Meridian sits in 3rd quartile — 2 hr 09 min/day primary-care median is ~18 minutes above cohort median but below the 2 hr 34 min/day worst-performer [E17][E28]. **Four of five cohort peers operate one or two ambient vendors** rather than three; the cohort gives Meridian the first structured IDN-denominator view of the Phase 3 rationalisation decision [E10]. The transferable-practice review identified four practices — unified ambient-to-CDI telemetry, HCC-capture feedback loop, quality-measure capture, and single-vendor note-template governance — that cohort leaders use and Meridian does not. All four map directly into the Phase 3 four-lever portfolio draft in D15.

## Key facts

- **5-peer composite IDN cohort** · revenue band $5.5B-$11B · hospital count 8-19 · ambulatory 150-260 sites · ≥45% MA-and-commercial-risk payer mix [E27]
- **Meridian position:** 4th quartile on ambient-value-chain integration maturity · 3rd quartile on pajama time · 2nd quartile on ambient-vendor clinician adoption [E28]
- **HCC-capture gap:** 58% Meridian vs. 62% cohort median vs. 71% cohort top-quartile on MA panel [E25][E28]
- **CDI-queue routing:** ~40/week Meridian vs. 165/week cohort median per 100 ambient-clinicians [E15][E25]

## Peer IDN selection · 5 MA-heavy systems

The cohort was assembled through a four-filter methodology [E27]. Filter 1 — **revenue band $5.5B-$11B**: IDNs placing Meridian ($7.8B) near the cohort midpoint. Filter 2 — **hospital count 8-19**: footprint spanning half- to double-scale of Meridian's 14. Filter 3 — **ambulatory footprint 150-260 sites**: comparable to Meridian's 220. Filter 4 — **payer mix ≥45% MA and commercial risk-based**: excludes IDNs with low MA exposure whose ambient integration economics differ structurally because HCC capture is less material [E18].

The final cohort of five satisfies all four filters and passes two auxiliary tests: each peer has had ≥1 ambient vendor live ≥18 months (settled operating state) and runs a CDI team of 25-65 specialists (comparable to Meridian's 42). All cohort data is composite — public filings, trade reports, analyst coverage, anonymised pattern-library data — with no peer individually identifiable [E27]. Cohort selection was ratified by Priya Raman 2026-02-18 and re-validated by Dr. Morales 2026-02-26.

## Documentation time benchmarks

The documentation-time benchmark uses three metrics: **pajama time** (median minutes/clinician/day), **note sign-to-close turnaround**, and **in-basket time** (minutes/day on portal-message response) [E28]. Meridian's primary-care pajama time of 2 hr 09 min/day sits **18 minutes above cohort median** (1 hr 51 min) and **41 minutes above top-quartile** (1 hr 28 min); hospital-medicine 1 hr 54 min sits **11 minutes above cohort median** [E17]. Specialty pajama time is closer — cardiology 6 minutes above median, orthopedics within 3 minutes — reflecting that DAX Copilot's Epic-embedded specialty integration has reached cohort parity on clinician-time even without downstream CDI/HCC integration [E13][E28].

Note sign-to-close turnaround: Meridian is **close to cohort median** (3.8 hr vs. 3.6 hr) — ambient is working on the narrow note-authorship surface it was deployed to address. The pajama-time gap is not note-authorship inefficiency; it is concentrated in the in-basket and care-gap documentation surfaces that ambient does not touch [E22][E23][E28].

## Burnout benchmark comparison · MBI-HSS scores

Four of five cohort peers share anonymised MBI-HSS data; the fifth runs a different instrument and is excluded. Meridian's **54% emotional-exhaustion elevated band** [E2] sits **6 points above the 4-peer cohort median (48%)** within a 42-56% cohort range [E29]. The depersonalisation subscale (Meridian 38%) is closer to cohort median (35%). The personal-accomplishment subscale (not in the Phase 1 wave) will be added to the 2026-02-25 WS2 repeat wave.

The 6-point emotional-exhaustion gap is **meaningful but not outlier**. Meridian is not the cohort worst, but it is on the wrong side of median in a window where two peers reduced emotional-exhaustion 8-11 points after integrating ambient into CDI and HCC workflows [E29]. The correlation between MBI-HSS reduction and value-chain integration is one of the cleaner cohort signals and powers hypothesis H6 in D11.

## Ambient vendor adoption patterns at peers

Four of five cohort peers operate **one or two ambient vendors**, not three [E10]. Peer-1 (top quartile) consolidated to a single primary vendor 14 months post-deployment. Peer-2 (top quartile) runs a primary + specialty pairing (same pattern as Abridge + DAX Copilot) with a shared note-template governance layer. Peer-3 (payer-provider hybrid; deep-dive below) runs one ambient vendor across the full clinical population. Peer-4 (cohort median) runs primary-care ambient only, with specialty clinicians on traditional dictation. Peer-5 (bottom-quartile) deployed two and is mid-consolidation.

**Cohort-leader IDNs converge on one or two ambient vendors, not three.** Meridian is the only IDN in the cohort operating three in parallel past 18 months [E10]. This does not prove three-vendor operation is wrong — cohort size does not justify that — but it does make the Phase 3 rationalisation question in D17 more empirically textured, and it is why Dr. Morales's prior dissent on rationalisation timing [E6] deserves the Phase 3 re-examination the charter committed it to [E16].

## Transferable practices

The transferable-practice review identified four cohort-leader practices Meridian does not currently use:

**Practice 1 — unified ambient-to-CDI telemetry**. Two cohort peers stood up a single telemetry surface spanning all deployed vendors, piping HCC suggestions, DRG specificity flags, and quality-measure gaps into a unified CDI queue. Meridian runs three separate telemetry formats with manual reconciliation [E6][E11]. **Practice 2 — HCC-capture feedback loop**. Three cohort peers close the loop from CDI-query resolution back into the ambient vendor's suggestion engine. Meridian's CDI resolutions are captured in Epic but not routed back into any vendor engine [E12][E13][E15]. **Practice 3 — quality-measure documentation capture**. Two cohort peers route ambient-identified care-gap documentation directly into the quality-measure workflow at encounter level. Meridian captures at 34% vs. cohort median 62% for integrated deployments [E25][E28]. **Practice 4 — single-vendor note-template governance**. Four cohort peers run a unified template-governance board across ambient vendors and the internal Epic library. Meridian runs three separate cadences [E11][E24].

All four practices map one-to-one into the Phase 3 four-lever portfolio draft in D15. The benchmark-to-lever mapping is the most actionable artefact in this deliverable.

## Peer-3 deep dive (payer-provider hybrid)

Peer-3 is the most structurally similar IDN in the cohort. A payer-provider hybrid IDN with ~60% MA exposure, ~$6.8B revenue, MA book ~30% larger than Meridian's per-dollar-revenue. Peer-3 operates **one ambient vendor** across primary care + specialty + outpatient procedural; consolidated 19 months post-first-deployment. Peer-3 reports pajama time 14% below cohort median, HCC capture 9 points above cohort median, CDI-query routing 2.4× cohort median [E29][E30].

Three takeaways: **(1)** single-vendor operation closed the ambient-to-CDI feedback loop in ~8 months vs. 14-20 months the two-vendor cohort peers required. **(2)** single-vendor operation did not eliminate specialty-template drift — Peer-3 still runs template governance and reports 11% template-selection-error, meaning Practice 4 is not strictly dependent on rationalisation. **(3)** Peer-3's payer-provider status gave it a captive-MA HCC-capture lever Meridian lacks (Meridian's MA is payer-mediated, not captive), so Peer-3's full economic model is not directly portable [E18][E30].

The Peer-3 deep dive is load-bearing evidence for D17. It does not settle the rationalisation question (Peer-3's lift depends partly on captive-MA economics Meridian cannot replicate), but it makes clear that **value-chain integration is a larger outcome lever than vendor rationalisation** — Peer-3's lift was ~70% integration-driven, ~30% consolidation-driven per the pattern-library decomposition [E7][E30].

## Decision log

- **2026-02-18** · Priya Raman (VP RCM) · **Cohort selection criteria locked.** Four-filter methodology; five-peer final cohort; no peer individually identifiable; ratified with Dr. Morales [E27].
- **2026-02-26** · Dr. Morales (CMIO) · **Peer-3 deep dive commissioned.** Rationale: Peer-3 is the most structurally similar IDN in the cohort and operates single-vendor; provides empirical anchor for the Phase 3 rationalisation question.
- **2026-03-01** · Sarah Chen (CIO) · Priya Raman · **D17 Phase 3 decision packet uses cohort integration maturity as primary benchmark, not vendor count.** Rationale: cohort evidence shows value-chain integration is the larger outcome lever; vendor count is a secondary decision.
- **2026-03-03** · Dr. Larsson (CMO) · **MBI-HSS 4-peer cohort comparison added to Phase 2 → 3 gate packet.** Rationale: clinician-facing lens explicit in the Phase 3 decision surface.

## Risks and mitigations

- **[Medium]** **Composite cohort data is not auditable at peer-IDN level.** The benchmark is defensible in aggregate but cannot be replicated by an external reviewer against named peers. **Mitigation:** D10 cites confidence levels; the business case (D16) uses the cohort for directional framing, not for point-estimate projections; Phase 5 attestation is measured against the Meridian 2025 Q4 baseline (D06), not against the cohort [E1].
- **[Medium]** **Peer-3 economics not fully portable to Meridian.** Peer-3's captive-MA relationship gives it an HCC-capture lever Meridian cannot directly replicate. **Mitigation:** D10 Peer-3 deep dive explicitly decomposes the Peer-3 lift into integration-driven (portable) and captive-MA-driven (non-portable) components per pattern-library analysis [E7][E30]; the business case uses only the portable component.
- **[Low]** **Cohort size of 5 produces wide confidence bands on some metrics.** Five peers is the minimum defensible cohort for IDN benchmarking. **Mitigation:** the transferable-practice review focused on practice mechanics, not outcome point estimates; practice identification is robust to cohort-size noise in a way outcome quantification is not.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Workstream Charters (D06):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d06-d06-workstream-charters`
- **Pain Point Register (D08):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d08-d08-pain-point-register`
- **Hypothesis Backlog (D11):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d11-d11-hypothesis-backlog`
- **Decision Memo (D17):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d17-d17-decision-memo`
- **Evidence anchors:** E2, E6, E7, E10, E11, E12, E13, E15, E17, E18, E22, E23, E24, E25, E27, E28, E29, E30 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
