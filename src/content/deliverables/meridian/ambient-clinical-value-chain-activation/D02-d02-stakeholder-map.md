---
deliverableCode: D02
deliverableSlug: d02-stakeholder-map
title: Stakeholder Map · Meridian Ambient Clinical Value Chain
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

**Breadcrumb:** Meridian Health System › Programs › Ambient Clinical Value Chain Activation › Phase 1 › D02

## Executive summary

The MRD-01 stakeholder map tiers every party with influence over or dependency on **ambient value-chain activation** across Meridian's 14 hospitals and 220 ambulatory sites. Unlike a typical margin program, this work spans four distinct executive domains — technology (CIO), medical staff (CMO), revenue cycle (VP RCM), and clinical informatics (CMIO) — so governance is built as a **four-principal partition** with explicit authority domains rather than a classical sponsor / co-sponsor dyad [E16]. Tier-2 influencers span CDI leadership, the three ambient vendor councils, revenue-cycle analytics, quality and population-health leadership, and chief ambulatory operations. Tier-3 affected populations include ~2,400 attending physicians and APPs, 42 CDI specialists, coding and HIM teams, and three ambulatory and inpatient quality committees. Governance runs on a **weekly working / biweekly steering** cadence. This map is the routing layer every subsequent deliverable references.

## Key facts

- **Phase:** 1 · Intake & Framing
- **Owner:** Dr. Morales · CMIO (stakeholder methodology owner)
- **Date approved:** 2026-01-14
- **Value at stake:** Governance integrity across 4 principals, 12 Tier-2 influencers, ~2,400 Tier-3 clinicians

## Sponsor and co-sponsor

**Sarah Chen · CIO (Primary sponsor).** Sarah holds capital authority, program-scope authority, and final sign-off on the business case. Her framing, captured in the intake synthesis [E3], is that Meridian has the scribe capability without the value chain: "the question is not which vendor survives, it's how any of them connect to CDI, HCC capture, and quality measure capture." Her decision tempo is fast — the charter approval completed 48 hours after the FY26 finance-committee flag. Attention cost is high; steering agendas must arrive 48 hours in advance, pre-reads under 8 pages.

**Dr. Larsson · CMO (Co-sponsor).** Dr. Larsson joined as co-sponsor on 2026-01-09 on the condition that clinician cognitive load be the north-star frame rather than revenue-cycle capture. Her framing [E4]: "if we only chase HCC capture uplift we are just moving documentation burden to a different accountant · pajama time is the number I can take to my medical staff and they believe it." She holds veto authority over any intervention that materially increases documentation burden on clinicians, even if the intervention uplifts HCC capture or DRG specificity. This creates the primary productive tension in the program — revenue-cycle optimization vs. cognitive-load protection — and is why the program is not structured as a revenue-cycle-led initiative despite most of the dollar value sitting in the documentation economy.

The pairing is deliberate. An ambient value-chain program with only a CIO sponsor would over-optimize on downstream capture and under-weight clinician experience. A program with only a CMO sponsor would protect clinicians without activating the documentation economy that funds the capital ask. Dual sponsorship with explicit authority domains is the governance answer to the underlying lever architecture.

## Decision authority

Decision authority is partitioned into four domains, ratified on 2026-01-14:

- **Capital and scope (Sarah).** Any decision that changes the $4.2M capital envelope, extends the program beyond the 14-month Phase 1-4 horizon, or alters the in/out scope boundary requires Sarah's sign-off. Includes business-case approval (D16) and decision-memo approval (D17).
- **Medical staff and clinician experience (Dr. Larsson).** Any intervention that changes clinician workflow, note-template structure, or documentation-time expectations requires Dr. Larsson's sign-off. Veto authority if an intervention increases documentation burden net of expected cognitive-load savings.
- **Revenue cycle operating model (Priya Raman · VP Revenue Cycle).** Any decision that changes CDI workflow, HCC capture operating model, DRG specificity workflow, or quality-measure documentation workflow requires Priya's sign-off.
- **Clinical informatics architecture (Dr. Morales · CMIO).** Any decision that changes Epic integration surface, ambient vendor integration architecture, or note-template governance requires Dr. Morales's sign-off. Holds the critical vendor-council-coordination responsibility.

This partitioning resolves the most common governance failure mode observed in comparable ambient-activation programs [E7]: the deadlock that occurs when a single-sponsor structure tries to absorb decisions that legitimately belong to four distinct domain owners.

## Influencers

Tier 2 — influencers with no formal vote but high-weight informal input. The twelve Tier-2 influencers:

- **Maria H. · Director, CDI.** Operates the 42-person CDI team. Her queue is where the ambient value chain either lands or fails to land [E15].
- **Kevin B. · Director, Epic Signal Analytics.** Owns the documentation-time baseline methodology, specialty decomposition, and Phase 4 / Phase 5 measurement.
- **Jenna T. · Director, Revenue Cycle Analytics.** HCC capture modeling, DRG specificity analytics, denial and downgrade trend monitoring.
- **Rohan P. · Director, Quality and Population Health.** HEDIS and CMS Stars documentation capture; ACO shared-savings performance.
- **Dr. Ayotunde A. · Chief Ambulatory Officer.** 220-site ambulatory operating model; capacity and patient-access framing [E19].
- **Dr. Sato · VP Medical Staff.** Medical-staff communication, specialty section chiefs, clinician change management.
- **Alex M. · Abridge vendor council lead (Meridian side).** Primary-care ambient deployment coordination [E12].
- **Sam K. · DAX Copilot vendor council lead (Meridian side).** Specialty ambient deployment coordination across cardiology, orthopedics, GI [E13].
- **Lia R. · Suki vendor council lead (Meridian side).** Outpatient and urgent-care ambient coordination [E14].
- **Theo J. · Director, Clinical Informatics Engineering.** Epic integration surface, ambient middleware, note-template governance.
- **Nadia S. · Director, Coding and HIM.** Coding operations, HCC queue workflow, DRG assignment.
- **Mark L. · Director, Transformation Office.** AbarVa-Meridian liaison; surfaces cross-program contradictions; PMO discipline.

