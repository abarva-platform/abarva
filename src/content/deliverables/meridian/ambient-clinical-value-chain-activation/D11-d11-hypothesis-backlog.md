---
deliverableCode: D11
deliverableSlug: d11-hypothesis-backlog
title: Hypothesis Backlog · Meridian Ambient Clinical Value Chain
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 2 › D11

## Executive summary

The MRD-01 hypothesis backlog catalogues **12 hypotheses** for ambient scaling — generated in Phase 1 intake and refined through Phase 2 diagnosis — each tested against D06 (documentation-time baseline), D08 (pain point register), D10 (benchmark comparison), and vendor-council / CDI-team evidence [E31]. Of the 12: **7 validated**, **2 rejected**, **2 deferred to Phase 5**; H12 is **held open** as a Phase 3 decision input because the vendor-rationalisation question belongs structurally to D17 [E6][E31]. The hypotheses cluster into four families — **consolidation (H1-H3)**, **documentation redesign (H4-H6)**, **clinician-facing workflow (H7-H9)**, **governance (H10-H12)** — and map one-to-one into the four-lever Phase 3 intervention portfolio draft in D15. The Phase 2 → 3 gate packet (2026-03-03) sequences the validated seven into four parallel tracks, with governance supporting the three clinical tracks as infrastructure. Deferred hypotheses (H3, H8) have real recovery value but execution risk better handled after the 14-month window closes.

## Key facts

- **12 hypotheses tested** · 7 validated · 2 rejected · 2 deferred to Phase 5 · 1 held open for D17 [E31]
- **Hypothesis resolution workshop** held 2026-03-03 with Sarah Chen (CIO), Dr. Larsson (CMO), Priya Raman (VP RCM), Dr. Morales (CMIO) [E31]
- **Four clusters** · H1-H3 consolidation · H4-H6 documentation redesign · H7-H9 clinician-facing workflow · H10-H12 governance
- **Portfolio-compounding effect** estimated at **+25-35%** vs. sequential execution of the same validated set, per pattern-library lever-interaction model [E7][E32]

## 12 hypotheses for ambient scaling

Each hypothesis follows a standard structure: claim, measurable test, evidence source, validation status, lever linkage. The hypotheses emerged bottom-up from D04 intake [E3][E4][E5][E6], D08 pain points [E22], and D10 benchmark [E27][E28], then cross-checked against the `ambient-clinical-value-chain` canonical hypothesis catalog [E7]. Status distinguishes validated (evidence converged), rejected (evidence pointed the other way), deferred (validated but outside the 14-month envelope), and held-open (decision routes to D17).

## H1-H3 · Consolidation hypotheses

**H1 · Full vendor consolidation lifts HCC capture 6-9 points and cuts template-drift 60% on a 14-20 month horizon.** *Rejected as Phase 3 intervention; held as Phase 5 reference.* Peer-3 shows ~70% of single-vendor lift is integration-driven and ~30% consolidation-driven [E30]; the consolidation-specific ~2 points do not justify the clinician-retraining cost across ~2,400 providers and 14-20 month transition exposure. The integration component is available through H4-H6 without the transition risk.

**H2 · Primary-care consolidation (Abridge as primary-care anchor; DAX Copilot + Suki preserved) lifts primary-care pajama time 12-18 min/clinician/day net of transition.** *Validated as a Phase 3 option, routed to D17.* Peer-2 pattern demonstrates the primary + specialty pairing works; Abridge's flagship primary-care status at Meridian makes the anchor credible [E12][E29]. Maps to Phase 3 Lever 1 if selected.

**H3 · Specialty consolidation (DAX Copilot single-anchor, Suki sunset in outpatient procedural) simplifies template governance at modest outcome cost.** *Deferred to Phase 5.* Validated in principle but Suki sunset exposes urgent-care and ambulatory-surgery to a 6-9 month gap; outside the Phase 4 envelope.

## H4-H6 · Documentation redesign hypotheses

**H4 · A unified ambient-to-CDI telemetry surface lifts CDI-queue routing from 40/week to 140-180/week on a 6-9 month horizon.** *Validated.* D10 Practice 1 — two cohort peers stood up exactly this surface [E28]; CDI capacity confirmed by Maria H. [E15]. High confidence. Maps to Phase 3 Lever 1 (CDI integration).

