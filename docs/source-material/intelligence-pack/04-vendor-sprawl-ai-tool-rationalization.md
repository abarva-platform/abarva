# Part 2.4 · Vendor Sprawl & AI Tool Rationalization

## 2.4 · Vendor Sprawl & AI Tool Rationalization

### YAML front-matter

```yaml
pattern_id: pattern_vendor_sprawl_ai_tool_rationalization
slug: vendor-sprawl-ai-tool-rationalization
name: Vendor Sprawl & AI Tool Rationalization
version: 1.0.0
status: active
category: Enterprise Architecture & Procurement
cross_industry: true
sector_applicability: [healthcare, retail, financial_services, energy, cross_sector]
short_description: >
  The proliferation of AI-enabled tools across the enterprise stack (dedicated
  AI platforms, SaaS with embedded AI features, agentic coding tools, domain
  vertical AI products) without portfolio discipline, producing duplicate
  capability, unmanaged spend, shadow procurement, vendor lock-in risk, and
  governance gaps. Pattern covers discovery, rationalization methodology,
  consolidation playbook, and the portfolio discipline that converts sprawl
  into a managed AI tool estate.
long_description: >
  AI tool sprawl has a distinctive shape. Dedicated AI platforms enter
  through data science teams. Agentic coding tools enter through engineering.
  SaaS vendors embed AI features that activate silently (Salesforce Einstein,
  Microsoft Copilot, Oracle AI, HubSpot AI, ServiceNow Now Assist). Domain
  AI products enter through business functions (marketing AI, sales AI,
  legal AI, HR AI). Shadow procurement adds consumer LLM subscriptions
  billed on credit cards. Within 18-24 months, enterprises that were
  deliberate about cloud vendor consolidation find themselves with 30-80+
  AI-enabled tools, no inventory, unclear spend total, overlapping
  capabilities, and multiple governance blindspots. The pattern captures
  the specific failure modes and the rationalization discipline that
  converts the AI tool estate into something manageable.
confidence_floor: 0.70
n_observations_floor: 8
related_patterns:
  - { id: pattern_ai_governance_operating_model, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: associative }
  - { id: pattern_ai_led_pdlc, relationship: associative }
regulatory_frameworks:
  - id: framework_nist_ai_rmf
    applicability: indirect
  - id: framework_eu_ai_act
    applicability: vendor_deployer_obligations
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_vendor_sprawl_ai_tool_rationalization`
**Name:** Vendor Sprawl & AI Tool Rationalization

**Long description:** AI tool sprawl is different from SaaS sprawl. Three characteristics make it harder. First, AI tooling is multi-modal: dedicated AI platforms (foundation model APIs, vector databases, orchestration frameworks); agentic coding tools (Claude Code, Codex, Cursor, Copilot); embedded AI features in SaaS tools (Einstein, Copilot, Now Assist); domain AI products (sales AI, legal AI, HR AI); shadow consumer tools (individual ChatGPT/Claude/Gemini subscriptions). Second, a lot of it is invisible: embedded AI activates silently in existing SaaS contracts; shadow procurement goes on credit cards; engineering tools proliferate below procurement thresholds. Third, category definitions blur: three tools may each call themselves "AI copilot" while doing substantively different work, and two tools in different categories may overlap substantially on a specific capability. Rationalization requires mapping capability to category, not vendor to vendor.

### Part B · Classification

**Category:** Enterprise Architecture & Procurement
**Cross-industry:** Yes
**Sector applicability:** All sectors. Healthcare and financial services face higher vendor risk diligence requirements (PHI exposure, model risk, data residency). Retail faces high SaaS-native AI exposure due to stack composition. Energy faces strict OT-side vendor restrictions that shape the problem differently.
**Variant of:** None (distinct from general SaaS sprawl; AI tools have distinct characteristics)
**Related patterns:** AI Governance (tools must be governed), AI Use Case Portfolio (tools serve the portfolio), Analytics Modernization (analytics tools are a subset), AI-Led PDLC (agent coding tools are a subset)

### Part C · Detection

#### C.1 · Trigger symptoms

