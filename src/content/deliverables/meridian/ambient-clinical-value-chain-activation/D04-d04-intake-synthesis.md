---
deliverableCode: D04
deliverableSlug: d04-intake-synthesis
title: Intake Synthesis · Meridian Ambient Clinical Value Chain
phase: 1
tier: rich
author: Claude Opus 4.7 · Agent C5
timestamp: 2026-04-23
program: MRD-01 · Ambient Clinical Value Chain Activation
tenant: Meridian Health System
pattern: ambient-clinical-value-chain
sponsor: Sarah Chen · CIO
coSponsor: Dr. Larsson · CMO
---

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 1 › D04

## Executive summary

Between **2026-01-08 and 2026-01-27**, the MRD-01 intake team conducted **14 structured interviews** across Tier-1 sponsors, Tier-2 influencers, the three ambient vendor councils (Abridge, Microsoft DAX Copilot, Suki), and four field operators (two attending physicians, a CDI specialist, a coder). Synthesis surfaces **four primary tensions**, **six pattern-library anchors** against the `ambient-clinical-value-chain` canonical pattern [E7], **three notable contradictions** between stakeholder framings, and **11 hypotheses** now carried into the Phase 2 hypothesis backlog. The sharpest contradiction — **Dr. Morales (CMIO) argues for earlier vendor consolidation; Sarah Chen and Dr. Larsson prefer value-chain activation across the three-vendor envelope through Phase 3** [E3][E6] — is productive rather than blocking, and the four-principal governance architecture absorbs it by design. This synthesis is the handoff document from framing to diagnosis; Phase 2 diagnostic work pushes against its claims, not its axioms.

## Key facts

- **Phase:** 1 · Intake & Framing
- **Owner:** Nexus orchestrator agent (synthesis) · Dr. Morales (ratification)
- **Date approved:** 2026-01-28
- **Value at stake:** 11 hypotheses carried forward; 4 tensions scoped for Phase 2 resolution

## What we heard

The intake covered 14 stakeholders over 22 hours of structured conversation. Interviews followed a five-part protocol: situational framing, value-chain topology, vendor-architecture preference, clinician-experience framing, and governance preference. Quotes below are composite-paraphrased from transcripts; exact transcripts are held in the Phase 1 evidence annex.

**Sarah Chen · CIO · interview 2026-01-08.** Framing: the three ambient deployments solved three different clinician populations but did not solve a system problem [E3]. Abridge for primary care, DAX Copilot for specialty, Suki for outpatient procedural. Each cleared its narrow success criterion. None of them connects into CDI, HCC capture, or quality measure documentation. Her framing: "the question is not which vendor survives, it's how any of them connect to CDI, HCC capture, and quality measure capture." She is explicit that vendor consolidation is a downstream question, not the framing question. She is prepared to authorize $4.0-4.5M capital envelope if the business case lands within an 18-month payback horizon.

**Dr. Larsson · CMO · interview 2026-01-09.** Framing: clinician cognitive load is the north-star [E4]. The documentation economy is real and material, but chasing HCC capture uplift without clinician cognitive-load recovery is just moving documentation burden from one accountant to another. Pajama time is the number medical staff believe. She accepts co-sponsorship on the condition that interventions that materially increase documentation burden — even if they unlock HCC capture — require her sign-off. She points to 54% of clinicians in the elevated MBI-HSS emotional-exhaustion band [E2] as the risk if the program over-rotates on revenue-cycle capture.

**Priya Raman · VP Revenue Cycle · interview 2026-01-12.** Framing: on the MA book the HCC recapture gap is real and material [E5]. She estimates $3.2-5.1M/yr uncaptured risk adjustment across the MA-heavy payer mix. On the inpatient side, DRG specificity shows a similar downgrade pattern, estimated $1.8-2.6M/yr in CMI drift. She is supportive of the value-chain framing and notes that none of her levers activate without ambient integration. Her concern: the CDI team is ready operationally but the feedback loops from ambient to CDI queue are not commissioned.

