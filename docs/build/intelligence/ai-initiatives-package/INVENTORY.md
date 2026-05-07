# AI Initiatives Inventory · 21 Initiatives Across 3 Tenants

This is the canonical list. Every initiative has: name, ID, primary category, business goal, stage, owner, committed $, current status, plain-language description, and an `aligned_callout` flag for the two highest-strategic-value initiatives per tenant.

---

## APEX RETAIL · 7 initiatives

**Tenant context:** $4.2B revenue · omnichannel retailer · 412 stores · digital growing 18% YoY · margin compression from value players · D. Park as CFO

### AR-01 · Store Associate Copilot
- **ID:** `apex-llm-copilot-2025`
- **Category:** CAT-01 · LLM Productivity
- **Business goal:** Reduce associate ramp time and improve floor coverage
- **Stage:** Pilot (8 stores)
- **Owner:** L. Tanaka · VP Store Operations
- **Committed:** $1.6M annual
- **Status:** Adoption gap (32% active vs 70% target)
- **Aligned callout:** No
- **Description:** Microsoft 365 Copilot deployed to 1,400 associates in 8 pilot stores. Use cases: shift handoff notes, customer return policy lookup, training Q&A. Pilot started Q4 2025; expansion gated on adoption metrics.

### AR-02 · GitHub Copilot for Engineering
- **ID:** `apex-sdlc-github-copilot-2025`
- **Category:** CAT-02 · Developer & IT SDLC AI
- **Business goal:** Accelerate digital commerce platform velocity
- **Stage:** Scaled (340 engineers)
- **Owner:** R. Chen · CTO
- **Committed:** $0.9M annual
- **Status:** Healthy (PR cycle time down 22%)
- **Aligned callout:** No
- **Description:** GitHub Copilot for the engineering org. Strongest measured value in the portfolio — clear PR cycle time reduction, developer satisfaction +18 NPS. Renewal Q3 2026 expected straightforward.

### AR-03 · Autonomous Customer Service Agent
- **ID:** `apex-agentic-cx-2026`
- **Category:** CAT-03 · Agentic Operations
- **Business goal:** Containment + cost-to-serve reduction in contact center
- **Stage:** Pilot (40% of inbound chat)
- **Owner:** M. Reyes · VP Customer Care
- **Committed:** $2.1M annual
- **Status:** Containment 47% (target 65%); escalation quality concerns
- **Aligned callout:** Yes ⭐ — directly tied to "improve cost-to-serve while protecting CX"
- **Description:** Sierra-based autonomous agent for chat. Handling returns, order status, basic policy questions. Escalation to human at confidence threshold. Q2 2026 governance review will determine voice expansion.

### AR-04 · SAP Joule for Merchandise Planning
- **ID:** `apex-erp-joule-merch-2025`
- **Category:** CAT-04 · ERP & Domain Agents
- **Business goal:** Reduce stock-out and overstock simultaneously
- **Stage:** Year 1 of 2 rollout
- **Owner:** K. Singh · Chief Merchandising Officer
- **Committed:** $3.4M committed (multi-year)
- **Status:** Value lag — measured $0.8M against $1.4M target after 9 months
- **Aligned callout:** No
- **Description:** SAP Joule embedded in merch planning workflows. Demand sensing, allocation suggestions, markdown timing. Value lag attributed to slower-than-planned data integration with POS.

### AR-05 · Demand Forecasting Modernization
- **ID:** `apex-ml-demand-forecast-2024`
- **Category:** CAT-05 · Predictive ML
- **Business goal:** Improve in-stock rate · reduce inventory carrying cost
- **Stage:** Scaled (all categories)
- **Owner:** P. Anand · VP Supply Chain
- **Committed:** $0.7M annual platform
- **Status:** Healthy · forecast accuracy +12% YoY
- **Aligned callout:** Yes ⭐ — anchor of the supply chain transformation thesis
- **Description:** ML demand forecasting modernized from legacy ARIMA to gradient-boosted + transformer hybrid. Live across all 23 categories. Forecast accuracy improvement is the most-cited ROI in the AI portfolio.

### AR-06 · AI Cost Attribution Platform
- **ID:** `apex-infra-finops-ai-2026`
- **Category:** CAT-06 · AI Infrastructure & FinOps
- **Business goal:** Make AI spend attributable to business outcomes
- **Stage:** Pilot
- **Owner:** D. Park · CFO
- **Committed:** $0.4M annual
- **Status:** Pilot · attribution coverage 38% of AI spend
- **Aligned callout:** No
- **Description:** LiteLLM + Helicone stack for token-level attribution across all LLM-using initiatives. Will eventually attribute every dollar of AI spend to a business outcome. Pilot covers 4 of 7 AI initiatives.