Each Tier-2 influencer has a named counterpart in the working committee and a specific decision surface where their input is load-bearing. The map is a routing table that the Nexus orchestrator agent uses when dispatching evidence requests and decision prompts.

## Affected populations

Tier 3 — parties affected by program decisions but not formally consulted in decision sessions.

- **Attending physicians and APPs (~2,400).** The primary behavioral population the program is designed to help. Specialty decomposition [E17] shows primary-care physicians and hospital-medicine teams carry the heaviest pajama time and absorb the largest workflow change. Communication cadence via section chiefs; training cascades via Dr. Sato's team.
- **CDI specialists (~42).** CDI workflow evolves substantially under ambient integration. The 42 specialists will absorb new query patterns, new upstream inputs, and a new operating-model cadence as vendor feedback loops are commissioned. Change management plan in D22 scopes 20 training hours per specialist.
- **Coding and HIM teams (~90).** HCC queue workflow shifts once ambient feedback loops are commissioned. Nadia S.'s team absorbs change; workflow redesign under Priya's authority.
- **Quality committee chairs (~14 at hospital level, plus system committees).** Quality-measure documentation capture changes flow through hospital and system quality committees; Rohan P. coordinates.
- **Three vendor account teams (Abridge, Microsoft DAX Copilot, Suki).** Vendors are affected — their integration surface expands, their product roadmap commitments are tested. They attend steering by invitation.

Downstream populations — patients, care-management teams, payer-relations staff — receive communication via existing channels. A full role-impact matrix appears in D22 Change Management Package (Phase 4).

## Communication cadence

Five cadences run in parallel:

- **Steering committee · biweekly** — Sarah, Dr. Larsson, Priya, Dr. Morales; 60 minutes; decision artifacts and phase-gate reviews. Pre-read 48 hours ahead.
- **Working committee · weekly** — Maria H., Kevin B., Jenna T., Rohan P., Theo J., with Dr. Morales chairing; 90 minutes; operational dispatch and evidence triage. Minutes to steering the same day.
- **Vendor-council coordination · weekly** — Alex M., Sam K., Lia R., chaired by Dr. Morales; 60 minutes; integration roadmap alignment, contradiction surfacing between vendor commitments.
- **Tier-2 influencer briefing · monthly** — async written brief to all Tier-2 parties summarizing state of play, open decisions, and upcoming asks. Reduces committee bandwidth consumption by pushing context-setting into writing.
- **Medical-staff communications · monthly** — section-chief briefings, specialty-rounded clinician communications, pajama-time dashboards shared with clinicians under Dr. Sato's governance.

Cadence discipline is owned by Mark L. (Transformation Office) with Nexus orchestrator agent support. This is Meridian's first program with the orchestrator agent carrying formal PMO duties.

## Decision log

- **2026-01-07** — **Program charter approved · sponsor identified.** Sarah Chen formally named primary sponsor; stakeholder tiering work commissioned to Dr. Morales [E16].
- **2026-01-09** — **Co-sponsor added.** Dr. Larsson confirmed with explicit veto authority over interventions that materially increase clinician documentation burden [E4]; dual-sponsor structure ratified.
- **2026-01-14** — **Stakeholder tiering methodology ratified.** Four-principal authority partition accepted · weekly working / biweekly steering cadence set · vendor-council coordination structure introduced.

## Risk callouts

- **Dr. Larsson's veto exercised mid-diagnosis (tier: Medium).** If Phase 2 evidence supports interventions that temporarily increase documentation burden to unlock HCC capture, veto exercise could reset Phase 3 design timing. **Mitigation:** Maria H.'s CDI workflow pre-read runs in parallel during Phase 2; Dr. Larsson is briefed on intermediate CDI-query-volume and clinician-time projections at weekly one-on-ones with Dr. Morales, avoiding surprise at steering.
- **Vendor council saturation (tier: Medium).** Three vendor councils on weekly cadence plus a weekly working committee and biweekly steering is a heavy meeting load on Dr. Morales. **Mitigation:** vendor-council coordination is the only venue where vendor representatives attend synchronously; vendors receive async monthly briefs otherwise; Nexus orchestrator agent maintains vendor-council state between meetings.
- **CMIO dissent carrying into Phase 3 (tier: Medium).** Dr. Morales's preference for earlier vendor consolidation [E6] could produce friction at the Phase 3 → 4 gate if Phase 2 evidence supports his position. **Mitigation:** explicit decision gate re-examines consolidation question in D17 with Phase 2 evidence; Dr. Morales's position is written into the decision log and held open, not suppressed.

## Cross-links

- **Source pattern (tenant):** `/tenant/meridian-health/intelligence/patterns/ambient-clinical-value-chain`
- **Source pattern (global):** `/intelligence/patterns/ambient-clinical-value-chain`
- **Program page:** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation`
- **Charter (D01):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`
- **Success Metric Tree (D03):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d03-d03-success-metric-tree`
- **Intake Synthesis (D04):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d04-d04-intake-synthesis`
- **Decision Memo (D17):** `/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d17-d17-decision-memo`
- **Evidence anchors:** E3, E4, E6, E7, E12, E13, E14, E15, E16, E17, E19 in `_evidence-base.json`

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
