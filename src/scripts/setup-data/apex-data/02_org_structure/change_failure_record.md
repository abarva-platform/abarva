# Apex Retail — Change Failure Record

**Tenant key:** `apex-retail`
**Last updated:** 2026-04-08
**Owner:** Daniel Okeke (Director, IT PMO)
**Data classification:** Internal — Confidential when discussing individuals

This document captures major IT and transformation initiatives that failed, were paused indefinitely, or significantly underperformed in the last 5 years. Maintained as institutional memory. Source documents (post-mortems, status updates, board materials) referenced; full versions in PMO archive.

---

## 1. AMS Consolidation (Original, 2023-2024) — PAUSED

**Initiative ID:** AMS-2023
**Sponsor:** Carlos Rivera (CIO)
**Investment Committee approval:** March 2023
**Paused:** July 2024
**Total spent at pause:** $9.2M (against $14M approved)
**Outcome status:** Paused; vendor relationships unwound; no capability delivered

### What was attempted

Consolidation of application managed services across 47 applications in the merchandising, store operations, and supply chain portfolios into a single managed-services partner. Stated goal: $4.2M annual run-rate savings + improved service levels. Selected vendor: Wipro (after BAFO with Wipro, Infosys, TCS).

### What went wrong

From the post-mortem (October 2024) authored by Carlos Rivera and Daniel Okeke:

1. **Scope expansion during implementation.** Initial scope was 47 apps; by month 6 had expanded to 62 apps as additional teams "wanted in" without IC approval. No structural mechanism to prevent scope creep once the program was running.
2. **Transition risk underestimated.** The transition design assumed knowledge transfer would take 90 days; in practice it took 9-14 months for the most complex applications. Service quality degraded materially during transition.
3. **CFO commitment evolved.** During the transition, CFO at the time (Patricia Holloway, retired 2023, no relation to Marcus) shifted to demanding faster savings realization. This pressured the team to expand scope to hit savings targets.
4. **Architecture review was skipped.** The 2023 program predates the current strict architecture review discipline. Several technical incompatibilities surfaced during transition that should have been caught in design.
5. **The vendor was set up to fail.** BAFO pressure had pushed Wipro to a price point that didn't support the actual transition cost. Wipro began aggressively scoping changes as out-of-scope; relationship deteriorated.

### Root causes (named in post-mortem)

1. Lack of in-flight scope discipline (no kill criterion, no scope freeze)
2. Transition risk planning was theoretical, not informed by application-by-application discovery
3. Vendor-management capability was insufficient for the program's complexity
4. Architecture review was a one-time gate, not an ongoing discipline

### Lessons applied since

1. Architecture Review Board now meets weekly, reviews every program in P2 and P3, has ongoing rather than gate-only authority. (Linda Mwangi promoted to VP EA, expanded mandate.)
2. IT PMO rebuilt under Daniel Okeke with explicit stage-gate discipline. No program proceeds past P3 without ARB attestation.
3. Transition risk in any AMS-class program now requires per-application discovery in P1, not assumed in P2.
4. BAFO discipline now formalized — explicit floor pricing, exit-assistance terms in every contract.
5. Carlos Rivera personally absorbed accountability publicly; this strengthened his credibility for the 2026 reattempt.

### What the current 2026 attempt does differently

The current AMS Consolidation 2026 program (`apex-ams-consolidation-2026`) is structured to address every named root cause:

- **Smaller initial scope:** 22 applications in two portfolio segments (merchandising + supply chain only). Store operations excluded for now.
- **Per-application discovery in P1:** completed Q1 FY2026.
- **Vendor BAFO discipline:** lower-bound floor pricing; exit-assistance terms specified in advance.
- **Architecture review embedded throughout, not gate-only.**
- **Daniel Okeke (PMO) and Diana Lopez (VP App Services) co-leading.** Carlos Rivera oversees but is not directly running.

### Lingering effects

