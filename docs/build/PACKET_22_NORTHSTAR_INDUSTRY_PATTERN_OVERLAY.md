# Packet 22 — Northstar Clinical Tech Industry Pattern Overlay + CXO Business Case

**Status:** Draft 2026-05-26. CXO-ready.
**Companion to:** `docs/build/PACKET_21_NORTHSTAR_CLINICAL_TECH_CONTEXT_LAYER_PROMPT.md` (the data-pack / ingestion-loop build packet).
**Grounding tenant (do NOT name in any artifact):** Solventum Inc. (NYSE: SOLV), the April 2024 spin-off from 3M Health Care. Tenant name in the product MUST remain "Northstar Clinical Tech."
**Purpose:** turn the Northstar synthetic tenant into a CXO-defensible $225K pilot → $750K/year commit. Build the 10x–50x payback math on patterns that map directly to disclosed Solventum-class transformation programs.

---

## Part 1 — The 1-page CXO memo

> **To:** Northstar Executive Committee
> **From:** [VP / Owner of the AbarVa pilot]
> **Subject:** Sentinel + Atlas + Maestro — 90-day pilot at $225K, year-1 commit at $750K
>
> **The ask.** $225K pilot fee for 90 days. $750K/year ARR if we commit after the pilot.
>
> **What it is.** AbarVa is a context-aware decision-OS for the C-suite. Three integrated agents — Sentinel (procurement / vendor / RFP intelligence), Atlas (program & regulatory intelligence), Maestro (board-grade synthesis) — sit on top of our ServiceNow CMDB, Workday/Coupa contracts, Anaplan demand plan, Veeva QMS, and supplier master. We have ~1,000 systems mid-migration off 3M, a $100–120M tariff headwind disclosed for 2026, and a 1,000+ supplier rebuild already booked. AbarVa makes that backlog answer board-level questions in minutes instead of weeks.
>
> **The simplest framing — what AbarVa replaces.**
> - **The McKinsey check we'd write for "AI strategy."** A typical Tier-1 firm engagement to define an AI strategy and roadmap for a Northstar-class medtech is $3–8M for one cycle. AbarVa does the equivalent work — segment strategy, opportunity prioritization, business cases, target architecture, sequencing — inside the platform with our own data. **One avoided engagement = $3–8M / 4x–11x ROI on year one before any other lever.**
> - **The Accenture/Deloitte execution invoice.** A separation-era medtech runs $50–200M/year of SI execution. AbarVa cuts 20–30% off that by right-sizing scope, killing over-engineered architectures, sharpening estimates, and orchestrating the right human + AI agent mix on each workstream. **At 20% on a $50M execution wave = $10M / 13x. At 30% on $100M = $30M / 40x.**
> - These two displacements alone clear 50x at the bull case. The patterns below are how the platform earns the right to do this work.
>
> **What 10x looks like, even on the conservative case.** $7.5M of measured year-1 savings on a $750K spend.
> - **AMS / SaaS rebid** of the post-separation contracting pipeline (~$200M flowing through new agreements in the next 18 months). Industry-standard first-pass rationalization recovers 10–20%. We need **4% measured = $8M** to clear 10x. This is the single most defensible procurement path.
> - **Engineering productivity** uplift across the 800-person SaMD + HIS engineering organization. Forrester TEI on Copilot-class deployments shows up to 376% ROI and 15% measured productivity recapture; at 5% measured = **$7.2M/yr**.
>
> **What 50x looks like.** $37.5M. Stack the displacement levers with:
> - **Tariff scenario AI** that mitigates 20% of the disclosed $100–120M 2026 tariff headwind = $20–24M. Done by routing the BoM × country-of-origin × HTS-code model through Sentinel and feeding the dual-source acceleration plan into procurement decisions before contracts land.
> - **Regulatory cycle compression** on the next 5–10 510(k) / CER / PCCP submissions; McKinsey-Merck CSR pilot shows 50% drafting compression and 40% end-to-end cycle reduction. Conservatively $3–6M of value pull-forward per year.
>
> **What we deliver in the 90-day pilot.**
> - **D1 (week 6):** AMS-rebid heatmap with named-vendor savings estimates on top 20 contracts.
> - **D2 (week 6):** SBOM + clause-gap report against FDA 524B and EU AI Act Annex I for top 15 SaMD-adjacent vendors.
> - **D3 (week 6):** Tariff-exposure model for top 50 SKUs (country-of-origin × HTS × landed cost).
> - **D4 (week 10):** Execute one production rebid (~$10M contract) and one PCCP draft through Atlas.
> - **D5 (week 13):** Board-ready ROI memo with audited dollar-savings booked + year-1 rollout plan.
>
> **Conviction trigger.** If D1 alone identifies $4M+ of negotiable savings in the first 6 weeks (highly likely given the $200M+ post-separation contracting pipeline), the $750K commit pays back before the pilot closes. We commit at week 10, not week 13.
>
> **Risk.** Three named risks. (1) Data-access lag if Workday/Coupa/ServiceNow connectors take longer than 3 weeks — mitigated by AbarVa shipping pre-built adapters for all three. (2) Vendor-relationship friction on aggressive rebids — mitigated by running Sentinel-generated counter-offers through the existing legal+procurement workflow, not in parallel. (3) Regulatory cycle benefit is real but lagging — booked as year-2 evidence, not part of the 90-day claim.
>
> **The bigger frame.** The 3M separation gave us a $1B+ once-in-a-decade chance to redesign the IT and supplier footprint. AbarVa is the diligence layer that ensures every new vendor agreement, every IT consolidation, and every supply-chain rebuild decision lands with the same evidence rigor regulators expect of our SaMD submissions. The $750K spend is **0.2–0.3% of our IT operating envelope**. If it returns 1% of the disclosed tariff and separation exposure, it pays for itself 50 times over.