- Unknown count of AI-enabled tools in use across enterprise
- AI tool spend totals don't reconcile between finance, procurement, and IT
- Multiple tools claim to do "the same thing" but are used in different pockets
- SaaS renewal pricing jumps due to AI feature activation on existing seats
- Shadow procurement visible in expense reports (ChatGPT Plus, Claude Pro, Midjourney, Runway, etc.)
- Employees using AI tools without knowing whether they're sanctioned
- IT cannot answer "who owns X tool?" for 20%+ of AI-enabled tools
- Category overlap visible but consolidation not attempted
- Vendor-claim comparison difficult (every vendor claims to be "the AI platform for X")
- Contract terms around AI (model provenance, data handling, incident notification) vary widely or are absent

#### C.2 · Detection signals

**Signal 1 · Inventory gap.**
- Type: `evidence_pattern`
- Threshold: AI tool count per employee exceeds 1.5x benchmark for category (e.g., 40+ AI tools at a 2,000-employee company)
- Evidence: procurement data, SaaS discovery scans, employee survey

**Signal 2 · Spend-reconciliation gap.**
- Type: `contradiction`
- Threshold: Finance, procurement, and IT report different total AI tool spend (≥15% variance)
- Evidence: finance GL, procurement records, IT license management

**Signal 3 · Shadow procurement prevalence.**
- Type: `evidence_pattern`
- Threshold: Expense reports show 20%+ of employees with AI tool subscriptions not routed through IT or procurement
- Evidence: expense report review, credit card data

**Signal 4 · Hidden-AI activation.**
- Type: `evidence_pattern`
- Threshold: SaaS tools deployed have AI features (Einstein, Copilot, Now Assist, etc.) activated without dedicated review
- Evidence: SaaS admin console audit, AI feature activation logs

**Signal 5 · Capability overlap.**
- Type: `evidence_pattern`
- Threshold: 3+ tools in production addressing substantially same capability (e.g., 4 different "meeting AI" tools, 3 different "writing assistant" tools)
- Evidence: capability map of AI tools

**Signal 6 · Renewal surprise.**
- Type: `kpi_deviation`
- Threshold: SaaS renewals include AI-feature-driven price increases of 25%+ not anticipated in budget
- Evidence: renewal records, budget variance reports

**Signal 7 · Vendor governance gap.**
- Type: `audit_finding`
- Threshold: <40% of AI-enabled vendor contracts include AI-specific clauses (model provenance, data handling, incident notification, audit rights)
- Evidence: contract audit

**Signal 8 · Rationalization backlog.**
- Type: `evidence_pattern`
- Threshold: Identified consolidation opportunities exist but not actioned for 6+ months
- Evidence: architecture review minutes, procurement records

#### C.3 · Diagnostic questions

1. Can you produce a current inventory of AI-enabled tools in production across the enterprise with owner, spend, and use case for each?
2. What is total annual AI tool spend, and how does it reconcile across finance, procurement, and IT?
3. For the top 10 SaaS tools in the enterprise, what AI features are activated and who reviewed them?
4. What is the policy for employees acquiring AI tools, and how is it enforced?
5. When capability overlap is identified (e.g., multiple tools for same purpose), what's the rationalization mechanism?
6. What AI-specific contract clauses are standard in new vendor agreements?
7. How does AI tool selection integrate with the AI use case portfolio?
8. How often is the AI tool inventory refreshed, and by whom?

#### C.4 · Evidence requirements

**Confident detection (≥0.75):**
- Current AI tool inventory (or documented absence)
- Finance spend records for AI category
- Procurement records for AI-enabled vendor contracts
- SaaS discovery scan results
- Employee survey on AI tool usage
- Contract template and sample contracts

**High confidence (≥0.85):** Add capability mapping, shadow procurement deep-dive, vendor audit results.

#### C.5 · Confidence rubric

- **0.9+:** No inventory, shadow procurement prevalent, capability overlap obvious, vendor governance gap clear
- **0.75-0.9:** Partial inventory, some controls, but gaps in shadow + hidden AI
- **0.6-0.75:** Inventory exists; maturity of rationalization unclear
- **Below 0.6:** Do not surface

### Part D · Causal Structure

