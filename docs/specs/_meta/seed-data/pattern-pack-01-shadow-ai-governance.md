# Shadow AI Governance · Foundational Pattern Pack #1

**Pattern pack number 1 of 20 foundational packs. Cross-industry. Applies to all four composite tenants and every future AbarVa tenant. This is the reference implementation — the template for authoring the other 19 foundational packs at full north star Part 6 schema depth.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star (Part 6 defines pattern pack schema)
- Per-tenant intelligence layer overlays (linked pattern instantiation)

---

## Part 1 · Pattern Identity

**ID:** `pattern_shadow_ai_governance`
**Name:** Shadow AI Governance
**Short description:** AI adoption outpacing enterprise governance, creating compounding compliance, data, security, and cost risk.
**Long description:** Enterprise employees and teams are adopting AI tools — through direct procurement, embedded vendor features, and personal-account usage — faster than the enterprise's governance framework can catalog, assess, and control. The result is a gap between stated AI policy and observed AI practice, leading to data exposure risk, regulatory compliance gaps, integration and consolidation inefficiency, shadow-spend accumulation, and model risk unmonitored in customer-facing or decision-critical contexts.

The pattern is near-universal in enterprises with more than 500 employees as of 2026. It manifests differently by sector but carries the same structural drivers and requires the same architectural response.

---

## Part 2 · Classification

**Category:** AI Governance and Technology Sprawl
**Cross-industry:** Yes — every sector exhibits this pattern
**Sector applicability:** All sectors. Sector-specific variants detailed in Part 12.
**Variant of:** None (this is a foundational pattern)
**Related patterns:** Cybersecurity Maturation (#10), Vendor Sprawl and Tool Rationalization (#6), Analytics Modernization (#2), Operating Model Decision-Latency Reduction (#7)

---

## Part 3 · Detection

### 3.1 · Trigger symptoms

- AI tool proliferation noticeable across business units without central inventory
- Procurement requests below threshold for AI-specific governance review surfacing repeatedly
- Security incidents or near-misses involving AI tools not previously inventoried
- Legal or compliance concerns raised about specific AI uses without architectural response
- Cost center reviews surfacing AI-category spend not in technology budget
- Customer complaints or regulator questions about AI use without ready institutional answer
- AI governance policy written but enforcement mechanisms unclear

### 3.2 · Detection signals

**Signal 1 — Tool inventory signal.**
- Signal name: AI tool inventory audit
- Signal type: evidence_pattern
- Threshold: >5 AI-adjacent tools identified in informal audit below central procurement threshold, within 12-month window
- Evidence source: procurement records, expense reports, vendor-contract database, IT asset management

**Signal 2 — Governance-practice contradiction signal.**
- Signal name: Policy vs practice gap
- Signal type: contradiction
- Threshold: Stated AI governance policy contradicted by >=3 documented instances of AI use not following policy
- Evidence source: policy documents, procurement records, known use cases

**Signal 3 — Data sharing signal.**
- Signal name: Unreviewed data sharing
- Signal type: evidence_pattern
- Threshold: >=2 AI tools with data sharing or training-data use in terms of service not reviewed by legal or privacy
- Evidence source: vendor terms of service, legal review records, privacy impact assessments

**Signal 4 — Customer-facing AI signal.**
- Signal name: Customer-facing deployment without model governance
- Signal type: evidence_pattern
- Threshold: >=1 customer-facing AI deployment without model risk management review
- Evidence source: deployment inventory, MRM records, customer-touchpoint inventory

**Signal 5 — Regulatory-adjacent signal.**
- Signal name: AI used in regulated workflows without oversight
- Signal type: evidence_pattern
- Threshold: AI deployed in regulated workflows (credit decisions, clinical, fair lending, trading, etc.) without sector-specific regulatory compliance review
- Evidence source: sector-specific regulatory frameworks, workflow analyses

**Signal 6 — Shadow spend signal.**
- Signal name: AI spend outside technology budget
- Signal type: kpi_deviation
- Threshold: Identified AI spend in non-technology budgets totaling >$500K annually
- Evidence source: finance records, departmental budget analysis

### 3.3 · Diagnostic questions

1. What is the total inventory of AI tools in use across the enterprise? (Asked in intake; typical answer is significantly incomplete)
2. Which AI tools have been reviewed by legal, privacy, and security? (Typical answer: a small subset)
3. Which customer-facing processes use AI? (Typical answer: identifies obvious deployments; misses embedded vendor features)
4. What governance framework covers AI specifically (beyond general technology policy)? (Typical answer: policy exists; enforcement unclear)
5. What is the organization's AI risk register? (Typical answer: doesn't have one)
6. Who owns AI governance enterprise-wide? (Typical answer: unclear or CTO as default)

