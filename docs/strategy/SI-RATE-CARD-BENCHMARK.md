# SI Rate-Card Benchmark — Moves Effort Estimator

**Status:** researched benchmark, v1
**As-of:** 2026-05-19
**Owner:** Moves Expert Kernel
**Companion data module:** `src/lib/programs/expert-kernel/rate-card/benchmark-rate-card.ts`
**Spec anchor:** `MOVES-DELIVERABLE-AND-BUSINESS-CASE-SPEC.md` §5.4 (rate-card discipline)

---

## 1. What this is — and is not

This is a **benchmark planning rate card**: market-derived hourly USD ranges
the Moves `effort-estimator` uses to cost a Move *before* a client-specific
rate card exists.

> **This is a benchmark, not a quote.** Every figure is a *range*, not a point.
> Every band carries a confidence note. Actual vendor pricing varies by
> client, deal size, scope, and commercial model. When a client-specific rate
> card exists, it **always overrides** these bands — cell by cell.

We deliberately publish **bands, not point figures**. SI firms treat their fee
structures as trade secrets; precise public rates do not exist. False
precision here would be dishonest. A band with a confidence note is the
honest unit.

## 2. The three dimensions

The founder's correction shaped the model: a rate is not "a firm" — it is a
**cell** in a 3-D grid.

### 2.1 SI archetype — *who* delivers

| Archetype | Examples | Character |
|---|---|---|
| `us_tier1` | Accenture, Deloitte Consulting | Global premium SI; carries its **own** onshore, nearshore and offshore (GDN) network |
| `india_tier1` | TCS, Infosys, Wipro | Offshore-heavy scale players; also carry **their own** US onshore presence |
| `big4_advisory` | EY, KPMG, PwC, Strategy& | Advisory-led; strongest in strategy, process, change, regulated work |
| `boutique_specialist` | Focused AI / data firms | Deep, narrow, senior; pricing varies widely by niche |

### 2.2 Delivery location — *where* the team sits

`onshore` (US) · `nearshore` (LatAm / Canada) · `offshore` (the firm's own
Global Delivery Network — India and similar).

**Key modelling rule:** delivery location is a property of the chosen firm's
**own delivery network** — *not* a separate vendor. A US Tier-1 carries both a
US onshore rate **and** an offshore GDN rate. "Offshore" is never a separate
archetype. A US Tier-1's own GDN is priced **above** an India Tier-1's
offshore rate for the same geography — same labour market, premium brand and
integrated delivery.

### 2.3 Work specialization — *what kind* of work

Rates vary by craft, not just seniority: `strategy_advisory`,
`solution_architecture`, `ai_ml_engineering`, `data_engineering`,
`integration`, `process_redesign`, `change_management`,
`program_management`, `run_ams`.

## 3. Methodology

1. **Research.** Public market sources (May 2026) — consulting fee surveys,
   IT-services rate guides, nearshore salary benchmarks, SAP/ERP rate guides,
   procurement-benchmark commentary. See §6.
2. **Anchor points.** A handful of well-corroborated figures pin the grid:
   - US Tier-1 / Big-4 top-end advisory: **$250–$850/hr**.
   - US Tier-1 onshore delivery (engineering): **$200–$300/hr** typical.
   - Big-4 senior-manager day rates **~£1,500–£2,120** → **~$240–$340/hr** blended.
   - India Tier-1 onsite (US): **$100–$140/hr**; offshore: **$30–$55/hr**.
   - Nearshore LatAm engineering: **$35–$90/hr**; AI/ML carries a **12–15% premium**.
3. **Interpolate honestly.** Cells without a direct data point are derived by
   characterized reasoning (location discount, specialization premium) and
   marked **`low` confidence** with an explicit note saying so.
4. **Blended hourly basis.** Every band is a *blended* hourly rate (mixed
   seniority team), USD. The estimator applies its own role mix on top.
5. **Skip what is not real.** Not every archetype delivers every cell. We
   populate only commercially real cells (e.g. boutiques rarely run a
   large-scale offshore GDN, so those cells are intentionally absent). A
   lookup miss returns `null` — the estimator must handle it, never fabricate.

