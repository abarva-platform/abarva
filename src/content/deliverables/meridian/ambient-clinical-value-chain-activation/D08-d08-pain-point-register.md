---
deliverableCode: D08
deliverableSlug: d08-pain-point-register
title: Pain Point Register · Meridian Ambient Clinical Value Chain
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 2 › D08

## Executive summary

The MRD-01 pain point register catalogues **28 operator- and clinician-reported frictions** gathered across 22 structured clinician conversations, 4 CDI-specialist shadows, 6 revenue-cycle workshops, and 3 vendor-council joint reviews between 2026-02-05 and 2026-02-24 [E21]. Clustered by population, four families carry **84% of weighted program-relevant pain**: clinician primary-care, clinician specialty/outpatient, administrative / revenue-cycle, and data/IT [E22]. A fifth cluster — patient-facing — is held as watchlist. The register was prioritised on **2026-02-24** with Dr. Larsson, Priya Raman, and Maria H., who flagged primary-care pajama time, note-template drift, CDI-queue starvation, and T+21 reporting latency as the four top-weighted pains [E11][E15][E22]. The register feeds D11 hypothesis backlog and D15 intervention portfolio scoping in Phase 3.

## Key facts

- **28 pain points** identified across 22 clinician conversations, 4 CDI shadows, 6 revenue-cycle workshops, 3 vendor-council reviews [E21]
- **10 high-severity, 13 medium, 5 low** — weighted by clinician impact, dollar impact, and feasibility [E22]
- **Top 4 by program-relevance:** primary-care pajama time (2 hr 09 min/day median), note-template drift (23% of sampled notes), CDI-queue starvation (40/week vs. 180-220/week expected), reporting latency (T+21) [E1][E11][E15][E22]
- Every pain point cross-references to at least one D11 hypothesis and at least one D15 candidate lever

## Clinician pain points · primary care

The primary-care cluster carries **9 pain points** and the heaviest weighted pain in the register. The headline, validated in 14 of 22 clinician conversations and triangulated against Epic Signal and MBI-HSS [E1][E2][E17], is **pajama time of 2 hr 09 min/day median** in primary care — 25% above hospital-medicine median and ~40% above specialty-benchmark median [E17][E23]. Abridge is the ambient vendor primarily serving this population; clinicians report the ambient draft is clinically usable but does not eliminate after-hours work because HCC-relevant language surfaced in the transcript is not being closed into the encounter note [E12]. Pain #2: **in-basket and message volume** is untouched by ambient, consuming median 38 min/day [E23]. Pain #3: **visit-volume compensation pressure** — documentation time does not scale down when visits scale up [E19][E23].

Pain #4 (surfaced in 9 of 14 primary-care conversations): the **post-visit care-gap documentation load** — HEDIS and Stars quality-measure documentation not captured by ambient. Pain #5: **risk-adjustment coaching absence** — clinicians have received no formal feedback on HCC capture performance against their MA panel [E12]. Pain #6: **pre-visit chart review time** grows with panel complexity; ambient does not help. Pain #7: **template fatigue** — 17 active Epic templates across the 3 largest primary-care specialties [E24]. Pain #8: **pajama-time variance** across 220 ambulatory sites (1.42-2.38 hr/day median by site) with no structured coaching loop [E19]. Pain #9: **Abridge-to-Epic hand-off latency** — notes occasionally land 45-90 minutes post-visit.

## Clinician pain points · specialty and outpatient

The specialty and outpatient cluster carries **6 pain points** with different character than primary care. DAX Copilot covers cardiology, orthopedics, and GI; clinicians report ambient works well inside the Epic-embedded workflow but **DRG specificity feedback is not closed** — when the CDI team later raises a specificity query, the clinician has no context for what the original ambient draft missed [E13][E15]. Pain #2: **template-selection errors** — 23% of sampled ambient-generated notes across the three vendors show specialty-inappropriate template selection (e.g., cardiology general-medicine template instead of the cardiology-specific structure) [E11]. Pain #3: **Suki outpatient-procedural note scope** is narrower than clinicians need for operative or procedural documentation [E14]. Pain #4: **ambient-generated summary drift** — occasional compression of clinically-important detail; correction absorbs ~4 min per affected encounter [E24]. Pain #5: **specialty-specific quality-measure capture** is worse in specialty because DAX Copilot's structured-data extraction is not tuned to specialty quality-measure fields. Pain #6: **dual-ambient exposure** — 40 clinicians across specialty and hospital medicine work in settings where two ambient vendors are active (DAX in clinic, Suki in urgent care); dual-vendor note-template reconciliation adds friction [E6][E24].

## Administrative pain points

The administrative cluster carries **7 pain points**, concentrated in CDI and revenue-cycle operations. The dominant pain — **CDI-queue starvation** — is a direct operational finding from Maria H.'s team shadow [E15]. HCC-relevant query volume routed from ambient runs at ~**40 queries/week** against a 180-220/week pattern-evidence benchmark for Meridian's scale and MA-payer-mix exposure [E15][E25]. Pain #2: **DRG specificity queries** on the inpatient side are similarly starved — 120-160/week expected vs. ~35/week observed [E25]. Pain #3: **HCC-queue feedback loop is unilateral** — CDI-resolved queries are captured in Epic but not routed back to vendor suggestion engines for future similar encounters [E12][E13][E15]. Pain #4: **coding and HIM queue routing** — HCC suggestions in ambient drafts have no programmatic route to the coding queue; capture depends on manual clinician endorsement [E11]. Pain #5: **quality-measure documentation capture** runs at 34% vs. 55-70% cohort benchmark for integrated deployments [E25]. Pain #6: **CDI staffing elasticity** — the 42-specialist team is sized for current volume but needs +12-15 to absorb the Phase 4 target state [E15]. Pain #7: **denial and downgrade workflow** — no feedback loop from payer-denied documentation patterns back to the ambient vendor.

