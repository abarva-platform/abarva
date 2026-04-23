---
deliverableCode: D24
deliverableSlug: d24-outcome-measurement-plan
title: Outcome Measurement Plan · Morrison Owned Brand Margin Recovery
phase: 4
tier: rich
author: Claude Opus 4.7 · Agent C4
timestamp: 2026-04-23
program: APX-01 · Morrison Owned Brand Margin Recovery
tenant: Apex Retail Group
pattern: owned-brand-margin-recovery
sponsor: Marcus T. · CFO
coSponsor: Katherine P. · CMO
---

Apex Retail Group › Programs › Morrison Owned Brand Margin Recovery › Phase 4 › D24

## Executive summary

The outcome measurement plan is Morrison's attestation contract with Apex Retail Group. It specifies how the three-lever intervention is measured, how the primary metric (owned-brand gross-margin recovery in bps vs. the D07 baseline) is attested, how supporting metrics cascade, how the dual-ledger reconciliation works, and the Phase 5 publishing cadence. The plan was locked by Marcus T. and Nexus Maestro on **2026-05-27** with agreement that every attestation runs through dual-ledger reconciliation before any external figure leaves the program [E74][E76][E77]. The primary metric is attested **monthly at T+7** against the Apex Finance closing ledger (tightened from T+14 via the WS3 reporting stand-up); supporting metrics cadence on the same rhythm. The framework anchors exclusively to the D03 success metric tree — no parallel scoring, no constructs introduced during execution [E74][E8].

## Key facts

- **Primary metric** · owned-brand gross-margin recovery (bps) vs. D07 baseline · attested monthly at T+7 [E74][E75]
- **Dual-ledger reconciliation** · Nexus telemetry + Apex Finance closing ledger · 3 bp target reconciliation band [E76]
- **Attestation publication** · monthly to sponsor pair · quarterly to Apex exec team · annually to board [E78]
- **Anchor to D03** · no parallel scoring · no metric construct introduced after D03 lock [E74]
- **Plan lock** · Marcus T. (CFO) + Nexus Maestro · 2026-05-27 [E77]

## Measurement framework anchored to D03

The framework does not re-invent the success metric tree. D03 established on 2026-01-18 the primary metric (owned-brand gross-margin recovery in bps vs. FY24) and the supporting set (unit cost bps, promotional depth bps, SKU-per-LF count, inventory turns) [E8]. D24 specifies **how those metrics are computed, reconciled, and attested** — it does not add, re-weight, or introduce alternative constructs. Metric proliferation during execution is a known failure pattern where programs silently migrate toward easier-to-move numbers; the D03 anchor makes migration detectable [E74].

Each metric has a D24 computation specification: source ledger, SKU/category filter, time window, owner. Primary: Apex Finance closing ledger, owned-brand flag, 24-month rolling vs. fixed FY24 baseline. Unit cost: same ledger, supplier-consolidation adjustment isolates the renegotiation effect. Promotional depth: pricing ledger at event level. SKU-per-LF: merchandising master-data with month-end planogram snapshot. Inventory turns: supply-chain ledger. Specifications are signed by the Finance BP before attestation; mid-flight changes require a ratified decision log entry [E74][E75].

## Primary metric attestation methodology

The primary metric is attested **monthly at T+7**, where T is calendar month-end. Three-step process: **(1)** Nexus pulls Morrison telemetry at T+5 and computes primary + supporting; **(2)** Apex Finance closes the category ledger at T+6 or T+7 via the WS3 stand-up; **(3)** the two figures reconcile against the 3 bp band. Inside the band: Nexus attests primary, Apex Finance attests reconciled. Outside: the protocol (below) triggers before any attestation publishes [E75][E76].

Phase 4 is explicitly not attested. The first primary attestation applies to the June 2026 close (published mid-July). Attesting 30 days of build-out as margin recovery would attest setup as outcome [E75]. Phase 4 reports build-activity completion (training, velocity, gate closure) — reported, not attested.

The metric is attested in bps, not dollars. Dollars drift with revenue mix and sector effects; bps recovery against FY24 is the clean construct [E8][E74].

## Supporting metric cadence

Supporting metrics attest monthly with one exception: promotional depth attests **weekly for the first six months of Phase 5**, reverting to monthly thereafter [E79]. Once T+7 close is in place, the pricing team can close weekly on the margin-gated calendar without additional data engineering. The tight loop prevents depth creep from re-establishing [E79]. If depth creep surfaces, the cadence extends until the trigger resolves.

Supporting metrics are tiered. Unit cost, promotional depth, and SKU-per-LF are **primary-supporting** and attest via dual-ledger because they decompose the primary metric. Inventory turns is **secondary-supporting** and attests on Apex Finance alone because it correlates rather than decomposes. The tiering prevents reconciliation overhead from expanding to metrics that do not require it [E79].

## Dual-ledger reconciliation protocol