### AR-07 · Personalization Engine v3
- **ID:** `apex-customer-personalization-2024`
- **Category:** CAT-07 · Customer-Facing AI
- **Business goal:** Increase digital revenue per session · improve repeat purchase rate
- **Stage:** Scaled (web + app + email)
- **Owner:** J. Wright · Chief Digital Officer
- **Committed:** $2.8M annual
- **Status:** Healthy · digital revenue per session +9% YoY
- **Aligned callout:** No
- **Description:** Personalization engine modernized to LLM-augmented recommendations. Drives product surfacing, email content, push notifications. Strong measured value; renewal of underlying ML platform contract due Q1 2027.

---

## FIRST CAPITAL FINANCIAL · 7 initiatives

**Tenant context:** Regional bank · $48B AUM · 142 branches · NIM compression accelerating · regulatory bar tightening (SR 11-7, FFIEC AI guidance) · E. Brooks as Chief Strategy Officer

### FCF-01 · M365 Copilot for Knowledge Workers
- **ID:** `fcf-llm-m365-copilot-2025`
- **Category:** CAT-01 · LLM Productivity
- **Business goal:** Productivity uplift in middle / back office
- **Stage:** Pilot (1,200 of 4,800 knowledge worker seats)
- **Owner:** S. Lin · CHRO
- **Committed:** $1.4M annual
- **Status:** Adoption mixed (Finance 67% · Legal 58% · IT 22%)
- **Aligned callout:** No
- **Description:** M365 Copilot deployed selectively. Finance and Legal driving adoption; IT and Operations underwhelming. Q3 2026 expansion decision gated on per-function ROI study.

### FCF-02 · AI-Assisted Code Review for Risk Engineering
- **ID:** `fcf-sdlc-code-review-2026`
- **Category:** CAT-02 · Developer & IT SDLC AI
- **Business goal:** Reduce model deployment cycle time without weakening review rigor
- **Stage:** Pilot (Risk Engineering team only · 38 engineers)
- **Owner:** M. Chen · CDO
- **Committed:** $0.3M annual
- **Status:** Pilot · cycle time -28%, review depth maintained
- **Aligned callout:** No
- **Description:** Cursor + custom rules for risk engineering team. Initially scoped narrowly because of model risk governance concerns. Expansion to broader engineering pending CISO sign-off.

### FCF-03 · Advisor Decision-Support AI
- **ID:** `fcf-agentic-advisor-2025`
- **Category:** CAT-03 · Agentic Operations
- **Business goal:** Increase advisor productivity in branches
- **Stage:** Pilot (28 branches in 3 metros)
- **Owner:** R. Khan · EVP Wealth & Branch
- **Committed:** $1.1M annual
- **Status:** Productivity +14% in pilot · expansion paused pending governance
- **Aligned callout:** No
- **Description:** AI overlay for branch advisors. Pulls relevant client context, suggests products, drafts follow-up communications. Productivity gains real but expansion paused waiting on the model governance operating model decision.

### FCF-04 · Credit Decisioning Modernization
- **ID:** `fcf-ml-credit-decisioning-2026`
- **Category:** CAT-05 · Predictive ML
- **Business goal:** Defend NIM through better risk-adjusted pricing
- **Stage:** Strategic bet · Year 1 of 2
- **Owner:** K. Nakamura · CRO
- **Committed:** $4.6M committed (multi-year)
- **Status:** Foundation phase · model build underway
- **Aligned callout:** Yes ⭐ — explicitly named as the highest-impact Move on the table per AI trajectory
- **Description:** Modernization of consumer credit decisioning models from legacy logistic regression to gradient-boosted + alternative-data ensemble. Single biggest AI investment in the portfolio. Tied directly to NIM compression mitigation thesis.

### FCF-05 · Fraud Detection AI Refresh
- **ID:** `fcf-ml-fraud-2025`
- **Category:** CAT-05 · Predictive ML
- **Business goal:** Reduce fraud losses · improve customer experience by reducing false positives
- **Stage:** In Strategic Move (P1 Charter · M-FCF-009)
- **Owner:** K. Nakamura · CRO
- **Committed:** $2.2M annual platform
- **Status:** Existing program · refresh in flight
- **Aligned callout:** No
- **Description:** Fraud detection model refresh with newer architecture. Currently in P1 Charter as a Strategic Move. Platform-grade investment with defined business case.