## Data and IT pain points

The data and IT cluster carries **4 pain points** and ranks below the clinical and administrative clusters on absolute severity but appears as a **dependency under every other pain** [E7]. Pain #1: **reporting latency** — CDI-queue, HCC-capture, and pajama-time dashboards close on a T+21 cycle [E22][E26]. Pain #2: **vendor-telemetry fragmentation** — each vendor exposes its own format; no unified telemetry surface [E6][E11]. Pain #3: **Epic integration middleware** runs three separate connectors, each commissioned by a different project team, with no automated integration-surface tests [E24]. Pain #4: **note-template governance tooling** — template changes across vendors are managed in three different vendor consoles with no unified governance record [E11].

## Patient-facing pain points (secondary)

A fifth cluster — **patient-facing pain** — is held as watchlist, not a Phase 3 intervention surface. Three pain points appear: (1) ambient-consent fatigue (per-visit acknowledgement where annual would suffice), (2) occasional patient-reported accuracy concerns on portal-shared ambient summaries, (3) mild ambient-active vs. ambient-off preference variance. Severity is low and program-level remediation feasibility limited; all three carry into D22 change-management rather than D15 Phase 3 design [E26].

## Severity and clustering

The 28 pain points were scored on a three-axis matrix: **severity** (clinician-impact + dollar-impact composite), **feasibility** (12-month recoverability inside the $4.2M envelope), and **program-relevance** (ambient-value-chain vs. adjacent program) [E22]. Ten landed in the high-severity / high-feasibility / high-program-relevance cell — direct input to D11. Thirteen landed medium and are carried as supporting hypotheses or Phase 4 execution details. Five low-severity are captured but not prioritised; two fold into Phase 4 change management without a dedicated lever.

The cluster weighting — **84% of program-relevant pain** concentrated in the top four clusters — is what framed the decision to route the Phase 3 intervention portfolio into **four parallel levers** (CDI integration, HCC-capture feedback loop, quality-measure capture, clinician cognitive-load protection) rather than a single- or two-lever architecture [E22]. The register appends through Phase 4 as execution-surfaced pain is routed in; 28 pains is the Phase 2 synthesis state.

## Decision log

- **2026-02-11** · Dr. Morales (CMIO) · **WS1 pain-point methodology ratified.** Three-axis scoring matrix (severity, feasibility, program-relevance); clinician pain weighted equally to dollar-impact pain per Dr. Larsson's co-sponsor authority [E4].
- **2026-02-24** · Dr. Larsson (CMO), Priya Raman (VP RCM), Maria H. (Director CDI) · **Top-4 pain prioritisation ratified.** Primary-care pajama time, note-template drift, CDI-queue starvation, reporting latency confirmed as top 4 by weighted program-relevance [E11][E15][E22].
- **2026-02-24** · Nexus Maestro · **Patient-facing pain routed to D22, not D15.** Severity below Phase 3 threshold; feasibility of program-level remediation limited; all three items carried to Phase 4 change-management package.
- **2026-02-26** · Dr. Larsson (CMO) · **Dual-ambient-exposure clinician subset (40 clinicians) flagged for Phase 3 specific attention.** Not a veto on the value-chain framing, but a fairness concern if Phase 3 interventions protect single-vendor clinicians first.

## Risks and mitigations

- **[Medium]** **Clinician-voice sample may underweight night and weekend shifts.** 22 clinician conversations conducted within business hours across a 30-day window may miss pain patterns specific to hospitalists on night rotation and weekend-only providers. **Mitigation:** Phase 3 intervention design (D15) includes a shift-specific pajama-time cut; WS2 schedules a targeted night-shift clinician round in Phase 3 Sprint 1 before intervention commissioning.
- **[Medium]** **Note-template drift audit sample skews toward higher-volume specialties.** The 2,400-note sample [E11] is distributed proportional to volume, which means low-volume specialties (outpatient psychiatry, palliative) are under-represented. **Mitigation:** Phase 3 template-governance intervention uses a stratified sample in its outcome-measurement plan; low-volume specialties receive explicit coverage in D24.
- **[Low]** **CDI-team pain may overweight what Maria H.'s team sees.** The CDI-queue starvation framing reflects the 42-specialist team's perspective; coders and HIM staff may see a different picture. **Mitigation:** Nadia S. (Director Coding and HIM) reviewed and co-signed the administrative cluster; one coding-specific pain point (#4 in the administrative cluster) was added after her review, correcting an earlier CDI-centric framing.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Workstream Charters (D06):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d06-d06-workstream-charters`
- **Benchmark Comparison (D10):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d10-d10-benchmark-comparison`
- **Hypothesis Backlog (D11):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d11-d11-hypothesis-backlog`
- **Evidence anchors:** E1, E2, E4, E6, E7, E11, E12, E13, E14, E15, E17, E19, E21, E22, E23, E24, E25, E26 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