**Root cause 1 · Distributed AI acquisition authority.**
Different functions (engineering, data science, marketing, sales, legal, HR) each acquire AI tools for their own needs. No single owner of AI tool portfolio. Central procurement doesn't have the AI fluency to challenge category decisions.

**Root cause 2 · Embedded AI invisibility.**
SaaS vendors activate AI features silently. Salesforce rolls out Einstein; Microsoft activates Copilot; ServiceNow enables Now Assist. Activation often happens at admin level without procurement or governance awareness. AI-specific cost, risk, and capability added to existing tools without review.

**Root cause 3 · Shadow procurement velocity.**
Consumer LLM tools (ChatGPT, Claude, Gemini) are cheap enough to go on credit cards. Employees who need AI capability faster than IT provides it self-procure. Over time, the shadow estate reaches material scale.

**Root cause 4 · Category definitions blur.**
"AI copilot" means different things. "AI platform" covers foundation model APIs, orchestration frameworks, vector databases, observability tools. Comparing vendor claims is hard; rationalization based on capability overlap is harder still without structured category framework.

**Root cause 5 · Velocity mismatch with procurement.**
AI vendor velocity (capability updates weekly, new features monthly, new vendors quarterly) exceeds typical procurement cadence. Procurement designed for 12-24 month contract cycles is structurally mis-paced for AI tool evaluation and rationalization.

**Causal chain:**

```
distributed_acquisition_authority
  + embedded_ai_invisibility
  + shadow_procurement_velocity
  + category_blur
  + procurement_velocity_mismatch
  → AI_tool_count_grows
  → spend_reconciliation_gap
  → capability_overlap
  → vendor_governance_gap
  → rationalization_backlog
  → cost_creep_without_outcome
```

### Part E · Interventions

**Intervention 1 · AI tool inventory discovery.**
One-time deep inventory of AI-enabled tools. Sources: procurement records, finance GL, SaaS discovery scans (CASB tools), employee survey, expense report review, SaaS admin console audit (for embedded AI). Output: canonical inventory with owner, capability category, spend, use case.
- *Success rate:* 0.84 (n=14) — high success rate because it's a diagnostic step; most orgs complete it successfully
- *Effort:* Medium · 6-10 weeks
- *Conditions:* Cross-functional cooperation (finance + procurement + IT + HR); CASB tool or discovery scanning capability

**Intervention 2 · Capability-category taxonomy.**
Define AI tool capability categories (e.g., foundation model API, agentic coding, meeting AI, writing assistant, analytics, CRM AI, marketing AI, legal AI, security AI, etc.). Map every inventoried tool to category. Surface overlap.
- *Success rate:* 0.72 (n=11)
- *Effort:* Small-Medium · 4-8 weeks
- *Conditions:* Enterprise architecture involvement; category definitions workshopped cross-functionally

**Intervention 3 · Rationalization decision framework.**
For each category with overlap, apply structured rationalization: (a) capability requirements, (b) total cost including hidden costs, (c) governance posture of each vendor, (d) integration fit, (e) adoption measurement. Decide consolidate / keep parallel / retire.
- *Success rate:* 0.66 (n=9)
- *Effort:* Medium · 8-12 weeks per category
- *Conditions:* Decision-making authority delegated to rationalization owner; change management plan for retired tools

**Intervention 4 · Sanctioned-tool catalog with self-service.**
Publish catalog of sanctioned AI tools per capability category. Self-service provisioning within catalog. Consumer-grade tools (individual ChatGPT/Claude) addressed with enterprise alternative provisioning.
- *Success rate:* 0.70 (n=10)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* Sanctioned tools actually meet employee needs; enterprise procurement for consumer-grade alternatives; IT self-service capacity

**Intervention 5 · Standardized AI vendor contract clauses.**
Legal authors AI-specific contract clauses: model provenance disclosure, data handling (training use, retention, export), incident notification, audit rights, exit terms (data portability), indemnification for model misbehavior. Applied to all new and renewing AI vendor contracts.
- *Success rate:* 0.74 (n=12)
- *Effort:* Medium · 8-12 weeks to develop and operationalize
- *Conditions:* Legal partnership; procurement enforcement; vendor negotiation willingness

