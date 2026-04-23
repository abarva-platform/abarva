---
deliverableCode: D13
deliverableSlug: d13-pilot-plan
title: Pilot Plan · Meridian Ambient Consolidation Pilot
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 3 › D13

## Executive summary

The ambient consolidation pilot is the **single-service-line Phase 4 experiment** Meridian uses to de-risk the Phase 5 vendor-rationalisation decision without committing the $4.2M envelope to a full consolidation path in Phase 4 [E42]. The pilot operates on **primary care at 18 of 220 ambulatory sites** (~8% of the primary-care footprint, ~120 clinicians) across two urban and two suburban medical groups, running from **2026-06-15 to 2026-12-15** on a **six-month instrumented window** [E43]. Abridge serves as the consolidated primary vendor inside the pilot boundary; DAX Copilot and Suki are suspended at these 18 sites for the pilot duration, with a ratified re-instatement pathway if the kill-switch triggers. The pilot is **explicitly not an intervention portfolio subset** — it is a structured counterfactual to the Phase 4 three-vendor-preserved path, producing the empirical Meridian-specific evidence the 2027-Q3 rationalisation ratification workshop needs [E31][E42]. Three leading indicators govern the pilot: **pajama time** (primary outcome), **CDI-queue routing volume**, and **HCC capture on the MA panel** [E4][E8][E44]. Two trailing indicators — MBI-HSS emotional exhaustion subscale and note-template drift — read out at month 3 and month 6. The pilot inherits the D15 kill-switch protocol and has a pre-ratified scale-out trigger if month-4 signal exceeds base-case expectations.

## Key facts

- **Pilot boundary** · 18 of 220 ambulatory sites · ~120 primary-care clinicians · 2 urban medical groups + 2 suburban medical groups [E43]
- **Duration** · 2026-06-15 → 2026-12-15 · six-month instrumented window · month-3 interim readout · month-6 go/scale/kill decision point [E42]
- **Consolidated state inside pilot** · Abridge as primary vendor · DAX Copilot + Suki suspended at the 18 sites with ratified re-instatement pathway [E42]
- **Primary outcome** · pajama time (minutes/clinician/day) · target: 18-minute reduction vs. pre-pilot baseline by month 6 [E17][E42]
- **Kill-switch** · month-3 interim readout with three-criterion gate · clinician-voice escalation trigger at any pilot-site-council weekly cadence [E45]

## Pilot design · ambient consolidation in 1 service line

The pilot consolidates to a single ambient vendor (Abridge) inside a contained boundary: 18 ambulatory primary-care sites, selected to span both urban and suburban basket dynamics and to match the Meridian-wide pajama-time distribution within ±10% [E17][E43]. The consolidation is **real but bounded** — clinicians at the 18 sites transition from whichever vendor they currently use to Abridge on a single cut-over weekend (2026-06-13), with two weeks of parallel-capture training in the run-up and three-week post-cut-over intensive adoption support. The **18-site boundary is deliberate**. A full primary-care consolidation would commit ~2,400 clinicians to a 14-20 month transition before any integration evidence is captured at Meridian scale; a pilot limited to a single specialty would miss the urban/suburban variance that is the most operationally textured part of the Meridian footprint [E17][E23][E42]. The pilot therefore tests the consolidation-specific outcome component (~30% of single-vendor lift per D10 Peer-3 decomposition) against the integration-specific component (~70%) that WS-B delivers independently across the three-vendor envelope [E30].

The pilot runs **concurrently with the Phase 4 intervention portfolio**, not as a replacement for it. CDI telemetry (WS-A), HCC feedback loop (WS-B), and quality-measure capture (WS-C) execute across all 220 ambulatory sites including the 18 pilot sites. The pilot adds **consolidation-specific interventions** on top of the portfolio baseline at its 18 sites: unified Abridge note-template governance, single-vendor HCC-suggestion commissioning at full capacity (rather than the staged Phase 4 rollout), and elimination of cross-vendor coordination overhead inside the pilot boundary. This layering is the empirical cleanliness the pilot needs — it measures consolidation-at-the-margin on top of the portfolio, isolating the 30% consolidation-specific outcome component D10 identifies [E30].

## Cohort definition

The 18-site cohort was selected to satisfy four constraints [E43]. **Constraint 1 · footprint representativeness** — two urban medical groups (one academic-affiliated, one community), two suburban medical groups, together spanning the pajama-time distribution band 1 hr 48 min to 2 hr 22 min median that covers 65% of Meridian's primary-care clinician population [E17][E23]. **Constraint 2 · ambient-maturity readiness** — all 18 sites had an ambient vendor live ≥12 months pre-pilot, so the cohort is measuring consolidation-on-top-of-maturity not initial-deployment uplift. **Constraint 3 · MA-panel exposure** — average 58-62% MA payer mix at the 18 sites, matching the Meridian system average of 55% within a tight band to preserve HCC capture measurability [E18]. **Constraint 4 · clinician-council readiness** — each medical group has a standing clinician council able to absorb biweekly pilot readouts; three of four medical groups already participated in Phase 2 D08 intake, so cohort trust is pre-established [E21][E23].