### 3.4 · Evidence requirements

For confident detection, minimum:
- AI tool inventory (direct audit or triangulated from procurement + expense)
- Documented governance policy
- At least 3 specific use cases with details
- Vendor contract review sample
- Any sector-specific regulatory framework applicability

Confidence levels:
- **High confidence:** 4+ signals firing with documented evidence across multiple business units
- **Medium confidence:** 2-3 signals firing with partial evidence
- **Low confidence:** 1-2 signals firing; may indicate emerging pattern rather than active

---

## Part 4 · Root Causes

### 4.1 · Likely root causes (ranked by prevalence)

**Root cause 1 — Decentralized procurement under governance thresholds.**
Prevalence: Universal
Description: AI tools frequently priced under the threshold triggering central procurement review. Teams purchase directly, often on expense or corporate card. Governance framework scales by dollar threshold, not by AI-specific criteria.
Diagnostic method: Compare AI inventory to procurement review records; identify spend patterns below review threshold.

**Root cause 2 — Individual team pressure to adopt AI.**
Prevalence: High
Description: Business units feel competitive pressure (external market, internal peer teams) to adopt AI tools. The centralized governance process feels slow. Teams choose fast adoption over compliant adoption.
Diagnostic method: Interview with business-unit leaders; documentation of AI adoption pressure.

**Root cause 3 — Policy without enforcement.**
Prevalence: High
Description: Written AI governance policy exists but has no operational enforcement mechanism — no AI-specific procurement gate, no inventory discipline, no ongoing review.
Diagnostic method: Policy document review; identify specific enforcement mechanisms.

**Root cause 4 — Prior-era slow approval philosophy.**
Prevalence: Medium
Description: Approval processes designed for legacy technology procurement are too slow for AI-tool velocity. Teams route around rather than engage.
Diagnostic method: Approval process audit; time-to-approve benchmarking.

**Root cause 5 — Vendor embedded AI features.**
Prevalence: High and growing
Description: AI features embedded in already-approved vendor products (Microsoft Copilot, Salesforce Einstein, Google Workspace AI, etc.) activate by default or at feature-flag level without triggering new governance review.
Diagnostic method: Vendor inventory with AI-feature audit.

**Root cause 6 — Personal-account AI use.**
Prevalence: High
Description: Employees use personal accounts (ChatGPT personal, Claude personal, etc.) for work tasks. No enterprise visibility; no data protection.
Diagnostic method: Survey, acceptable use policy review, network traffic analysis (with privacy constraints).

### 4.2 · Common adjacent contradictions

**Contradiction 1.** Public statements positioning enterprise as "AI-first" or "AI-native" while internal AI governance maturity is early-stage (Category E per Contradiction Engine).

**Contradiction 2.** Risk and compliance functions prioritizing legacy risks while AI-specific risks are unmeasured (Category A — strategy-allocation).

**Contradiction 3.** CTO declared as AI governance owner while CTO has no operational control over business-unit procurement (Category C — sponsor-behavior).

### 4.3 · Benchmark signatures

Typical enterprise profile by AI governance maturity stage (5-stage scale):