---

## Part 2 — Northstar tenant identity (synthetic, Solventum-shaped)

**Forbidden facts in any visible artifact:** the literal word "Solventum", "3M", "Bryan Hanson", "Wayde McMillan", "Amy Landucci", "Heather Knight". The tenant in the product is **always** "Northstar Clinical Tech".

| Field | Value |
|---|---|
| Tenant key | `northstar` |
| Display name | Northstar Clinical Tech |
| Legal | Northstar Clinical Tech, Inc. (composite Fortune-500 medtech) |
| HQ | Saint Paul, Minnesota |
| Founded | 2023 (carve-out from a diversified industrial parent, separation April 2024) |
| Total revenue (FY25) | $8.3B |
| FY26 revenue guide | flat to slight growth, with ~$100–120M tariff headwind absorbed |
| Net income FY25 | ~$1.1B normalized |
| Operating margin target (2028) | 23–25% |
| EPS CAGR target | 10% through 2028 |
| Employees | ~12,700 (post P&F divestiture) |
| HQ ticker | NYSE: NST (composite — do not echo a real ticker) |
| Business segments (3 active) | MedSurg (~57% of revenue, includes Infection Prevention + Surgical Solutions); Dental Solutions (~17%); Health Information Systems (~17% — coding/CAC/CDI/speech-to-text) |
| Recently divested | Purification & Filtration (~12% of pre-divestiture revenue, sold Sept 2025) |
| Current transformation | 1,000+ system migration off the prior parent (40% complete; 90% target EOY 2026); ERP rollout (Feb 2026 APAC + EU go-lives); supplier rebuild (~1,000 suppliers re-papering); EU distribution + own manufacturing footprint stand-up |
| Annual IT operating envelope | ~$280M–$320M baseline (3.5% of revenue) with upward pressure during separation |
| Annual procurement envelope | ~$1.8B addressable; ~$540M of which is technology + AMS + SaaS |
| 2026 tariff exposure | $100–120M annualized (disclosed) |
| CEO | (composite) — clinical-industry veteran, 24 months in seat |
| CFO | (composite) — ex-large-medtech CFO |
| CIDO (Chief Information & Digital Officer) | (composite) — likely AbarVa champion |
| CCO (Commercial) | (composite) — also owns R&D operations across the three remaining segments |
| Other forbidden tenant terms | "Apex Retail", "Meridian Health", "First Capital", "Arcturus" — all must never leak into Northstar surfaces |

---

## Part 3 — Industry pressure stack (medtech 2026)

| Pressure | What it means for Northstar | Sentinel pattern fit |
|---|---|---|
| **FDA PCCP (final Aug 2025)** | All AI-enabled devices need predetermined-change-control plans with modification description + protocol + impact assessment + labeling transparency. 1,250+ AI/ML devices authorized as of July 2025. | Atlas regulatory-affairs pattern: auto-draft PCCP, monitor post-market signals, surface change-control triggers. |
| **EU AI Act × MDR** | Almost all MDR Class IIa/IIb/III SaMD using AI = high-risk. Annex III applies Aug 2, 2026 (one month after pilot starts). Annex I (safety component) Aug 2, 2027. | Atlas + Sentinel-clause-extraction pattern: gap-scan every active vendor contract for EU AI Act Annex I compatibility. |
| **FDA 524B cybersecurity** | Cyber devices need vuln-disclosure, secure-design, postmarket patching, SBOM. Now a §301(q) prohibited act → False Claims Act exposure (Morgan Lewis Nov 2025 analysis). | Sentinel SBOM-and-clause-gap pattern (D2 deliverable). |
| **Tariffs** | 62% of US medical devices imported. Largest medtechs: $200–450M annual hits. Northstar disclosed $100–120M for 2026. | Sentinel tariff-scenario AI pattern (D3 deliverable). |
| **Reimbursement** | CMS hospital tariff pressure + VBC shifts → IDN procurement teams need TCO + RWE, not clinician preference. | Atlas RWE-monitor pattern; Sentinel IDN contract-intelligence pattern. |
| **Supply-chain post-separation** | 1,000+ suppliers being re-papered while TSAs unwind to 90% by EOY 2026. Highest-risk window is now. | Sentinel supplier-risk graph + Source AMS-rebid pattern (D1 deliverable). |
| **Talent** | Medtech firmware/SaMD engineers compete with FAANG comp; AI engineer scarcity forces toolchain compression. | Atlas engineering-productivity pattern (Copilot rollout instrumentation). |
| **Investor pressure** | 23–25% operating margin by 2028, 10% EPS CAGR through 2028, freed P&F sale proceeds (~$3.4B net) earmarked for M&A. | Maestro board-pack pattern: every quarter, what did the IT/procurement decisions contribute to the margin walk? |