- COO David Okonjo carries strong memory of the 2023 failure and is publicly skeptical of large-scale IT consolidation programs. He has not formally blocked the 2026 attempt but his support is conditional on visible discipline.
- IT vendor management (Nathan Kohl) is more aggressive on contract terms than industry norms because of the 2023 experience.
- IT spending posture remains conservative; Investment Committee is slower to approve large programs than in the pre-2023 era.

---

## 2. Customer Data Lake Initiative (2022) — DELIVERED BUT MISSED OBJECTIVES

**Initiative ID:** CDL-2022
**Sponsor:** Marcus Holloway (former CDO)
**Investment Committee approval:** January 2022
**Closed:** December 2023
**Total spent:** $6.4M (against $5.8M approved — 10% overrun)
**Outcome status:** Capability delivered; outcomes underperformed targets

### What was attempted

Build of a customer data lake on AWS S3 + Snowflake to consolidate customer data from 12 source systems for analytics use. Stated goal: reduce time-to-insight for customer analytics from "weeks" to "days" and enable a planned future CDP activation initiative.

### What was delivered

The data lake exists. It contains data from 11 of 12 planned sources (one source — the legacy in-store CRM — was deferred indefinitely due to extraction complexity). Time-to-insight for new customer analytics queries is roughly 5-7 days vs. 14-21 days previously.

### What underperformed

1. **Identity resolution accuracy was lower than promised.** Original target: 87% match rate across sources. Delivered: 71%. The gap is largely attributable to the deferred legacy CRM source and to lower-than-expected match quality on email-only customers.
2. **Activation never happened.** The data lake was supposed to enable a CDP activation initiative in 2024. That initiative was deprioritized due to budget constraints. Result: the data lake supports analytics but not real-time customer activation.
3. **Marketing's expected use never materialized.** The CMO's team continued to use Klaviyo's native segmentation rather than the data lake, because Klaviyo workflow integration was easier than data-lake-to-Klaviyo synchronization.
4. **Operating cost was higher than projected.** Snowflake and S3 costs ran $890K higher in year 1 than the business case projected, due to higher query volumes from analytics teams.

### Root causes (from PMO retrospective, March 2024)

1. The business case conflated "data foundation" with "business value" — the data lake was a foundation but didn't itself produce value without an activation layer.
2. Marketing was a stakeholder but not a true sponsor; their adoption of the new capability was assumed, not verified.
3. Identity resolution was treated as a technical problem; the source-system data quality issues that limited match rate were not adequately discovered in P1.

### Lessons applied since

1. Programs that depend on downstream activation are now required to design and budget the activation in the same business case, not as a follow-on.
2. CDP Activation 2026 explicitly does not stop at "data unified" — the success criteria require activation in three channels.
3. Stakeholder-vs-sponsor distinction now formalized in P0 origination process.

### Connection to current programs

- The CDP Activation 2026 program is built on top of the data lake delivered by CDL-2022. It is essentially the activation layer that was always supposed to exist.
- Lynne Stratham (current CDO) has been candid that the 2022 data lake delivered foundational capability but missed the activation target; she's framed the 2026 CDP work as completing the unfinished work, not as a new initiative.

---

## 3. AI-Powered Personalization Pilot (2024) — KILLED

**Initiative ID:** PERS-2024
**Sponsor:** Jennifer Park (CMO)
**Approved:** April 2024
**Killed:** September 2024
**Total spent:** $1.1M (against $2.4M approved)
**Outcome status:** Killed at first gate review; capability not deployed

### What was attempted

Pilot of an AI-powered product recommendation engine for the Apex e-commerce site, intended to replace the existing rules-based recommendation logic. Vendor: Algolia AI (later acquired by another vendor in 2025).

### What was killed and why

Killed at the gate review between pilot and production rollout. Three specific issues surfaced:

1. **Lift was not measurable against the existing baseline.** The pilot ran A/B tests but the variance was within statistical noise. The vendor's claimed 18-32% lift could not be reproduced on Apex's traffic.
2. **Personalization was illegible to merchants.** Angela Foster's merchandising team objected to the fact that the AI was making product-presentation choices that merchants couldn't explain or override. This was a culture/governance issue, not a technical issue.
3. **Vendor lock-in concerns surfaced at architecture review.** Switching cost would have been high; alternatives were not fully evaluated.

