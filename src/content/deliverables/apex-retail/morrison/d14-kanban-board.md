---
deliverableCode: D14
deliverableSlug: d14-kanban-board
title: Kanban Board · Morrison Owned Brand Margin Recovery
phase: 3
tier: rich
author: Claude Opus 4.7 · Agent C3
timestamp: 2026-04-23
program: APX-01 · Morrison Owned Brand Margin Recovery
tenant: Apex Retail Group
pattern: owned-brand-margin-recovery
sponsor: Marcus T. · CFO
coSponsor: Katherine P. · CMO
---

Apex Retail Group › Programs › Morrison Owned Brand Margin Recovery › Phase 3 › D14

## Executive summary

The Morrison kanban board is the **operating surface** for the three Phase 3-designed workstreams (WS1 Supplier, WS2 Assortment, WS3 Promo) during Phase 4 build-and-deliver. It is explicitly designed **not** to be a generic task tracker — the columns are calibrated to the Morrison cadence (14-day sprints aligned to biweekly sponsor governance), the cycle-time targets are tied to the D12 gate calendar, and the escalation protocol routes blockages to Marcus T. when they cross a 5-day SLA [E43]. The board was standing-drafted in Phase 3 so that Phase 4 can open (2026-05-06) with a populated backlog rather than a blank surface. Current board state — as of the 2026-04-22 snapshot — is **eight cards in backlog**, **three in ready-for-sprint-1**, and **zero in flight**; execution starts on G1 [E43]. The **definition of done per phase** is the single source of discipline: every card has to satisfy an explicit exit criterion before it moves, and the exit criteria are graded against the D12 gate calendar [E44].

## Key facts

- **Three swim lanes** · WS1 Supplier · WS2 Assortment · WS3 Promo · plus a cross-cutting Governance lane [E43]
- **Five columns** · Backlog · Ready · In-flight · Review · Done
- **14-day sprint cadence** · aligned to biweekly sponsor governance forum [E43]
- **Cycle-time target** · Ready → Done ≤ 21 days for standard cards · ≤ 35 days for contract/redraft cards [E44]
- **Escalation SLA** · any card in In-flight >5 days without movement auto-raises to Marcus T. [E43]

## Operating cadence

The operating cadence is the rhythm the kanban board enforces. **Daily** · workstream leads update their own cards; no formal stand-up, but a 15-minute async check-in via the program's shared backlog note by 09:00. **Weekly** · Tuesday 30-minute workstream lead sync to surface any card that has been In-flight >3 days; this is the leading-indicator mechanism for the 5-day escalation SLA [E43]. **Biweekly** · Thursday 60-minute governance forum with Marcus T., Katherine P., Diane R., and the three workstream leads; board review is the first 20 minutes, followed by gate-prep and cross-workstream dependencies. **Monthly** · first Friday, a 90-minute board retrospective with Maestro-surfaced cycle time and blockage analytics — this is where cycle-time targets are re-baselined if systemic drift is detected. The cadence is deliberately tight because Phase 4 execution compresses three parallel workstreams through a nine-month window; looser cadences in pattern-library precedents correlated with G2-level gate slippage [E43].

## Current board state

As of the 2026-04-22 snapshot — the board's state at Phase 3 close — the layout reads as follows. **WS1 Supplier · Backlog (3)**: supplier negotiation dossier draft; Tier-2 supplier activation list for 3 categories; dual-sourcing assessment for 4 critical SKUs. **WS1 · Ready (1)**: supplier contract redraft kickoff (scheduled for sprint 1). **WS2 Assortment · Backlog (3)**: SKU tier inventory (hero / support / tail) across 8 categories; long-tail cut target calibration per store tier; pack-size consolidation shortlist (12 SKUs). **WS2 · Ready (1)**: assortment Wave 1 category selection (4 of 8). **WS3 Promo · Backlog (2)**: T+14 → T+7 reporting rebuild scope; margin-gated calendar logic specification. **WS3 · Ready (1)**: competitive price monitoring vendor shortlist. **Governance · Backlog (1)**: standing instruction for the gross-margin governance forum (H12 ratification). Eleven cards total at Phase 3 close [E43]. No cards are In-flight because Phase 4 has not yet opened; G1 (2026-05-06) moves the three Ready cards to In-flight on day one.

## Cycle time targets

Cycle-time targets are the discipline mechanism. **Standard cards** — most backlog items — target **Ready → Done ≤ 21 days**. **Contract / redraft cards** — any card touching supplier legal, pack-size specification lock, or calendar logic sign-off — target **≤ 35 days** because legal review adds deterministic latency [E44]. **Governance cards** — standing instructions, RACI amendments — target **≤ 14 days** because they are prerequisite to downstream card movement. Any card that exceeds its cycle-time target by 50% is flagged in the Thursday governance forum and assigned an explicit unblock owner; historical pattern-library data shows cards that drift >50% past target have a 3.5× higher probability of becoming true blockers by the next gate [E44]. Cycle-time metrics are surfaced in the governance forum monthly dashboard, not weekly, because weekly noise on small samples (11 cards scaling to 30-40 at Phase 4 peak) generates false signals.

## Escalation + blockage protocol

