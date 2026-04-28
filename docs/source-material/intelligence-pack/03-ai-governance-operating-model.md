# Part 2.3 · AI Governance Operating Model

## 2.3 · AI Governance Operating Model

### YAML front-matter

```yaml
pattern_id: pattern_ai_governance_operating_model
slug: ai-governance-operating-model
name: AI Governance Operating Model
version: 1.0.0
status: active
category: Risk & Governance
cross_industry: true
sector_applicability: [healthcare, retail, financial_services, energy, cross_sector]
short_description: >
  The organizational mechanism that decides what AI gets built, who authorizes
  production deployment, what risk controls apply, how incidents are handled,
  and how governance keeps pace with AI capability velocity without becoming
  theater. Covers AI Council structure, risk-tiered approval, policy design,
  integration with existing risk functions, and the operating cadence that
  makes governance usable rather than obstructive.
long_description: >
  Enterprises typically respond to AI governance pressure with either extreme.
  The first extreme is policy theater: long policy documents authored by risk
  and compliance functions, approved at committee, sitting in SharePoint,
  read by no one, violated in every AI deployment. The second extreme is
  governance absence: AI deployment happens with no formal oversight, shadow
  AI adoption runs ahead of leadership awareness, and the first real
  governance event is either a regulatory inquiry or a customer-facing
  incident. The pattern captures both extremes and the operating model that
  threads between them — a risk-tiered, decision-rights-explicit, cadence-
  disciplined AI governance function that scales with organizational AI
  maturity without introducing friction disproportionate to actual risk.
confidence_floor: 0.70
n_observations_floor: 8
related_patterns:
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_ai_led_pdlc, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: associative }
  - { id: pattern_vendor_sprawl_ai_tool_rationalization, relationship: associative }
  - { id: pattern_shadow_ai_governance, relationship: associative }
regulatory_frameworks:
  - id: framework_nist_ai_rmf
    applicability: always
  - id: framework_eu_ai_act
    applicability: eu_deployments_and_operations
  - id: framework_sr_11_7
    applicability: sector_specific_financial_services
  - id: framework_hipaa_security_rule
    applicability: sector_specific_healthcare
  - id: framework_iso_42001
    applicability: always
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_ai_governance_operating_model`
**Name:** AI Governance Operating Model
**Short description:** The organizational mechanism that decides what AI gets built, who authorizes deployment, what controls apply, and how governance keeps pace with capability velocity.

**Long description:** AI governance as an abstract topic is uncontroversial — every organization knows they need it. AI governance as an operating model is where the hard decisions happen. Who owns it (CIO? CDO? CAIO? Chief Risk Officer?). Where does it report (technology? risk? independent?). How does it decide (committee? delegated?). What's in scope (production AI? shadow AI? vendor AI in the SaaS stack? agent tools in engineering?). What's the risk taxonomy (EU AI Act tiers? NIST AI RMF dimensions? internal?). How often does it meet (monthly? quarterly? crisis-only?). The answers to these questions determine whether governance enables responsible AI deployment or suffocates it. The pattern identifies the failure modes at both ends of the spectrum and the operating-model choices that produce functional governance at scale.

### Part B · Classification

**Category:** Risk & Governance
**Cross-industry:** Yes — every sector faces AI governance pressure; regulatory specificity differs
**Sector applicability:** All sectors. Financial services has the most mature baseline (SR 11-7 model risk management provides a starting point adapted to GenAI). Healthcare has specific regulatory pressure (patient safety, PHI handling). Retail has growing pressure (consumer protection, privacy, brand risk). Energy has safety-critical concerns (OT systems, grid reliability). Cross-sector: every enterprise with EU footprint faces EU AI Act obligations.
**Variant of:** None (foundational pattern)
**Related patterns:** AI Use Case Portfolio (governance acts on the portfolio), AI-Led PDLC (governance over agent deployment), Analytics Modernization (data governance underpins AI governance), Vendor Sprawl (AI vendor governance), Shadow AI Governance (governance must address shadow adoption)

### Part C · Detection

#### C.1 · Trigger symptoms