---

## Part 4 — The pattern catalog (built for the Source module)

These are the patterns that must appear in the product's Source workflow when a Northstar user is signed in. Each maps to a 90-day deliverable.

### 4.1 — AMS rebid analytics (D1, the $4M+ quick win)

**Trigger:** 200+ active AMS, SI, and SaaS contracts; ~$200M flowing through new agreements in the next 18 months as the prior-parent TSAs unwind. Most renewals are happening on inherited rate cards.

**What Sentinel does:**
- Ingest SOWs, run-rate spend, vendor scorecards from Coupa AP + Workday Procurement + ServiceNow CMDB.
- Build a rebid heatmap: each contract scored on (a) negotiation leverage, (b) substitutability, (c) value-leakage signals (e.g. 53% SaaS-license unused benchmark per Zylo 2025), (d) time-to-cutover.
- Generate the named-vendor savings estimate with citation back to the source contract clause and benchmarked peer rate.

**Year-1 economics:** 4% savings on $200M pipeline = **$8M** (clears 10x). 10% = **$20M** (27x). 15% = **$30M** (40x).

**Sample Northstar contracts to plant in the substrate** so Sentinel has something to score:
- Top 5 AMS partners: 1 large global SI ($24M/yr, 3 of 1,000 systems), 1 nearshore SI ($14M/yr), 1 specialist healthcare-IT MSP ($9M/yr), 1 boutique SaMD-engineering shop ($6M/yr), 1 inherited managed-service from the prior parent (~$11M/yr, expiring Sept 2026).
- Top 10 SaaS: Microsoft 365 E5, ServiceNow, Salesforce HLS Cloud, Workday Financials + HCM, Coupa, Veeva Vault QMS, Anaplan, Snowflake, Databricks, AWS commit.

### 4.2 — SBOM + clause-gap pattern (D2)

**Trigger:** FDA 524B is now a §301(q) prohibited act; EU AI Act Annex I lands Aug 2027; any SaMD vendor without a maintained SBOM is a compliance landmine.

**What Sentinel does:** scan top 15 SaMD-adjacent vendor contracts for (a) SBOM commitments, (b) vulnerability-disclosure program clauses, (c) AI-training-rights and data-residency clauses, (d) EU AI Act Annex I compatibility (transparency, human oversight, post-market monitoring). Output a heatmap with concrete clause-rewrite recommendations.

**Year-1 economics:** primarily risk-avoidance — single warning-letter event = $5M+ direct cost + reputational. Hard to book as "savings"; book as "exposure averted."

### 4.3 — Tariff scenario AI (D3, the 50x stretch)

**Trigger:** Disclosed $100–120M tariff headwind for 2026; layered Section 232/301, retaliatory EU/China, Mexico 25% on Chinese inputs. 70% of medical devices made solely outside US.

**What Sentinel does:** ingest BoM × country-of-origin × HTS code × supplier master. Run scenarios:
- Today: $X landed cost across top 50 SKUs.
- Dual-source acceleration: re-route N suppliers, $Y new landed cost, Z weeks to cutover, $K capex.
- Renegotiation leverage: which suppliers carry pricing power; which can absorb tariff vs. pass it through.

**Year-1 economics:** 5% mitigation = $5–6M. 20% = $20–24M. The capital expense to dual-source = bookable cap-allocation argument for the CFO.

### 4.4 — Multi-vendor benchmark generation

**Trigger:** Sentinel needs to credibly tell the procurement team "Boston Scientific pays X for the same SOW." Without it, every rebid is a guess.

**What Sentinel does:** auto-generates peer rate cards from public 10-Ks, IDC/Gartner peer benchmarks, prior RFP outcomes (ingested), and corpus chunks tagged with peer-naming. Critically, the citations are real — every benchmark traces to a source.

### 4.5 — Renewal-pressure dashboard

**Trigger:** TSA expirations + inherited contracts = renewal cliffs every quarter through end-2026.

**What Sentinel does:** sorts the next 12 months of renewals by negotiation power score (single-source vs. substitutable, time-to-cutover, exit-clause language). Tells procurement: "These 8 contracts have weak exit clauses and high substitutability — start now. These 4 are single-source — accept incumbent terms but use the leverage elsewhere."

### 4.6 — Shadow-SaaS discovery

**Trigger:** Industry baseline says **53% of SaaS licenses are unused** (Zylo 2025). On Northstar's $540M technology + AMS + SaaS spend, that's ~$80M+ of potential waste (most is people-headcount-driven so not all recoverable, but $20M is conservatively bookable).

**What Sentinel does:** cross-references SSO logs, expense reports, and CASB feeds (where available) against the approved-vendor list. Flags the deltas. Generates a 90-day SaaS-rationalization punch list.

### 4.7 — TBM-style IT cost transparency

**Trigger:** The CIDO needs CFO-grade variance reporting on IT spend now that the prior parent's allocation is gone.

**What Sentinel does:** maps every IT dollar to (a) business capability, (b) segment (MedSurg / Dental / HIS), (c) vendor, (d) unit-cost ($ per SaMD engineer, $ per claim coded, $ per active contract). Output is a TBM-style stack chart that segments leaders can defend.

