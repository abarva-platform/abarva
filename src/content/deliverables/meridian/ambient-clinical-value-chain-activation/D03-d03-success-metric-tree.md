---
deliverableCode: D03
deliverableSlug: d03-success-metric-tree
title: Success Metric Tree · Meridian Ambient Clinical Value Chain
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 1 › D03

## Executive summary

The MRD-01 success metric tree anchors on a **single clinician-facing north-star metric** — **after-hours Epic time ("pajama time") in minutes per clinician per day** — measured against a 2025 Q4 Epic Signal baseline frozen on 2026-01-07 [E1][E8]. The choice is deliberate: every party on the steering committee can read the metric, clinicians believe it, and it moves on a rhythm (weekly) fast enough for committee steering [E4]. Four supporting metrics decompose the north-star into value-chain stages: **note sign-to-close turnaround**, **HCC capture rate on MA panel**, **CDI query resolution cycle time**, and **quality-measure documentation capture rate** [E8]. The **MBI-HSS burnout index** is held as a quarterly trailing indicator — it reveals outcome on a slower rhythm than the program needs to steer on [E2]. Tiered success (22 / 34 / 48 minute reductions) corresponds to the **$8-14M/yr steady-state value-at-stake** in the business case [E9].

## Key facts

- **Phase:** 1 · Intake & Framing
- **Owner:** Dr. Morales · CMIO + Kevin B. · Director, Epic Signal Analytics (metric methodology)
- **Date approved:** 2026-01-20
- **Value at stake:** $8-14M/yr steady-state · tied to pajama-time reduction of 22-48 min/clinician/day

## North-star metric

**Clinician after-hours Epic time (pajama time) in minutes per clinician per day.** Calculated from Epic Signal logs as documentation activity (note authoring, note-closing, order-entry tied to encounters) occurring outside the clinician's scheduled work window, aggregated across all active clinicians and medianed by specialty for committee reporting. The baseline is frozen at 2026-01-07; no subsequent restatement of the 2025 Q4 baseline is permitted without an explicit charter amendment.

Tiered success definition [E8]:

- **Threshold (22 min/clinician/day reduction):** median across all specialties · matches the top third of published ambient-deployment outcomes in the Genome cohort [E7]. Validates that the program reached peer-median outcomes.
- **Target (34 min/clinician/day reduction):** specialty-benchmark median convergence visible in primary care and hospital medicine. Primary committee commitment.
- **Stretch (48 min/clinician/day reduction):** full value-chain activation with clinician cognitive-load recovery felt system-wide. Excluded from business case baseline for conservatism; permitted as upside narrative.

The primary metric is measured weekly starting Phase 4. Measurement is owned by Kevin B.'s team using Epic Signal's canonical documentation-activity ledger; Nexus orchestrator agent computes a parallel measurement against the AbarVa evidence stream (note timestamps from vendor logs, CDI queue state, ambulatory-visit volume correlates) and reconciles at the dual-ledger check in D24 Outcome Measurement Plan (Phase 4).

**Why pajama time and not MBI-HSS?** Dr. Larsson was explicit [E4]: "pajama time is the number I can take to my medical staff and they believe it." MBI-HSS is methodologically stronger but runs quarterly, is survey-based, and does not move on a rhythm suitable for committee steering. MBI-HSS is retained as a quarterly **trailing** validator — if pajama time moves down but MBI-HSS does not improve over three quarters, the program has succeeded on the dashboard but not in the clinic, and the Phase 4 measurement plan re-opens.

## Value-chain supporting metrics

Supporting metrics decompose the north-star by value-chain stage. Each has its own baseline and target.

- **Note sign-to-close turnaround (median hours).** Baseline: 11.4 hours across all specialties; target: ≤6 hours by Phase 4 mid. Rationale: sign-to-close is the fastest-cycling signal of ambient note quality — if ambient notes require heavy editing, turnaround stays slow and the pajama-time improvement will not land.
- **HCC capture rate on MA panel (% of opportunities captured per encounter).** Baseline: 58% against coder-audited denominator; target: ≥72% by Phase 4 close. Rationale: primary financial mechanism on the MA book [E5]. Cohort median post-ambient integration is 4-7 points of lift; Meridian's current gap allows 14 points of headroom [E10].
- **CDI query resolution cycle time (median hours from query open to resolution).** Baseline: 38 hours against Maria H.'s CDI queue; target: ≤18 hours by Phase 4 mid. Rationale: the CDI feedback loop is currently cold [E15]; activation will surge query volume before it settles. Cycle-time is the capacity metric.
- **Quality-measure documentation capture rate (% of HEDIS / Stars-relevant elements captured in structured form from ambient notes).** Baseline: 34% of measured opportunities; target: ≥55% by Phase 4 close. Rationale: Rohan P.'s team owns the quality-measure outcome; this metric is the ambient-side lever into it.

Each supporting metric has a weekly measurement cadence starting Phase 4 and a dashboard owner named in D24 Outcome Measurement Plan.

## Leading indicators

Leading indicators are the committee's early-warning system for the value chain. Five are tracked:

- **Ambient note acceptance rate (target: ≥92% by Phase 4 mid, across all three vendors).** If clinicians are discarding ambient notes, nothing downstream works.
- **CDI query volume routed from ambient notes (target: ≥40 queries/week baseline moving to 180+/week by Phase 4 close).** Measures whether the CDI feedback loop is actually activating [E15].
- **HCC code-suggestion enable rate (target: 100% at Phase 4 close, across Abridge primary-care population initially).** Binary: is the Abridge HCC code-suggestion feature turned on? As of charter approval it is not [E12].
- **DRG-specificity feedback enable rate (target: 100% at Phase 4 close, across DAX Copilot specialty population).** Binary: is DAX Copilot routing DRG-specificity cues to CDI? As of charter approval it is not [E13].
- **Specialty-benchmark gap (target: close to ≤15 min/clinician/day above benchmark by Phase 4 mid).** Measures whether the 47% of Meridian physicians currently above specialty-benchmark median is shrinking [E1].