- No named AI governance owner at executive level; ownership distributed across CIO/CDO/CRO/CCO with unclear decision rights
- AI policy document exists but no mechanism for enforcement or exception tracking
- AI deployments proceeding with no documented risk assessment
- Shadow AI adoption widespread; leadership reports uncertainty about usage scope
- First governance event triggered by external pressure (regulatory inquiry, customer escalation, media coverage) rather than internal initiative
- Model risk function exists (financial services) but treats GenAI as out of scope or materially different
- EU AI Act exposure not assessed despite EU operations or EU customers
- AI vendor contracts signed without AI-specific risk review
- Incidents or near-misses with AI systems not triaged or learned from
- Board-level AI questions cannot be answered within a reasonable timeframe

#### C.2 · Detection signals

**Signal 1 · Decision rights void.**
- Type: `evidence_pattern`
- Threshold: When asked "who authorizes a new production AI deployment?", leadership gives multiple, inconsistent answers
- Evidence: stakeholder interviews, org chart, policy documents

**Signal 2 · Policy-without-practice gap.**
- Type: `contradiction`
- Threshold: AI policy document references controls that cannot be demonstrated in any production AI deployment
- Evidence: policy doc, deployment audit, control evidence

**Signal 3 · Shadow AI prevalence.**
- Type: `evidence_pattern`
- Threshold: Employee survey indicates 40%+ using generative AI tools without IT/governance awareness
- Evidence: employee survey, SaaS discovery scans, network telemetry

**Signal 4 · Risk taxonomy absence.**
- Type: `evidence_pattern`
- Threshold: No defined risk tiering for AI use cases; approval workflow not tier-differentiated
- Evidence: governance documentation, approval workflow records

**Signal 5 · Incident invisibility.**
- Type: `evidence_pattern`
- Threshold: No defined AI incident reporting path; no record of AI-related incidents or near-misses
- Evidence: incident management system, SOC records, risk committee minutes

**Signal 6 · EU AI Act non-assessment.**
- Type: `audit_finding`
- Threshold: EU operations or EU customer base present, but no documented EU AI Act gap assessment
- Evidence: regulatory documentation, risk register

**Signal 7 · Vendor AI review gap.**
- Type: `evidence_pattern`
- Threshold: AI-enabled SaaS vendors (e.g., CRM with GenAI features, productivity tools with AI) contracted without AI-specific review
- Evidence: vendor contracts, procurement records, AI tool inventory

**Signal 8 · Board-level blindspot.**
- Type: `evidence_pattern`
- Threshold: Board AI questions (usage, spend, risk exposure, incidents) take more than 2 weeks to answer or cannot be answered comprehensively
- Evidence: board materials, management response timing

#### C.3 · Diagnostic questions

1. Who is the single accountable executive for AI at your organization, with documented decision rights?
2. What is the current count of AI use cases in production, and who approved each?
3. What is the risk tiering framework applied to AI use cases, and who calibrated it?
4. How does AI governance integrate with your existing risk and compliance functions?
5. What is your EU AI Act exposure posture, and when was it last assessed?
6. How do you discover and govern AI embedded in vendor SaaS tools?
7. What is your AI incident response path, and when was it last exercised?
8. How does governance cadence match AI capability velocity? (typical answer reveals mismatch)

#### C.4 · Evidence requirements

**Confident detection (≥0.75):**
- AI governance documentation (or documented absence)
- Decision rights record
- Risk taxonomy and approval workflow documents
- Policy documents and exception log
- Stakeholder interviews with CIO, CDO, CAIO (if exists), CRO, CCO
- AI use case inventory with approval records

**High confidence (≥0.85):** Add employee survey, shadow AI audit, vendor AI inventory, EU AI Act gap assessment (if applicable), incident log.

#### C.5 · Confidence rubric

- **0.9+:** No named AI executive, no risk tiering, shadow AI widespread, policy gaps demonstrable
- **0.75-0.9:** Partial governance structure but clear gaps in decision rights or coverage
- **0.6-0.75:** Governance exists but maturity unclear; diagnostic probing recommended
- **Below 0.6:** Do not surface

### Part D · Causal Structure

**Root cause 1 · AI treated as technology decision rather than enterprise governance concern.**
CIO or CDO manages AI deployment inside technology function without enterprise governance integration. Risk, compliance, legal, ethics not embedded. Deployment decisions made on technology merit, not risk tier or strategic fit.

**Root cause 2 · Existing risk functions don't self-extend to cover AI.**
Model risk (financial services) frames AI as traditional model; misses prompt-level risks, hallucination risks, agent-action risks. Compliance defaults to existing frameworks; doesn't update for EU AI Act or NIST AI RMF. Legal reviews contracts but not model deployments.