### 4.8 — IT/ERP transition AI (cross-pattern, runs through all of Source)

**Trigger:** ERP rollout Feb 2026; 50% of 1,000+ systems migrated, 90% target EOY 2026.

**What Atlas + Sentinel do together:**
- **Atlas:** legacy-code mining of prior-parent-era apps for cutover risk; test-gen for ERP go-live; auto data-migration mapping.
- **Sentinel:** track every SI's burn-rate vs. SOW milestones; flag when an SI is on track for a 20%+ cost overrun before the quarterly steering committee sees it.

**Year-1 economics:** AWS/NorthBay reports application-portfolio-rationalization assessment phase 50% faster (6 wks); DLA generated $23M savings on a similar program. Conservative Northstar take: $15–30M cut-from-cutover-risk.

---

## Part 5 — Source-module patterns mapped to product surfaces

The Source module (procurement / RFP / vendor workflow) must render each of the above patterns as a first-class object. The Northstar tenant substrate (Packet 21) needs to seed these objects so the demo shows them visibly:

| Pattern | Product surface (Source) | Substrate row count |
|---|---|---|
| AMS rebid heatmap | `/source/events?type=rebid` with 20 named-vendor rebid cards | 20 rebid cards seeded |
| SBOM / clause-gap report | `/source/events/{id}/artifacts/sbom-gap-report` | 15 SaMD-adjacent vendors flagged |
| Tariff scenario model | `/source/events/{id}/artifacts/tariff-scenarios` | 50 SKUs × 3 scenarios = 150 scenario rows |
| Multi-vendor benchmark | `/source/patterns/benchmarks/{vendor}` | 35 peer benchmark rows |
| Renewal-pressure dashboard | `/source` landing → next-12-month renewal pressure widget | 62 renewals in next 18 months |
| Shadow-SaaS discovery | `/source/events/{id}/artifacts/shadow-saas` | 40 shadow-SaaS rows |
| TBM cost transparency | `/source/value` segment × capability stack | 22 IT teams × 8 capabilities |
| IT/ERP transition tracking | `/source/events?type=transition` | 12 active SI engagements tracked |

These are the rows the Packet 21 build packet must seed for the Source module to demo with substance.

---

## Part 6 — Sentinel verification questions (16 for the Northstar tenant)

These belong in `99-verification/expected-sentinel-answers.json` in the Northstar data pack. Each has a 10x–50x defensible answer when the substrate is fully loaded.

1. **What do you know about us?** Expected: cites $8.3B revenue, ~12,700 employees, 3 segments, post-separation context, the disclosed 2026 tariff exposure, ERP rollout in flight. Forbidden: any mention of the real parent company.
2. **As CIDO, what AI investments should we prioritize for the next two quarters?** Expected: AMS rebid + tariff scenario + Copilot rollout in named priority order with named-dollar savings.
3. **Where are our most exposed AMS contracts under the post-separation rebid window?** Expected: 5 named (composite) vendors with SOW value, renewal date, leverage score.
4. **What blocks closing on the prior-parent TSA exit by EOY 2026?** Expected: 3 named system dependencies, 2 named SI burn-rate risks, 1 regulatory-cutover-window constraint.
5. **What is our 2026 tariff scenario at +20% vs. baseline?** Expected: top 50 SKUs, $X impact, dual-source acceleration option with capex.
6. **Walk me through our application portfolio. Where is legacy concentrated?** Expected: 240 apps, top 20 by criticality, the 18 prior-parent-era apps flagged for ERP retirement.
7. **Which active initiatives should we kill or pause to fund the tariff response?** Expected: 6 candidate initiatives with sponsor + sunk cost + savings if cancelled.
8. **What's the FY26 renewal pressure and which renewals are most exposed?** Expected: 18 renewals next 6 months; 4 named contracts with weak exit clauses + high substitutability.
9. **Where is our regulatory-affairs cycle longest, and what AI patterns compress it?** Expected: 510(k) drafting average X days; PCCP draft Y days; cite McKinsey-Merck CSR 40% compression benchmark.
10. **Where are we exposed on EU AI Act Annex I (effective Aug 2027) on our current SaMD-adjacent vendor stack?** Expected: top 15 contracts with clause-gap heatmap.
11. **Map our integration topology — where is the legacy debt concentrated?** Expected: 820 directed edges; top 5 hub apps; 22 high-risk point-to-point integrations flagged.
12. **What's our AI cost-to-serve across MedSurg / Dental / HIS, and where is it growing fastest?** Expected: 3-segment unit cost table with directional trend; HIS likely fastest given AI-coding/CDI products.
13. **What sibling moves should I bundle with the prior-parent-AMS unwind?** Expected: 6 sibling-move proposals with risk + sequencing.
14. **CIDO 30-60-90 plan synthesis given current substrate.** Expected: structured 30/60/90 with named owners, deliverables, dollar impact.
15. **CFO 30-60-90 plan for closing the 2026 margin gap given $100–120M tariff headwind.** Expected: 3 levers — AMS rebid, dual-source, shadow-SaaS — with sized contributions to the 23–25% margin target.
16. **CEO synthesis: given the prior-parent separation, the 2026 tariff exposure, and the FY28 operating-margin target, where do AbarVa-class AI bets unlock the most value?** Expected: 5-priority synthesis pulling from all the patterns above; ends with a CFO-defensible IRR table.

