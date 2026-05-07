# AI Category Taxonomy

8 categories. Each AI initiative gets exactly one primary category. Categories are mutually exclusive at the primary level (an initiative can be tagged with secondary categories but has one primary).

---

## CAT-01 · LLM Productivity

**Definition:** General-purpose AI assistants embedded in everyday work tools. Reduce time-to-output for office workers, knowledge workers, executives.

**Examples in the wild:** Microsoft 365 Copilot, Google Duet AI, SAP Joule for finance teams, Salesforce Einstein Copilot for sales, internal Copilot pilots built on OpenAI/Anthropic APIs.

**Typical KPIs:** Active seats / licensed seats · time saved per task · output quality scores · adoption depth (occasional vs daily user)

**Typical risk:** Adoption gap · cost overrun (token burn) · value attribution loose

---

## CAT-02 · Developer & IT SDLC AI

**Definition:** AI tools embedded in the software development and IT operations lifecycle. Code generation, code review, test generation, documentation, infrastructure-as-code AI, AI-assisted debugging.

**Examples in the wild:** GitHub Copilot, Cursor (vibe coding), Claude Code, Tabnine, Sweep AI, AI-assisted Jira/ServiceNow ticket triage, AI runbook generation.

**Typical KPIs:** PR merge time · code review depth · test coverage · developer satisfaction · incident MTTR · deployment frequency

**Typical risk:** Quality drift · security review gaps · over-reliance on suggestions

---

## CAT-03 · Agentic Operations

**Definition:** Autonomous or semi-autonomous AI agents that take action in operational systems (helpdesk, IT ops, customer service, back-office workflows). Distinguished from "AI assistant" by the agent acting on the system, not just suggesting actions.

**Examples in the wild:** ServiceNow Now Assist (autonomous incident triage), Salesforce Agentforce, autonomous helpdesk agents (Decagon, Sierra, Ada), autonomous IT ops (PagerDuty AI Operations).

**Typical KPIs:** Deflection rate · autonomous resolution % · escalation rate · customer satisfaction post-agent · cost per ticket

**Typical risk:** Autonomy boundary unclear · escalation breakdowns · attribution loose vs human handoff

---

## CAT-04 · ERP & Domain Agents

**Definition:** AI embedded in enterprise resource planning and domain-specific business systems. Finance, HR, procurement, supply chain, revenue cycle. Tied tightly to a specific business process.

**Examples in the wild:** SAP Joule for procurement / supply chain, Workday agents for HR (recruiting · onboarding), Oracle Fusion AI, Coupa AI for spend, Epic AI for clinical revenue cycle.

**Typical KPIs:** Process cycle time · exception rate · accuracy · STP (straight-through processing) rate

**Typical risk:** Vendor lock-in · domain expertise gaps · integration complexity

---

## CAT-05 · Predictive ML

**Definition:** Traditional and modern machine learning models for prediction, classification, scoring. The most mature category — many enterprises have been doing this for 5-10+ years; AI investment is now about modernization (LLM-augmented features, real-time scoring, foundation model fine-tuning).

**Examples in the wild:** Demand forecasting, fraud detection, credit decisioning, churn prediction, clinical risk scoring, predictive maintenance, recommendation engines.

**Typical KPIs:** Model AUC / precision / recall · business outcome (fraud caught $ · NPL avoided $ · churn reduced) · model drift · refresh cadence

**Typical risk:** Model risk governance · regulatory scrutiny · data drift · attribution to outcome

---

## CAT-06 · AI Infrastructure & FinOps

**Definition:** Platform investments that enable other AI initiatives. Token routing, model risk governance frameworks, AI observability, AI cost attribution, vector databases, RAG infrastructure, prompt management, model serving platforms.

**Examples in the wild:** Token routing layers (LiteLLM, Portkey), AI observability (Langfuse, Helicone), model serving (vLLM, Anyscale), governance platforms (Credo AI, Holistic AI).

**Typical KPIs:** Cost per inference · model utilization · attribution coverage % · governance posture score · time-to-deploy

**Typical risk:** Hard to attribute to business outcome · easy to under-invest · easy to over-invest

---

## CAT-07 · Customer-Facing AI

**Definition:** AI that customers directly interact with. Chatbots, conversational interfaces, personalization engines, AI-powered search, recommendation surfaces, voice agents.

**Examples in the wild:** Conversational banking assistants (Erica, Eno), retail recommendation engines, AI search in e-commerce, voice agents for service, personalized content engines.

**Typical KPIs:** Customer satisfaction · NPS impact · conversion rate · containment rate (vs human handoff) · revenue per customer

**Typical risk:** Brand risk · accessibility · regulatory · escalation paths

---

## CAT-08 · Compliance & Governance AI

**Definition:** AI that watches AI. Automated control monitoring, audit AI, regulatory reporting AI, model risk monitoring, bias detection, AI red-teaming platforms.

**Examples in the wild:** Continuous control monitoring (Drata + AI), AI for regulatory reporting (SR 11-7 compliance), model bias platforms (Fiddler, Arthur), AI red-teaming (Robust Intelligence, Calypso AI).

**Typical KPIs:** Control coverage % · finding-to-resolution time · audit cycle time · examiner posture · model risk score

**Typical risk:** Reactive vs proactive · regulatory bar shifting · attribution to avoided cost

---

## Category distribution across tenants (planned)

| Category | Apex Retail | First Capital | Meridian Health |
|---|---|---|---|
| LLM Productivity | 1 | 1 | 1 |
| Developer & IT SDLC AI | 1 | 1 | 1 |
| Agentic Operations | 1 | 1 | 1 |
| ERP & Domain Agents | 1 | — | 1 |
| Predictive ML | 1 | 2 | 1 |
| AI Infrastructure & FinOps | 1 | — | 1 |
| Customer-Facing AI | 1 | 1 | — |
| Compliance & Governance AI | — | 1 | 1 |
| **Total** | **7** | **7** | **7** |

Each tenant has 7 named initiatives. Categories represented vary by tenant industry context (FCF heavier on predictive ML and compliance; Meridian heavier on ERP agents and infrastructure; Apex heavier on customer-facing).
