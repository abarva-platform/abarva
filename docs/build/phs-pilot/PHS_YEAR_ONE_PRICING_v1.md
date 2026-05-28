# Presbyterian Healthcare Services — AbarVa Year-1 Operating Partnership

**Pricing & Commercial Structure**

**Effective:** Year-1 contract (post-90-day-pilot conversion)
**Annual fee:** $750,000
**Contract length:** 12 months
**Auto-renewal:** Year-2 renews at $750,000 (reference discount tapers in Year-3)

---

## 1. Executive summary

PHS converts from the 90-day pilot into a **Year-1 Operating Partnership** at **$750,000 annual fee**. The headline number is fully bundled and predictable: it includes platform subscription, dedicated Azure infrastructure (capped), managed services running the platform 24×7, and a named Maestro Consultant allocated at 15% FTE to the PHS account.

Founder advisory time, principal architect engagement, premier launch support, and a $100,000 first-customer reference discount are explicitly contributed as **AbarVa partnership investment** at no additional charge — surfacing total stated value of approximately $929,500.

This document is the commercial backbone for the Year-1 contract. It mirrors the pilot's pricing structure at scale, so finance can plan around a single annual line.

---

## 2. What the $750,000 covers (deliverables PHS pays for)

| # | Component | Description | Stated Cost |
|---|---|---|---|
| 1 | **Platform Subscription** | Software access for up to 25 named PHS users; full Intelligence + Moves + Source modules; AI consumption up to fair-use envelope (200 model calls per named user per business day); Sentinel grounded answers; Atlas decision support; full audit trail; RLS tenant isolation; "no training on customer data" posture | $480,000 |
| 2 | **Infrastructure & Dedicated Tenant** | Dedicated Azure private tenant (HIPAA-eligible services only); pgvector + Postgres Flexible Server HA; Azure Front Door Premium WAF; Key Vault Premium with CMK; Defender for Cloud; Log Analytics with 7-year audit archive; pass-through at cost plus 15% admin uplift; **capped at $80,000/year** with overages absorbed by AbarVa | Up to $80,000 |
| 3 | **Managed Services / Platform Operations** | 24×7 platform monitoring; incident response (business-hour SLA, see Section 6); patching; upgrades; backup; DR drills; security operations; vulnerability scanning; access reviews; BAA compliance maintenance; CloudTrail / audit log monitoring; quarterly platform health reports | $110,000 |
| 4 | **Maestro Consultant — 15% FTE Allocation** | Named delivery consultant at T3 tier (Senior Engineer / Senior Consultant); approximately 312 hours/year (15% of 2,080 FTE hours); $250/hr standard rate. Covers: workflow configuration, new user onboarding, ongoing adoption coaching, content authoring support, quarterly business reviews, escalation point between PHS and AbarVa engineering | $78,000 |
| 5 | **Standard Customer Success + Support** | Named Customer Success Manager; business-hours support (8am–6pm MT); quarterly executive cadence; monthly health reports; ad-hoc Slack/email support; knowledge base access | Included |
| | **Year-1 Total Commercial** | | **$750,000** |

---

## 3. AbarVa Partnership Investment (stated, no charge)

Four investment lines that are real value delivered to PHS, contributed by AbarVa as part of becoming the launch healthcare reference customer:

| # | Investment Line | Tier | Allocation | Stated Value | Cost to PHS |
|---|---|---|---|---|---|
| A | **Founder / Executive Sponsor** | T1 — $475/hr standard rate | Up to 100 hours/year | $47,500 | **Investment** |
| B | **Principal Architect** | T2 — $325/hr standard rate | Up to 60 hours/year (major reviews, AI/security architecture checkpoints, ad-hoc senior engineering) | $19,500 | **Investment** |
| C | **First-Customer Reference Discount** | — | Year-1 list rate $850,000; PHS rate $750,000 | $100,000 | **Investment** |
| D | **Premier Support — Launch Period** | — | 24×7 support for first 90 days post-conversion; reverts to business-hours thereafter | $12,500 | **Investment** |
| | **Total Partnership Investment** | | | **~$179,500** | |

---

## 4. Total Year-1 picture