**H5 · An HCC-capture feedback loop from CDI resolution back into each vendor's suggestion engine lifts MA-panel HCC capture 3-5 points on a 9-12 month horizon.** *Validated.* D10 Practice 2 — three cohort peers close this loop [E28]; Abridge and DAX Copilot confirm capability but non-commissioning on Meridian side [E12][E13]. Medium-to-high confidence. Maps to Phase 3 Lever 2.

**H6 · Specialty-specific note-template governance across the three vendors cuts template-selection errors from 23% to 8-12% on a 6-9 month horizon.** *Validated.* D08 pain #2, D10 Practice 4 [E11][E28]; Peer-3 runs single-vendor at 11% residual, suggesting the three-vendor variant reaches 11-14% without consolidation [E30]. Medium confidence. Maps to Phase 3 Lever 2 sub-workstream.

## H7-H9 · Clinician-facing workflow hypotheses

**H7 · Ambient-generated quality-measure documentation capture lifts HEDIS + Stars capture from 34% to 55-65% on a 9-12 month horizon.** *Validated.* D10 Practice 3 — two cohort peers route ambient care-gap documentation into the quality-measure workflow at encounter level [E28]; Rohan P. confirms operational readiness. Medium confidence. Maps to Phase 3 Lever 3.

**H8 · Ambient coverage extended to in-basket and portal-message documentation cuts primary-care pajama time 22-34 min/clinician/day on a 12-18 month horizon.** *Deferred to Phase 5.* D08 pain #2 identifies 38 min/day in-basket [E23]; mechanism supported [E7]; but Epic in-basket modernisation exceeds the $4.2M envelope.

**H9 · Shift-specific pajama-time interventions (night and weekend rotations) protect against the uneven-coverage pain WS2 identified.** *Validated.* D08 clinician-voice triangulation [E23]; surfaced in 9 of 14 primary-care conversations. Medium confidence. Maps to Phase 3 Lever 3 clinician-coaching sub-workstream.

## H10-H12 · Governance hypotheses

**H10 · A single unified vendor-council coordination cadence (weekly, all three vendors + Meridian-side leads, Dr. Morales chair) cuts cross-vendor decision latency from median 18 days to median 5.** *Validated.* D02 stakeholder-map evidence [E24]; Dr. Morales currently runs three parallel cadences. High confidence. Maps to Phase 3 Lever 4 (governance) — infrastructure, not a standalone outcome lever.

**H11 · A monthly CMIO/CMO/CIO alignment triad (separate from biweekly four-principal steering) pre-empts the governance drift multi-principal ambient programs exhibit in the pattern library.** *Validated.* Pattern-library evidence [E7]; Phase 2 WS4 experience [E20]. High confidence. Maps to Phase 3 Lever 4 sub-workstream; WS4 is already piloting.

**H12 · The three-vendor envelope should transition to a two-vendor envelope (primary + specialty) on a Phase 5 horizon, with transition path selected at D17.** *Held open for D17.* The rationalisation hypothesis belongs structurally to Phase 3 decision memo [E6]. Evidence from H1, H2, D10, and Peer-3 feeds D17; Dr. Morales's prior dissent is preserved in the D17 packet [E6].

**Rejected:** H1 above is the explicit rejection. A prior candidate (full ambient withdrawal / return to traditional dictation) was tested at 2026-02-24 and rejected when clinician-voice [E23] and vendor-council capability evidence [E12][E13][E14] converged against it.

## Prioritisation and Phase 3 sequencing

The seven validated hypotheses were sequenced into four parallel tracks on 2026-03-03 [E31]. **Track 1 (CDI integration)** executes H4 plus a portion of H10. **Track 2 (HCC feedback loop + template governance)** executes H5 and H6, with feedback-loop commissioning preceding template-governance ratification by ~4 weeks. **Track 3 (quality-measure capture + shift-specific clinician work)** executes H7 and H9. **Track 4 (governance)** executes H10 and H11 as infrastructure supporting Tracks 1-3.

The parallel-track sequencing is the most consequential decision in the deliverable. Portfolio-compounding analysis estimates **+25-35% faster outcome realisation** vs. sequential execution, because CDI-queue volume, HCC feedback loop, and template governance reinforce each other operationally [E7][E32]. Parallel-execution load — higher Q2/Q3 2026 on Dr. Morales's informatics team — was mitigated by two integration engineers added to Theo J.'s team and ratified by Sarah Chen. The sequencing feeds D15 (intervention portfolio) and D16 (business case), with the compounding lift modelled in the mid-scenario $11M/yr projection.