---

## Part 7 — Demo personas + logins (5 deep-org, consistent with a $8.3B medtech)

To be provisioned in Clerk against `clientId: 'northstar'`. Aligned to the Northstar deep-org-chart artifact in Packet 21.

| Login | Role | Persona Key | Module Access | Notes |
|---|---|---|---|---|
| cidio@northstar-clinical.example.com | CIDO (Chief Information & Digital Officer) | northstar-cidio | setup, programs, source, intelligence, tower | The AbarVa champion. Maestro role. |
| cfo@northstar-clinical.example.com | CFO | northstar-cfo | programs, source, intelligence, tower | Maestro role. Reads cost + ROI surfaces. |
| svp.procurement@northstar-clinical.example.com | SVP, Procurement & Strategic Sourcing | northstar-svp-procurement | source, programs | Client role. Source-heavy. |
| vp.regulatory@northstar-clinical.example.com | VP, Regulatory Affairs (SaMD + medical-device) | northstar-vp-regulatory | programs, intelligence | Client role. Atlas-heavy. |
| director.supplychain@northstar-clinical.example.com | Director, Supply-Chain Strategy (tariff lead) | northstar-director-supplychain | source, programs, intelligence | Client role. Tariff-scenario user. |

All five `clientLocked: true`, `defaultClientId: 'northstar'`, `clientName: 'Northstar Clinical Tech'`. None of them named after real Solventum executives. Resolution flow same as Apex/Meridian/First Capital — covered by `inferClientKeyFromEmail` in `src/lib/client-config.ts`.

---

## Part 8 — Deep-org chart (composite, consistent with ~12,700 employees)

**CEO** (1)
- **CFO** (1) → reports up: Treasurer, Controller, VP FP&A, VP Investor Relations, VP Tax, VP Internal Audit (6 direct, ~85 FTE)
- **COO** (1) → reports up: SVP Operations Excellence, SVP Manufacturing Network, SVP Quality, SVP EHS, SVP Customer Operations (5 direct, ~3,800 FTE)
- **CCO (Commercial)** (1) → reports up: President MedSurg, President Dental, President HIS, SVP Global Customer Experience (4 direct, ~4,200 FTE)
- **Chief R&D Officer** (1) → reports up: SVP R&D MedSurg, SVP R&D Dental, SVP R&D HIS, SVP Clinical Affairs, SVP Innovation (5 direct, ~1,800 FTE)
- **CIDO (Chief Information & Digital Officer)** (1) → reports up: VP Enterprise Apps (Workday/SAP/Oracle), VP Cloud & Platform, VP Cyber & Identity, VP Data & AI, VP Digital Customer Experience, VP IT for MedSurg, VP IT for Dental, VP IT for HIS, VP Field & Branch IT, VP PMO & Tech Governance, VP Innovation/Emerging Tech (11 direct, ~2,200 FTE)
- **Chief Legal & Compliance Officer** (1) → VP Regulatory Affairs, VP Quality & Compliance, VP Global Trade & Customs, GC, Chief Privacy Officer (5 direct, ~280 FTE)
- **Chief HR Officer** (1) → SVP Talent, SVP Total Rewards, SVP HR Business Partners, VP DEI (4 direct, ~340 FTE)
- **Chief Strategy Officer** (1) → VP Corporate Development, VP Strategy & Insights, VP M&A Integration (3 direct, ~85 FTE)

**Total ExCo:** 9. **Total VP+ bench:** ~58 named roles. **Total Director-and-above:** ~280. **Role inventory target:** 3,400.

The Packet 21 generator should emit this hierarchy as `03-org/leadership-bench.csv` with 58 VP+ rows and `03-org/org-chart.json` (the explicit hierarchy artifact the Codex transcript already mentioned authoring).

---

## Part 9 — 90-day pilot plan (week-by-week, contracted deliverables)

| Weeks | Workstream | Deliverable | Owner | Status gate |
|---|---|---|---|---|
| 1–2 | Connect | Connectors live: Workday, Coupa, ServiceNow CMDB, Anaplan, Veeva | AbarVa SE + Northstar IT | Data flowing, identity pinned |
| 1–3 | Ingest | Top 100 active contracts + supplier master + BoM/SKU master ingested | Sentinel | 80%+ classification accuracy on test set |
| 4–6 | D1 | AMS-rebid heatmap with named-vendor savings on top 20 contracts | Sentinel | $4M+ identified savings → triggers commit conversation |
| 4–6 | D2 | SBOM + clause-gap report on top 15 SaMD-adjacent vendors | Atlas + Sentinel | 100% of contracts scanned; clause-rewrite recommendations attached |
| 4–6 | D3 | Tariff-exposure model for top 50 SKUs | Sentinel | 3 scenarios per SKU; dual-source capex modeled |
| 7–10 | Execute | One production rebid (~$10M contract) run through Sentinel counter-offer pack | Northstar Procurement + AbarVa | Counter-offer accepted or savings booked |
| 7–10 | Execute | One PCCP draft on a queued submission run through Atlas | Northstar RA + AbarVa | Draft completed in ≤50% of usual cycle time |
| 11–13 | Synthesize | Board-ready ROI memo with audited dollar-savings + production rollout plan | Maestro + Northstar VP-AbarVa | Board pack approved by Northstar ExCo |
| 11–13 | Commit | $750K ARR commit decision | Northstar ExCo | Signed |