- **Stage 1 (Absent).** No policy. No inventory. Significant shadow AI. Typical Fortune 500 enterprise in 2023 era.
- **Stage 2 (Emerging).** Policy exists. Minimal enforcement. Incomplete inventory. Shadow AI visible but not controlled. Typical Fortune 500 enterprise in 2024-2025.
- **Stage 3 (Formalized).** Policy enforced through procurement integration. Substantial inventory. Risk framework defined. Remaining shadow AI is deliberate rather than accidental.
- **Stage 4 (Integrated).** Cross-functional AI governance committee. Enterprise AI platform reducing need for shadow tools. Model risk management for decision-critical deployments.
- **Stage 5 (Optimized).** AI governance mature. Platform-sanctioned access widely used. Risk-adjusted ROI on AI investments measurable. Shadow AI minimal and bounded.

All four AbarVa composite tenants currently assessed at Stage 2.

---

## Part 5 · Intervention Options

### 5.1 · Option 1 — Enterprise AI platform with sanctioned access

**Description.** Deploy an enterprise AI platform (typically built on major cloud AI services with enterprise governance, SSO, audit logging, data boundaries) that provides sanctioned access to AI capabilities. Employees and teams can get what they need without shadow procurement.

**Appropriate when.**
- Volume of demand across workforce is significant
- Organization has cloud and data platform maturity to support
- Budget and engineering capacity available for 6-12 month build

**Contraindicated when.**
- Extremely small enterprise where demand doesn't justify platform investment
- Cloud platform is immature
- Governance framework fundamentals missing (platform without policy is worse than neither)

**Capability required.** Cloud AI platform engineering, data platform, identity and access management, security architecture, governance office

**Typical cost range.** $3-15M initial investment, $1-5M ongoing (scales with enterprise size)

**Typical time to value.** 6-12 months to platform live; 12-18 months to significant shadow AI reduction

**Success probability.** High if capability and sponsorship present

### 5.2 · Option 2 — AI governance framework with procurement integration

**Description.** Operationalize AI-specific governance by integrating AI-review gates into procurement process, regardless of dollar threshold. Any AI tool procurement requires AI governance review before approval.

**Appropriate when.**
- Procurement process is centralized enough to enforce
- Legal/compliance/security have capacity for review
- Governance framework is defined (or being defined)

**Contraindicated when.**
- Procurement is highly decentralized
- Review capacity is insufficient (will create bottleneck)

**Capability required.** Procurement process discipline, legal/privacy/security review capacity, governance office

**Typical cost range.** $500K-$2M annual in review capacity

**Typical time to value.** 3-6 months to operational; 12 months to steady-state compliance

**Success probability.** Medium-high; depends heavily on enforcement discipline

### 5.3 · Option 3 — Tool consolidation leveraging enterprise contracts

**Description.** Identify the AI capability needs driving shadow adoption; consolidate into enterprise contracts with major vendors that cover the use cases. Retire shadow tools in favor of consolidated sanctioned tools.

**Appropriate when.**
- Use cases cluster into identifiable patterns
- Major vendor relationships exist that can expand
- Budget available for enterprise contracts

**Contraindicated when.**
- Use cases are highly specialized and heterogeneous
- Vendor relationships are limited

**Typical cost range.** $1-10M annual in consolidated contracts (often replacing shadow spend)

**Typical time to value.** 6-12 months

**Success probability.** Medium; depends on vendor-feature fit

### 5.4 · Option 4 — Employee AI literacy and sanctioned-use training

**Description.** Educate workforce on the risks of shadow AI and the availability of sanctioned alternatives. Build culture around sanctioned use.

**Appropriate when.**
- Sanctioned alternatives exist (training without options is counterproductive)
- Enterprise has established training infrastructure

**Contraindicated when.**
- Sanctioned alternatives don't yet exist
- Training without enforcement won't shift behavior

**Typical cost range.** $100-500K

**Typical time to value.** 3-6 months

**Success probability.** Medium as supporting intervention; low as primary intervention

### 5.5 · Option 5 — Model risk management for decision-critical AI

**Description.** Establish formal MRM framework (per SR 11-7 in banking, equivalents in other sectors) for AI deployments in decision-critical contexts (credit, clinical, customer-facing, pricing, hiring).

**Appropriate when.**
- Sector has regulatory MRM requirements (banking definitely; healthcare increasingly)
- Organization has or can build model validation capability

**Contraindicated when.**
- Scope too broad (not every AI use needs MRM rigor)
- Capacity to validate is limited

