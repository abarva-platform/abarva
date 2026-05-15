# AbarVa · Monetization — Tiers, ARR Model, Inclusion Matrix

> Owner: founder. Last updated 2026-05-14. Pair-read with `D1-NARRATIVE-AND-VALUE-PROP.md`. Pricing anchored on **value of decisions made**, not seats or queries.

---

## TL;DR

Three tiers. Per-tenant licensing. Pilot enables fast yes/no; Production is the ARR engine; Enterprise unlocks the regulated buyers.

| Tier | Annual price | Term | Deployment | Pilots needed before quote |
|---|---|---|---|---|
| **Pilot** | $50–100k for a 6-month engagement | 6 months, non-auto-renewing | SaaS managed (Vercel + Azure private data plane) | 0 — designed to be the first conversation |
| **Production** | $250–500k/year | 12-month auto-renew | SaaS managed | 1 referenceable pilot |
| **Enterprise** | $1M+/year | 24–36 months | In-VPC (customer Azure subscription, B4) | 1 production reference |

Pricing is **per-tenant**, not per-seat. A tenant is one customer organization (one parent company, all CXOs included). Per-tenant aligns the unit of value with the unit of buying.

---

## Why per-tenant, not per-seat

Three reasons:

1. **The unit of value is the decision portfolio, not the user.** A CFO's read of the Tower is worth more than a 20-seat analyst pool. Counting seats fights the value structure.
2. **CXOs hate per-seat pricing for executive tools.** Anchors as commodity rather than infrastructure.
3. **It's easier to defend at the renewal.** "Did the substrate generate value for your AI portfolio?" is the renewal question. "Did 47 of 50 seats log in?" is the wrong question.

Per-seat may show up later as a *consumption-on-top* mechanic for analyst-tier users (junior staff who pull reports). Not for the first 50 customers.

---

## Tier 1 · Pilot ($50–100k, 6 months)

**Designed to be the first commercial conversation.** The goal of the pilot is to get from "interesting" to "the CXO asked Sentinel a real question and got a quotable answer" within two weeks of signed SOW (see `docs/pilot/FIRST-PILOT-RUNBOOK.md`).