---

## Part 10 — The conviction structure (how to defend the 10x–50x out loud)

A CXO will get asked "where's the 10x?" The defensible answer has four legs. State them in this order:

1. **The base is small.** $750K is 0.2–0.3% of our IT operating envelope. A 1% return on what AbarVa touches = 5x. A 3% return = 15x. We're not asking for a 50% return — we're asking for marginal improvement on the slice we focus.

2. **The slice is huge.** The post-separation contracting pipeline alone is $200M+. The tariff exposure is $100–120M. The ERP cutover risk is in the hundreds of millions. AbarVa touches all three. Even single-digit improvements on any one of them clears 10x.

3. **The math has audit.** Every dollar AbarVa books in the pilot D1/D4/D5 is traceable to a specific contract, vendor, or SKU with a citation back to the source document. We're not claiming benefits in a slide; we're booking them in a ledger.

4. **The risk is contained.** $225K is sunk if the pilot fails. $750K commits only after the pilot proves itself. No multi-year prepay, no enterprise license commitment.

The CXO's 30-second pitch to their leadership becomes:

> "We're putting $225K on a 90-day pilot. If they identify $4M of negotiable rebid savings against the post-separation contracting wave — which is exactly the slice they're built for — we'll commit $750K/year. If they don't, we walk. The downside is a quarter and a small check. The upside is a permanent decision-OS for the most strategically important 18 months in our history."

---

## Part 11 — Cross-tenant matrix (now four composites)

| Aspect | Apex Retail (P18) | Meridian Health (P19) | First Capital (P20) | Northstar Clinical Tech (P21–P22) |
|---|---|---|---|---|
| Vertical | Retail | Healthcare IDN | Diversified Financial Services | Medical Technology (post-separation) |
| Tenant key | `apexretail` | `meridian` | `arcturus` | `northstar` |
| Annual revenue | $24.8B | $4.8B net patient | $18.2B | $8.3B (FY25) |
| Employees | 96,000 | 18,400 | 46,000 | 12,700 |
| IT budget | $545M | $215M | $1.85B | $280M–$320M (separation-era volatile) |
| Apps in pack | 120 | 140 | 180 | 240 |
| Integration edges | 320 | 380 | 520 | 820 |
| Initiatives active | 30 | 28 | 32 | 80 |
| Teams | 14 | 16 | 22 | (per org-chart Part 8 above) |
| Roles | 1,420 | 1,650 | 3,400 | 3,400 |
| Vendor contracts | 45 | 50 | 70 | 90 |
| AI tools | 14 | 18 | 22 | (TBD in Packet 21) |
| Retrieval chunks | 280 | 320 | 400 | 720 |
| Verification questions | 12 | 14 | 16 | 16 (Part 6 above) |
| Dominant regulatory regime | PCI-DSS + state | HIPAA + Joint Commission + CMS | OCC + FRB + FDIC + CFPB + SEC + FINRA + BSA/AML | FDA (510(k), PCCP, 524B) + EU AI Act + MDR + tariff regime |
| Distinguishing AI risk | Loyalty/personalization | HIPAA PHI in clinical AI | SR 11-7 + Consent Order | FDA SaMD + EU AI Act Annex I + SBOM |
| Distinguishing transformation | Modernization-blocked | Newly-arrived CDIO | Newly-elevated CDO | Post-separation 1,000-system migration + tariff response + ERP cutover |

---

## Part 12 — Sources backing the $750K business case

- Solventum (NYSE: SOLV) FY25 Q4 earnings (Feb 26, 2026) — $8.325B FY25 revenue, FY26 guide with $100–120M tariff headwind: https://investors.solventum.com/news-events/press-releases/detail/143/
- Solventum 2025 Investor Day Long-Range Plan (March 20, 2025) — 23–25% op margin by 2028, 10% EPS CAGR: https://investors.solventum.com/image/SOLV-2025-IR-Day-Presentation.pdf
- Purification & Filtration sale to Thermo Fisher closed Sept 2, 2025 (~$4.1B; ~$3.4B net proceeds): https://news.solventum.com/2025-09-02-Solventum-Completes-Sale-of-its-Purification-Filtration-Business-to-Thermo-Fisher-Scientific-Inc
- FDA Final Guidance on PCCP for AI-Enabled Devices (Aug 2025): https://www.mcdermottplus.com/insights/fda-issues-final-guidance-on-predetermined-change-control-plans-for-ai-enabled-devices/
- FDA Premarket Cybersecurity §524B Final Guidance (June 27, 2025) + False Claims Act exposure: https://www.morganlewis.com/blogs/asprescribed/2025/11/
- EU AI Act × MDR compliance: https://meddeviceguide.com/blog/eu-ai-act-medical-devices-compliance-guide
- Medtech tariff impact baseline ($200–450M per large medtech; 62% of US devices imported): https://www.medtechdive.com/news/one-year-in-how-medtech-companies-are-coping-with-tariff-challenges/816982/
- Forrester TEI on Copilot-class deployments (376% ROI, <6 months payback, 55% task speedup)
- McKinsey-Merck CSR pilot (180h→80h, 50% fewer errors, 40% faster end-to-end)
- Quality AI case studies (optiQMS 57% efficiency gain): https://www.myqms.ai/post/case-study-ai-assisted-complaints-review-improving-accuracy-while-achieving-a-57-efficiency-gain
- Application-portfolio rationalization (AWS/NorthBay — assessment 50% faster, $23M savings example): https://aws.amazon.com/blogs/apn/application-portfolio-rationalization-using-generative-ai-with-northbay-solutions/
- Zylo 2025 SaaS waste benchmark (53% of licenses unused)
- Gartner 2025 worldwide IT spending forecast (9.8% growth, $6T+): https://www.gartner.com/en/newsroom/press-releases/2025-10-22-gartner-forecasts-worldwide-it-spending-to-grow-9-point-8-percent-in-2026-exceeding-6-trillion-dollars

