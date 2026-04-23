---
deliverableCode: D01
deliverableSlug: d01-program-charter
title: Program Charter · Meridian Ambient Clinical Value Chain
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 1 › D01

## Executive summary

Meridian Health System has deployed three ambient AI scribe vendors in parallel — **Abridge** in primary care, **Microsoft DAX Copilot** across specialty, and **Suki** in outpatient procedural — without a connecting value chain into CDI, HCC capture, quality measure documentation, or care-gap closure [E3][E7]. The MRD-01 charter redirects the program from a vendor-rationalization exercise to **value-chain activation**: connecting ambient listening to the downstream documentation economy on which Meridian's MA-heavy payer mix depends [E18]. Sponsor **Sarah Chen (CIO)** has authorized a **$4.2M capital envelope** against a projected **$8-14M/yr steady-state value-at-stake** with a **12-18 month payback horizon** [E9]. **Dr. Larsson (CMO)** joins as co-sponsor to anchor the program on a clinician north-star — after-hours Epic time ("pajama time") and the MBI-HSS burnout index — so that documentation-economy recovery does not come at the cost of further cognitive load [E4]. This charter locks scope, success definition, governance, and phase gates for a 12-week Phase 1-3 cadence.

## Key facts

- **Phase:** 1 · Intake & Framing (2026-01-07 → 2026-02-03)
- **Owner:** Sarah Chen · CIO (sponsor) · Dr. Larsson · CMO (co-sponsor)
- **Date approved:** 2026-01-07
- **Value at stake:** $4.2M capital ask · $8-14M/yr projected steady-state value-at-stake [E9]

## Why this program exists

Meridian operates at **$7.8B in annualized revenue** across **14 hospitals** and **220 ambulatory sites**, with **55% of revenue carried on Medicare Advantage and commercial risk-based contracts** [E18]. In a payer mix that heavy on risk, documentation quality is not an accounting artifact — it is a direct revenue and margin mechanism. HCC capture underpins MA revenue adjustment; DRG specificity underpins inpatient case-mix; quality-measure documentation underpins Stars ratings and ACO shared savings.

Between 2024 Q1 and 2025 Q4 Meridian deployed three ambient AI scribe vendors to address clinician burnout: **Abridge** as the primary-care ambient scribe, **Microsoft DAX Copilot** for specialty (cardiology, orthopedics, GI, and others), and **Suki** for outpatient procedural and urgent-care settings [E3][E12][E13][E14]. Each deployment cleared its narrow success criterion — clinician adoption, note turnaround time, subjective satisfaction. None of the three vendors has been connected into CDI, HCC capture, DRG specificity, or quality measure documentation.

The charter's central observation, surfaced in the 2026-01-06 sponsor working session [E16], is that Meridian has the scribe capability without the value chain. Epic Signal shows **47% of Meridian physicians above specialty-benchmark median for after-hours documentation time** across **18 months of data** [E1]. The **CDI team** of 42 specialists has received almost no increase in query volume routed from ambient notes [E15]. The **MBI-HSS burnout survey** completed 2026-01-12 shows **54% of clinicians in the elevated emotional-exhaustion band** [E2]. Ambient listening is installed; the documentation economy it should be powering is not.

The trigger for program activation was the **FY26 operating plan review** delivered to Meridian's finance committee on 2026-01-05, which flagged a projected **$3.2-5.1M/yr uncaptured HCC risk-adjustment on the MA book** and a **$1.8-2.6M/yr CMI drift from DRG downgrades** [E5]. Sarah Chen moved within 48 hours to commission a structured activation program. The choice to frame the work as a **pattern-matched program** against the Transformation Genome `ambient-clinical-value-chain` pattern rather than as an ad-hoc vendor-rationalization push was deliberate [E7]: the pattern explicitly distinguishes "vendor sprawl" anti-patterns from "value-chain gap" patterns, and Meridian's presentation matches the latter.

