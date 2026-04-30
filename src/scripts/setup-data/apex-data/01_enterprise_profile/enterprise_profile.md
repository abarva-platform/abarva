# Apex Retail Group — Enterprise Profile

**Tenant key:** `apex-retail`
**Last updated:** 2026-04-15
**Reviewed by:** Margaret Chen, CFO
**Data classification:** Internal

## Identity

| Field | Value |
|---|---|
| Legal name | Apex Retail Group, Inc. |
| Ownership type | Public (NYSE: APXR) |
| Headquarters | Columbus, Ohio |
| Year founded | 1987 |
| Industry | Specialty retail — apparel, home, lifestyle |
| NAICS | 448140 (primary), 442299, 454110 |
| Fiscal year | February — January (retail standard) |
| Current FY | FY2026 (Feb 2026 – Jan 2027) |
| Last 10-K filed | March 14, 2026 |

## Scale

| Metric | FY2025 actual | FY2024 actual | FY2023 actual |
|---|---|---|---|
| Revenue | $2.41B | $2.38B | $2.29B |
| Adjusted EBITDA | $284M | $312M | $305M |
| EBITDA margin | 11.8% | 13.1% | 13.3% |
| Net income | $97M | $134M | $128M |
| Total employees (full-time equiv) | 5,247 | 5,182 | 5,021 |
| Stores (North America) | 342 | 348 | 351 |
| E-commerce % of revenue | 31% | 27% | 22% |
| Loyalty member count | 14.2M | 12.8M | 11.1M |

## Geographic footprint

- 340 retail stores across 41 US states + 2 Canadian provinces
- Distribution centers in Columbus OH (primary), Reno NV (West coast), and Atlanta GA (Southeast)
- E-commerce fulfillment from Columbus DC + 2 third-party 3PL providers
- Corporate offices: Columbus OH (HQ), New York NY (creative + merchandising), Bangalore India (technology center, ~180 employees)

## Strategic priorities — FY2026

These are the 5 priorities communicated in the FY2026 strategic plan presented to the Board in January 2026:

1. **Restore margin to FY2024 levels.** EBITDA margin compressed 130bp YoY in FY2025 driven by markdowns, e-commerce shipping cost, and digital marketing inflation. Target: recover 80bp in FY2026.
2. **Scale digital channel profitability.** E-commerce share growth is healthy but contribution margin lags stores by ~600bp. Investment in fulfillment automation, returns reduction, and acquisition-cost discipline.
3. **Customer experience differentiation.** Specialty retail competition is increasingly platform-driven (Amazon, Shopify-backed DTC). Apex's bet is on owned-experience differentiation enabled by customer data activation.
4. **Inventory productivity recovery.** Inventory turn declined from 4.2 in FY2023 to 3.6 in FY2025. Drivers include forecast accuracy degradation post-pandemic and store-level allocation drift.
5. **AI-enabled productivity.** Stated commitment to "AI literacy and adoption across operating functions." Specific use cases under evaluation: customer service deflection, demand forecasting, content production, store labor optimization.

## Active transformation portfolio (high-level)

The Board is briefed on these 4 active programs at quarterly cadence. Detailed program data is in `06_program_inventory/`.

1. **CDP Activation 2026** (`apex-cdp-2026`) — customer data unification + activation across channels
2. **Contact Center AI** (`apex-cc-ai-2026`) — call deflection + agent assist
3. **AMS Consolidation 2026** (`apex-ams-consolidation-2026`) — application portfolio rationalization
4. **Demand Forecasting Modernization** (`apex-forecast-2026`) — SKU-store-week forecast accuracy

## Regulatory posture

Apex is regulated as a public company and a multi-channel retailer. Applicable frameworks:

- **SOX** — public company, full ICFR program; PCAOB-registered auditor (Deloitte). Latest 10-K filed clean.
- **PCI-DSS** — Level 1 merchant; latest assessment November 2025, no material findings.
- **GDPR** — limited UK customer base via international shipping (~2% of e-commerce revenue); compliant via standardized DSR program.
- **CCPA / CPRA** — California operations; full compliance program; ~340K Do-Not-Sell requests processed in FY2025.
- **State privacy patchwork** — CO, CT, VA, UT, IA, IN, TN, TX, OR, MT, FL, DE, NJ, NH, KY, MN, MD, RI laws all in scope; managed via OneTrust platform.
- **State sales tax** — Wayfair-era full nexus across 41 states + remote-seller obligations.
- **FCRA** — applies to credit decisions on the Apex co-branded credit card (issued by Synchrony); compliance owned by Synchrony.
- **CAN-SPAM / CASL / Canadian provincial** — marketing email compliance.
- **California Prop 65** — product labeling compliance for home/lifestyle categories.

**Pending regulatory developments being tracked:**

- Federal privacy legislation (APRA): preparation for potential federal preemption.
- FTC AI rulemaking: potential applicability to recommendation systems and pricing AI.
- New York Local Law 144 (AI in employment): applies to hiring AI; under review for relevance.

## Data classification policy

Apex's information classification policy (last revised October 2024):

| Tier | Definition | Examples | Storage rules |
|---|---|---|---|
| Public | Already disclosed publicly | 10-K filings, press releases | No special handling |
| Internal | Not externally disclosed; broad internal access OK | Org chart, internal financial trends | Apex-managed systems only |
| Confidential | Need-to-know basis; requires data classification training | Customer PII, employee PII, supplier pricing | Approved systems only; encryption at rest required |
| Restricted | Highest sensitivity; access logged | Cardholder data, undisclosed M&A material, board materials | PCI-scoped systems only; no cloud storage outside approved providers |

**Known compliance gap:** Marketing's use of Klaviyo for email campaigns includes customer email addresses (Confidential) but Klaviyo is not on the approved-systems list for Confidential data. Identified during the November 2025 PCI assessment as out-of-scope for PCI but within scope for general policy compliance. Marketing has a remediation plan with target date Q2 FY2026; tracking owner: Sarah Whitfield (CISO).

## Risk appetite

The Board's risk appetite statement (last reaffirmed October 2025):

> Apex Retail Group operates with a moderate-low risk appetite for operational, financial, regulatory, and brand risks. The Company will accept higher risk in service of strategic differentiation when (a) the upside materially exceeds the downside in plausible scenarios; (b) the failure mode is recoverable; and (c) appropriate controls and reversibility are designed before commitment. AI investments and customer-data initiatives are explicitly governed under this elevated-but-controlled framework.

In practice, this means: AI use cases that touch customer experience are within appetite; AI use cases that touch hiring decisions, pricing personalization, or financial reporting require additional Board notification.

## ESG posture

Apex publishes an annual sustainability report (latest: April 2026). Headline commitments:

- Net-zero Scope 1+2 emissions by 2035 (committed 2022; on track)
- 100% renewable electricity in DCs and corporate offices by 2028
- 50% of cotton from regenerative or recycled sources by 2030 (currently 23%)
- Ethical sourcing audit on 100% of tier-1 suppliers (currently 91%)
- Living wage commitment for direct US employees (achieved 2024)

ESG governance: Sustainability Committee chaired by Chief Sustainability Officer (Patricia Okonkwo), reports to Board's Nominating & Governance Committee.

## Recent context worth knowing

- **Q4 FY2025 earnings miss.** Reported March 2026. Margin pressure attributed to digital marketing inflation and markdown depth in apparel. Stock dropped 14% on the print; recovered 6% over following month.
- **CDO transition.** Lynne Stratham joined as Chief Data Officer in October 2025, replacing Marcus Holloway who left in July 2025 for personal reasons that were not publicly explained. Lynne came from a national grocery chain; brings strong data-foundations background; less retail-specific operational experience.
- **AMS consolidation second attempt.** The current AMS Consolidation 2026 program is the second attempt. The 2023-2024 attempt was paused after vendor selection due to scope expansion and an estimated $14M overrun. Lessons-learned document on file in `02_org_structure/change_failure_record.md`.
- **Activist investor on register.** Stoneridge Capital Partners disclosed a 4.8% position in February 2026; has met privately with management twice; public position has not yet shifted. Watching for proxy implications at FY2026 annual meeting (June 2026).

---

**File metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.92
- Last reviewed by: Margaret Chen, CFO
- Last reviewed at: 2026-04-15
- Next review: 2026-07-15