### Root causes (from gate review documentation)

1. Baseline measurement was not rigorous enough to detect the pilot's actual lift.
2. The merchandising stakeholder was a "consulted" party on the original RACI; should have been a sponsor or co-sponsor given that they would own the operational change.
3. The architecture review was scheduled for after the pilot rather than before, which left no path to course-correct.

### Lessons applied since

1. The principle that AI use cases touching curation/taste/merchandising require merchandising co-sponsorship is now explicit in the AI Governance Council's review criteria.
2. Architecture review for AI initiatives is required before pilot, not after.
3. Baseline measurement quality is now a hard P1 DoD item for any AI initiative.

### Connection to current programs

- The AI Governance Council was established in September 2025 partly in response to the lessons from PERS-2024 and from the broader pattern of AI vendor demos that didn't survive scrutiny.
- Angela Foster's involvement in the apex-forecast-2026 program is non-negotiable from her perspective; she will not allow another AI initiative to make merchandising-adjacent decisions without her co-sponsorship.

---

## 4. Store Labor Optimization Pilot (2024) — UNDERPERFORMED, CONTINUED AT REDUCED SCOPE

**Initiative ID:** LABOR-2024
**Sponsor:** David Okonjo (then EVP Stores, now COO)
**Approved:** February 2024
**Status:** Continued at reduced scope; original objectives not met

### What was attempted

ML-based store labor scheduling optimization to reduce labor cost and improve sales-per-labor-hour. Vendor: Reflexis (now owned by Zebra).

### What underperformed

The system delivered roughly 60% of the projected labor cost savings (vs. 100% target). Two reasons:

1. **Scheduling rigidity hit cultural resistance.** Store managers resented losing flexibility in scheduling decisions. Adoption was uneven; ~30% of stores opted out of the AI-recommended schedules.
2. **Forecast inputs were weak.** The labor optimizer depended on accurate sales forecasts at the store-day-hour level. Apex's forecast accuracy at that grain was insufficient; the optimizer was making decisions on bad inputs.

### Lessons applied since

1. Demand forecasting accuracy is now a recognized prerequisite for any optimization use case downstream. apex-forecast-2026 is partly motivated by the recognition that several downstream initiatives (labor, inventory, marketing) all depend on better forecasts.
2. Cultural change management is now a first-class P3 design consideration, not a P5 afterthought.

### Current state

- The labor optimizer is still in use, at reduced scope (~70% of stores; managers can override).
- Savings continuing at ~60% of original target.
- Not a planned program for 2026; will be revisited after demand forecasting improvements land.

---

## Patterns observed across the failure record

A pattern that the IT PMO has explicitly named:

> *"Apex's failures are not failures of capability. They are failures of foundation, alignment, and governance discipline. The technology has worked. The data has been the bottleneck. The political alignment has been the multiplier."*

Specifically:

1. **Data foundation has been the recurring root cause.** CDL-2022, LABOR-2024, and PERS-2024 all had data quality or measurement gaps that limited outcomes. apex-cdp-2026, apex-forecast-2026, and apex-cc-ai-2026 all have explicit data-readiness gates in P1 because of this pattern.
2. **Stakeholder-vs-sponsor distinction has been the second pattern.** Multiple programs assumed adoption from operating teams that had been consulted but not committed. The current Programs module's P0 sponsor-1:1 discipline is partly a response to this.
3. **Scope freeze has been the third pattern.** AMS-2023 in particular failed on uncontrolled scope expansion. The current programs all have explicit scope-boundary statements and kill criteria in P2.

These patterns are now reflected in the platform's failure-mode catalog and in the AI Governance Council's review criteria.

---

**Document metadata:**

- Source basis: `tenant_authored` (extracted from PMO archive)
- Confidence: 0.92
- Last reviewed by: Daniel Okeke
- Last reviewed at: 2026-04-08
- Next review: 2026-10-08 (annual)
- Source documents available in PMO archive: post-mortems, gate review materials, IC submissions, retrospective decks