**Root cause 3 · Governance velocity mismatch.**
AI capability moves at weeks-quarters cadence (model upgrades, new agent capabilities, new use cases). Governance operates at months-years cadence (committee reviews, policy approvals, audit cycles). Mismatch creates either bypass (shadow AI) or bottleneck (governance becomes blocker).

**Root cause 4 · Policy without operating model.**
Organizations author AI policy in isolation from how work actually happens. Policy references controls that don't exist, roles that are undefined, processes that have no owner. Policy becomes SharePoint artifact, not living operating discipline.

**Root cause 5 · Risk tiering absence.**
Without risk tiering, every AI deployment goes through same approval, which either means heavy scrutiny on trivial use cases (exhausting governance capacity) or light scrutiny on high-risk use cases (creating real exposure). Risk tiering is the mechanism that aligns governance investment to actual risk.

**Causal chain:**

```
ai_treated_as_tech_decision
  → enterprise_governance_not_integrated
  → risk_functions_dont_self_extend
  → governance_velocity_mismatch
  + policy_without_operating_model
  → risk_tiering_absence
  → governance_theater
  → shadow_ai_runs_around_governance
  → first_real_event_is_incident_or_regulatory_inquiry
```

### Part E · Interventions

**Intervention 1 · Named AI governance executive with decision rights.**
Single accountable executive at C-level or equivalent (Chief AI Officer, Chief Data & AI Officer, or designated CDO/CIO extension). Documented decision rights: what this executive authorizes, what escalates, what delegates. Integration with CRO, CCO, CPO defined.
- *Success rate:* 0.76 (n=13 orgs)
- *Effort:* Medium · 4-8 weeks to define and announce
- *Conditions:* CEO sponsorship; willingness to designate single accountability rather than distributed

**Intervention 2 · Risk-tiered approval workflow.**
Define 3-5 risk tiers (e.g., Tier 1 exploratory / Tier 2 internal-facing / Tier 3 customer-facing / Tier 4 high-risk decisions / Tier 5 safety-critical or regulated). Each tier has named approval path, required controls, review cadence. Tiers align with EU AI Act risk categories where applicable.
- *Success rate:* 0.74 (n=15 orgs)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* Cross-functional working group (IT + risk + compliance + legal + AI product); willingness to enforce tiers

**Intervention 3 · AI Council operating cadence.**
Cross-functional council (typically: AI exec + CRO + CCO + CPO + CISO + business domain leads) with defined cadence (monthly for most; weekly for fast-moving periods). Clear charter: approval of Tier 3+ use cases, policy updates, incident review, horizon scanning. Decisions logged and traceable.
- *Success rate:* 0.70 (n=12 orgs)
- *Effort:* Medium · 8-12 weeks to establish
- *Conditions:* Executive commitment to attendance; operating cadence compatible with AI velocity; clear charter

**Intervention 4 · Model card + use case card discipline.**
Every AI use case has a structured card: intent, data, model, training, evaluation, limitations, risk tier, monitoring, incident plan. Reviewed at approval; updated on material change; retired with use case. Cards version-controlled and auditable.
- *Success rate:* 0.72 (n=11 orgs)
- *Effort:* Medium · 8-12 weeks to institute
- *Conditions:* Template authored; review discipline; integration with deployment gates

**Intervention 5 · Integration with existing risk functions, not replacement.**
AI governance extends rather than replaces: model risk function (financial services) adds GenAI-specific criteria; compliance adds EU AI Act and NIST AI RMF; legal adds AI-specific contract provisions; privacy adds AI-specific data handling; security adds AI-specific threat models. Governance is a dimension added to existing machinery, not a new parallel machinery.
- *Success rate:* 0.68 (n=14 orgs)
- *Effort:* Medium-Large · 12-20 weeks
- *Conditions:* Existing risk functions willing to extend; cross-function coordination; skill augmentation where needed

**Intervention 6 · Continuous horizon scanning.**
Monthly (at minimum) scan of regulatory developments (EU AI Act implementation, state/national AI laws, sector-specific rules), AI capability developments (new models, new risks, new attack vectors), and internal deployment developments. Fed into AI Council agenda and policy updates.
- *Success rate:* 0.65 (n=9 orgs)
- *Effort:* Small-Medium · 4-8 weeks to institute
- *Conditions:* Dedicated owner; information sources established; feedback loop to policy