## 4. Confidence ladder

| Confidence | Meaning |
|---|---|
| `high` | Directly corroborated by multiple sources (e.g. India offshore $30–50/hr). |
| `medium` | Derived from solid anchors with reasonable interpolation. |
| `low` | Thinly researched — characterized/inferred. Band widened on purpose. |

**Where research is thin (honest disclosure):**

- **US Tier-1 onshore AI/ML** — onshore AI delivery rates are barely disclosed;
  inferred from US AI-consultant context minus an advisory discount.
- **US Tier-1 / Big-4 own GDN AI/ML** — GDN AI capacity is growing fast but not
  broken out publicly; bands carry a deliberate AI premium over GDN baseline.
- **US Tier-1 nearshore** — firms' own LatAm centers are thinly disclosed;
  priced above independent nearshore for brand + integration.
- **Big-4 offshore delivery** — Big-4 are advisory-led, so their offshore
  *delivery* rates are far less visible than the SI Tier-1s'.
- **Boutique strategy advisory** — ranges from independent advisors
  (~$75–200/hr) to firm-level (~$450/hr); the band is wide and low-confidence.

Top-end advisory high ends are **characterized, not quoted** — partner day
rates can reach ~£3,800 but are rarely billed directly.

## 5. How the estimator consumes it

`lookupBenchmarkRate(archetype, location, specialization)` returns the
`RateCardEntry` for a cell, or `null` if unpopulated. The `effort-estimator`
(owned by a parallel workstream — not modified here) will:

1. Prefer a **client-specific rate** for the cell if one exists.
2. Else fall back to this benchmark band.
3. Carry the `confidence` and `note` into the business case so the CFO sees
   *how solid* each rate is.
4. Surface the bands in the UI labelled as **planning ranges, overridable**.

## 6. Sources

- [Consultancy Fees & Rates — Consultancy.org](https://www.consultancy.org/consulting-industry/fees-rates)
- [IT Consulting Rates per Hour by Country and Specialization — Cleveroad](https://www.cleveroad.com/blog/it-consulting-rates/)
- [Management consulting fees — Slideworks](https://slideworks.io/resources/management-consulting-fees-how-mc-kinsey-prices-projects)
- [A comparison of day rates between the Big Four and Accenture — LinkedIn](https://www.linkedin.com/pulse/comparison-day-rates-between-big-four-accenture-tom-moore)
- [Big 4 Consulting Firms 2026 — Road to Offer](https://www.roadtooffer.com/blog/big-4-consulting-firms)
- [LatAm Engineering Rates 2026 — Mismo](https://mismo.team/latam-engineering-rates-costs-by-role-and-country/)
- [How Much Does an AI Consultant Cost in 2026 — Leanware](https://www.leanware.co/insights/how-much-does-an-ai-consultant-cost)
- [Hire AI and ML Engineers in Latin America 2026 — Nearshore Business Solutions](https://nearshorebusinesssolutions.com/news/hire-ai-machine-learning-engineers-latin-america/)
- [Understand SAP Program Manager Consulting Rates — SAP BW Consulting](https://www.sapbwconsulting.com/understand-sap-program-manager-consulting-rates)
- [SAP Implementation Cost Breakdown 2025 — Nerdbot](https://nerdbot.com/2025/06/28/sap-implementation-cost-breakdown-a-realistic-2025-guide/)
- Glassdoor / Quora / Fishbowl practitioner-forum commentary on India Tier-1
  onsite vs. offshore billing rates (directional, used only to corroborate
  anchors — not cited as primary).

## 7. Refresh cadence

**Review every two quarters.** Strategy and run/AMS rates drift slowly.
**AI/ML and data-engineering premiums move fast** (12–18%/yr per 2026
nearshore research) — re-research those cells first. On each refresh, bump
`RATE_CARD_AS_OF` in the data module and this doc's *As-of* line, and update
any band whose confidence can be raised by new corroboration.