**Typical cost range.** $2-8M annual

**Typical time to value.** 9-18 months

**Success probability.** High for scoped deployment; essential for regulated sectors

### 5.6 · Anti-patterns

**Anti-pattern 1.** Blanket AI ban. Drives adoption further underground. Does not solve the pattern.

**Anti-pattern 2.** Governance-without-enablement. Policy tightening without offering sanctioned alternatives. Teams route around.

**Anti-pattern 3.** Over-scoped MRM. Applying full model risk management to every AI use creates bottleneck that drives shadow adoption.

**Anti-pattern 4.** One-time audit without ongoing discipline. Shadow AI regrows within 6 months.

### 5.7 · Common failure modes

- Platform built without adoption planning → employees continue shadow adoption
- Governance framework written without operational enforcement
- Consolidation attempt that doesn't cover real use cases → teams retain shadow tools for unmet needs
- Sponsor loses interest after initial remediation → program drifts
- Cross-BU coordination insufficient → pockets of shadow AI persist in specific business units

---

## Part 6 · Phase-Mapped Deliverables

### 6.1 · Phase 1 · Intake deliverables

**Deliverable 1.1 — AI Tool Inventory Audit.** Comprehensive catalog of AI tools in use across enterprise. Sources: procurement records, expense reports, vendor contracts, BU interviews, network traffic analysis (privacy-bounded). Output: inventory with tool, owner BU, spend, data handling posture, governance status.

**Deliverable 1.2 — Spend and Contract Posture Analysis.** Total AI-category spend, contract-status distribution (MSA, point-contract, expense-based), auto-renewal risk, data-sharing terms risk.

**Deliverable 1.3 — Governance vs Practice Contradiction Documentation.** Stated AI policy mapped against observed practice. Specific contradictions catalogued with evidence.

**Deliverable 1.4 — Sector-Specific Regulatory Exposure Assessment.** Per sector, identify which shadow AI uses create specific regulatory exposure (fair lending in FS, HIPAA in healthcare, critical infrastructure in utility, consumer protection in retail).

**Deliverable 1.5 — AI Governance Maturity Assessment.** Current state rated on 5-stage scale with specific evidence. Gap analysis to target stage.

### 6.2 · Phase 2 · Diagnosis deliverables

**Deliverable 2.1 — Root Cause Analysis.** Which of the 6 root causes apply, with prevalence assessment and specific evidence.

**Deliverable 2.2 — Enterprise AI Platform Options Assessment.** Major cloud platforms (Azure AI, AWS Bedrock, Google Vertex), build-vs-buy considerations, enterprise integration requirements, cost modeling.

**Deliverable 2.3 — Governance Framework Options.** Alternative governance architectures: procurement-gate-based, AI-review-committee-based, risk-tiered, hybrid. Recommendation criteria.

**Deliverable 2.4 — Tool Consolidation Targets.** Use case clustering; candidate consolidation paths; vendor fit analysis.

**Deliverable 2.5 — Stakeholder Mapping.** Sponsor, co-sponsors, informed executives, business unit alignment, IT and security partnership, legal and compliance partnership, vendor management.

### 6.3 · Phase 3 · Decision deliverables

**Deliverable 3.1 — Enterprise AI Platform Commitment.** Specific platform decision, architecture, capability scope, budget, timeline, capability team.

**Deliverable 3.2 — Governance Framework Finalization.** Policy, procurement integration, review framework, risk-tier definition, ongoing discipline, accountability.

**Deliverable 3.3 — Tool Consolidation Roadmap.** Which shadow tools migrate to which sanctioned alternatives; timeline; communication plan.

**Deliverable 3.4 — Migration and Sunset Plan.** Per shadow tool, specific migration path (sanctioned equivalent, negotiated enterprise contract, or cessation with workflow redesign). Timeline. Owners.

**Deliverable 3.5 — Sector-Specific Compliance Integration.** MRM framework for regulated use cases. Fair lending review for FS. HIPAA review for healthcare. Critical infrastructure review for utility.

### 6.4 · Phase 4 · Execution deliverables