The 18 sites exclude urgent care (too short a visit cycle for reliable pajama-time signal), outpatient surgery (Suki-dominant; consolidation cost too high for pilot scope), and all specialty outpatient (DAX Copilot governance surface outside pilot scope). The cohort was ratified by Dr. Larsson 2026-04-08 with sign-off on the clinician-council engagement plan; Dr. Morales co-signed on the CMIO/vendor-council transition pathway [E6][E42].

## Measurement framework · pajama-time + burnout + note quality

The pilot instruments three leading indicators and two trailing indicators on a 14-day reporting cadence [E44]. **Leading indicator 1 · pajama time** — median minutes/clinician/day of after-hours Epic activity, measured from Epic Signal; target trajectory: 4-minute reduction at month 1, 9-minute reduction at month 3, 18-minute reduction at month 6, all vs. the pilot-site pre-pilot baseline of 2 hr 02 min (±7 min across the 4 medical groups) [E1][E17][E44]. **Leading indicator 2 · CDI-queue routing volume** — HCC-relevant queries per week per 100 ambient-clinicians at the pilot sites; target trajectory: 40/week at month 1, 110/week at month 3, 150-165/week at month 6 (approaching cohort median from D10) [E25][E28]. **Leading indicator 3 · HCC capture on MA panel** — encounter-level HCC code capture rate at pilot sites; target: 1.5 point lift at month 3, 3-point lift at month 6, closing toward cohort-median 62% from Meridian baseline 58% [E28][E44].

**Trailing indicator 1 · MBI-HSS emotional exhaustion subscale** — administered month 3 and month 6 at the 18 pilot sites with matched pre-pilot baseline from the 2026-01-12 wave [E2]. Target: 4-7 point reduction on emotional-exhaustion elevated-band share by month 6. **Trailing indicator 2 · note-template drift** — monthly 200-note audit per vendor (600 notes total system-wide, isolating the pilot 18 sites); target: template-selection error rate at pilot sites drops from 23% to 9-12% by month 6, a deeper drop than the 11-14% system-wide target because the pilot-scope consolidation eliminates cross-vendor template ambiguity [E11][E44]. All five indicators feed the month-3 interim readout and the month-6 go/scale/kill decision.

## Readout cadence

The readout cadence is **biweekly operational, monthly steering, and two named decision checkpoints**. **Biweekly operational readout** — every other Tuesday at the pilot operational council; chaired by Theo J. with the four medical-group clinician leads, Dr. Morales attending, and the Abridge vendor-council representative attending at alternate cadence. Agenda: leading-indicator trajectory vs. target, clinician-voice escalations, workflow-blocker log, kill-switch threshold check. **Monthly steering readout** — second Thursday of each month, inside the Phase 4 four-principal steering forum (Sarah Chen, Dr. Larsson, Priya Raman, Dr. Morales); the pilot readout is a named agenda block with pre-populated dashboards and a 10-minute decision window for any escalation the operational council could not resolve. **Named decision checkpoints** — month 3 interim readout (2026-09-15) and month 6 go/scale/kill readout (2026-12-15). Both checkpoints have a pre-ratified decision matrix that the steering forum operates against; no checkpoint decisions are improvised. The readout discipline borrows directly from the D06 workstream-coordination pattern and the H11 CMIO/CMO/CIO alignment triad [E11 alignment; E20][E44].

## Success criteria + kill-switch

The month-3 interim readout applies a **three-criterion gate** where all three must be met for the pilot to continue unchanged. **Criterion 1 · pajama-time trajectory** — pilot-site pajama time trending at or below the 9-minute-reduction target by month 3 (tolerance: 7 minutes). **Criterion 2 · no clinician-voice escalation** — no formal escalation from any of the four medical-group clinician councils alleging workflow regression, template quality regression, or consolidation-related friction that the operational council could not resolve within 10 business days [E21][E23][E45]. **Criterion 3 · CDI-queue signal** — CDI-queue routing from the pilot sites at ≥80/week/100 clinicians by month 3 (tolerance: 70/week) [E25][E44]. A miss on any one criterion triggers the operational council to surface a **kill-switch decision option** at the next monthly steering; the forum then decides between (a) continue unchanged with mitigation, (b) extend the interim window by 30 days with mitigation, or (c) activate the kill-switch [E45].