**Intervention 6 · Hidden-AI activation control.**
Policy and technical controls for embedded AI in SaaS tools. SaaS admin configurations reviewed; AI features activated only after dedicated review; renewal pricing reviewed for AI-feature-driven increases.
- *Success rate:* 0.64 (n=8)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* SaaS admin access; governance integration (AI Council awareness); renewal visibility

**Intervention 7 · Spend concentration target.**
Set target for spend concentration (e.g., 70% of AI tool spend across top 10 vendors, 90% across top 25). Surfaces long-tail rationalization opportunity and consolidation pressure. Tracked quarterly.
- *Success rate:* 0.62 (n=7)
- *Effort:* Small · 2-4 weeks to establish; ongoing measurement
- *Conditions:* Finance partnership for spend tracking; rationalization follow-through

**Intervention 8 · AI tool governance cadence.**
Quarterly AI tool portfolio review by AI Council: new tools adopted, categories with new overlap, spend trend, governance gaps, consolidation opportunities. Integrated with AI governance operating model.
- *Success rate:* 0.68 (n=10)
- *Effort:* Small-Medium · 4-8 weeks to institute
- *Conditions:* AI Council existence (see pattern_ai_governance_operating_model); spend visibility; inventory maintained

### Part F · Anti-Patterns

- **Inventory one-and-done.** Inventory conducted once but not refreshed; decays within months.
- **Tool consolidation without capability migration.** Retire tool without migrating users; surface shadow re-adoption.
- **Capability-overlap denial.** Multiple tools "have slightly different use cases"; justification overrides evidence.
- **Embedded-AI ignore.** Focus only on dedicated AI tools; miss SaaS-embedded AI entirely.
- **Ban-without-alternative.** Ban shadow consumer tools without providing sanctioned alternatives; productivity harm + employee dissatisfaction.
- **Standardization overreach.** Single-vendor standardization where capability diversity is warranted (foundation model API diversity, for example, often strategically valuable).
- **Procurement-led without business alignment.** Rationalization driven by procurement cost focus without business capability validation; kills valuable tools.
- **Contract-clause theater.** AI-specific clauses in contracts but not enforced or audited.

### Part G · Vendor Landscape

**SaaS / AI tool discovery:**
- **Netskope, Zscaler, Bitglass** — CASB tools with SaaS discovery
- **Productiv, Torii, Zylo, BetterCloud** — SaaS management platforms
- **Harmonic Security, Prompt Security, Nightfall** — LLM-specific discovery and DLP
- **1Password SaaS, LastPass Business** — credential-based discovery

**AI tool categories (reference — not exhaustive):**

*Foundation model API:* Anthropic, OpenAI, Google AI, AWS Bedrock, Azure OpenAI, Cohere, Mistral

*Agentic coding:* Claude Code, Codex / GPT-based agents, Cursor, Windsurf (Codeium), GitHub Copilot + Workspaces, Sourcegraph Cody, Continue, Tabnine

*Enterprise search + GenAI:* Glean, Copilot for Microsoft 365, Google Workspace AI, Notion AI, ClickUp AI

*Meeting AI:* Otter.ai, Fireflies, Read.ai, Fathom, Grain, Zoom AI Companion

*Writing AI:* Grammarly, Jasper, Copy.ai, Writer, Claude/ChatGPT enterprise

*CRM/Sales AI:* Salesforce Einstein, HubSpot AI, Gong, Chorus, Outreach AI, Clari

*Marketing AI:* Mutiny, 6sense, Salesforce Marketing Cloud Einstein, Jasper, HubSpot Marketing AI

*Analytics AI:* ThoughtSpot, Tableau Pulse, Power BI Copilot, Mode + Hex AI, Snowflake Cortex, Databricks AI/BI

*Legal AI:* Harvey, Eve, Spellbook, Luminance, Kira, Casetext CoCounsel

*HR AI:* HireVue, Eightfold, Gloat, Paradox, Phenom

*Security AI:* CrowdStrike Charlotte, SentinelOne Purple AI, Microsoft Security Copilot, Palo Alto XSIAM