**H12's open status routes to D17, not to a Phase 3 track.** The vendor-rationalisation question is the single decision the Phase 3 gate structurally owns [E16]. D11 does not validate or reject H12; the backlog's job is to assemble the evidence D17 will reason against. Dr. Morales co-signed this framing at 2026-03-03 [E6][E31]; his rationalisation argument is carried into D17 with Phase 2 evidence rather than suppressed.

The 2 deferred hypotheses (H3, H8) are scheduled, not shelved — both enter the Phase 5 continuation roadmap with refresh at month 9 of Phase 4. The program's deferral discipline reflects Sarah Chen's capital-scope authority [E16]: Phase 4 delivers what $4.2M credibly delivers; Phase 5 is genuine continuation scoping. The **seven-hypothesis → four-track consolidation** (vs. hypothesis-per-track) cuts Phase 3 coordination load ~40% and matches the D02 four-principal authority partition. Each track has a single lead, a single weekly cadence, a single D15 artefact. The four-track architecture is what D15 inherits.

## Decision log

- **2026-02-26** · Nexus Maestro · **Hypothesis structure locked.** Claim, test, evidence source, validation status, lever linkage. Rationale: every hypothesis must be testable against Phase 2 evidence; hypotheses that cannot be structured this way are not kept in the backlog.
- **2026-03-03** · Sarah Chen (CIO), Dr. Larsson (CMO), Priya Raman (VP RCM), Dr. Morales (CMIO) · **12 hypotheses resolved: 7 validated, 2 rejected, 2 deferred, 1 held open for D17.** Rationale: validation evidence converges across D06 baseline, D08 pain points, D10 benchmark, and vendor-council sources; H12 routes structurally to D17 under the charter commitment [E6][E16].
- **2026-03-03** · Sarah Chen (CIO) · **Parallel-track sequencing selected over sequential.** Rationale: portfolio compounding (+25-35% faster realisation per pattern library [E7][E32]) materially changes NPV; Q2/Q3 operational load mitigated by two added integration engineers.
- **2026-03-03** · Dr. Larsson (CMO) · **Clinician-cognitive-load sign-off required on any Phase 3 track that touches clinician workflow.** Rationale: WS2 veto authority [E4] applies at track level, not just at D15 level; track leads carry Dr. Larsson's sign-off in-workstream.

## Risks and mitigations

- **[High]** **Parallel-track execution creates concentrated Q2/Q3 2026 operational load on Dr. Morales's informatics team.** Four tracks executing simultaneously, plus three vendor-council coordination cadences, could overwhelm a single CMIO's bandwidth. **Mitigation:** two additional integration engineers added to Theo J.'s team; Dr. Morales chairs Track 1 and Track 4 directly; Tracks 2 and 3 chaired by Theo J. and Kevin B. respectively with Dr. Morales reviewing biweekly.
- **[Medium]** **Portfolio-compounding estimate is pattern-library-derived, not Meridian-specific.** The +25-35% lift is a pattern library benchmark [E7][E32] rather than a Meridian measurement. **Mitigation:** D16 business case treats the compounding lift as a mid-scenario element; low-scenario business case assumes zero compounding (additive-only outcome realisation).
- **[Medium]** **Deferred hypotheses may drift from the Phase 5 roadmap.** H3 and H8 have real recoverable value; if deferred too long they lose context. **Mitigation:** D24 outcome measurement plan explicitly carries H3 and H8 as named Phase 5 candidates with refresh triggers at month 9 of Phase 4.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Workstream Charters (D06):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d06-d06-workstream-charters`
- **Pain Point Register (D08):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d08-d08-pain-point-register`
- **Benchmark Comparison (D10):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d10-d10-benchmark-comparison`
- **Intervention Portfolio (D15):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d15-d15-intervention-portfolio`
- **Business Case (D16):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d16-d16-business-case`
- **Decision Memo (D17):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d17-d17-decision-memo`
- **Evidence anchors:** E3, E4, E5, E6, E7, E11, E12, E13, E14, E15, E16, E20, E22, E23, E24, E27, E28, E29, E30, E31, E32 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