The kill-switch protocol is **pause with ratified re-instatement**, not cancel. If activated, the pilot pauses new-clinician onboarding, DAX Copilot and Suki are re-instated at the 18 sites on a 30-day rolling schedule, and a pilot-retrospective readout is scheduled within 45 days to feed the D17 Phase 5 rationalisation packet with Meridian-specific negative-evidence. Pattern-library precedent: pilots with named pause-not-cancel kill-switches contribute materially to downstream decisions even when they fail, because the failure mode is instrumented [E7][E45]. The kill-switch is owned at the steering level (Sarah Chen + Dr. Larsson joint authority), with Dr. Morales holding a tie-break vote if the two sponsors disagree — mirroring the Phase 3 governance pattern [E16][E45].

## Scale-out triggers

The **month-6 go/scale/kill decision** operates against four scale-out triggers, of which three must be met for the pilot to scale from 18 sites to a Phase 5 primary-care-consolidation commitment. **Trigger 1 · pajama-time outcome** — 18-minute median reduction achieved or exceeded at month 6, with the distribution showing reduction across at least 3 of the 4 medical groups (not concentrated in one outlier group). **Trigger 2 · integration lift captured** — CDI-queue routing at ≥140/week/100 clinicians by month 6, HCC capture up ≥2.5 points, both within 15% of the pilot-site target. **Trigger 3 · clinician-voice signal** — net-positive clinician survey signal at the month-6 MBI-HSS wave, with emotional-exhaustion reduction at the pilot sites exceeding the system-wide emotional-exhaustion trend by ≥3 percentage points (this is the consolidation-specific lift signal) [E29]. **Trigger 4 · operational readiness** — Abridge vendor-council capacity to absorb a 2,400-clinician scale-out without template-governance regression, ratified at the vendor-council monthly cadence. If three of four triggers meet, the pilot feeds directly into the 2027-Q3 Phase 5 rationalisation ratification workshop with a "scale to Option A" recommendation [E54]. If fewer than three, the pilot feeds the ratification workshop with a "three-vendor preserved" or "Option C hybrid" recommendation, depending on which triggers missed.

## Decision log

- **2026-04-02** · Sarah Chen (CIO) + Dr. Larsson (CMO) · **Pilot scope ratified · 18 sites · 6 months · Abridge-anchored primary-care consolidation.** Rationale: single-service-line scope isolates consolidation-specific outcome component without committing the $4.2M envelope to a full consolidation path [E42].
- **2026-04-08** · Dr. Larsson (CMO) · **Cohort definition approved · 4 medical groups · urban/suburban spread.** Pulled from `_timeline.json` Phase 3 entry. Rationale: cohort spans pajama-time distribution band covering 65% of primary-care clinician population; clinician-council readiness verified in 3 of 4 groups [E43].
- **2026-04-14** · Sarah Chen + Dr. Larsson + Priya Raman · **Pilot entered D17 decision memo as structured counterfactual to Phase 5 rationalisation.** Rationale: pilot produces Meridian-specific consolidation evidence the 2027-Q3 ratification workshop needs [E55].

## Risks and mitigations

- **[High]** **Clinician-voice backlash at consolidation sites could leak to non-pilot primary-care sites and damage system-wide ambient adoption.** If pilot-site clinicians escalate negative transition experience through informal medical-staff channels, non-pilot clinicians may lose confidence in the broader program. Mitigation: clinician-council engagement plan ratified by Dr. Larsson 2026-04-08; biweekly operational readout with escalation pathway; pilot-site communications reviewed by Dr. Larsson before publication to medical staff [E4][E21].
- **[High]** **Abridge capacity to absorb 120-clinician cut-over may lag.** Abridge's stated readiness for a 120-clinician Meridian cut-over is conditional on two weeks parallel-capture training and three-week post-cut-over intensive support. If Abridge de-prioritises Meridian against other flagship deployments, cut-over slips and month-3 interim readout loses evidence integrity. Mitigation: Abridge vendor-council commitment ratified 2026-04-10; escalation pathway to Abridge account leadership via Sarah Chen standing relationship [E12].
- **[Medium]** **Integration-specific lift on non-pilot sites may mask consolidation-specific lift at pilot sites.** If WS-A and WS-B deliver strong integration lift across all 220 sites, the pilot's consolidation-specific signal at 18 sites may appear within noise of the system-wide trend. Mitigation: month-3 and month-6 readouts compute pilot-vs-control delta using pilot-matched non-pilot cohort as control; Nexus Maestro analytics team owns the counterfactual calculation [E32][E44].

## Cross-links

- Pattern · `ambient-clinical-value-chain`
- Program · MRD-01 Ambient Clinical Value Chain Activation
- Prerequisite · D10 Benchmark Comparison · D11 Hypothesis Backlog · D15 Intervention Portfolio
- Downstream · D17 Decision Memo · D18 Risk Register · D20 Sprint Milestone Artifacts · D24 Outcome Measurement Plan
- Evidence base · `_evidence-base.json` (E1, E2, E4, E6, E7, E8, E11, E12, E16, E17, E18, E20, E21, E23, E25, E28, E29, E30, E31, E32, E42, E43, E44, E45, E54, E55)

---

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