*Customer service AI:* Zendesk AI, Intercom Fin, Salesforce Service Cloud Einstein, Ada, Decagon

**Hidden-AI-in-SaaS:** Salesforce Einstein, Microsoft Copilot (M365, Dynamics, Security, GitHub), Google Workspace AI, Adobe Sensei, Oracle AI, SAP Joule, ServiceNow Now Assist, Zoom AI Companion, Slack AI, Workday AI, NetSuite AI, HubSpot AI, Atlassian Intelligence, Intuit AI, Autodesk AI — essentially, assume every major SaaS vendor has embedded AI or is adding it in current release cycle.

**AbarVa positioning:** Platform-agnostic; scored on operating model discipline. Strong opinion on inventory-first discipline (before tool decisions) and capability-category taxonomy (before rationalization decisions). Consolidation is valuable but is a second-order outcome of discipline rather than a first-order goal.

### Part H · Regulatory Considerations

- **NIST AI RMF** — indirect; tool inventory and governance feed AI risk management
- **EU AI Act** — vendor deployer obligations; enterprises deploying vendor AI systems in regulated categories face compliance obligations
- **SR 11-7 (financial services)** — vendor AI used in decisioning subject to model risk management
- **HIPAA (healthcare)** — AI vendors with PHI access subject to BAA and security rule
- **State privacy laws** — AI vendors processing personal information subject to notice and DSR obligations
- **Export control** — some AI capabilities subject to export controls (particularly for government / defense contexts)

### Part I · Observations

**Obs 1 · Retail tech AI tool inventory.**
~600 engineers, rapid AI adoption 2024-2025. Conducted inventory: 47 AI-enabled tools in production; $180K monthly spend distributed across 47 vendors; top 3 tools = 35% of spend; long tail of 30 tools = 20% of spend at <$2K/month each. Rationalization identified 5 consolidation opportunities + 12 retirement candidates. Post-rationalization: 28 tools, $85K monthly spend, ≥90% employee satisfaction with alternatives.

**Obs 2 · Financial services hidden-AI audit.**
Tier-2 US bank audited SaaS admin consoles for AI feature activation: Salesforce Einstein (activated, no review); Microsoft Copilot (activated on 4,000 seats, no model risk review); ServiceNow Now Assist (activated, no privacy review); HubSpot AI (activated, no review). Governance backlog: 14 embedded AI activations requiring retrospective review; 6 identified as material risk requiring remediation.

**Obs 3 · Healthcare shadow procurement remediation.**
IDN expense report review: 820 employees with consumer LLM subscriptions (~18% of workforce). Risk concern: PHI potentially submitted to consumer tools. Remediation: provisioned enterprise Claude and Copilot; banned consumer tools on corporate devices; provided clear policy. 90 days later: 94% shadow usage eliminated; enterprise tool adoption 3,100 seats; PHI risk materially reduced.

**Obs 4 · Energy dual-track tool governance.**
Integrated energy co. maintained strict separation: OT-side AI tooling restricted to approved-vendor list with NERC-CIP compliance; IT-side AI tooling managed per standard enterprise process. Annual audit confirmed separation; saved significant regulatory review cycles by preventing cross-contamination.

**Obs 5 · Mid-stage SaaS vendor-clause operationalization.**
SaaS scale-up adopted standardized AI vendor clauses in Q1 2025. 50 contracts reviewed at renewal; 40 updated with new clauses; 5 vendors refused and contracts not renewed (replaced with alternatives); 5 vendors pending negotiation. Subsequent vendor AI incident response: standardized notification timeline (72h) proved valuable in single incident handling.

**Obs 6 · Cross-sector renewal surprises.**
Organizations reported AI-feature-driven renewal pricing increases from enterprise SaaS vendors averaging 15-40%; largest single increase observed was 95% on a CRM renewal with Einstein activation across large seat count. Pattern: vendors activate AI features during contract; renewal pricing reflects activated features; budget shock unless managed proactively.

**Obs 7 · Foundation-model-API concentration.**
Organizations that standardized too narrowly on foundation model APIs (single-vendor Anthropic, or single-vendor OpenAI) experienced significant vendor risk exposure during capability updates and pricing changes. Multi-vendor strategy (2-3 foundation model providers) became best practice for enterprises at scale.