**Dr. Morales · CMIO · interview 2026-01-13.** Framing [E6]: three parallel ambient vendors is an unstable equilibrium. Abridge handles primary care well, DAX Copilot carries specialty, Suki covers outpatient procedural, but governance is fragmented across three vendor councils and note-template drift is measurable. He would argue for vendor consolidation now, not Phase 4. He accepted the program scope as written on the condition that the Phase 3 → 4 gate explicitly re-examines the consolidation question with Phase 2 evidence. His position is preserved in the decision log rather than suppressed.

**Maria H. · Director, CDI · interview 2026-01-14.** Framing [E15]: her 42 CDI specialists have received almost no increase in query volume routed from ambient notes since deployment. The CDI team is well-staffed and well-trained; the bottleneck is not CDI capacity, it is that the ambient vendors are not routing documentation gaps to CDI queue. She is ready to support a 4-6x surge in query volume if vendor feedback loops are commissioned. She estimates current HCC-relevant query volume at ~40/week against what pattern evidence suggests should be 180-220/week at Meridian's scale.

**Kevin B. · Director, Epic Signal Analytics · interview 2026-01-15.** Framing on measurement: 18 months of Epic Signal data is clean enough for a robust baseline [E1]. Primary-care and hospital-medicine specialties carry the heaviest pajama time. 47% of Meridian physicians sit above specialty-benchmark median. He cautions that Epic Signal occasionally redefines activity categories with Epic upgrades and recommends the baseline methodology pin specific categories explicitly.

**Jenna T. · Director, Revenue Cycle Analytics · interview 2026-01-15.** Framing on HCC capture: the 58% capture rate against coder-audited denominator is ~14 points below what the cohort achieves post-ambient-integration [E10]. She flagged that four of six cohort peers operate with one or two ambient vendors, not three; the vendor count correlates with HCC integration maturity in her cohort view.

**Dr. Ayotunde A. · Chief Ambulatory Officer · interview 2026-01-16.** Framing [E19]: the 220 ambulatory sites are where the clinician burnout math actually lives. Primary care carries 2 hr 09 min/day median pajama time [E17]. If ambient works in ambulatory primary care, it buys capacity worth 6-9 incremental visits per clinician per week. That is a real patient-access number, not just a wellness number.

**Rohan P. · Director, Quality and Population Health · interview 2026-01-19.** Framing: HEDIS and CMS Stars documentation capture from ambient content is currently at 34%; the pattern-cohort range for integrated deployments is 55-70%. Ambient-side integration is a 2-3 point Stars-rating swing if captured through to quality measure documentation.

**Nadia S. · Director, Coding and HIM · interview 2026-01-20.** Framing: coding-side capacity is not the bottleneck; workflow integration is. HCC queue is manual; DRG assignment workflow does not currently consume ambient content. Her team can absorb a 3-4x surge in code-suggestion queue volume if workflow is redesigned.

**Alex M. · Abridge vendor council (Meridian side) · interview 2026-01-21.** Framing [E12]: Abridge treats Meridian as a flagship primary-care ambient deployment. HCC-oriented code suggestion is available but has not been enabled at Meridian because integration to the Epic HCC queue has not been commissioned on the Meridian side. The feature is live at other Abridge customers at similar scale.

**Sam K. · DAX Copilot vendor council (Meridian side) · interview 2026-01-21.** Framing [E13]: specialty deployments cover cardiology, orthopedics, and GI. Clinician adoption is steady but the DRG specificity feedback loop has not been opened. DAX Copilot has the capability but requires CDI integration on Meridian's side.

**Lia R. · Suki vendor council (Meridian side) · interview 2026-01-22.** Framing [E14]: outpatient procedural deployment in urgent care and outpatient surgery. Lighter integration footprint than Abridge or DAX Copilot. No current HCC or DRG feedback loop commissioned. Suki is comfortable with either a continued scope or a scope-reduction outcome at Phase 4, conditional on transition timing.

