# Source Module Product Design v1

Status: canonical design baseline for the next Source implementation slices.

Audience: founder, app-tier agents, knowledge-layer agents, and reviewers.

Principle: Source is not a procurement dashboard with a chat box. Source is the operating system for IT sourcing events. Sentinel is the sourcing partner that turns a business trigger into scoped, evidence-backed, gate-ready sourcing motion.

Research basis: this design is grounded in public procurement, outsourcing, ICT supply-chain risk, and AI risk-management references, then adapted to AbarVa's enterprise IT lifecycle. Key anchors:

- UK Government Sourcing Playbook: pipeline planning, should-cost discipline, selection versus bid evaluation, contract management, and strategic supplier relationship management.
- NIST SP 800-161 Rev. 1: ICT cybersecurity supply-chain risk management across supplier acquisition, risk assessment, assurance, and monitoring.
- NIST AI RMF: trustworthy AI risk management for AI-enabled products, services, systems, and third-party capabilities.
- ISO 37500: outsourcing lifecycle governance, provider selection, transition, value delivery, relationship governance, and exit/continuation discipline.

## 1. Product Thesis

Source exists to prevent expensive IT buying mistakes before they are locked into vendor process, contract language, or transformation delivery. It does this by forcing every sourcing event through:

- A clear event intake floor before registration.
- Stage-specific entry and exit criteria.
- Evidence-backed decisions instead of vendor-led narratives.
- Live connection to Programs when sourcing is part of a transformation.
- A right-side canvas that materializes the current sourcing state instead of making the user read long chat answers.

The product promise is:

> AbarVa helps IT and procurement teams create, run, and govern technology sourcing events with the rigor of a senior sourcing partner: clear scope, real decision authority, comparable evidence, credible walkaway leverage, and clean transition back to program execution.

## 2. Primary Users

| User | Job | Needs From Source |
|---|---|---|
| CIO / IT executive | Sponsor or stop major sourcing motion | Current status, decision needed, risk, value, authority path |
| IT procurement lead | Run the sourcing event | Stage workflow, templates, vendor comparison, approval discipline |
| Program lead | Spawn sourcing from a program | Linked event, criteria carryover, vendor decision returned to program |
| Vendor manager | Manage incumbent and renewal posture | Contract dates, renewal risk, leverage, QBR / scorecard context |
| Finance partner | Validate value and savings | Baseline run-rate, target savings, commercial assumptions |
| Legal / security / risk | Review contract and risk posture | Clause callouts, data/privacy posture, subprocessor and exit risks |

## 2.5 Best-In-Class Design Tenets

The best Source experience should borrow from strong consulting and procurement practice, not from generic SaaS form flows.

| Tenet | External Anchor | AbarVa Product Translation |
|---|---|---|
| Look ahead, not only react | Sourcing Playbook pipeline discipline | Source portfolio shows upcoming renewals, active events, blocked gates, and next decisions |
| Build a should-cost / baseline before negotiating | Sourcing Playbook should-cost discipline | Every event requires current run-rate, demand, volume, service, or benchmark evidence before BAFO |
| Separate supplier qualification from bid evaluation | Sourcing Playbook selection versus evaluation distinction | S2 Shortlist evaluates supplier suitability; S3/S4/S5 evaluate responses, demos, and commercial offers |
| Treat ICT supply chain as risk-bearing | NIST SP 800-161 | Vendor cards include cyber, resilience, subprocessor, software supply-chain, and contract-control posture |
| Treat AI claims as trust/risk claims | NIST AI RMF | AI-enabled vendors require AI governance, data, model, monitoring, and human-control evidence |
| Manage outsourcing beyond award | ISO 37500 | S7 Activate carries transition, governance, service readiness, and value realization, not just contract signature |
| Keep the business case alive | ISO 37500 | Value ledger and kill criteria are rechecked at intake, BAFO, contract, activation, and renewal |
| Make relationship governance explicit | ISO 37500 / Sourcing Playbook SRM | Strategic supplier cadence, QBRs, scorecards, escalation, and exit options become post-award artifacts |

## 3. What The Source Landing Page Must Communicate

When a user lands on `/source`, the page must answer four questions without requiring chat:

1. What is this page for?
2. How do I create a sourcing event?
3. Why is Sentinel here?
4. What needs attention in the current sourcing portfolio?

### Required Above-The-Fold Elements

- Page title: "Create, run, and govern IT sourcing events."
- Primary CTA: "Create sourcing event" linked to `/source/new`.
- One-sentence purpose statement: Source runs IT sourcing events from intake through award and activation.
- Sentinel explanation: Sentinel is the sourcing partner that tests intake, evidence, stage gates, vendor claims, walkaway leverage, and approval readiness.
- Portfolio posture: event count, active count, at-risk count, value at stake.
- Top mission signal: the event requiring attention now.
- Event stand-up floor: the 5 things required to register a new event.

## 4. Event Registration Floor

A sourcing event is not "created" just because a user names a category. It is registered when these five fields are coherent enough to govern:

| Field | Minimum Requirement | Good Looks Like | Failure Pattern |
|---|---|---|---|
| Trigger | Why now and consequence of inaction | "Board cost mandate before FY27 budget; AMS run-rate up 18%; renewal window closes in 120 days." | Category signal only |
| Decision owner | Named accountable sponsor with stop/go authority | "Thomas Reeves, CIO, owns scope and can stop if savings floor fails." | Ghost sponsor |
| Scope boundary | In-scope and explicit out-of-scope | "Application managed services for retail merchandising and store ops; ERP and cybersecurity excluded." | Enterprise/all towers |
| Baseline evidence | Current facts needed to test the event | Run-rate, app/service inventory, incumbents, contract dates, service pain, transition constraints | Vendor-defined baseline |
| Stop / approval condition | What would stop or reroute the event | "Stop if normalized savings below 12% or transition risk red for tier-1 systems." | No walkaway |

If one or more fields is missing, Sentinel should not produce a long lecture. It should:

1. Acknowledge the useful input.
2. Fill any known seeded client context.
3. Ask exactly one next question unless the user asks for a full intake checklist.
4. Update the right canvas with met/open/unknown status.

## 5. Sentinel Role

Sentinel has three jobs on Source:

- Create: turn a category signal into a registered sourcing event.
- Run: coach each sourcing stage using stage packs, artifacts, and evidence.
- Govern: block weak advancement, flag anti-patterns, and keep decisions auditable.

Sentinel should not:

- Ask for facts already present in the tenant context, such as known executive roles.
- Recite every gate criterion in prose when the canvas can carry it.
- Treat "enterprise all towers" as a valid scope boundary.
- Produce pseudo-code, artifact syntax, or parse markers in the user-visible transcript.
- Act like a generic RFP chatbot.

## 6. Source Surfaces

### `/source` - Portfolio Command Center

Purpose: create new sourcing events and monitor active event health.

Entry:

- User opens Source from nav.
- User comes from a Program handoff.
- User searches or filters active events.

Exit:

- User opens an existing event.
- User starts `/source/new`.
- User asks Sentinel to triage the portfolio and receives action cards.

Required layout:

```text
/source
+-------------------------------------------------------------+
| Source command center                     + Create event     |
| Create, run, and govern IT sourcing events                   |
| Purpose sentence + Sentinel role                             |
+----------------------------------+--------------------------+
| Sentinel chat canvas             | Reactive portfolio panel  |
| - concise partner responses      | - what Source is for      |
| - event creation coaching        | - portfolio posture       |
| - current event triage           | - top mission signal      |
|                                  | - event stand-up floor    |
+----------------------------------+--------------------------+
| collapsed event grid / legacy deterministic content          |
+-------------------------------------------------------------+
```

### `/source/new` - Event Creation

Purpose: register a sourcing event only after the intake floor is coherent.

Entry:

- User clicks "Create sourcing event."
- Program agent spawns sourcing event from P2/P3/P4.
- Sentinel determines that a user prompt is a new event, not a query.

Exit:

- Draft created with missing fields visible, or
- Event registered and opened at S0 Intake, or
- User cancels back to portfolio.

Required fields:

- Trigger.
- Decision owner.
- Scope boundary.
- Baseline evidence.
- Stop / approval condition.
- Optional but recommended: linked program, category pattern, estimated value, vendors/incumbents, timeline.

Current gap:

- The existing wizard starts with pattern selection and vendor rows. That is useful later, but it is not the right first mental model. The next slice should reorder `/source/new` around the five-field intake floor, with pattern selection as an assisted classification step after the trigger and scope are known.

### `/source/events/[eventId]` - Active Event Canvas

Purpose: run the sourcing event through stages, evidence, vendor decisions, and approval.

Entry:

- User opens an event card.
- Program handoff opens the linked event.
- Sentinel routes from portfolio to the active event.

Exit:

- Stage advances.
- Award decision is made.
- Contract / activation handoff is created.
- Event returns selected vendor and transition conditions back to linked Program.

Required layout:

```text
/source/events/[eventId]
+-------------------------------------------------------------+
| Event title, status, stage strip, linked program             |
+----------------------------------+--------------------------+
| Sentinel event chat              | Reactive event panel      |
| - stage-specific coaching        | - stage gate criteria     |
| - compare vendors                | - vendor cards            |
| - run BAFO check                 | - pricing benchmarks      |
| - inspect clauses                | - clause callouts         |
| - advance stage                  | - walkaway signal         |
+----------------------------------+--------------------------+
| collapsed event detail, evidence, matrix, contract content   |
+-------------------------------------------------------------+
```

## 7. Stage Model And Entry / Exit Criteria

The stage packs in `src/lib/source/stage-packs/` are the doctrine layer. The UI and agent must render them as operating workflow, not static documentation.

| Stage | Entry Criteria | Exit Criteria | Sentinel Primary Move |
|---|---|---|---|
| S0 Intake | Business trigger exists; affected capability/category roughly named | Five-field event floor met; sponsor and kill criterion captured; missing evidence named | Slow down vague requests and make the event registerable |
| S1 Market Shape | S0 floor complete; scope hypothesis and missing evidence known | Vendor universe, market question, RFI/backchannel plan, buyer-owned assumptions | Shape market learning without vendor-defined scope |
| S2 Shortlist | Market shape complete; candidate universe known | Shortlist rationale, scoring rubric locked before responses, evaluator panel named | Prevent favorite-vendor scoring and missing dissenters |
| S3 RFP / RFI | Shortlist and rubric ready | RFP/RFI package issued with Q&A discipline, evaluation workflow, required response structure | Keep vendor responses comparable |
| S4 Demo / POC | Responses received; demo/POC criteria known | Buyer-designed scenarios, success criteria, red-team cases, result capture | Stop vendor-curated demos from becoming evidence |
| S5 BAFO | Evaluation narrowed; leverage posture understood | BAFO calendar, hold/reveal strategy, walkaway credibility, normalized commercial view | Build credible commercial pressure |
| S6 Contract | Preferred vendor selected; BAFO posture complete | Clause positions, exit assistance, price protections, approval and signature path | Convert deal intent into enforceable terms |
| S7 Activate | Contract signed or ready; transition owner known | Onboarding plan, dual-run window, QBR/scorecard cadence, lessons learned | Move award into operating success |

Every stage must expose:

- Outcome.
- Definition of done.
- Right questions.
- Anti-patterns.
- Entry data needed.
- Exit artifact.
- Approval owner.
- What passes to the next stage.

## 7.5 Research-To-Stage Mapping

| AbarVa Stage | Sourcing Playbook / Procurement Anchor | NIST / Risk Anchor | ISO 37500 / Outsourcing Anchor | Knowledge Layer Object |
|---|---|---|---|---|
| S0 Intake | Pipeline need, business requirement, pre-procurement rationale | Initial ICT/AI risk scoping | Business case and make/buy decision | Stage pack + intake pattern + tenant context |
| S1 Market Shape | Market engagement, supplier landscape, should-cost early view | Supplier risk posture and assurance questions | Identify potential providers | Category pattern + vendor profiles + market signals |
| S2 Shortlist | Supplier selection and suitability | Supplier integrity, security, resilience | Shortlist providers | Vendor-card artifacts + graph relationships |
| S3 RFP / RFI | Solicitation package and response discipline | Contractual security and risk requirements | Outline agreements | RFP template + clause/policy patterns |
| S4 Demo / POC | Bid evaluation and evidence capture | AI/ICT testing, validation, assurance evidence | Due diligence before agreement | Evidence ledger + test evidence + contradiction detector |
| S5 BAFO | Negotiation, value for money, low-cost bid bias defense | Residual risk and commercial-risk treatment | Negotiate and establish agreements | Pricing patterns + BAFO scoreboard + walkaway signal |
| S6 Contract | Contract management standards, supplier obligations | Control requirements embedded in contract | Agreement as enforceable governance artifact | Clause library + contract intelligence + approvals |
| S7 Activate | Contract management and SRM | Monitor supplier risk and respond | Transition, service delivery, value realization | Transition plan + QBR scorecard + value ledger |