**Obs 8 · Healthcare long-tail retention.**
IDN attempted long-tail retirement (tools <$1K/month each, ~25 tools). 80% retirement succeeded; 20% had hard business-user resistance surfacing important use cases not captured in rationalization. Lesson: capability-overlap analysis must include user interview, not just capability descriptions.

### Part J · Success Measures

**Leading indicators (monthly):**
- AI tool inventory freshness (days since last refresh)
- New AI tool additions per month (with sanctioned vs shadow split)
- Shadow procurement rate (shadow count / total count)
- Sanctioned-catalog adoption rate
- Contract coverage with AI-specific clauses (target: 80%+)

**Lagging indicators (quarterly):**
- Total AI tool count (tracked over time; consolidation reduces)
- Total AI tool spend (tracked with outcome attribution)
- Spend concentration (top 10 vendors % of total; target typically 70%+)
- Capability overlap index (count of categories with 3+ tools; target: decreasing)
- Employee satisfaction with AI tool availability

**Maturity thresholds:**
- **Emerging:** no inventory; shadow prevalent; hidden-AI unreviewed
- **Scaling:** inventory exists; sanctioned catalog forming; contract clauses adopted for new contracts
- **Mature:** continuous inventory; rationalization cadence; AI Council reviews portfolio; contract coverage broad
- **Optimized:** spend concentration target met; shadow rate <5%; hidden-AI reviewed at activation; vendor portfolio evolves intentionally

### Part K · Timeline & Sequencing

**Months 0-3 · Discovery**
- AI tool inventory discovery (one-time deep audit)
- Capability-category taxonomy defined
- Finance/procurement/IT spend reconciliation

**Months 3-6 · Baseline**
- Sanctioned-tool catalog v1 published
- Shadow remediation program launched
- Standardized AI vendor clauses in legal templates

**Months 6-12 · Rationalization**
- Category-by-category rationalization
- Hidden-AI activation control implementation
- Portfolio spend concentration targets set

**Months 12-18 · Discipline**
- Quarterly AI Council portfolio review
- Renewal cycle management with AI-feature surprise mitigation
- Continuous inventory maintenance

**Months 18-24 · Optimize**
- Spend concentration targets met
- Shadow rate materially reduced
- Vendor contract coverage broad

### Part L · Governance Mechanism

| Decision | Owner | Review body | Cadence |
|---|---|---|---|
| AI tool inventory maintenance | IT + Procurement | AI Council | Monthly |
| Sanctioned catalog updates | AI Council | — | Quarterly |
| New AI tool approval | AI tool portfolio owner (per category) | AI Council (Tier 3+) | Per request |
| Contract clause standards | Legal + AI Council | — | Annual review |
| Rationalization decisions | AI Council | Finance + impacted business owners | Quarterly |
| Hidden-AI activation | SaaS admin + AI Council | — | At activation |

### Part M · Sector Variants

**Healthcare:** BAA required for PHI-exposing AI vendors. Model risk adaptation for clinical AI. Specific attention to consumer LLM shadow risk in clinical settings.

**Financial Services:** SR 11-7 extended to vendor AI used in decisioning. Model provenance disclosure particularly important. BCBS operational risk principles extend to vendor AI.

**Retail:** High SaaS-native AI exposure; embedded-AI review particularly load-bearing. Consumer protection and advertising compliance for marketing AI.

**Energy:** OT/IT separation strict. OT-side vendor AI subject to NERC-CIP; typically approved-vendor list maintained. IT-side follows standard pattern.

**Cross-sector:** EU AI Act deployer obligations apply to any enterprise deploying vendor AI in EU-regulated categories.

### Part N · Related Patterns

- **`pattern_ai_governance_operating_model`** (associative) — AI Council reviews tool portfolio; governance integration
- **`pattern_ai_use_case_portfolio`** (associative) — tools serve use cases; portfolio drives tool selection
- **`pattern_analytics_modernization`** (associative) — analytics tools are a subset of AI tool portfolio
- **`pattern_ai_led_pdlc`** (associative) — agent coding tools are a subset; portfolio discipline applies
- **`pattern_shadow_ai_governance`** (associative) — shadow procurement is a sub-case; remediation mechanisms overlap