**Intervention 7 · Incident response and learning loop.**
AI-specific incident response path. Covers both classic incidents (system outage, data leak) and AI-specific events (model misbehavior, prompt injection, hallucination causing customer harm). Post-incident review institutionalized; learnings feed into policy, controls, model cards.
- *Success rate:* 0.62 (n=8 orgs)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* Incident response team scope extension; AI expertise in response team; culture of learning rather than blame

**Intervention 8 · Vendor AI governance.**
AI-specific vendor review protocol. All AI-enabled vendors (including hidden AI in SaaS tools) inventoried. AI-specific contract clauses (model provenance, data handling, incident notification, audit rights). Integration with procurement.
- *Success rate:* 0.58 (n=7 orgs)
- *Effort:* Medium-Large · 12-20 weeks
- *Conditions:* Procurement partnership; legal authorship of AI contract templates; vendor inventory tooling

### Part F · Anti-Patterns

- **Policy theater.** Long policy docs that no one references in operational decisions.
- **Single-function governance.** Owned entirely by IT, or risk, or compliance, without cross-functional integration.
- **Committee-of-committees.** Governance distributed across multiple overlapping committees with unclear decision rights.
- **One-size-fits-all approval.** Every AI use case through same approval process; either slow on low-risk or lax on high-risk.
- **Reactive-only governance.** Only responds to incidents or regulatory events; no proactive design.
- **Shadow AI tolerance.** Leadership aware of shadow AI but doesn't address; over time grows to material exposure.
- **Hidden-AI blindness.** Governance covers AI built in-house but misses AI in vendor tools.
- **Velocity-mismatched cadence.** Quarterly governance operating on monthly-velocity AI capability.

### Part G · Vendor Landscape

**AI governance tooling:**
- **Credo AI, Holistic AI, Modulos** — dedicated AI governance platforms (model cards, risk assessment, audit trail)
- **ServiceNow GRC** — extending traditional GRC to AI
- **OneTrust AI Governance** — privacy-and-AI integration
- **Monte Carlo, WhyLabs, Arize, Fiddler** — AI observability with governance crossover
- **Weights & Biases, MLflow** — model registry + governance features
- **Microsoft Purview** — governance including AI scope
- **Collibra AI Governance** — data governance platform with AI extensions

**Model risk management tooling (FinServ-specific, relevant to AI):**
- SAS Model Risk Management, IBM OpenScale, Dataiku Govern, proprietary bank-built systems

**Shadow AI discovery:**
- Netskope, Zscaler, Bitglass — CASB tools with AI/LLM detection
- Harmonic Security, Nightfall, Prompt Security — LLM-specific security
- Bigid, OneTrust — data flow discovery

**Regulatory intelligence:**
- Thomson Reuters Regulatory Intelligence, Compliance.ai — automated regulatory change tracking

**AbarVa positioning:** Platform-agnostic. AbarVa's opinion is on operating model (who decides, what tiers, what cadence, what integration) rather than on tool selection. Most governance tool purchases go poorly because they precede operating model clarity; AbarVa's intervention order is operating model first, tool selection second.

### Part H · Regulatory Considerations

**Always-applicable:**
- **NIST AI Risk Management Framework 1.0** — voluntary but foundational; scaffolds most operating models. Cross-references GOVERN, MAP, MEASURE, MANAGE functions.
- **ISO/IEC 42001 (AI Management System)** — certification-track AI management system standard; increasingly referenced in regulated procurement.

**Jurisdictional:**
- **EU AI Act** — risk-tier framework (prohibited / high-risk / limited risk / minimal risk); obligations on providers and deployers; phased in 2025-2027. Cross-border enterprises face compliance obligations regardless of HQ location.
- **US state-level** — California, Colorado, Illinois, Texas, New York emerging specific AI obligations; federal activity uneven. Monitor via horizon scanning.
- **UK** — pro-innovation principles-based framework; sector regulators (ICO, FCA, CMA) issue AI-specific guidance.

**Sector-specific:**
- **Financial Services:** SR 11-7 model risk management, BCBS operational risk principles, FCA Consumer Duty (UK), FINRA Reg BI (US). Existing model risk machinery must extend to GenAI with adapted criteria.
- **Healthcare:** FDA AI/ML device regulation, HIPAA Security Rule, state medical privacy laws, clinical evidence standards, patient safety protocols. AI governance intersects clinical governance.
- **Retail:** FTC guidance on AI, state privacy laws (CCPA/CPRA, VCDPA), consumer protection, advertising standards. Product safety for AI-enabled products.
- **Energy:** NERC CIP for bulk electric system AI, FERC guidance, CFTC for AI in commodity trading, state PUC for utility AI.