## 8. Right Canvas Behavior

The right canvas is not decorative. It should reduce chat length and make the product feel alive.

It should show:

- What is known.
- What is missing.
- What Sentinel is using from tenant context.
- Which stage criteria are met/open/unknown.
- Which artifact or template is next.
- Which approval is needed.
- Which risk or contradiction has appeared.

Canvas cards should be actionable:

- "Create sourcing event."
- "Open top event."
- "Upload baseline evidence."
- "Compare vendors."
- "Run BAFO check."
- "Review contract clause."
- "Advance stage."

## 9. Agent Pacing Rules

For a simple user prompt, Sentinel should answer in under 110 words and ask at most one question.

Example:

User: "Technology application managed services outsourcing."

Good Sentinel response:

> That sounds like a new AMS sourcing intake for Apex. I can stand it up, but first I need the trigger.
>
> Seeded context shows Thomas Reeves as CIO, so I will treat him as the likely decision owner unless you tell me otherwise.
>
> What triggered this now: renewal window, cost mandate, service issue, or transformation dependency?

Bad Sentinel response:

> Long recap of all doctrine, three-plus questions, asks who the CIO is when seeded context knows the CIO.

## 10. Data Requirements

For Source to feel real, tenant context must include:

- Leadership and decision rights: CIO, CFO, CPO/procurement, legal, security, finance, program sponsors.
- IT org structure: application owners, vendor managers, enterprise architects, platform owners.
- System landscape: critical apps, service towers, data platforms, integrations, risk tier.
- Vendor/contract registry: incumbents, spend, renewal dates, SLAs, termination rights, notice windows.
- Financial baseline: run-rate, target savings, budget owner, cost allocation.
- Program links: programs that spawned or depend on a sourcing event.
- Evidence room: uploaded inventories, meeting notes, RFP drafts, scorecards, BAFO materials, contract drafts.

If data is synthetic, Sentinel may use it as seeded context but must not imply live procurement write-back unless the runtime has persistence.

## 10.5 Knowledge Layer Architecture

Source should not keep its expertise inside UI components. The knowledge layer should be the operating brain behind Sentinel.

```text
User / Program context
        |
        v
AgentContextBroker
        |
        +-- Tenant data room
        |   +-- people_org: executives, IT leaders, decision rights
        |   +-- system_landscape: apps, service towers, integrations, criticality
        |   +-- vendor_contracts: incumbents, renewal dates, spend, clauses, SLAs
        |   +-- sourcing_lifecycle: events, stages, evidence, approvals
        |   +-- evidence_provenance: uploaded files, meeting notes, artifacts
        |
        +-- Source doctrine
        |   +-- stage packs S0-S7
        |   +-- sourcing patterns PAT-SRC-*
        |   +-- vendor profiles PAT-SRC-VEN-*
        |   +-- pricing patterns PAT-SRC-PRC-*
        |   +-- contract patterns PAT-SRC-CON-*
        |   +-- risk patterns PAT-SRC-RSK-*
        |
        +-- Retrieval layer
            +-- deterministic corpus lookup
            +-- vector chunks for semantic evidence and pattern recall
            +-- graph edges for tenant, vendor, system, program, event, evidence
            +-- contradiction and gate validation
        |
        v
Sentinel prompt + tools
        |
        v
Chat response + right-canvas artifacts + auditable event state
```

### Knowledge Object Responsibilities