Dual-ledger is the single most consequential commitment in D24. Apex Finance owns the closing ledger; Nexus owns the Morrison telemetry ledger. The two will differ in non-material bps from timing, classification, and rounding — expected, not a defect [E76]. The **3 bp reconciliation band** was calibrated against D07's baseline reconciliation (the 3 bp band Apex Finance signed off on 2026-02-04 [E21]).

The out-of-band protocol has four steps. **(1)** Identify the gap by category (usually concentrated in 1-2 categories). **(2)** Classify cause (timing, classification, or methodological). **(3)** Remediate per classification: timing re-runs on aligned dates, classification proposes a mapping update, methodological escalates to Marcus T. **(4)** Re-reconcile; inside the band, attest with a decision log entry; still outside, defer one cycle with sponsor-pair note [E76]. Expected deferral frequency: 1-2 per 24-month program per pattern library [E9].

No external figure leaves the program outside the attested set. "Attested" means dual-ledger passed or a Marcus T. authorised exception was documented. This is the confidence source for board-level and external-disclosure defensibility [E76][E77].

## Attestation timeline + sign-off

The attestation calendar runs from **July 2026 (first Phase 5 close)** through the 14-month program window. Each monthly attestation is signed by Marcus T. and countersigned by the WS3 Finance BP. Katherine P. signs supporting-metric attestations with brand-visible content (primarily promotional depth). Quarterly publications to the Apex exec team are Nexus-authored and reviewed in 30-minute sessions; the annual publication to the board is a dedicated agenda item with Marcus T. presenting and Nexus Maestro in support [E77][E78].

The sign-off protocol is designed so that the CFO's signature is **the attestation**, not a rubber stamp. The Finance BP is the operational author; Marcus T. is the accountable signatory. If they disagree on a month, the deferred-attestation path triggers rather than a signature being compelled — defensibility over velocity [E77].

## Publishing cadence post-go-live

Attested numbers publish on three cadences. **Monthly:** sponsor pair + workstream co-owners + Apex Finance partners (~12 recipients). **Quarterly:** Apex exec team (~25 recipients). **Annually:** Apex board agenda item [E78]. No attested number appears externally without CFO sign-off on external use; D24 authorises the numbers that are available, not external publication [E77].

Every monthly publication carries a **delta report**: the month's attested metrics plus cumulative attested vs. the D16 projection. The delta report tracks Morrison to the $14-22M/yr steady-state range [E30]. One month below the $14M floor triggers a sponsor-pair conversation; two consecutive months triggers a portfolio-level review (structured conversation, not automatic descoping). Trigger thresholds are ratified in the 2026-05-27 decision log entry [E77].

## Decision log

- **2026-05-20** · Nexus Maestro · **Framework anchored exclusively to D03.** Metric proliferation is a known failure pattern; the D03 anchor makes silent migration detectable.
- **2026-05-27** · Marcus T. + Nexus Maestro · **Plan locked · dual-ledger with 3 bp reconciliation band.** Band calibrated against D07 baseline reconciliation [E21].
- **2026-05-27** · Marcus T. (CFO) · **Phase 4 is not attested; first attestation is the June 2026 close.** Attesting 30 days of build-out as outcome would be a governance failure.
- **2026-05-27** · Marcus T. + Katherine P. · **Promotional depth attests weekly for the first six months of Phase 5.** The T+7 stand-up enables the tight cadence without new work; the weekly loop prevents depth creep from re-establishing in the ramp window.

## Risks and mitigations

- **[High]** **First-cycle reconciliation opens outside the 3 bp band (July 2026 close).** First cycles often surface classification or timing gaps the baseline did not anticipate. Mitigation: pre-Phase-5 dry-run reconciliation scheduled 2026-06-15 using the May closing ledger, Finance BP and Nexus delivery lead pairing; gaps resolve before first live attestation.
- **[Medium]** **Weekly promotional cadence strains WS3 data engineering bandwidth.** Mitigation: reporting contractor engagement extends through the first six Phase 5 months; Apex data-engineering shadow owner takes over at month 7.
- **[Medium]** **Delta report triggers force portfolio review during ramp.** Ramp months are volatile; false positives are possible. Mitigation: trigger protocol distinguishes "ramp-variability" from "program-performance" explanations; the review is structured conversation, not automatic descoping.

## Cross-links

- Pattern · `owned-brand-margin-recovery`
- Program · APX-01 Morrison Owned Brand Margin Recovery
- Prerequisite · D03 Success Metric Tree · D07 Financial Baseline · D16 Business Case · D19 Delivery Plan · D20 Sprint Artifacts · D22 Change Management
- Downstream · Phase 5 attestation cadence (continuation program)
- Evidence base · `_evidence-base.json` (E8, E9, E21, E30, E74, E75, E76, E77, E78, E79)

---

> Apex Retail Group is a composite organization built from real-world data.

> This document is a demo rendering, not a deliverable for a real engagement.