**Deliverable 4.1 — Platform Deployment.** Enterprise AI platform live, integrated with identity/SSO, data boundaries enforced, audit logging active. User onboarding program.

**Deliverable 4.2 — Governance Operationalization.** AI governance office active. Procurement gate enforced. Risk review cycles running. Quarterly inventory refresh.

**Deliverable 4.3 — Tool Consolidation Execution.** Shadow tools migrated or sunset per roadmap. Contract termination executed. Workflow validation complete.

**Deliverable 4.4 — AI Governance Maturity KPI Tracking.** Quarterly maturity assessment. Progress against target stage documented. Remaining gaps tracked.

**Deliverable 4.5 — Workforce Enablement.** Training rolled out. Sanctioned-alternative adoption measured. Shadow AI re-audit on recurring cadence (every 6 months).

---

## Part 7 · Expected Outcomes

### 7.1 · Time to value

- **Diagnostic time:** 3-8 weeks to comprehensive Phase 1 output
- **First intervention time:** 3-6 months to first material intervention landed (governance gate active, enterprise platform MVP)
- **Measurable outcome time:** 12 months to first material shadow AI reduction
- **Steady state time:** 18-24 months to sustained Stage 3+ maturity

### 7.2 · Success metrics

**Metric 1 — Shadow AI spend reduction.**
- KPI link: Shadow AI spend per tenant overlay (tenant-specific)
- Expected direction: down
- Expected magnitude: 40-60% reduction in shadow spend within 18 months
- Typical timeline: months 12-18

**Metric 2 — AI governance maturity progression.**
- KPI link: `ai_governance_maturity` (tenant-specific per overlay)
- Expected direction: up (stage progression)
- Expected magnitude: 1 stage per 12-18 months
- Typical timeline: ongoing; Stage 2→3 within 18 months typical

**Metric 3 — Governance-reviewed AI share.**
- Definition: % of AI tool spend that has passed formal governance review
- Expected direction: up
- Expected magnitude: from <30% to >85%
- Typical timeline: 12-18 months

**Metric 4 — Compliance-risk remediation.**
- Definition: % of identified compliance-risk AI uses remediated (sanctioned, modified, or sunset)
- Expected direction: up
- Expected magnitude: >80% of identified high-risk items remediated
- Typical timeline: 9-12 months after Phase 3

**Metric 5 — Enterprise AI platform adoption.**
- Definition: Active users on sanctioned enterprise AI platform
- Expected direction: up
- Expected magnitude: rises to cover majority of AI use cases
- Typical timeline: 12-24 months post-platform-deployment

### 7.3 · Leading indicators (track before steady state)

- Procurement requests routed through AI governance gate (activity)
- Shadow AI audits showing declining net new additions
- Sanctioned platform user growth
- Governance committee meeting cadence and decision velocity
- Compliance function involvement in AI review (hours per quarter)

---

## Part 8 · Context Requirements

### 8.1 · Required sponsor profile

- **Role archetype.** Chief Information Officer, Chief Technology Officer, Chief Data Officer, Chief Customer and Technology Officer (combined roles), or Chief Compliance Officer (for regulated sectors where compliance is the primary driver)
- **Scope breadth.** Cross-functional / enterprise — this pattern cannot be solved within a single BU
- **Political capital required.** Medium to high — requires telling business units they can't continue current procurement patterns
- **Time commitment.** 2-4 hours per month in active phases; steering committee presence for 18-24 months

### 8.2 · Required capabilities

- Cloud and data platform maturity (for platform option)
- Procurement process discipline (for governance option)
- Legal, privacy, and security review capacity
- Identity and access management (for platform integration)
- Training and change management capability
- Sector-specific regulatory expertise (MRM, HIPAA, etc.)

### 8.3 · Typical stakeholders

- **Executive sponsor** (as above)
- **Chief Compliance Officer** (regulatory overlay)
- **Chief Legal Officer** (contract review, privilege)
- **Chief Privacy Officer** (data handling)
- **Chief Information Security Officer** (security posture)
- **Chief Risk Officer** (enterprise risk)
- **Chief Procurement Officer** (procurement discipline)
- **CFO** (budget and cost reality)
- **Business unit leaders** (ownership of use cases and sanctioned adoption)
- **Chief People Officer** (training and change management)

