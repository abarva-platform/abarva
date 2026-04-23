---
deliverableCode: D03
deliverableSlug: d03-success-metric-tree
title: Success Metric Tree · Morrison Owned Brand Margin Recovery
phase: 1
tier: rich
author: Claude Opus 4.7 · Agent C1
timestamp: 2026-04-23
program: APX-01 · Morrison Owned Brand Margin Recovery
tenant: Apex Retail Group
pattern: owned-brand-margin-recovery
sponsor: Marcus T. · CFO
coSponsor: Katherine P. · CMO
---

**Breadcrumb:** Apex Retail Group › Programs › Morrison Owned Brand Margin Recovery › Phase 1 › D03

## Executive summary

The Morrison success metric tree anchors on a **single north-star metric** — owned-brand gross margin recovery measured in basis points against the FY24 baseline — and decomposes it into four supporting metrics (unit cost, promotional depth, SKU-per-linear-foot, inventory turns) and six leading indicators that give committee visibility into whether the primary metric is trending correctly [E8]. Thresholds for gate advancement are defined on the **leading indicators** because gross margin is a lagging reveal; relying only on the north-star metric would mean discovering success or failure after the intervention window closes. Tiered success (180/240/340 bps) corresponds to the $14-22M/yr steady-state impact range in the business case [E9].

## Key facts

- **Phase:** 1 · Intake & Framing
- **Owner:** Jon D. · VP Finance, Merchandising (metric methodology owner)
- **Date approved:** 2026-01-18
- **Value at stake:** $14-22M/yr steady-state impact · tied to recovery of 180-240+ bps against FY24 baseline

## North-star metric

**Owned-brand gross margin recovery (bps vs. FY24 baseline).** The metric is calculated as the difference between trailing-twelve-month owned-brand gross margin and the FY24 full-year owned-brand gross margin, aggregated across all eight priority categories weighted by FY25 revenue. The baseline is frozen at 2026-01-14; no subsequent restatement of the FY24 numbers is permitted without an explicit charter amendment.

Tiered success definition [E8]:

- **Threshold (180 bps):** matches cohort median [E2]. Validates that the program reached peer-median outcomes.
- **Target (240 bps):** exceeds cohort median and approaches top-quartile trajectory. Primary committee commitment.
- **Stretch (340 bps):** full recovery to FY24 baseline. Excluded from business case baseline assumptions for conservatism; permitted as upside narrative.

The primary metric is measured monthly internally and reported at each phase gate. Measurement cadence moves to weekly in Phase 5 once attestation windows open. The primary metric is computed by Jon D.'s team using Apex Finance's canonical margin ledger; Nexus orchestrator agent computes a parallel measurement against the AbarVa evidence stream and reconciles at the dual-ledger check in D24 Outcome Measurement Plan.

## Leading indicators

Leading indicators are the committee's early-warning system. Six are tracked:

- **Supplier cost index (target: -4 to -7% against FY25 baseline by Phase 4 mid).** Unit-cost movement is the fastest-cycling signal; supplier renegotiations book within 30-60 days of contract execution.
- **SKU-per-linear-foot ratio (target: -18 to -22% against FY25 baseline by Phase 4 close).** Assortment rationalization shows up in this metric within four weeks of planogram rollout.
- **Average promotional depth (target: -4 to -6 percentage points against FY25 baseline by Phase 4 mid).** Promotional discipline cycles to the metric fast — within 2-3 promotional windows.
- **Long-tail SKU revenue contribution (target: <6% of owned-brand revenue by Phase 4 close, from 12% at FY25 close).** Tests whether rationalization is preserving velocity in the remaining assortment.
- **Supplier concentration (target: top-3 ≤ 55% of owned-brand COGS by Phase 5 open, from 62% at FY25 close).** Tests whether diversification is proceeding without re-aggregating into a new concentration.
- **Markdown rate, long-tail SKUs (target: -6 to -9 percentage points against FY25 baseline).** Validates that markdown pressure on the tail is dropping as the tail shrinks.

Each leading indicator has a weekly measurement cadence starting Phase 4 and a dashboard owner named in D24 Outcome Measurement Plan. Threshold breaches on any two indicators simultaneously trigger a steering-committee review.

## Trailing indicators

Trailing indicators confirm what the leading indicators foreshadow. Four are tracked:

- **Gross margin, owned-brand, trailing twelve months (bps).** The primary north-star metric itself, read as a trailing indicator because it publishes with a one-month accounting lag.
- **Inventory turns, owned-brand (turns/yr; target: +12 to +18% against FY25 baseline).** Confirms that assortment rationalization is converting to faster-cycling inventory.
- **Markdown capital absorbed, owned-brand ($M/yr; target: -$8 to -$12M against FY25 baseline).** Confirms that long-tail markdown compression is real, not just a mix shift.
- **Consumer-perception index, owned-brand (quarterly survey; target: flat ±1 point against FY25 baseline).** Katherine's brand-equity guardrail. If this metric degrades beyond the ±1 point band, the program has succeeded on margin at an unacceptable cost to brand, and Katherine's veto authority becomes active.