| Object | What It Knows | What It Must Not Do |
|---|---|---|
| Stage pack | Universal sourcing doctrine for the stage | Store tenant facts |
| Pattern | Category/vendor/contract/pricing/risk intelligence | Pretend it is tenant evidence |
| Tenant data room | Client-specific people, systems, contracts, events, files | Become generic sourcing doctrine |
| Evidence ledger | Provenance and status of facts used in decisions | Replace stage gates |
| Vector index | Finds semantically relevant patterns, docs, and evidence chunks | Override tenant filters or cite unsourced claims |
| Graph layer | Connects program, event, vendor, system, person, evidence, risk | Infer private facts without source nodes |
| Broker | Assembles scoped context for the agent | Let UI import raw data room/vector/graph directly |

### Pattern Tie-In

Each Source stage should retrieve different pattern families:

| Stage | Pattern Families | Example Use |
|---|---|---|
| S0 Intake | category, process, risk | Identify AMS intake anti-patterns and required baseline facts |
| S1 Market Shape | category, vendor, signal | Build supplier universe and market learning plan |
| S2 Shortlist | vendor, risk, contradiction | Compare vendor suitability and flag missing challenger |
| S3 RFP / RFI | contract, category, template | Generate outcome-based questions and required response structure |
| S4 Demo / POC | risk, evidence, AI governance | Turn demo claims into testable evidence |
| S5 BAFO | pricing, commercial risk, negotiation | Build normalized pricing view and walkaway posture |
| S6 Contract | contract clause, risk, regulatory | Surface clause positions and missing protections |
| S7 Activate | outsourcing, SRM, value realization | Build transition, QBR, scorecard, and value-realization cadence |

### Retrieval Rules

- Deterministic corpus lookup wins for known pattern IDs and stage pack doctrine.
- Tenant data room wins for client facts.
- Vector retrieval is used for semantic recall across uploaded documents, meeting notes, RFP drafts, contracts, and long pattern bodies.
- Graph retrieval is used when relationship matters: vendor to contract to system to program to owner to evidence.
- Every retrieval result must carry source/provenance.
- Tenant key is mandatory on private data/vector/graph queries.
- The right canvas should show whether a fact came from seeded tenant data, uploaded evidence, corpus doctrine, or live write-back.

## 10.6 Graph / Vector Model For Source

The Source graph should make sourcing reasoning navigable:

```text
(Tenant)
  -> (Program)
  -> (SourcingEvent)
  -> (StageGate)
  -> (EvidenceItem)

(SourcingEvent)
  -> (Vendor)
  -> (Contract)
  -> (Clause)
  -> (Risk)

(SourcingEvent)
  -> (System)
  -> (ServiceTower)
  -> (BusinessOwner)

(Pattern)
  -> (StagePack)
  -> (GateCriterion)
  -> (Template)
```

Suggested source-specific graph edges:

- `SPAWNED_FROM_PROGRAM`
- `HAS_DECISION_OWNER`
- `SCOPE_INCLUDES_SYSTEM`
- `SCOPE_EXCLUDES_SYSTEM`
- `HAS_INCUMBENT_VENDOR`
- `HAS_CHALLENGER_VENDOR`
- `HAS_CONTRACT`
- `HAS_RENEWAL_WINDOW`
- `USES_PATTERN`
- `SATISFIES_GATE_CRITERION`
- `BLOCKED_BY_EVIDENCE_GAP`
- `FLAGS_RISK`
- `RETURNS_AWARD_TO_PROGRAM`

Vector chunk types:

- `sourcing_event_brief`
- `stage_pack`
- `pattern_body`
- `vendor_profile`
- `contract_clause`
- `pricing_benchmark`
- `meeting_notes`
- `rfp_response`
- `scorecard_rationale`
- `bafo_offer`
- `contract_draft`
- `transition_plan`

Minimum metadata on every private vector:

- `tenant_key`
- `source_event_id`
- `program_id` when linked
- `stage`
- `artifact_kind`
- `evidence_id`
- `created_at`
- `provenance_url_or_storage_path`
- `visibility`

Tenant isolation requirement:

- Private vector and graph queries must fail closed without `tenant_key`.
- Tests must prove a Client A query cannot retrieve Client B evidence.
- A deliberate "filter missing" negative test should demonstrate why the filter is required.

## 11. Workflow Requirements

### New Standalone Event