Threshold breaches on any two leading indicators simultaneously trigger a steering-committee review.

## Trailing indicators

- **MBI-HSS burnout index (quarterly survey).** Baseline: 54% in elevated emotional-exhaustion band [E2]. Target at Phase 5 attestation: ≤42%. Trailing confirmation that the pajama-time reduction translated to clinician-experienced improvement, not dashboard illusion.
- **Clinician retention rate (attending and APP annualized).** Baseline: 88%. Target: ≥91% by Phase 5 attestation. Direct economic confirmation.
- **Ambulatory visit capacity (visits/clinician/week, primary care).** Baseline: 84. Target: ≥89 by Phase 5 attestation [E19]. Direct patient-access confirmation.
- **HCC RAF score trend (trailing four quarters).** Validates that HCC capture rate improvements translated to risk-adjusted revenue. Dual-ledger reconciled with Meridian Finance.

## Thresholds for gate advancement

Gate advancement uses a **composite threshold**, not a single-metric gate.

- **Phase 1 → 2 gate (2026-02-03):** Charter approved (D01) · Stakeholder map ratified (D02) · Success metric tree approved (D03) · Intake synthesis complete (D04). No quantitative thresholds — framing gate.
- **Phase 2 → 3 gate (2026-03-10):** Documentation-time baseline validated (D06) · HCC / DRG opportunity quantified (D08) · ≥7 of 11 hypotheses resolved (D11). Evidence threshold: primary root causes at "high" confidence in the evidence base.
- **Phase 3 → 4 gate (2026-04-21):** Decision memo approved (D17) · Business case baseline-locked (D16) · Intervention portfolio selected (D15) · Vendor-consolidation decision held or deferred explicitly. Financial threshold: projected value-at-stake ≥ $8M/yr floor [E9].
- **Phase 4 → 5 gate (2026-05-26):** ≥2 of 5 leading indicators tracking at target · HCC code-suggestion enable rate = 100% for Abridge primary care · DRG-specificity feedback enable rate = 100% for DAX Copilot specialty · Change management package live · Outcome measurement plan locked.
- **Phase 5 attestation (2027 Q1):** Primary metric ≥ 22 min/clinician/day reduction (threshold tier) · MBI-HSS improvement ≥ 6 points in elevated band · Dual-ledger reconciliation complete.

Gate advancement is not automatic when thresholds are met. The steering committee retains override authority to hold a gate if newly-surfaced evidence suggests the underlying value chain is fragile.

## Measurement architecture

Measurement is dual-ledger by design. Kevin B.'s Epic Signal Analytics team owns the canonical documentation-time ledger. Nexus orchestrator agent maintains a parallel evidence stream that aggregates vendor-log timestamps, CDI queue state, HCC code-suggestion acceptance rates, and quality-measure capture events. Reconciliation occurs every two weeks during Phase 4 and every week during Phase 5.

Dual-ledger architecture exists to prevent two failure modes observed in pattern-comparable programs [E7]: the **attribution dispute** (AbarVa claims clinician-time improvement; Meridian analytics attributes the lift to Epic updates, seasonal factors, or staffing changes) and the **baseline drift** (Epic Signal definitions shift mid-program and baseline integrity erodes). Freezing the baseline at 2026-01-07 and committing to dual-ledger reconciliation locks the measurement frame against both.

## Decision log

- **2026-01-07** — **Baseline frozen.** 2025 Q4 Epic Signal documentation-time baseline locked at charter approval; no subsequent restatement without charter amendment.
- **2026-01-09** — **North-star selected.** Dr. Larsson endorsed pajama time as the primary leading metric over MBI-HSS; MBI-HSS retained as quarterly trailing validator [E4].
- **2026-01-20** — **Success metric framework approved.** Primary metric (tiered 22/34/48 min), four supporting metrics, five leading indicators, four trailing indicators ratified [E8]; dual-ledger architecture accepted.

## Risk callouts

- **Leading indicator over-reliance (tier: Medium).** If the committee over-weights early leading-indicator green signals, it may advance Phase 4 too quickly and hit the pajama-time reveal unprepared. **Mitigation:** composite gate thresholds; explicit committee override authority to hold gates even when numeric thresholds pass.
- **Epic Signal baseline contamination (tier: Medium).** Epic Signal documentation-activity definitions occasionally change with Epic updates; this can shift the baseline mid-program. **Mitigation:** baseline methodology in D06 pins specific activity categories; Epic upgrade path monitored; any definitional change triggers a charter amendment and steering review.
- **Specialty aggregation masking (tier: Low).** System-wide median can move favorably while a specialty cohort stagnates. **Mitigation:** specialty decomposition [E17] reported alongside the system median at every steering meeting.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Stakeholder Map (D02):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d02-d02-stakeholder-map`
- **Documentation-Time Baseline (D06):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d06-d06-documentation-time-baseline`
- **Business Case (D16):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d16-d16-business-case`
- **Outcome Measurement (D24):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d24-d24-outcome-measurement-plan`
- **Evidence anchors:** E1, E2, E4, E7, E8, E9, E10, E12, E13, E15, E17, E19 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