### 8.4 · Common objections

**Objection 1.** "We already have an AI policy; this is just enforcement."
*Response.* Enforcement requires operational mechanism. Policy without enforcement mechanism has produced the current state.

**Objection 2.** "This will slow down AI adoption."
*Response.* Well-designed sanctioned paths are faster than shadow paths, because they don't require individual negotiation. Governance-enabled adoption is usually faster than shadow adoption at enterprise scale.

**Objection 3.** "Our employees are creative; we shouldn't constrain them."
*Response.* Not a constraint on creativity; a constraint on compliance-risk introduction. Creativity happens within the sanctioned platform.

**Objection 4.** "Vendors are moving faster than we can review."
*Response.* Risk-tiered review addresses this. Most tools need lightweight review, not full MRM.

**Objection 5.** "We can't justify the platform investment."
*Response.* Cost comparison between sanctioned platform and shadow-spend-plus-risk-events often favors platform. Quantify both sides.

---

## Part 9 · Applicability

### 9.1 · Applicable company scales

- Small enterprise (<500 employees): applicable but simplified implementation (governance-framework option often sufficient without platform)
- Mid-enterprise (500-5,000): full pattern applies; platform option usually justified
- Large enterprise (5,000-50,000): full pattern applies; multi-phase implementation; cross-BU coordination intensive
- Very large enterprise (50,000+): full pattern applies; federated governance model often required

### 9.2 · Cross-pattern links