**Field interview · attending physician (primary care, 2026-01-26).** Framing: Abridge is a clear win on ambient note quality, but the clinician doesn't feel HCC or quality-measure cues changing. The note goes out, the work at the top of in-basket doesn't shrink, the pajama time hasn't moved. "Ambient fixed the note; it didn't fix my workflow."

**Field interview · CDI specialist (2026-01-27).** Framing: ambient is invisible from the CDI seat today. Queue volume has not changed meaningfully since deployment. The queries they write are still manually sourced from chart review, not ambient triage. They would welcome ambient-routed queries and are capacity-ready.

## Pattern-library anchors

The `ambient-clinical-value-chain` canonical pattern [E7] surfaces ten triggering symptoms and eight detection signals. Intake confirmed six anchor matches:

1. **Narrow deployment scope.** Ambient deployed; CDI / HCC / quality-measure integration absent. Matches the pattern's "Signal 1 — Narrow deployment scope" exactly [E15].
2. **HCC capture flatline post-deployment.** Jenna T.'s analysis shows ~0 point HCC lift since primary ambient deployment [E5][E10] vs. cohort median 4-7 points post-integration.
3. **CDI isolation.** Maria H. confirms CDI team has received almost no ambient-routed query volume [E15]. Direct match to "Signal 4 — CDI isolation."
4. **Narrow ROI framing.** The ambient business cases were built on "hours saved" + clinician satisfaction, not clinical value chain metrics. Direct match to "Signal 5 — Narrow ROI framing."
5. **Vendor shopping for more value.** Meridian's Abridge / DAX Copilot / Suki arrangement is itself this signal in material form — three parallel vendors in pursuit of the same value chain deliverable [E3][E6].
6. **Revenue cycle disconnect.** Priya Raman's team has no ambient visibility; denial rates and DRG downgrade rates unchanged from pre-ambient baseline [E5]. Direct match to "Signal 7 — Revenue cycle disconnect."