### Part I · Observations

**Obs 1 · Financial services AI Council formation.**
Tier-1 US bank stood up AI Council under Chief Risk Officer with participation from Chief Data Officer, Chief Information Officer, Chief Compliance Officer, Chief Privacy Officer, General Counsel. Weekly cadence during initial 6 months; monthly thereafter. SR 11-7 extended with GenAI-specific criteria. Model card discipline applied to all AI use cases. 18 months in: 40+ use cases governed, 3 high-risk use cases explicitly declined, zero material AI incidents.

**Obs 2 · Healthcare IDN governance integration.**
Large IDN established AI governance as extension of Medical Informatics Committee rather than new structure. CMIO became AI governance chair with CIO, Chief Nursing Officer, Chief Legal Officer participation. Clinical risk frame applied to AI use cases; patient safety became primary review criterion. Operating model took 9 months to stabilize; by month 12, ambient clinical documentation, clinical decision support, and revenue cycle AI all governed through single structure.

**Obs 3 · Retail vendor AI discovery.**
Mass retailer conducted AI-enabled vendor inventory: discovered 47 SaaS tools in production with AI features (CRM, marketing automation, forecasting, HR screening, cybersecurity, etc.). 31 had no AI-specific review. 8 had material customer-facing AI features requiring governance classification. Governance backlog took 6 months to clear.

**Obs 4 · Energy OT/IT governance bifurcation.**
Integrated energy company established dual-track governance: IT-side AI under CIO; OT-side AI (safety-critical, grid-adjacent) under Chief Operating Officer with NERC-CIP coordination. Explicit decision rights prevented cross-contamination (IT AI not deployed near OT; OT AI not casually updated). Regulatory relationships managed separately.

**Obs 5 · Mid-stage tech policy-to-practice.**
SaaS scale-up authored AI policy in 2024; by 2026 found only 20% of AI deployments referenced policy in approval records. Policy refresh reduced length by 60% and added operating model (who approves what, what cadence). Post-refresh, 85% of deployments reference policy in approval records.

**Obs 6 · Cross-sector shadow AI remediation.**
Organizations that conducted employee AI use surveys found 45-70% of employees using generative AI tools outside IT awareness. Shadow AI remediation programs (inventory + sanctioned tool provision + clear policy) typically reduced high-risk shadow AI by 60-80% within 6 months while often increasing total sanctioned usage.

**Obs 7 · FinServ EU AI Act gap.**
US-HQ bank with EU subsidiary assessed EU AI Act exposure: found 4 high-risk AI systems (credit decisioning, fraud detection scoring, customer onboarding, claims processing) requiring EU AI Act conformity assessment. Remediation plan required 12-18 months of work to document, conformity-assess, and maintain ongoing oversight. Started too late relative to enforcement timeline; had to scope down some deployments.

**Obs 8 · Healthcare incident learning.**
Health system deployed clinical AI use case; 6 months in, observed model drift producing occasional clinically misleading outputs. Incident response triggered: model paused, root cause analyzed (data shift post-deployment), model card updated, monitoring enhanced, deployment resumed with tighter oversight. Post-incident review shared across institution as learning artifact; governance credibility strengthened.

### Part J · Success Measures

**Leading indicators (monthly):**
- AI use cases with completed model/use case cards (target: 100% of production)
- Tier distribution of use cases (should reflect actual risk, not skew to low tier for convenience)
- AI Council decision backlog (target: <2 weeks mean time to decision for Tier 3+)
- Horizon scanning artifact freshness
- Shadow AI discovery cadence

**Lagging indicators (quarterly):**
- AI incidents and near-misses, with trend
- Regulatory findings or inquiries related to AI
- Policy exception rate (targets should trend down as policy matures)
- Employee survey on AI policy awareness
- Board-level AI question response time

**Maturity thresholds:**
- **Emerging:** policy exists; operating model absent or nominal; no risk tiering; no council
- **Scaling:** named executive; risk tiering; council forming; model cards for new deployments
- **Mature:** operating model institutionalized; council cadence stable; cards comprehensive; incident learning loop; regulatory integration
- **Optimized:** continuous horizon scanning; proactive policy evolution; cross-function fluency; governance velocity matches AI velocity

### Part K · Timeline & Sequencing