## Scope in / scope out

**In scope for Phase 1-3:**
- Ambient-to-CDI integration across all three incumbent vendors
- Ambient-to-HCC-capture feedback loop on the MA and commercial-risk population
- Ambient-to-DRG-specificity feedback loop on inpatient encounters
- Quality-measure documentation capture (HEDIS, CMS Stars) from ambient-generated content
- Clinician cognitive-load protection protocols tied to documentation time
- Governance unification across the three vendor councils (single Meridian-side steering)
- CDI team operating-model evolution under ambient augmentation

**Out of scope (Phase 1-3):**
- Vendor consolidation decisions (deferred to Phase 4 with an explicit decision gate in D17)
- Net-new ambient vendor pilots or RFPs
- Care-management platform integration beyond documentation-surface capture (addressed in successor program MRD-04)
- Prior-authorization automation (owned by program MRD-02)
- Revenue cycle AI tool rationalization more broadly (owned by program MRD-04)
- Population-health analytics modernization (adjacent pattern, separate program)

The in/out boundary was ratified on **2026-01-07** at the charter working session [E16]. The single most consequential scope call of Phase 1 was the decision to **preserve the three-vendor operating envelope through Phase 3** and defer the consolidation question to a formal Phase 4 decision gate. Dr. Morales (CMIO) dissented in the working session, arguing for earlier consolidation [E6]; his position is preserved in the decision log and re-examined at the D17 decision memo.

## Success definition

The primary success metric is **clinician after-hours Epic time ("pajama time") in minutes per clinician per day**, measured against a 2025 Q4 Epic Signal baseline frozen on 2026-01-07 [E8]. The charter adopts a **tiered success definition**:

- **Threshold success:** reduce pajama time by **22 minutes/clinician/day** (median) within 12 months of Phase 4 kickoff
- **Target success:** reduce pajama time by **34 minutes/clinician/day** (median) within 12 months — the level at which specialty-benchmark median convergence is visible
- **Stretch success:** reduce pajama time by **48 minutes/clinician/day** (median) within 18 months

Supporting metrics — note sign-to-close turnaround, HCC capture rate on MA panel, CDI query resolution cycle time, quality-measure documentation capture rate — are tracked in D03 Success Metric Tree [E8]. The MBI-HSS burnout index is held as a **trailing quarterly indicator**, not a gate metric: it reveals outcomes on a slower rhythm than the program needs to steer on [E2].

Financial coherence: the **$8-14M/yr steady-state value-at-stake** range in the capital envelope decomposes into **$3-5M/yr cognitive-load recovery** (retention and recruitment arbitrage, locum avoidance, visit-volume recovery) and **$5-9M/yr documentation-economy recovery** (HCC recapture $3.2-5.1M/yr, DRG specificity $1.8-2.6M/yr, quality-measure performance $0.5-1.3M/yr) [E9]. The stretch tier is excluded from the business case baseline to preserve conservatism in finance-committee messaging.

## Governance

Governance operates on a **weekly working committee** and a **biweekly steering committee** ratified in the D02 Stakeholder Map approval on 2026-01-14:

- **Steering committee** — Sarah Chen (chair), Dr. Larsson, Priya Raman, Dr. Morales; biweekly Thursdays; 60 minutes; decision artifacts and phase-gate reviews.
- **Working committee** — CDI director, Epic-Signal analytics lead, clinical informatics leads from the three vendor councils, revenue-cycle analytics lead; weekly Tuesdays; 90 minutes; operational dispatch and evidence triage.
- **Nexus orchestrator agent** — maintains program artifact state, surfaces contradictions between vendor-council positions and Meridian-internal positions, tracks decision log, prepares committee packets.
- **Escalation path** — any blocker unresolved > 5 business days at working level escalates to Sarah; > 10 days escalates to Meridian's CEO and medical-staff executive committee.

