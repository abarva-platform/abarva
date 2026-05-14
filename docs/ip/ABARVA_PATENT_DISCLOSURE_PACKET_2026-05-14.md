# AbarVa Patent Disclosure Packet

Date: 2026-05-14
Audience: founder, patent counsel, product leadership
Status: internal working disclosure, not legal advice

This packet frames the AbarVa invention surface for counsel. It is not
intended to claim that every item is patentable. The practical goal is
to separate what should be discussed as possible provisional patent
material from what should remain trade secret.

## 1. Counsel-ready thesis

AbarVa is not a generic chatbot over documents. It is a tenant-grounded
decision operating system that converts private enterprise context,
industry pattern knowledge, graph relationships, vector evidence,
agent doctrine, tool permissions, and governance gates into bounded
CXO-grade recommendations and executable workflows.

The strongest potential patent story is the system-level orchestration:

- tenant context is assembled as a typed evidence bundle before model
  reasoning;
- agents are constrained by surface-specific missions and tenant access
  policy;
- recommendations are bound to workflow stages, evidence provenance,
  confidence, dissent, and measurable value;
- agent actions are converted into controlled tools and artifacts, not
  unconstrained free-form outputs;
- the same context layer powers Intelligence, Strategic Moves, Source,
  Tower, and Setup without allowing tenant leakage.

That is the inventive center: a governed context-to-decision-to-action
runtime for enterprise AI and business transformation decisions.

## 2. Filing posture

Recommended posture: file a small family of provisional applications
rather than one broad "AbarVa product" application.

| Provisional | Working title | Why it may matter |
|---|---|---|
| P1 | Tenant-Grounded Agent Context Broker | Protects the context assembly mechanism that turns private tenant data plus shared corpus into a bounded agent prompt and evidence receipt. |
| P2 | Multi-Agent Decision Operating System For Enterprise AI Moves | Protects the cross-surface workflow: Sentinel identifies a bet, Nexus shapes it, Source sources it, Tower monitors value. |
| P3 | Evidence-Governed Recommendation And Dissent Engine | Protects the method of forcing confidence, dissent, what-would-change-my-view, citation, and arithmetic consistency into executive recommendations. |
| P4 | Context-Layer Ingestion, Readiness Scoring, And Activation | Protects Day 1 dataset pack ingestion, readiness scoring, graph/vector mapping, and Day 2 incremental updates. |
| P5 | Vendor And SI Selection Intelligence With Tenant-Specific Sourcing Memory | Protects Source-specific vendor selection, pricing, contract risk, SI mapping, and auditable selection records. |

## 3. Core invention candidates

### Candidate A: Tenant-grounded agent context broker

Problem: Enterprise LLM systems often either expose too much raw data
to the model, retrieve weakly, or produce generic answers divorced from
the tenant's actual org, systems, contracts, policies, and programs.

Potential invention: a broker that receives tenant key, persona, agent
mission, surface, query, access policy, requested domains, and context
mode; then composes a typed bundle from relational records, graph
neighborhoods, vector chunks, evidence citations, readiness warnings,
and source-basis labels.

Distinctive implementation concepts:

- context bundle carries provenance, source basis, sensitivity, tenant
  key, graph summary, warning set, and evidence citations;
- broker rejects unknown tenant and disallows direct app-tier access to
  vector, graph, or enterprise data room internals;
- route shells call bounded broker adapters rather than stores;
- agents see receipts and summary blocks instead of raw databases;
- outputs are paired with context-bundle artifacts so the UI can show
  what evidence was assembled.

Example claim direction for counsel to refine:

> A computer-implemented method for generating an enterprise advisory
> response by resolving a tenant-scoped context bundle from multiple
> private and shared evidence stores, applying an agent mission and
> access policy to the bundle, generating a response constrained by the
> bundle and mission, and emitting both the response and a machine-readable
> evidence receipt.

### Candidate B: Multi-agent decision operating system

Problem: AI initiatives fail because idea generation, business-case
shaping, sourcing, execution governance, and value tracking are usually
handled in disconnected systems.

Potential invention: a coordinated agent system where different agents
share a tenant context layer but have distinct missions:

- Sentinel forms expert views on AI/business bets and pattern evidence;
- Nexus converts a bet into a phase-gated Strategic Move;
- Source shapes vendor and SI selection;
- Atlas watches portfolio value, risk, pressure, adoption, and renewals;
- Steward governs setup, trust, and readiness.

Distinctive implementation concepts:

- surface controls agent mission, prompt doctrine, tool availability,
  artifact grammar, and context domains;
- cross-agent handoff carries structured artifact state rather than
  vague chat memory;
- workflow phases define what evidence must exist before a move can
  progress;
- value realization is tracked as projected, tracked, and verified.

### Candidate C: Evidence-governed recommendation and dissent engine

Problem: Generative AI recommendations sound confident but lack
executive discipline: no dissent, weak confidence calibration, invented
numbers, and poor arithmetic self-checking.

Potential invention: a response-quality layer that evaluates and shapes
agent outputs against expert-consultant criteria:

- opinion formation;
- tenant-specific reasoning;
- confidence calibration;
- evidence citation;
- dissent and what-would-change-my-view;
- arithmetic/ranking consistency;
- no unsupported tenant facts;
- no raw ID/debug syntax in executive chat.

Distinctive implementation concepts:

- pre-answer prompt guard for ranked money values and arithmetic order;
- post-generation validators for synthesis violations;
- audit batteries that score answers by tenant grounding, specificity,
  confidence, citation, dissent, internal consistency, and demo quality;
- corrective doctrine embedded by agent and surface.

### Candidate D: Context-layer ingestion and readiness scoring