**Months 0-3 · Foundation**
- CEO designates single AI governance executive
- AI Council chartered with initial cross-function membership
- Baseline AI use case inventory
- Initial risk tiering framework drafted

**Months 3-6 · Operating model rollout**
- Decision rights documented
- Approval workflows per tier launched
- Model/use case card templates authored
- Integration with existing risk functions (model risk, compliance, legal, privacy, security)

**Months 6-12 · Maturity**
- Shadow AI discovery and remediation
- Vendor AI governance rollout
- Horizon scanning cadence established
- Incident response path defined and exercised
- Policy refresh based on operating experience

**Months 12-18 · Scale and integrate**
- Board reporting cadence established
- Continuous improvement loop running
- Regulatory readiness (EU AI Act, sector-specific) closed

**Months 18-24 · Institutionalize**
- AI governance institutional; part of enterprise risk framework
- Continuous measurement and evolution

### Part L · Governance Mechanism

| Decision | Owner | Review body | Cadence |
|---|---|---|---|
| Policy approval | AI Council chair | AI Council + CEO | Annual + as needed |
| Tier 4-5 use case approval | AI Council | Board (Tier 5) | Per deployment |
| Tier 3 use case approval | AI Council | — | Per deployment (monthly) |
| Tier 1-2 approval | Delegated to tier owners | Reporting to AI Council | Continuous |
| Vendor AI review | Procurement + AI Council | — | Per vendor |
| Incident review | Incident response team + AI Council | — | Per incident |
| Horizon scan | Chief AI Officer | AI Council | Monthly |

**Escalation paths:**
- Tier 3 incidents → AI Council within 48h
- Tier 4-5 incidents → immediate AI Council + CRO + CEO
- Regulatory contact → immediate General Counsel + AI Council chair
- Board material AI matters → quarterly board reporting + as-needed

### Part M · Sector Variants

**Financial Services:** AI governance extends SR 11-7 model risk management with GenAI-specific dimensions. Model risk function typically owns AI governance with CRO oversight. Strong alignment between existing model risk machinery and AI governance.

**Healthcare:** AI governance integrates with medical informatics and clinical governance. CMIO or Chief Medical Officer often chairs. Patient safety is primary review criterion; clinical evidence standards apply to clinical AI.

**Retail:** Chief Digital Officer or CIO often owns. Integration with privacy, consumer protection, brand risk. Vendor AI governance particularly load-bearing because of SaaS heavy stack.

**Energy:** Dual-track governance common (IT AI under CIO; OT AI under COO with regulatory coordination). NERC-CIP, FERC, state PUC relationships separate.

**Cross-sector:** EU AI Act applies to any enterprise with EU operations or EU customer base; assessment required regardless of sector.

### Part N · Related Patterns

- **`pattern_ai_use_case_portfolio`** (associative) — governance acts on the portfolio; portfolio decisions require governance approval
- **`pattern_ai_led_pdlc`** (associative) — governance over agent tools and agent deployments
- **`pattern_analytics_modernization`** (associative) — data governance underpins AI governance
- **`pattern_vendor_sprawl_ai_tool_rationalization`** (associative) — AI vendor governance and consolidation
- **`pattern_shadow_ai_governance`** (associative) — shadow AI must be addressed as part of governance operating model

### Part O · Graph Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_ai_governance_operating_model'})
SET p.slug = 'ai-governance-operating-model',
    p.name = 'AI Governance Operating Model',
    p.version = '1.0.0',
    p.category = 'Risk & Governance',
    p.cross_industry = true,
    p.confidence_floor = 0.70,
    p.n_observations_floor = 8,
    p.status = 'active';

// Category
MERGE (c:Category {name: 'Risk & Governance'})
MERGE (p)-[:OF_CATEGORY]->(c);

// Sectors
FOREACH (sector IN ['healthcare','retail','financial_services','energy','cross_sector'] |
  MERGE (s:Sector {id: sector})
  MERGE (p)-[:APPLIES_TO_SECTOR]->(s)
);

// Regulatory frameworks
MERGE (f1:RegulatoryFramework {id: 'framework_nist_ai_rmf'})
ON CREATE SET f1.name = 'NIST AI Risk Management Framework 1.0', f1.jurisdiction = 'US', f1.applicability = 'always';
MERGE (f1)-[:APPLIES_TO {applicability_note: 'Voluntary foundational framework; scaffolds most operating models'}]->(p);