### Included
- 1 tenant, up to **5 CXO-tier users**
- All 4 surfaces (Intelligence, Moves, Source, Tower) with all 4 named agents
- The 14-segment context substrate bootstrap (manual onboarding by AbarVa)
- Tier-1 (UI) + Tier-2 (Azure landing zone) data ingestion
- Sensitive-data guard (live across 7/7 upload routes)
- Cross-tenant isolation (audit-arc PRs #1923–#1933)
- Standard support: founder-led, business-hours, 24h P1 response
- Pre-filled CAIQ-Lite + DPA template

### Excluded
- In-VPC deployment (Enterprise tier)
- Bring-your-own-keys / customer-managed Key Vault keys (Enterprise)
- SOC 2 Type II attestation copy (in roadmap)
- Real-time integration (Tier 3 — Direct integration, Enterprise add-on)
- Custom agent doctrine beyond `arcturus`-style overlay (Enterprise add-on)

### Why this price band
$50k floors the conversation at a level where the customer treats it as a real procurement, not a free trial. $100k caps it so a single VP can sponsor with a one-quarter discretionary budget. Most customers will land $75k.

### What converts to Production
A pilot is a success when, by month 5:
- All 5 CXO users have logged in at least 10 times each
- At least 3 AbarVa-recommended moves have been adopted or shaped (Nexus surface)
- The customer's sec team has signed off on production rollout
- Customer signs an MSA + Production SOW before month 6

If those are green, the conversion is a paperwork exercise. If 2 of 4 are green, propose a 6-month extension at +25%. If 0–1 are green, walk away clean.

---

## Tier 2 · Production ($250–500k/year)

**The ARR engine.** Multi-CXO usage, full feature set, contractual support, named CSM.

### Included on top of Pilot
- **Up to 25 named users** (still CXO + direct reports + their analyst pool)
- **All four ingestion tiers** including Tier-3 Direct integration (Azure Data Share, Snowflake Data Share, point connectors to ServiceNow / Workday / Coupa) — one integration included; additional at $50k each
- **SLA upgrade** — 99.9% availability, ≤30 min P1 response, ≤4h P1 resolution (per `docs/pilot/SUPPORT-MODEL.md` production tier)
- **Microsoft Purview** content classification (B5b when shipped) on every upload
- **Quarantine review dashboard** (B5c)
- **Named CSM** (contracted at this tier until 3+ Production customers, then FTE)
- **Quarterly business review** with founder + customer CXO sponsors
- **Soc 2 Type II attestation copy** when available (roadmap)

### Excluded
- In-VPC deployment (Enterprise)
- Bring-your-own-keys (Enterprise)
- 24/7 paging (Enterprise)
- Custom agent doctrine packs (Enterprise add-on at $100–200k)
- Dedicated environment (Enterprise)

### Pricing levers
- **$250k floor** — single industry vertical, 25-user cap, standard support
- **$350k mid** — multi-vertical OR cross-business-unit substrate, 50-user cap
- **$500k ceiling** — multi-vertical, multi-BU, executive briefings monthly, premium Purview SLAs, optional quarterly on-site

### Why this price band
Anchored to the consulting alternative. A McKinsey AI-strategy engagement runs $1–3M for ~9 months and produces a deck. Production AbarVa at $350k produces a queryable substrate that survives 3 years. Sales conversation is "30% of one consulting engagement, with software you own."

---

## Tier 3 · Enterprise ($1M+/year, 24–36 months)

**The regulated-industry SKU.** Hospitals, banks, defense, public sector — anyone whose sec architect won't approve SaaS-managed data planes.

### Included on top of Production
- **In-VPC deployment** (customer Azure subscription, B4 Bicep modules)
- **Bring-your-own-keys** via customer-managed Key Vault
- **24/7 paging** with named on-call engineer (requires the first FTE hire to land)
- **Dedicated environment** — no co-tenancy with other AbarVa customers in any infrastructure layer
- **Unlimited named users** (still CXO + report-team scoped)
- **Multiple direct integrations included** (typically 3, then $50k each)
- **Custom agent doctrine pack** — industry- or customer-specific prompt and behavior overlays (1 included, additional at $100–200k)
- **Annual independent pen-test** results shared
- **Customer-defined retention windows** per segment
- **Multi-year discount** — 10% off Y2, 15% off Y3 for 36-month commitment

### Why this price band
- A customer's IT will spend $200–500k *just on the Azure infrastructure* for an in-VPC deployment. AbarVa's $1M is the all-in number including software, support, and the SKU's higher margin reflecting the operational lift.
- Regulated buyers don't shop on price — they shop on whether the procurement and infosec processes can be made to work. The price has to be high enough to fund the contracted DPA, the in-VPC support engineering, and the annual third-party pen-test.

### Enterprise SKU is what unblocks
- Top-5 US health systems (HIPAA + BAA + in-VPC requirement)
- Top-20 US banks (model risk governance, no public-internet data plane)
- Defense / public-sector (FedRAMP path; that's a separate tier when relevant)
- Pharma and life sciences (GxP-adjacent buyers; in-VPC is non-negotiable)

---

## Inclusion matrix

A condensed view of what's in / out per tier. Use this on a single slide.

| Capability | Pilot | Production | Enterprise |
|---|---|---|---|
| 4 surfaces + 4 agents | ✓ | ✓ | ✓ |
| 14-segment substrate | ✓ | ✓ | ✓ |
| Sensitive-data guard | ✓ | ✓ | ✓ |
| Cross-tenant isolation (PRs #1923–#1933) | ✓ | ✓ | ✓ |
| Tier-1 UI upload | ✓ | ✓ | ✓ |
| Tier-2 Azure landing zone | ✓ | ✓ | ✓ |
| Tier-3 Direct integration | — | 1 included | 3 included |
| Tier-4 In-VPC deployment | — | — | ✓ |
| Microsoft Purview (B5b) | — | ✓ | ✓ |
| Quarantine review dashboard (B5c) | — | ✓ | ✓ |
| Bring-your-own-keys | — | — | ✓ |
| Named users | 5 | 25 (50 at $350k mid) | unlimited (CXO+team scope) |
| SLA · availability | 99.5% | 99.9% | 99.9% |
| SLA · P1 response | 24h | 30 min | 30 min · 24/7 |
| Named CSM | — | ✓ (contracted, then FTE) | ✓ (FTE) |
| Quarterly business review | — | ✓ | ✓ (monthly available) |
| Custom doctrine pack | — | — | 1 included |
| Annual third-party pen-test | — | — | ✓ shared |
| Dedicated environment | — | — | ✓ |
| SOC 2 Type II copy | — | ✓ (when available) | ✓ |
| Term | 6 mo, non-renewing | 12 mo auto-renew | 24–36 mo |
| **Annual price** | **$50–100k** | **$250–500k** | **$1M+** |

---

## ARR model (first 24 months)

Targets from `docs/gtm/D6-SEED-FUNDING-PLAN.md`. This is the math behind those numbers.

### Year 1 (months 1–12)

| Quarter | Pilots signed (cumulative) | Production signed (cumulative) | Enterprise signed | Quarter-end ARR |
|---|---|---|---|---|
| Q1 | 0 (3 demo) | 0 | 0 | $0 |
| Q2 | 1 ($75k pilot equivalent if annualized) | 0 | 0 | $50–75k |
| Q3 | 2 | 0 | 0 | $100–150k |
| Q4 | 3 | 1 ($300k starter) | 0 | $300–375k |

End-Y1 target: **$300–500k ARR**, anchored on the first Production conversion.

### Year 2 (months 13–24)

| Quarter | Pilots cumulative | Production cumulative | Enterprise cumulative | Quarter-end ARR |
|---|---|---|---|---|
| Q5 | 4 | 2 | 0 | $600–750k |
| Q6 | 5 | 3 | 0 | $850k–1.1M |
| Q7 | 6 | 4 | 0 (first conversation) | $1.2–1.5M |
| Q8 | 7 (some renewed) | 5 | 1 | **$2.0–2.7M ARR** |

End-Y2 target: **$2–3M ARR**, with the first Enterprise customer signed. This is the Series A milestone.

### Sensitivities

- **Pilot → Production conversion rate.** Assumed 50%. Below 30% means the pilot tier needs rethinking. Above 70% means we're underpricing Pilot.
- **Production → Enterprise expansion.** Assumed 25% by month 24. Above that suggests Enterprise should be the default conversation for some segments (e.g., healthcare).
- **Churn at Production renewal.** Assumed 10% (one customer in five). Above 20% kills the model — Production tier value isn't landing.

---

## Pricing tactics

### Discount discipline

- **Pilot:** never discount. The price is so low that any discount signals desperation. If a customer balks, change the inclusion (drop a CXO seat, drop a vertical) — not the price.
- **Production:** up to 15% discount on multi-year prepay. Up to 10% on 2nd Production deployment at the same customer (e.g., a second business unit).
- **Enterprise:** the 10% Y2 / 15% Y3 commitment discount is the standard pre-negotiated lever. Don't reopen it.

### Anchor moves

- For CFOs, lead with the **value-at-stake of decisions made**, not seat counts. "The AI portfolio at stake is $200M. AbarVa Production is 0.2% of that."
- For CIOs, lead with the **infrastructure substrate not built**. "What you'd need a small team 18 months to build, available as a tenant in 14 days."
- For CISOs, lead with the **infosec accelerator doc**. The price gets resolved after the architecture passes their review.

### The pilot-to-production close

The single most important moment in the funnel. Standard close: in month 4 of a 6-month pilot, present a **Production SOW** with a 30-day window and a small pricing concession (5% off Y1 production) if signed before month-5. This avoids the dead-air month 6 negotiation.

---

## What this implies for the seed pitch

From `docs/gtm/D6-SEED-FUNDING-PLAN.md`: $1.5M target raise, 18-month runway, Series A milestone at $2–3M ARR with 1 Enterprise customer.

The pricing model above gets to $2–3M ARR with **3–5 Production customers + 1 Enterprise**. That is a believable 18–24 month plan for a single founder + 3-4 hires.

It does **not** get to $2–3M ARR via Pilot tier alone (that requires 25-50 pilots — implausible). The model is gated on landing the first Production customer in Q4 Year 1.

---

## What to refresh next cycle

1. **After 3 customer conversations** — confirm the $50k pilot floor lands. If we hear "is this an ELA?" at first ask, we're under-priced.
2. **After first Production signed** — adjust the $250-500k band if the actual close lands outside it.
3. **After first Enterprise conversation** — confirm $1M floor with a real customer's procurement.
4. **Every 9 months** — review against the broader market (what's Snowflake AI ELA running at? What's Glean charging now?). Re-anchor.

---

## Companion artifacts

- `docs/gtm/D1-NARRATIVE-AND-VALUE-PROP.md` — the locked language
- `docs/gtm/D6-SEED-FUNDING-PLAN.md` — the investor narrative
- `docs/pilot/FIRST-PILOT-RUNBOOK.md` — how a pilot actually ships
- `docs/pilot/SUPPORT-MODEL.md` — what the SLAs above actually cost to deliver
- `docs/security/INFOSEC-ACCELERATOR.md` — what the customer's sec team gets
- `docs/BACKLOG-2026-05-14.md` — the strategic backlog