- **Prerequisite:** None (foundational)
- **Consequence if not addressed:** Cybersecurity Maturation (#10) stalls, Analytics Modernization (#2) fragments, Vendor Sprawl (#6) worsens
- **Co-occurring:** Vendor Sprawl and Tool Rationalization (#6), Operating Model Decision-Latency Reduction (#7)
- **Alternative:** None at this scope

---

## Part 10 · Meta

### 10.1 · Evidence base

- Gartner enterprise AI governance research (2024-2025)
- Industry consulting-firm reports on enterprise AI adoption patterns
- Regulatory guidance on AI use (EU AI Act, FTC guidance, sector-specific)
- SR 11-7 and equivalents for model risk management
- Composite observation across AbarVa's 4 tenants (direct pattern evidence)

### 10.2 · Confidence level

**High.** Pattern is well-documented across enterprises. Intervention effectiveness has strong evidence base from consulting-engagement results and peer-practice sharing.

### 10.3 · Last updated

April 21, 2026

### 10.4 · Version

1.0

### 10.5 · Author

AbarVa intelligence layer foundational pattern library

---

## Part 11 · Variants by Sector

### 11.1 · Retail variant — Apex Retail Group

**ID:** `pattern_shadow_ai_retail`
**Variant name:** Shadow AI in Merchandising and Customer Operations
**Applies to:** Apex

**Sector-specific signals.**
- AI tools in price optimization without pricing-governance review
- AI tools in customer-facing personalization without fair-treatment oversight
- AI tools in merchandising decisions influencing customer experience without model governance
- AI tools in marketing with PII handling not reviewed by privacy

**Apex evidence.** 14 AI tools identified · $2.1M annualized · 9/14 below governance threshold · 3 customer-facing · 2 with pricing decision integration

**Apex linked KPIs.** AI Governance Maturity (2.8.2), Cybersecurity Maturity (2.8.1), CSAT Omnichannel (2.3.2), Conversion Rate Digital (2.3.6)

### 11.2 · Healthcare variant — Meridian Health System

**ID:** `pattern_shadow_ai_healthcare`
**Variant name:** Shadow AI in Clinical and Revenue Cycle Operations
**Applies to:** Meridian

**Sector-specific signals.**
- AI tools handling PHI without BAA coverage
- AI tools in clinical decision-influencing contexts without validation
- AI tools in revenue cycle with payer-audit exposure
- AI tools in patient-communication without clinical-review oversight

**Meridian evidence.** 16 AI tools identified · 9 below governance threshold · 4 with PHI exposure unclear BAA · 2 clinical decision-adjacent · 3 in revenue cycle

**Meridian linked KPIs.** AI Governance Maturity (2.9.1), Cybersecurity Maturity (2.9.2)

**Healthcare-specific sensitivities.** HIPAA violation risk · clinical decision liability · CMS audit exposure · Joint Commission accreditation implications

### 11.3 · Financial services variant — First Capital Financial

**ID:** `pattern_shadow_ai_financial_services`
**Variant name:** Shadow AI in Lending and Customer Operations
**Applies to:** First Capital

**Sector-specific signals.**
- AI tools in credit-decisioning-adjacent workflows (fair lending exposure)
- AI tools in customer-facing workflows without model risk management
- AI tools in trading/wealth-advisory without regulatory governance
- AI tools handling customer data without GLBA review

**First Capital evidence.** 12 AI tools · 7 below governance threshold · 3 in credit-adjacent workflows · 2 customer-facing · fair lending risk unaddressed

**First Capital linked KPIs.** AI Governance Maturity (2.9.2), Model Risk Management Maturity (2.9.3), Cybersecurity Maturity (2.9.1)

**FS-specific sensitivities.** Fair lending disparate impact · SR 11-7 model risk management · FINRA supervisory obligations · GLBA Safeguards Rule

### 11.4 · Utility variant — Keystone Energy Holdings

**ID:** `pattern_shadow_ai_utility`
**Variant name:** Shadow AI in Customer Operations and Grid Analytics
**Applies to:** Keystone

**Sector-specific signals.**
- AI tools handling critical infrastructure data (NERC CIP implications)
- AI tools in customer operations with state PUC reporting exposure
- AI tools in grid analytics without operational-technology security review
- AI tools making grid operational decisions without validation

**Keystone evidence.** 11 tools, $1.6M annualized, 17 teams, 7/11 with auto-renewal, 4/11 with unreviewed data sharing (NERC CIP implications)

**Keystone linked KPIs.** AI Governance Maturity (2.8.1), Cybersecurity Maturity (2.8.2), First Call Resolution (2.2.2), Customer Complaint Rate (2.2.4)

**Utility-specific sensitivities.** NERC CIP critical infrastructure · state PUC regulatory oversight · grid operational technology security · bulk electric system implications

---

## Part 12 · Template Notes for Other Foundational Packs

This pattern pack serves as the reference template for the other 19 foundational packs. Authoring discipline for each subsequent pack:

1. **Full Part 1-10 completion** at this depth
2. **Sector variants in Part 11** where cross-sector
3. **Minimum 6 detection signals** with evidence requirements
4. **Minimum 5 intervention options** including anti-patterns and failure modes
5. **Phase-mapped deliverables at specific granularity** (not abstract; enumerable deliverables)
6. **Success metrics linked to specific KPIs**
7. **Evidence base and confidence level** documented

The remaining 19 foundational packs per north star Part 6.2:

**Cross-sector (pending authoring):**
2. Analytics Modernization
3. Customer Data Platform Consolidation
4. Enterprise Search and Knowledge Access
5. Workforce Productivity and Frontline AI
6. Vendor Sprawl and Tool Rationalization
7. Operating Model Decision-Latency Reduction
8. Cross-Functional KPI Alignment
9. Core Platform Modernization
10. Cybersecurity Maturation

**Retail-specific (pending):**
11. Owned-Brand Margin Optimization
12. Omnichannel Fulfillment Decisioning

**Healthcare-specific (pending):**
13. Value-Based Care Progression
14. Revenue Cycle Automation

**Financial services-specific (pending):**
15. AML/BSA Compliance Modernization
16. Cross-Franchise Relationship Deepening

**Utility-specific (pending):**
17. Data Center Load Interconnection Decisioning
18. Storm Response Coordination
19. Grid Modernization Capital Recovery
20. Workforce Attrition in Specialized Technical Roles

---

**END OF SHADOW AI GOVERNANCE PATTERN PACK**

*Foundational Pattern Pack #1 of 20. Template reference for subsequent packs. Cross-industry. Composite variants for all 4 tenants. Version 1.0. April 21, 2026.*