MERGE (f2:RegulatoryFramework {id: 'framework_eu_ai_act'})
ON CREATE SET f2.name = 'EU AI Act', f2.jurisdiction = 'EU', f2.applicability = 'jurisdictional';
MERGE (f2)-[:APPLIES_TO {applicability_note: 'Risk-tier framework; obligations on providers and deployers'}]->(p);

MERGE (f3:RegulatoryFramework {id: 'framework_sr_11_7'})
ON CREATE SET f3.name = 'SR 11-7 Guidance on Model Risk Management', f3.jurisdiction = 'US', f3.applicability = 'sector_specific';
MERGE (f3)-[:APPLIES_TO {applicability_note: 'Financial services model risk framework; extend to GenAI'}]->(p);

MERGE (f4:RegulatoryFramework {id: 'framework_iso_42001'})
ON CREATE SET f4.name = 'ISO/IEC 42001 AI Management System', f4.jurisdiction = 'global', f4.applicability = 'always';
MERGE (f4)-[:APPLIES_TO {applicability_note: 'Certification-track AI management system standard'}]->(p);

// Signals (8)
// Interventions (8)
// Anti-patterns (8)
// Vendors (Credo AI, Holistic AI, ServiceNow, OneTrust, etc.)
// Observations (8)
// Related patterns
MATCH (p:Pattern {id: 'pattern_ai_governance_operating_model'})
MATCH (t1:Pattern {id: 'pattern_ai_use_case_portfolio'})
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(t1);

MATCH (p:Pattern {id: 'pattern_ai_governance_operating_model'})
MATCH (t2:Pattern {id: 'pattern_ai_led_pdlc'})
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(t2);

// Full DDL expanded in assembly; structure mirrors Analytics Modernization pattern
```

### Part P · Retrieval Contribution

~55 chunks. Namespace placement: `global:patterns` for cross-sector content; `global:patterns:{vertical}` for sector variants; `global:regulatory_frameworks` for detailed framework content.

Sample chunk types and counts:
- Pattern summary (1)
- Long description (1)
- Signals (8)
- Diagnostic questions (8)
- Interventions (8)
- Anti-patterns (8)
- Observations (8)
- Vendor landscape (3 chunks covering governance platforms, MRM, shadow AI discovery)
- Sector variants (5)
- Regulatory frameworks referenced (5 short summary chunks + links to full framework content)
- Timeline + Governance + Success Measures (3 chunks)

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_ai_governance_operating_model
Summary: Organizational mechanism for deciding what AI gets built, who authorizes deployment, what controls apply.
Activates when:
- No named AI governance executive with documented decision rights
- Policy document exists but controls not demonstrable in deployments
- Shadow AI prevalence indicator (40%+ employee use outside IT awareness)
- Risk taxonomy absence; no tier-differentiated approval workflow
- No AI incident reporting path or record
- EU AI Act exposure not assessed despite EU operations
- AI-enabled vendor tools contracted without AI-specific review
- Board AI questions cannot be answered within 2 weeks
Diagnostic questions in scope:
- Who is accountable AI executive with decision rights?
- What is AI risk tiering framework?
- How does governance integrate with existing risk/compliance functions?
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Top interventions (named executive, risk-tiered workflow, AI Council, model cards, integration with existing risk, horizon scanning, incident response, vendor governance). Top observations (FinServ AI Council, Healthcare IDN integration, Retail vendor discovery, EU AI Act gap). Top anti-patterns (policy theater, single-function ownership, committee-of-committees, one-size approval). Regulatory landscape (NIST AI RMF, EU AI Act, SR 11-7, ISO 42001, sector-specific).

**Diagnostic fragment:** 4-6 probing questions from C.3 with typical answer framings. Sequenced to surface decision rights clarity, risk tiering maturity, integration with existing risk, and horizon scanning posture.

### Part R · Rendering Contract

`/intelligence/patterns/ai-governance-operating-model`. Light hero + dark working zone. Central content: decision rights matrix, risk tier definitions, AI Council charter template. Right sidebar: regulatory framework quick-reference cards. Tab view for sector variants.

Unique rendering element: "Governance Maturity" self-assessment widget on the page — 12 questions, returns emerging/scaling/mature/optimized rating with color-coded dimensions.

---

*End of Part 2.3 · AI Governance Operating Model*

*Next in file sequence: `04-vendor-sprawl-ai-tool-rationalization.md` — Part 2.4*

---