Decision authority is partitioned: **Sarah** holds capital and scope authority; **Dr. Larsson** holds clinician-facing and medical-staff-communication veto authority; **Priya** holds revenue-cycle operating-model authority; **Dr. Morales** holds clinical-informatics technical-architecture authority. The four-principal structure is specific to MRD-01 — the program's most consequential decisions cut across CIO, CMO, revenue-cycle, and CMIO domains, and a single-sponsor structure would invite downstream deadlock.

## Phase gates

MRD-01 advances through five gates:

- **Phase 1 → 2 (target: 2026-02-03):** Charter approved · success metrics locked · intake synthesis complete · stakeholder map ratified.
- **Phase 2 → 3 (target: 2026-03-10):** Documentation-time baseline validated · HCC / DRG opportunity quantified · pain-point register ranked · ≥7 of 11 hypotheses resolved.
- **Phase 3 → 4 (target: 2026-04-21):** Decision memo approved · intervention portfolio selected · business case baseline-locked · vendor-consolidation question explicitly held for Phase 4 gate.
- **Phase 4 → 5 (target: 2026-05-26):** Delivery plan ratified · change management active · outcome measurement plan locked · CDI operating-model change plan signed.
- **Phase 5 attestation (target: 2027 Q1):** Primary metric ≥ threshold tier · dual-ledger reconciliation between AbarVa projections and Meridian Finance.

Each gate carries a steering-committee vote and a signed artifact. The Phase 3 → 4 gate is the single highest-stakes gate in the program: it is where the vendor-consolidation decision is revisited with Phase 2 evidence in hand, and where Dr. Morales's dissent [E6] is either resolved or formally carried forward as a Phase 4 open question.

## Decision log

- **2026-01-07** — **Program charter approved · value-chain framing ratified.** Sarah Chen authorized scope lock to value-chain activation; vendor consolidation deferred to Phase 4 gate [E16].
- **2026-01-09** — **Co-sponsor confirmation.** Dr. Larsson committed clinician cognitive load as the north-star frame and endorsed pajama time as the primary leading metric [E4].
- **2026-01-14** — **Revenue-cycle dependencies ratified.** Priya Raman confirmed HCC capture and DRG specificity as primary Phase 2 diagnostic threads [E5].
- **2026-01-20** — **Success metric tree approved.** Pajama time set as north-star · four supporting metrics ratified · MBI-HSS retained as quarterly trailing indicator [E8].

## Risk callouts

- **Vendor-council politics (tier: High).** Three vendor councils exist; each will advocate for its primary surface. Without unified Meridian-side governance the program decisions will drift toward whichever council's last meeting was loudest. **Mitigation:** single steering committee holds all vendor-facing decisions; vendor councils attend as invited participants, not voting members; Dr. Morales chairs vendor-council coordination under the steering umbrella.
- **CMIO dissent on consolidation timing (tier: Medium).** Dr. Morales argued for earlier vendor consolidation in the charter session [E6]. If Phase 2 evidence reinforces his position and the program continues to hold the three-vendor envelope, CMIO alignment drifts. **Mitigation:** explicit Phase 3 → 4 decision gate re-examines the question with Phase 2 evidence; Dr. Morales's position is preserved in writing rather than suppressed.
- **Documentation-time baseline contamination (tier: Medium).** Epic Signal data includes non-documentation activity (order entry, in-basket, results review). If the baseline is not cleanly scoped, the primary metric will move for reasons unrelated to ambient. **Mitigation:** baseline methodology in D06 scoped to documentation activity specifically; note sign-to-close as secondary confirmation metric; dual-ledger reconciliation at Phase 5.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Stakeholder Map (D02):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d02-d02-stakeholder-map`
- **Success Metric Tree (D03):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d03-d03-success-metric-tree`
- **Intake Synthesis (D04):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d04-d04-intake-synthesis`
- **Evidence anchors:** E1, E2, E3, E4, E7, E8, E9, E16, E18 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