### Part O · Graph Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_vendor_sprawl_ai_tool_rationalization'})
SET p.slug = 'vendor-sprawl-ai-tool-rationalization',
    p.name = 'Vendor Sprawl & AI Tool Rationalization',
    p.version = '1.0.0',
    p.category = 'Enterprise Architecture & Procurement',
    p.cross_industry = true,
    p.confidence_floor = 0.70,
    p.n_observations_floor = 8,
    p.status = 'active';

// Category + sectors + frameworks + signals + interventions + anti-patterns + observations
// Full DDL expanded in assembly; structure mirrors Analytics Modernization and AI Governance patterns

// Vendors (extensive — this pattern references most vendor categories)
// Example vendor node contributions:
MERGE (v1:Vendor {id: 'vendor_anthropic'}) ON CREATE SET v1.name = 'Anthropic', v1.category = 'Foundation Model API', v1.maturity_stage = 'established';
MERGE (v2:Vendor {id: 'vendor_openai'}) ON CREATE SET v2.name = 'OpenAI', v2.category = 'Foundation Model API', v2.maturity_stage = 'established';
MERGE (v3:Vendor {id: 'vendor_google_ai'}) ON CREATE SET v3.name = 'Google AI', v3.category = 'Foundation Model API', v3.maturity_stage = 'established';
// ... (full vendor node library)

// Related patterns
MATCH (p:Pattern {id: 'pattern_vendor_sprawl_ai_tool_rationalization'})
MATCH (t1:Pattern {id: 'pattern_ai_governance_operating_model'})
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(t1);

MATCH (p:Pattern {id: 'pattern_vendor_sprawl_ai_tool_rationalization'})
MATCH (t2:Pattern {id: 'pattern_ai_use_case_portfolio'})
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(t2);
```

### Part P · Retrieval Contribution

~52 chunks. Namespace `global:patterns`. Sector variants in sector namespaces. Vendor landscape chunks in `global:vendors` namespace (reused across patterns).

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_vendor_sprawl_ai_tool_rationalization
Summary: AI-enabled tool proliferation without portfolio discipline; duplicate capability, unmanaged spend, shadow procurement, vendor lock-in, governance gaps.
Activates when:
- Unknown count of AI tools in use; spend doesn't reconcile across finance/procurement/IT
- Shadow procurement prevalent (20%+ employees with unsanctioned AI subscriptions)
- Hidden AI activated in SaaS without review (Einstein, Copilot, Now Assist, etc.)
- Capability overlap (3+ tools addressing same category)
- SaaS renewal surprises from AI-feature pricing
- <40% of AI vendor contracts have AI-specific clauses
Diagnostic questions:
- Can you produce current AI tool inventory with owner/spend/use case?
- What AI-specific contract clauses are standard?
- For top 10 SaaS tools, what AI features are activated?
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Top interventions (inventory discovery, capability taxonomy, rationalization framework, sanctioned catalog, standardized clauses, hidden-AI control, spend concentration, portfolio cadence). Top observations (retail inventory reduction, financial services hidden-AI audit, healthcare shadow remediation, cross-sector renewal surprises). Top anti-patterns (one-and-done inventory, capability-overlap denial, ban-without-alternative, contract theater). Regulatory considerations.

**Diagnostic fragment:** 4-6 probing questions; sequenced to surface inventory maturity, shadow procurement scope, hidden-AI awareness, contract coverage.

### Part R · Rendering Contract

`/intelligence/patterns/vendor-sprawl-ai-tool-rationalization`. Light hero + dark working zone.

Unique rendering element: interactive AI tool landscape map showing category-vendor matrix with common overlap zones highlighted. "Your enterprise likely has AI tools in these categories" prompt with category checklist.

Right sidebar: vendor inventory snapshot (if tenant has inventory data loaded); category overlap alerts; shadow procurement estimate.

---

*End of Part 2.4 · Vendor Sprawl & AI Tool Rationalization*

*Next in file sequence: `05-ai-use-case-portfolio-management.md` — Part 2.5*

---