Problem: Enterprises cannot get useful agent behavior from generic
document upload alone. The system needs to know which data families
are loaded, which are thin, which support which agent capabilities, and
which should be refreshed through APIs later.

Potential invention: a dataset onboarding system that maps source
artifacts into canonical context segments, computes readiness by segment
and capability, and uses that readiness both to guide Setup and to
condition agent confidence.

Current segment examples:

- enterprise profile;
- org structure and decision rights;
- IT system landscape / CMDB;
- IT financials and budgets;
- KPI dictionary;
- program inventory;
- sourcing artifacts;
- program deliverables;
- evidence ledger;
- operating telemetry;
- vendor and contract inventory;
- compliance and regulatory posture;
- industry context;
- cross-program signals.

Day 2 automation direction:

- HRIS/org API for leadership and span changes;
- ServiceNow/CMDB API for systems, incidents, policies, ITSM workflows;
- ERP/procurement API for contracts, spend, renewals, PO/vendor master;
- cloud billing APIs for AWS/Azure/GCP consumption and unit economics;
- EHR/claims/RCM interfaces in healthcare;
- Jira/GitHub/ADO APIs for SDLC velocity;
- risk/GRC APIs for policies, controls, exceptions, audit findings.

### Candidate E: Vendor and SI selection intelligence

Problem: Vendor selection is often shaped by sales pressure and weak
RFP templates. Enterprises need independent advocacy grounded in their
architecture, cost base, vendor footprint, and implementation risk.

Potential invention: a sourcing agent system that turns tenant context
and use-case context into a shortlist, RFP criteria, pricing questions,
vendor health checks, SI partner mapping, negotiation posture, and
auditable decision documentation.

Distinctive implementation concepts:

- Source intake is chat-driven while the right pane fills structured
  event fields;
- event stages have stage packs, evidence requirements, and exit gates;
- vendor recommendations are conditioned by current contracts, systems,
  operating model, spend, and risk;
- outputs produce defensible procurement records rather than a generic
  vendor catalog.

## 4. What should probably stay trade secret

| Asset | Recommended treatment | Rationale |
|---|---|---|
| Exact prompt text and voice doctrine | Trade secret | Easy to copy if disclosed; changes frequently. |
| Scoring rubrics and audit batteries | Mixed | Some system-level method may be patentable; exact weights and tests should stay private. |
| Tenant corpus taxonomy | Trade secret unless needed for claims | Valuable operating know-how. |
| Pattern library contents | Trade secret / copyright | Differentiates advisory quality; not the core mechanical invention. |
| Demo datasets and personas | Trade secret / product collateral | Not invention-grade by themselves. |
| Model/provider routing thresholds | Trade secret | Operational tuning. |

## 5. Prior-art and patentability risks to discuss with counsel

Software and AI patents require careful claim drafting. Avoid claims
that read like "use an LLM to advise executives." That is likely too
abstract. The stronger posture is a practical technical application:
tenant-isolated context assembly, evidence receipts, access-aware
agent missions, controlled tool execution, and workflow-gated outputs.

Specific risk areas:

- generic RAG systems;
- agent orchestration frameworks;
- workflow/PMO software;
- vendor management / sourcing platforms;
- data catalog and governance tools;
- decision intelligence / business intelligence systems.

Specific differentiators to emphasize:

- multi-plane architecture with broker-enforced store boundaries;
- typed context bundles, evidence receipts, source-basis labels, and
  sensitivity gating;
- agent missions mapped to enterprise decision surfaces;
- phase-gated decision workflows connected to sourcing and portfolio
  value monitoring;
- tenant leak prevention as an architectural mechanism, not just policy;
- expert-consultant answer controls including dissent and arithmetic
  reflection.

## 6. Evidence to collect before counsel session

| Evidence | Location / owner | Why counsel needs it |
|---|---|---|
| Architecture diagrams | `docs/architecture/*` | Shows technical system, not just business concept. |
| Agent C boundary PRs | PR #1933 and follow-on | Shows broker boundary and app-tier route hardening. |
| Context bundle contracts | `src/lib/knowledge/context-broker/*` | Shows typed mechanism. |
| Enterprise agent broker | `src/lib/knowledge/agent-context-broker.ts` | Shows tenant-grounded agent context. |
| Strategic Moves phase model | `docs/design/strategic-moves/*` | Shows workflow-gated decision lifecycle. |
| Source stage packs | `src/lib/source/stage-packs*` | Shows sourcing-specific operating method. |
| Audit reports | `docs/audit/*` and `audit-2026-05-13/*` | Shows problem/solution and quality gates. |
| Product screenshots | Product, Intelligence, Moves, Source, Tower | Helps counsel understand reduction to practice. |

## 7. Attorney question list

1. Which invention candidates are strongest as provisional filings?
2. Should the first filing be a system claim around the context broker,
   or a method claim around decision workflow orchestration?
3. How much prompt/doctrine detail must be disclosed versus retained as
   trade secret?
4. Can evidence receipts, source-basis labels, and tenant-context
   readiness scoring be claimed as technical improvements?
5. How should claims avoid being characterized as an abstract business
   method?
6. Should we file before external demos with Prat, Vipin, Sriram, Kiran,
   or Sharad?
7. Who must be listed as human inventors for each candidate?

## 8. Official reference links for counsel packet

- USPTO AI subject matter eligibility guidance: https://www.uspto.gov/about-us/news-updates/uspto-issues-ai-subject-matter-eligibility-guidance
- USPTO subject matter eligibility resources: https://www.uspto.gov/patent/laws-and-regulations/examination-policy/subject-matter-eligibility
- USPTO MPEP 2106 subject matter eligibility: https://www.uspto.gov/web/offices/pac/mpep/s2106.html