### FCF-06 · Conversational Banking Assistant
- **ID:** `fcf-customer-conv-banking-2026`
- **Category:** CAT-07 · Customer-Facing AI
- **Business goal:** Reduce contact center burden · improve digital banking NPS
- **Stage:** Pilot (10% of digital banking traffic)
- **Owner:** L. Pereira · Chief Digital Officer
- **Committed:** $1.7M annual
- **Status:** Pilot · containment 34% (target 60%)
- **Aligned callout:** No
- **Description:** AI conversational interface in digital banking app. Account inquiries, transaction lookups, basic servicing. Pilot scaling slowly; containment below target attributed to limited use-case coverage.

### FCF-07 · Model Risk Governance Operating Model
- **ID:** `fcf-governance-mrm-2026`
- **Category:** CAT-08 · Compliance & Governance AI
- **Business goal:** Achieve SR 11-7 compliance posture for AI models · unblock 4 stalled model deployments
- **Stage:** In progress · Q1 2026 → Q4 2026
- **Owner:** Conflict (CDO · M. Chen vs CIO · J. Park)
- **Committed:** $0.8M annual + governance build
- **Status:** Stalled · CDO–CIO conflict unresolved 3 quarters
- **Aligned callout:** Yes ⭐ — blocker for 4 other initiatives; regulatory urgency rising
- **Description:** Operating model for who owns model risk across the bank. Currently contested between CDO and CIO. Until resolved, model deployment cadence is blocked. Regulatory bar from SR 11-7 makes this urgent rather than optional.

---

## MERIDIAN HEALTH · 7 initiatives

**Tenant context:** Health system · 8 hospitals · 142 clinics · margin pressure post-COVID · workforce shortage · regulatory complexity (HIPAA, CMS) · M. Castillo as CFO

### MH-01 · Clinical Documentation Copilot
- **ID:** `meridian-llm-clinical-doc-2025`
- **Category:** CAT-01 · LLM Productivity
- **Business goal:** Reduce physician documentation burden · address burnout
- **Stage:** Scaled (3 hospitals · 1,800 physicians)
- **Owner:** Dr. A. Hassan · CMIO
- **Committed:** $4.1M annual
- **Status:** Healthy · physician satisfaction +21 points
- **Aligned callout:** Yes ⭐ — flagship initiative · physician retention thesis anchor
- **Description:** Ambient AI scribe (Nuance DAX or equivalent) deployed to physicians. Strongest qualitative impact in the portfolio — physician satisfaction is the #1 board-level metric. Expansion to remaining 5 hospitals planned for FY26.

### MH-02 · Vibe Coding Rollout for IT
- **ID:** `meridian-sdlc-cursor-2026`
- **Category:** CAT-02 · Developer & IT SDLC AI
- **Business goal:** IT velocity to support clinical platform modernization
- **Stage:** Pilot (24 of 180 IT engineers)
- **Owner:** P. Iyer · CTO
- **Committed:** $0.4M annual
- **Status:** Pilot · early signals positive · CISO review pending
- **Aligned callout:** No
- **Description:** Cursor (vibe coding) deployed to platform engineering team. Pilot scoped to non-PHI codebases initially. Expansion to clinical-adjacent codebases gated on CISO review of code-leak risk.

### MH-03 · Autonomous Helpdesk via ServiceNow
- **ID:** `meridian-agentic-now-assist-2026`
- **Category:** CAT-03 · Agentic Operations
- **Business goal:** Reduce IT helpdesk burden · address staff churn in service desk
- **Stage:** Pilot (IT support only · expanding to clinical IT requests)
- **Owner:** J. Park · Steward
- **Committed:** $0.9M annual (Now Assist licensing)
- **Status:** Duplication conflict with M365 Copilot for similar use cases
- **Aligned callout:** No
- **Description:** ServiceNow Now Assist for IT helpdesk. Auto-resolution of password resets, access requests, basic config issues. Currently in "P-DUPL-2026-02" pressure due to overlap with M365 Copilot. ServiceNow renewal Q4 2026.

### MH-04 · Epic AI for Revenue Cycle
- **ID:** `meridian-erp-epic-revcycle-2025`
- **Category:** CAT-04 · ERP & Domain Agents
- **Business goal:** Reduce denied claims · accelerate cash collection
- **Stage:** Year 1 of 2
- **Owner:** S. Williams · CFO Revenue Cycle
- **Committed:** $2.6M committed (multi-year)
- **Status:** Mid-deployment · denials reduction tracking 8% (target 15%)
- **Aligned callout:** Yes ⭐ — directly tied to margin recovery thesis
- **Description:** Epic AI features for revenue cycle: prior auth automation, denial prediction, claim scrubbing. Tied directly to margin recovery thesis (post-COVID financial recovery). Performance currently below target but trajectory positive.