The trailing indicators anchor the Phase 5 attestation. Dual-ledger reconciliation is the control: Apex Finance's ledger and the AbarVa evidence stream must agree within defined tolerance before any outcome is attested as delivered.

## Thresholds for gate advancement

Gate advancement uses a **composite threshold**, not a single-metric gate. This is deliberate — a single-metric gate would bias the program toward whatever metric is easiest to move, not the metric most diagnostic of underlying health.

- **Phase 1 → 2 gate (2026-02-10):** Charter approved (D01) · Success metric tree approved (D03) · Intake synthesis complete (D04) · Stakeholder map ratified (D02). No quantitative thresholds — this is the framing gate.
- **Phase 2 → 3 gate (2026-03-15):** RCA validated (D09) · Benchmark cohort accepted (D10) · ≥9 of 14 hypotheses resolved (D11). Evidence-confidence threshold: at least two root causes at "high" confidence in the evidence base.
- **Phase 3 → 4 gate (2026-04-30):** Decision memo approved (D17) · Business case baseline-locked (D16) · Intervention portfolio selected (D15). Financial threshold: business case projected impact ≥ $14M/yr floor [E9].
- **Phase 4 → 5 gate (2026-05-30):** ≥2 of 6 leading indicators tracking at target · RACI ratified (D19) · Change-management package live (D22) · Outcome measurement plan locked (D24). Operational threshold: supplier renegotiation wave 1 executed; assortment rationalization wave 1 executed; promotional depth policy active in at least 3 categories.
- **Phase 5 attestation (2027 Q1):** Primary metric ≥ 180 bps recovery against FY24 baseline (threshold tier) · Consumer-perception index within ±1 point band · Dual-ledger reconciliation complete.

Gate advancement is not automatic when thresholds are met. The committee retains override authority to hold a gate if newly-surfaced evidence suggests the underlying pattern is fragile, even if the numeric thresholds show green. The override is a governance primitive, not a measurement problem.

## Measurement architecture

Measurement is dual-ledger by design. Apex Finance owns the canonical margin ledger and publishes monthly closes on the corporate calendar. Nexus orchestrator agent maintains a parallel evidence stream that aggregates supplier contract executions, planogram rollout timestamps, promotional depth adjustments, and consumer perception survey waves. Reconciliation between the two ledgers occurs every two weeks during Phase 4 and every week during Phase 5.

The dual-ledger architecture exists to prevent two failure modes observed in pattern-comparable programs: the **attribution dispute** (AbarVa claims lift; client finance attributes the lift elsewhere) and the **accounting drift** (underlying definitions shift mid-program and baseline integrity erodes). Freezing the baseline at 2026-01-14 and committing to dual-ledger reconciliation locks the measurement frame against both failure modes.

## Decision log

- **2026-01-14** — **Baseline frozen.** FY24 owned-brand gross margin baseline locked at charter approval; no subsequent restatement without charter amendment.
- **2026-01-16** — **Brand-equity guardrail added.** Katherine P. required the consumer-perception index as a trailing indicator with veto authority when the ±1 point band is breached [E4].
- **2026-01-18** — **Success metric framework approved.** Primary metric (340 bps tiered) and four supporting metrics ratified [E8]; dual-ledger architecture accepted.

## Risk callouts

- **Leading indicator over-reliance (tier: Medium).** If the committee over-weights early leading-indicator green signals, it may advance gates too quickly and hit the primary-metric reveal unprepared. **Mitigation:** composite gate thresholds (not single-metric), with explicit committee override authority to hold gates even when numeric thresholds pass.
- **Baseline drift (tier: Medium).** Apex Finance occasionally restates historical numbers when accounting standards change. If FY24 is restated mid-program, the entire metric tree shifts under the program. **Mitigation:** charter-locked baseline with explicit no-restatement clause; any restatement triggers a charter amendment and committee review.
- **Dual-ledger divergence (tier: Low).** AbarVa and Apex Finance ledgers could drift apart if upstream data definitions diverge. **Mitigation:** reconciliation cadence with escalation if divergence exceeds 20 bps at any month-close during Phase 4 or Phase 5.

## Cross-links

- **Source pattern (tenant):** /tenant/apex-retail/intelligence/patterns/owned-brand-margin-recovery
- **Source pattern (global):** /intelligence/patterns/owned-brand-margin-recovery
- **Program page:** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery
- **Charter (D01):** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d01-d01-program-charter
- **Stakeholder Map (D02):** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d02-d02-stakeholder-map
- **Financial Baseline (D07):** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d07-d07-current-state-financial-baseline
- **Business Case (D16):** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d16-d16-business-case
- **Outcome Measurement (D24):** /tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d24-d24-outcome-measurement-plan
- **Evidence anchors:** E1, E2, E4, E8, E9 in `_evidence-base.json`

> Composite reference tenant built from real-world patterns. Sponsor-validated before production use.