---

## Part 13 — Consulting + SI displacement (the simplest CXO story)

The procurement / tariff / engineering-productivity argument is technically defensible but it's an *operator* argument. For a VP or CXO defending the spend to their leadership, there's a simpler, more intuitive frame that lands harder: **AbarVa replaces or substantially reduces the spend on management consultants and Systems Integrators that we'd otherwise sign for the same work.**

### 13.1 — Strategy consulting displacement (the McKinsey/BCG/Bain line item)

**What we'd otherwise buy.** A Tier-1 management consulting engagement to define an "AI strategy and roadmap" for a Northstar-class medtech ($8B revenue, mid-separation, three segments, regulated-SaMD product portfolio) lands in the $3–8M range for a single 12–20-week engagement. Add 1–2 follow-on engagements per year (segment-specific deep-dives, board-prep work, M&A AI due diligence) and the steady-state line item is **$5–15M/year**.

**What that engagement actually produces** — and what AbarVa replaces:

| Consultant deliverable | What it actually is | AbarVa equivalent |
|---|---|---|
| AI opportunity assessment / heatmap | 30–50 use cases scored on impact × feasibility | Atlas pattern catalog rendered against Northstar's actual substrate (apps, contracts, BoM, regulatory landscape) |
| Target operating model | Org-design + governance for AI investment decisions | Maestro decision-OS — every AI investment goes through the same evidence-graded workflow with citation trail |
| Reference architecture | Vendor-agnostic technology stack recommendations | Sentinel benchmarks + clause-extraction pattern; surfaces what peers actually buy with real rate cards |
| Business cases for top initiatives | 5–10 use-case NPV / ROI / payback models | Atlas program-intel pattern — every Move has a live business case linked to current substrate |
| Implementation roadmap | 18-month plan with phases, dependencies, investment | Sequencing engine across the Source / Moves / Tower modules with dependency-graph reasoning |
| Change-management playbook | Org-readiness, training, incentives | Atlas adoption-tracking pattern on Copilot-class rollouts (the Forrester TEI work feeds straight in) |

**Year-one displacement.** Avoiding **one** $5M McKinsey AI-strategy engagement and **one** $2M follow-on segment dive is enough to clear **9x payback on $750K** before any other lever. Steady-state ($5–15M/year of consulting-fee avoidance) puts displacement alone at **7x–20x**.

**Where consultants still earn their fee** — and where AbarVa doesn't try to replace them:
- Board / activist / regulatory negotiation (people work, not platform work).
- M&A due diligence on a specific target where confidentiality of the target matters more than evidence rigor.
- Industry-wide trend reports that don't need tenant-specific grounding.
- Crisis interventions (consent order, FDA warning letter, supply-chain rupture) where speed and senior-partner-by-the-hour beats platform.

The defensible AbarVa frame: **we replace the strategy work that should have been built on your own data anyway, not the relationship work that consultants are actually best at.**

### 13.2 — Systems Integrator execution displacement (the Accenture/Deloitte/Wipro/Cognizant line item)

**What we'd otherwise pay.** A separation-era medtech runs **$50–200M/year** of SI execution across (a) ERP cutover (we just heard the Feb 2026 APAC + EU rollout — Solventum is mid-program), (b) AMS for the legacy app portfolio, (c) AI/data platform builds, (d) cyber + identity programs, (e) regulatory-systems modernization. At a typical large medtech, this line is the single biggest discretionary IT cost.

**Where AbarVa cuts 20–30% off that line:**