The escalation protocol is two-tier. **Tier 1 · workstream lead** — any blockage identified in the 09:00 check-in triggers an attempt-to-unblock within the day; most blockages resolve here (pattern-library base rate: 68% of blockages) [E44]. **Tier 2 · governance forum + Marcus T.** — a card that has been In-flight >5 calendar days without net progress auto-surfaces at the next Thursday forum with Marcus flagged as decision owner; Marcus's standing commitment (captured in D17) is 48-hour turnaround on any card surfaced this way [E43]. The protocol deliberately does not have a Tier 3 — the escalation ladder ends at the CFO. Katherine P.'s involvement is scoped to brand-equity decisions inside WS2 Assortment, not as a general escalation path; her engagement is scheduled against specific cards (assortment cut depth decisions, brand-signal reviews) rather than open-ended. The protocol has one exception carved out: any card involving a supplier relationship change is automatically routed to Diane R. regardless of Tier level, because the supplier-relationship surface is operationally fragile and benefits from a consistent voice [E43].

## Definition of done per phase

Definition of done varies by column. **Ready → In-flight** requires: card has a named execution owner, a cycle-time commitment, and a linked gate criterion from D12. Cards without a linked gate criterion go back to Backlog and are rescoped [E44]. **In-flight → Review** requires: the card's execution artifact (contract draft, SKU list, calendar logic doc, etc.) is attached to the card and the workstream lead has done a 15-minute walkthrough with the next downstream card's owner. **Review → Done** requires: either a sponsor sign-off (Marcus for supplier cards, Katherine for brand-equity cards, Diane for cross-workstream operational cards) or an explicit "no sign-off needed" annotation from the workstream lead with rationale. The three-column movement discipline is stricter than most programs run because the cross-workstream dependencies in the parallel track make silent slippage expensive — a card that sits in Review unresolved blocks the downstream card and the parallel workstream simultaneously [E44].

## Dashboard feeds

The board feeds three dashboards. **Dashboard 1 · Workstream Health** — per-workstream cycle-time, blockage rate, and gate-criterion progress; consumed by the workstream leads daily and the governance forum weekly. **Dashboard 2 · Portfolio Health** — cross-workstream dependency status, critical-path card identification, and Phase 4 gate countdown; consumed by the governance forum biweekly. **Dashboard 3 · Sponsor Attestation Feed** — card-level decision log entries flowing into D24 outcome measurement plan; consumed by Marcus T. monthly for Phase 5 attestation readiness [E43]. All three dashboards are Maestro-surfaced; workstream leads do not maintain them manually. The design principle is that the board is the source of truth — dashboards are read-only derivations — and any metric that cannot be derived from the board by Maestro is explicitly scoped out.

## Decision log

- **2026-04-02** · Nexus Maestro · **Kanban shape locked · three workstream lanes + governance lane · five columns.** Pulled from `_timeline.json` Phase 3 roadmap entry. Rationale: swim lanes map one-to-one to D12 workstreams so the board is structurally inseparable from the execution plan.
- **2026-04-15** · Marcus T. (CFO) · **5-day in-flight escalation SLA ratified as standing commitment.** Captured in D17 decision memo. Rationale: CFO as terminal escalation node because the workstream leads already coordinate laterally through Diane R.; adding a middle tier would dilute accountability.
- **2026-04-22** · Nexus Maestro · **Board state snapshot captured at Phase 3 close · 11 cards loaded.** Pulled from `_timeline.json` Phase 3 risk-register entry. Rationale: G1 2026-05-06 opens with a populated board; Phase 4 sprint 1 does not burn day-one effort on backlog loading.

## Risks and mitigations

- **[Medium]** **Cycle-time targets assume pattern-library base rates that may not apply to Apex's operating cadence.** The 21-day and 35-day targets are calibrated on three pattern-library programs with similar envelopes; Apex's legal cycle may be longer [E44]. Mitigation: first monthly retrospective re-baselines targets if systemic drift exceeds 20%; no gate criterion depends on meeting the first-sprint target.
- **[Medium]** **Governance forum biweekly cadence may under-serve the parallel execution load.** If any two of the three workstreams hit blockage in the same sprint, the next Thursday forum may not surface the issue in time for the 5-day SLA. Mitigation: Tuesday workstream lead sync is the leading indicator; workstream leads have standing authority to call an emergency sponsor call without waiting for Thursday [E43].
- **[Low]** **Dashboard 3 sponsor attestation feed depends on reliable card-level decision-log capture.** If leads update cards but skip the decision-log annotation, the feed degrades. Mitigation: Maestro flags any Done-column card missing a decision-log entry; pattern-library compliance is ~92% with this check vs. ~70% without.

## Cross-links

- Pattern · `owned-brand-margin-recovery`
- Program · APX-01 Morrison Owned Brand Margin Recovery
- Prerequisite · D12 Roadmap · D15 Intervention Portfolio
- Downstream · D19 Delivery Plan RACI · D20 Sprint Milestone Artifacts · D24 Outcome Measurement Plan
- Evidence base · `_evidence-base.json` (E43, E44)

---

> Composite organization built from real-world data. Sponsor-validated before production use.

> This document is a demo rendering, not a deliverable for a real engagement.