Two pattern signals are **not anchored** in Meridian intake: **population health disconnect** (Rohan P.'s team is actively engaged and ready) and **physician satisfaction + "nothing else changed"** dissonance (physicians do report the dissonance, but it is leading to program activation rather than program stall). The pattern is a scaffolding, not a template.

## Contradictions observed

Three contradictions that the synthesis preserves rather than resolves. Preservation is deliberate — contradictions are the material the Phase 2 diagnostic works on.

**Contradiction 1 — Value-chain activation vs. vendor consolidation as program frame.** Sarah Chen and Dr. Larsson [E3][E4] frame the program as value-chain activation across the current three-vendor envelope. Dr. Morales [E6] frames the program as vendor consolidation with value-chain activation as a side-effect. This is not two views of the same problem; it is two decisions about which lever is load-bearing. The governance absorbs it via the Phase 3 → 4 decision gate, where the consolidation question is explicitly re-examined with Phase 2 evidence in hand.

**Contradiction 2 — Clinician experience vs. revenue-cycle capture as decision criterion.** Dr. Larsson [E4] will veto interventions that materially increase documentation burden even if they unlock HCC capture. Priya Raman [E5] needs interventions that expand documentation capture to activate the MA book value. The contradiction is numerical and will be resolved by the Phase 2 pain-point register (D08) and the Phase 3 intervention portfolio (D15), which must demonstrate net cognitive-load reduction even when adding documentation-economy capture.

**Contradiction 3 — Vendor cohort-median preference.** Jenna T. noted that four of six cohort peers run with one or two ambient vendors, not three [E10]. This implicitly supports Dr. Morales's consolidation preference. But cohort-median preference is a correlational observation, not a causal claim. Phase 2 analysis will test whether vendor count is the dominant driver of HCC integration maturity in the cohort or whether it co-varies with other factors (CDI team structure, Epic instance age, payer mix).

## Hypotheses to test

Phase 1 surfaced 11 hypotheses carried into the D11 Hypothesis Backlog (Phase 2). Summary list; full evidence framing in D11.

1. Pajama time reduction ≥22 min/clinician/day is achievable with value-chain activation alone (no vendor consolidation) at Meridian scale.
2. HCC code-suggestion enablement on Abridge primary-care lifts MA HCC capture rate by 8-14 points within 6 months of enable date.
3. DAX Copilot DRG-specificity feedback loop closure lifts inpatient DRG specificity by 180-250 bps CMI within 9 months of enable date.
4. CDI query volume routed from ambient surges to 180-220/week within 90 days of vendor feedback-loop commissioning [E15].
5. Vendor consolidation is not the dominant lever for HCC integration maturity in the cohort; value-chain integration maturity is.
6. Specialty-benchmark convergence is achievable in primary care and hospital medicine on a 12-month horizon with value-chain activation.
7. MBI-HSS elevated-band rate improves by ≥6 points within 3 quarters of Phase 4 completion if pajama-time metric hits target tier.
8. Quality-measure documentation capture improves from 34% to 55%+ when ambient content is consumed by the quality registry workflow.
9. Ambulatory primary-care visit capacity improves by 4-7 incremental visits/clinician/week at threshold pajama-time reduction [E19].
10. Note sign-to-close turnaround <6 hours is achievable across specialties when ambient note acceptance rate ≥92%.
11. Vendor-council governance under a unified steering committee reduces note-template drift from 23% to <10% within 6 months [E11].

Seven of these are expected to validate in Phase 2 (per Nexus pattern-library priors), two are expected to reject or significantly modify, and two are expected to defer to Phase 5. Actual Phase 2 resolution is logged in D11.

## Decision log

- **2026-01-08** — **Intake protocol approved.** Five-part interview structure ratified; composite-paraphrase transcription discipline adopted.
- **2026-01-22** — **Vendor-council interviews added.** Decision to interview all three vendor councils (Abridge, DAX Copilot, Suki) on symmetrical protocol rather than relying on Meridian-internal framing alone. Produced three of the sharpest evidence points on integration-readiness asymmetry [E12][E13][E14].
- **2026-01-28** — **Intake synthesis complete.** 14 interviews, 4 tensions, 11 hypotheses confirmed; primary contradiction (value-chain vs. vendor consolidation) flagged as productive and preserved rather than resolved [E3][E6].

## Risk callouts

- **Composite-paraphrase slippage (tier: Medium).** Transcripts are composite-paraphrased, not verbatim; aggressive paraphrase could drift from speaker intent. **Mitigation:** each interviewee reviewed their paraphrased quotes within 48 hours of interview; one correction applied to Dr. Morales's framing on consolidation timing to preserve the "preference, not precondition" nuance.
- **Vendor-side framing bias (tier: Medium).** Vendor councils have a commercial incentive to frame their capabilities favorably and Meridian-side readiness as the gating factor. **Mitigation:** vendor claims about integration capability (e.g., Abridge's HCC code-suggestion, DAX Copilot's DRG feedback) will be independently verified in the Phase 2 pain-point register (D08) through vendor-documentation review, not relied on as interview assertion.
- **Pattern-anchor over-mapping (tier: Low).** Forcing Meridian into pattern-library archetypes risks missing Meridian-specific dynamics. **Mitigation:** six anchors are positive matches; two pattern signals are explicitly not anchored. The pattern is a scaffolding, not a template.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Stakeholder Map (D02):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d02-d02-stakeholder-map`
- **Success Metric Tree (D03):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d03-d03-success-metric-tree`
- **Pain Point Register (D08):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d08-d08-pain-point-register`
- **Hypothesis Backlog (D11):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d11-d11-hypothesis-backlog`
- **Decision Memo (D17):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d17-d17-decision-memo`
- **Evidence anchors:** E1, E2, E3, E4, E5, E6, E7, E10, E11, E12, E13, E14, E15, E17, E19 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