| SI cost-driver | What's wrong today | AbarVa fix |
|---|---|---|
| **Scope inflation.** SI proposes 80-FTE engagement; only 50 are needed. | No independent counterfactual exists. | Sentinel multi-vendor benchmark + similar-scope pattern surfaces what peers actually paid + staffed for equivalent scope. Procurement gets a defensible counter-offer. |
| **Over-engineered architecture.** Reference architecture is built to maximize SI burn, not customer outcome. | No tenant-specific benchmark of "what worked." | Atlas architecture-pattern catalog surfaces 3–5 production-proven architectures from the corpus, each with a build cost band and a known-failure list. The SI's reference architecture becomes one option, not the only option. |
| **Underestimated complexity.** Estimate misses 30% of the actual work; the change-orders consume 25–40% of the original contract value. | Estimate is built once at proposal time; nobody re-grounds it as the work progresses. | Atlas estimate-tracking pattern — every milestone gets re-estimated against the current substrate; deviation > 10% triggers a re-plan event, not a change order. |
| **Wrong agent/human mix.** SI staffs a 30-FTE pyramid because that's their billing model. 12 FTE + AbarVa agents would do the same work. | No platform alternative for the "thinking" work (architecture, design, testing, regulatory artifacts, change management). | Maestro orchestrates the agent + human mix on each workstream. The SI's billable hours drop because the platform absorbs the routine decision-making and document generation. |
| **Vendor lock-in via implementation choices.** Architecture decisions favor the SI's preferred technology partner. | Procurement doesn't see those choices until the contract amendment lands. | Sentinel clause-extraction pattern flags lock-in language at design time, before the SOW is signed. |

**Year-one math.** Assume Northstar is signing one $50M SI execution wave in the pilot window (conservative — they're mid-ERP-rollout and mid-system-migration). **20% reduction = $10M / 13x payback** on $750K. **30% reduction = $15M / 20x.** Across the full $100M+ steady-state SI envelope, the displacement compounds.

**Where the math is most live for Northstar specifically:** the 90% TSA-exit target for end-2026, which forces ~$30–50M of net-new SI commitments in the pilot window. Sentinel scope-and-architecture review on each new SOW is the most-defensible single application of AbarVa during the pilot.

### 13.3 — Solution-engineering quality (the failure-avoidance lever, reframed)

The first version of this packet led with "failure avoidance" (80% of AI projects fail to reach production). The user feedback: lead with cost-offset instead, because failure-avoidance is intangible until it happens to you, while consulting/SI bills are visible to the CFO every month.

Reframed as cost-offset: **AbarVa ensures the AI strategy decision, target architecture, business case, and implementation plan are all built on the same grounded substrate** — your apps, your contracts, your suppliers, your regulatory exposure, your existing in-flight programs. That alignment is the actual source of the 20–30% execution cost reduction. The SI can't pad the estimate when the platform already knows the historical run-rate. The architecture review can't recommend an over-engineered stack when the platform already shows what 3 peers shipped. The business case can't be inflated when every NPV input traces to a citation.

In other words: **the "right approach, solution, estimate, architecture, business case" outcome is the cost-offset outcome.** They're the same lever stated two different ways. For the CXO pitch, lead with the cost-offset framing.

### 13.4 — Updated 10x–50x stack with displacement as the lead

| Lever | Conservative year-1 | Aggressive | Best evidence |
|---|---|---|---|
| **Strategy-consulting displacement** (avoid 1–2 Tier-1 engagements/year) | **$5M / 7x** | **$15M / 20x** | Typical Tier-1 medtech AI-strategy engagement $3–8M per cycle; 1–2 cycles/year |
| **SI execution displacement** (20–30% on $50–100M of SI commitments in pilot window) | **$10M / 13x** | **$30M / 40x** | Industry-standard 20–30% scope/architecture/estimate compression on enterprise programs |
| AMS / SaaS rebid on $200M post-separation pipeline | $8M / 11x | $30M / 40x | Zylo 53% SaaS-unused; AWS/NorthBay app-rat 50% faster |
| Engineering productivity on 800-engineer SaMD org | $7.2M / 10x | $21M / 28x | Forrester TEI Copilot 376% ROI |
| Tariff scenario AI on disclosed $100-120M 2026 headwind | $5–6M / 7x | $20–24M / 30x | Solventum FY26 guide |
| Regulatory cycle compression on next 5–10 submissions | $3–6M / 5x | $6–12M / 14x | McKinsey-Merck CSR 40% compression |
| **Combined floor** | **$38M ≈ 51x** | | |
| **Combined stretch** | | **$122M ≈ 163x** | |

The combined floor now passes 50x **on its own**, without any single lever needing to perform at its aggressive case. That's the point. We don't need every lever to fire — we need any two of the displacement levers plus one operational lever to clear 50x.

### 13.5 — Updated CXO 30-second pitch with displacement lead

> "We're putting $225K on a 90-day pilot. The first question we answer is whether AbarVa lets us avoid the next $5M McKinsey AI-strategy check — it almost certainly does, because the deliverable they'd produce is exactly what the platform produces against our own data. The second question is whether it lets us cut 20–30% off the next $50M wave of SI execution we're already committed to — also almost certainly, because the platform surfaces scope inflation, over-engineered architecture, and lock-in clauses before the SOW is signed. If we land on either of those two, we've already cleared 10x. If we land on both, we've cleared 50x. The $750K commit is roughly half a McKinsey week."

---

## Out of scope for this packet

- Real customer NPI of any kind — the entire pack is composite.
- The actual data files for the Northstar substrate — Packet 21 handles those; this packet specifies what they must contain (Parts 2, 5, 7, 8).
- Pricing negotiation with Solventum — this is the pattern overlay and the conviction math, not a sales contract.
- Anything that names the real Solventum executives or programs by their real names — the tenant must remain Northstar in every artifact.