1. User lands on `/source`.
2. User clicks "Create sourcing event" or tells Sentinel the category.
3. Sentinel identifies whether it is a new event or an existing-event query.
4. The intake floor is collected.
5. Tenant context fills known people/systems/vendors automatically.
6. Missing evidence appears in the right canvas.
7. Event registers at S0 Intake when minimum floor is coherent.
8. User opens the event canvas.

### Program-Spawned Event

1. Program reaches a sourcing-relevant phase or step.
2. Program agent calls `spawn_sourcing_event`.
3. Program context passes problem, constraints, criteria, sponsor, value hypothesis, and kill criterion.
4. Source opens with handoff context visible.
5. Sentinel does not ask for data already passed from Programs.
6. Award/contract/activation output returns to Program.

### Existing Event Work

1. User opens an event.
2. Sentinel loads stage pack, event evidence, linked program, and tenant data.
3. Right panel shows stage gate and next action.
4. User asks a task such as compare vendors, run BAFO, inspect clause, advance stage.
5. Sentinel produces artifacts and updates canvas.
6. Gate advancement only succeeds when hard criteria are met or explicitly bypassed with approval.

## 12. Acceptance Criteria

The Source module is not pilot-ready until:

- `/source` clearly shows purpose, primary CTA, Sentinel role, and current sourcing posture above the fold.
- `/source/new` is organized around the five-field intake floor.
- Sentinel resolves known seeded leadership roles before asking the user for names.
- Sentinel asks at most one next question for simple intake prompts.
- The right canvas updates with intake progress, not just static cards.
- Every stage has entry and exit criteria visible to the user.
- Event creation has a draft vs registered distinction.
- Program-spawned and standalone events share the same workflow.
- Stage advancement is gated by evidence and approval, not chat optimism.
- Artifact syntax never appears in the transcript.
- Signed-out production route behavior and signed-in local browser behavior are both verified.

## 13. Implementation Slices

| Slice | Scope | Files / Areas |
|---|---|---|
| SRC-PD-1 | Landing page purpose and Create sourcing event CTA | `SourcePortfolioPage`, `SourcePortfolioAgentCanvas`, `SourcePortfolioReactivePanel` |
| SRC-PD-2 | Rebuild `/source/new` around five-field intake floor | `SourceOriginatePage`, tests |
| SRC-PD-3 | Sentinel intake prompt and broker grounding hardening | `src/app/api/chat/agent/route.ts`, broker tests |
| SRC-PD-4 | Dynamic intake progress artifacts from Sentinel | artifact parser, reactive panel |
| SRC-PD-5 | Event draft vs registered model | source types, seed/runtime contract |
| SRC-PD-6 | Stage entry/exit criteria renderer | stage packs, event detail right panel |
| SRC-PD-7 | Program-spawned event handoff | Programs tool, Source route handoff |
| SRC-PD-8 | End-to-end pilot walk | browser QA, screenshots, runbook |

## 14. Known Gaps In Current Code

- The `/source/new` wizard exists but is not discoverable from the new portfolio canvas.
- The `/source/new` wizard starts with pattern/vendor mechanics rather than the sourcing intake floor.
- The portfolio page currently over-indexes on "ask Sentinel" and under-explains the product job.
- The right rail has useful static facts but needs stronger purpose and action hierarchy.
- Seeded enterprise context is improving, but the UI still needs to show what Sentinel knows versus what it is asking the client to confirm.
- Persistence/write-back is not yet implied; language must stay honest until durable event creation exists.

## 15. Non-Negotiable Design Rules

- Source is a command center, not a report page.
- Sentinel is a sourcing partner, not a generic chatbot.
- The user should always see how to create a sourcing event.
- Chat explains less; canvas carries more.
- Known tenant facts should be used before asking the user.
- No sourcing event advances without evidence, criteria, and approval posture.
- Programs and Source must feel like one lifecycle, not two products.

## 16. External References

- UK Government, The Sourcing Playbook: https://www.gov.uk/government/publications/the-sourcing-and-consultancy-playbooks/the-sourcing-playbook-html
- NIST, SP 800-161 Rev. 1, Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final
- NIST, AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- ISO 37500 overview / table of contents, Guidance on outsourcing: https://standards.iteh.ai/catalog/standards/iso/90857435-f240-4d29-be22-bb322083991b/iso-37500-2014