| Line | Stated Value | Cost to PHS |
|---|---|---|
| Platform subscription | $480,000 | $480,000 |
| Infrastructure (cost+15%, capped at $80K; overages absorbed) | Up to $80,000 | Up to $80,000 |
| Managed Services / Platform Operations | $110,000 | $110,000 |
| Maestro Consultant (15% FTE, T3) | $78,000 | $78,000 |
| Standard CSM + Support | — | Included |
| **Year-1 Commercial Subtotal** | | **$750,000** |
| — | | — |
| Founder / Executive Sponsor (100 hrs @ T1) | $47,500 | Investment |
| Principal Architect (60 hrs @ T2) | $19,500 | Investment |
| Reference-customer platform discount | $100,000 | Investment |
| Premier Support during 90-day launch period | $12,500 | Investment |
| **Total Partnership Investment** | **~$179,500** | |
| **Total Stated Value PHS Receives** | **~$929,500** | |
| **Total Year-1 Cost Ceiling** | | **$750,000** |

---

## 5. Fair-use envelope (AI consumption)

The platform fee includes AI model calls up to the following envelope:

- **200 model calls per named user per business day** (5 business days/week × 50 weeks/year)
- **Annualized envelope:** ~1,250,000 calls/year across 25 users
- **Above the envelope:** $0.10 per call, billed monthly with full transparency

**Typical CXO-tier user usage observed in pilot:** 30–90 calls/business-day. Power users (data analysts, transformation leads) may approach 150–180 calls/day. **Most customers stay comfortably within the envelope; overages are rare.**

Fair-use envelope is reviewed at the Year-1 renewal and may be adjusted based on actual utilization patterns.

---

## 6. Service Level Objectives — Year-1

Year-1 SLAs are more stringent than the pilot. Pilot ran on a "best-effort, business-day" posture; Year-1 commits to formal SLOs with service credits.

| Dimension | Year-1 Commitment | Service Credit (if missed) |
|---|---|---|
| **Platform availability** | 99.5% measured monthly (24×7 basis) | 5% monthly fee credit |
| **Incident response — P1 (platform down)** | Acknowledge within 30 min (business hours), 1 hr (after hours); engineer engaged within 1 hr (BH) / 2 hr (AH) | 2.5% monthly fee credit |
| **Incident response — P2 (degraded)** | Acknowledge within 2 hrs (BH), 8 hrs (AH) | 1% monthly fee credit |
| **Data durability** (Postgres + Blob) | 99.99% (Azure-backed) | Reimbursement of actual data loss |
| **Planned maintenance windows** | Tue/Thu 9pm–11pm MT, minimum 72-hour notice | — |
| **Security incident notification** | Within 24 hours of confirmed incident (per BAA) | BAA-defined remedies |
| **Quarterly availability report** | Delivered within 15 business days of quarter-end | — |

Service credits are computed against the **monthly platform-fee equivalent ($62,500/mo)** and capped at 15% of monthly fee in any given month. Credits apply to the subsequent invoice.

---

## 7. Out-of-scope work — billable add-ons

Work outside the Year-1 scope is billed against the published rate card with written PHS authorization:

### 7.1 Future Engagement Rate Card

| Tier | Role | Standard Rate |
|---|---|---|
| T1 | Executive / Partner (Founder, Executive Sponsor) | $475/hr |
| T2 | Principal / Architect | $325/hr |
| T3 | Senior Engineer / Senior Consultant | $250/hr |
| T4 | Engineer / Consultant | $185/hr |
| T5 | Support / Operations | $125/hr |
| — | Blended team rate (T2–T4 composition) | $250/hr |

### 7.2 Premier Support Tier (optional uplift)

Beyond the 90-day launch period, PHS may elect Premier Support at **$50,000/year**, which adds:
- 24×7 support coverage (replaces business-hours coverage)
- Dedicated Technical Account Manager (TAM)
- 15-minute P1 acknowledge target
- Priority engineering escalation queue
- Monthly executive briefing (replaces quarterly cadence)

### 7.3 Professional Services examples

- Custom Move authoring beyond included scope
- Native integration build (Epic, Workday, Coupa, ServiceNow)
- Custom data pipeline / ingestion adapters
- Executive workshops / board-level presentations
- Cross-portfolio strategic advisory
- M&A or transaction-related decision support

Professional Services are scoped via mini-SOW with fixed fee or T&M against the rate card. **No PS work begins without PHS written authorization.**

---

## 8. Pilot-to-Year-1 continuity

The Year-1 structure mirrors the pilot's commercial shape, scaled appropriately:

| Element | Pilot (90 days) | Year-1 |
|---|---|---|
| **Headline fee** | $300,000 fixed | $750,000 fixed |
| **Infrastructure** | Cost+15%, capped at $10,000 | Cost+15%, capped at $80,000 |
| **Managed Services** | Included (effort absorbed) | Included ($110,000 stated) |
| **Maestro Consultant** | Effort absorbed (no specific %) | 15% allocation explicit ($78,000) |
| **Founder Time** | 100 hrs investment | 100 hrs investment |
| **Principal Architect** | Ad-hoc (investment) | Up to 60 hrs investment |
| **Reference Discount** | "Pilot pricing" framing | $100,000 off list price |
| **Premier Support** | N/A | First 90 days included (investment) |
| **SLAs** | Best-effort, business-day | 99.5% with service credits |

**The continuity message:** "The pilot proved the model. Year-1 is the same model, scaled, with infrastructure and managed services explicitly included so finance can plan around one number. The only commercial growth is platform subscription itself — everything else stays proportional or improves in your favor."

---

## 9. Year-2 / Year-3 forward look (indicative, not contractual)

Year-1 contract is the binding commitment. Forward-year pricing is shared transparently for planning purposes:

| Year | Annual Fee | Reference Discount Status | Notes |
|---|---|---|---|
| **Year 1** | $750,000 | $100K off list applied | Launch reference customer |
| **Year 2** | $775,000 (3.3% growth) | $75K off list applied | Reference discount begins tapering |
| **Year 3** | $810,000 (4.5% growth) | $40K off list applied | Discount tapered to nominal level |
| **Year 4+** | List rate at execution | None | PHS holds long-term reference status (non-monetary) |

Annual rate-card increases capped at 5% per year, indexed to CPI. Fair-use envelope reviewed annually based on actual utilization.

---

## 10. What PHS hears in the conversion conversation

> *"Year-1 is $750,000. That includes the platform, your dedicated Azure infrastructure capped at $80K, our managed services running the platform 24×7, and 15% of a named Maestro Consultant's time on your account. Founder and senior architect time stays at zero — that's our investment in the partnership, the same way we ran the pilot. List price for what you're getting is closer to $930K; you receive about $180K of value at no charge as our launch healthcare reference customer. The fair-use envelope covers normal CXO and analyst usage with comfortable headroom. SLA moves from pilot best-effort to formal 99.5% with service credits. Same commercial shape as the pilot, scaled to a full year."*

A 45-second answer. Procurement-clean. Finance-friendly. Defensible against board scrutiny.

---

## 11. Open items to finalize before contract execution

| # | Item | Owner | Target |
|---|---|---|---|
| 1 | Confirm 25 named users is the right Year-1 envelope (vs. 15 / 30 / 50) | PHS sponsor | Phase 3 (Week 10–11) |
| 2 | Confirm fair-use envelope at 200 calls/user/business-day based on actual pilot data | AbarVa platform + PHS sponsor | Phase 3 |
| 3 | Confirm Year-1 SLAs (specifically 99.5% target) acceptable to InfoSec | PHS InfoSec | Phase 3 |
| 4 | Confirm $80K infra cap based on pilot actual + projected Year-1 load | AbarVa platform | Phase 3 |
| 5 | Confirm Maestro Consultant named individual + onboarding timing | AbarVa | Pre-Year-1 kickoff |
| 6 | BAA + MSA renewal for Year-1 (pilot BAA may be sufficient; confirm) | PHS Legal + AbarVa | Pre-Year-1 kickoff |
| 7 | Year-2 / Year-3 forward-look terms acceptable as planning reference | PHS procurement | Phase 3 |

---

## 12. Document control

- **Version:** v1
- **Date:** 2026-05-27
- **Author:** AbarVa Founder
- **Status:** Draft for Phase 3 conversion conversation
- **Companion documents:**
  - `PHS_PILOT_SOW_DRAFT_v2.md` — Pilot commercial agreement
  - `PHS_CDAO_MEETING_ONE_PAGER.md` — Executive brief for discovery
  - `PHS_AWS_PORTABILITY_LAB_PLAN.md` — Optional Week-1 portability track
- **Next revision:** v2 after Phase 2 actuals inform fair-use + infra-cap calibration

---

*This document is for PHS internal review and AbarVa-PHS commercial discussion. Not for distribution beyond the PHS executive sponsor, CDAO, CIO, procurement, and finance.*