### MH-05 · Clinical Risk Stratification ML
- **ID:** `meridian-ml-clinical-risk-2024`
- **Category:** CAT-05 · Predictive ML
- **Business goal:** Identify high-risk patients earlier · improve outcomes · reduce readmissions
- **Stage:** Scaled (system-wide)
- **Owner:** Dr. R. Kim · Chief Quality Officer
- **Committed:** $0.6M annual platform
- **Status:** Healthy · readmission rate -7%
- **Aligned callout:** No
- **Description:** Risk stratification models for inpatient population. Live system-wide. Mature program; mostly maintenance + incremental model updates. Strong outcomes attribution.

### MH-06 · Joule (SAP) Pilot for Finance
- **ID:** `meridian-llm-sap-joule-2025`
- **Category:** CAT-04 · ERP & Domain Agents (secondary: CAT-01)
- **Business goal:** Finance team productivity · close-cycle acceleration
- **Stage:** Pilot · finance only
- **Owner:** SAP COE
- **Committed:** $3.2M annual (committed) · $1.4M measured value at 9 months
- **Status:** Value lag (P-VALUE-2026-05 pressure)
- **Aligned callout:** No
- **Description:** SAP Joule for finance team workflows. The "Joule rollout" referenced in current Tower pressure cards. Value lag attributed to slower-than-planned RPA pipeline migration. Re-baseline expected at next governance review.

### MH-07 · Model Governance & FinOps Platform
- **ID:** `meridian-infra-governance-finops-2026`
- **Category:** CAT-06 · AI Infrastructure & FinOps (secondary: CAT-08)
- **Business goal:** Make AI spend visible · enable governance posture for HIPAA + SR-equivalent
- **Stage:** Year 1 of 3 · strategic bet
- **Owner:** P. Iyer · CTO (governance) · M. Castillo · CFO (finops)
- **Committed:** $4.2M committed (multi-year platform investment)
- **Status:** Foundation phase · attribution coverage low
- **Aligned callout:** No
- **Description:** Platform investment for AI cost attribution + model governance. The "Agent platform foundation" referenced in current Tower strategic bets. Won't show measured value until programs migrate onto platform.

---

## Summary table · all 21

| ID | Tenant | Category | Stage | $ committed | Aligned ⭐ |
|---|---|---|---|---|---|
| AR-01 | Apex | LLM Productivity | Pilot | $1.6M | |
| AR-02 | Apex | Developer SDLC | Scaled | $0.9M | |
| AR-03 | Apex | Agentic Ops | Pilot | $2.1M | ⭐ |
| AR-04 | Apex | ERP Agents | Y1 of 2 | $3.4M | |
| AR-05 | Apex | Predictive ML | Scaled | $0.7M | ⭐ |
| AR-06 | Apex | AI Infra/FinOps | Pilot | $0.4M | |
| AR-07 | Apex | Customer-Facing | Scaled | $2.8M | |
| FCF-01 | FCF | LLM Productivity | Pilot | $1.4M | |
| FCF-02 | FCF | Developer SDLC | Pilot | $0.3M | |
| FCF-03 | FCF | Agentic Ops | Pilot | $1.1M | |
| FCF-04 | FCF | Predictive ML | Y1 of 2 | $4.6M | ⭐ |
| FCF-05 | FCF | Predictive ML | In Move | $2.2M | |
| FCF-06 | FCF | Customer-Facing | Pilot | $1.7M | |
| FCF-07 | FCF | Compliance & Gov | In progress | $0.8M | ⭐ |
| MH-01 | Meridian | LLM Productivity | Scaled | $4.1M | ⭐ |
| MH-02 | Meridian | Developer SDLC | Pilot | $0.4M | |
| MH-03 | Meridian | Agentic Ops | Pilot | $0.9M | |
| MH-04 | Meridian | ERP Agents | Y1 of 2 | $2.6M | ⭐ |
| MH-05 | Meridian | Predictive ML | Scaled | $0.6M | |
| MH-06 | Meridian | ERP Agents (LLM) | Pilot | $3.2M | |
| MH-07 | Meridian | AI Infra/FinOps | Y1 of 3 | $4.2M | |

**Totals:**
- 21 initiatives across 8 categories across 3 tenants
- $39.2M total committed across all initiatives
- 6 ⭐ aligned-callouts (2 per tenant)
- Stage mix: 11 Pilot · 5 Scaled · 4 multi-year strategic bets · 1 in Strategic Move
