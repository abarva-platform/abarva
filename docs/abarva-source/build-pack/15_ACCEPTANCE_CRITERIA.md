# 15 ACCEPTANCE CRITERIA

## Build Pack Completeness

- all required Build Pack files exist
- master anchor defines read order and approval boundary
- `CYCLE_STATE.md` exists and is read before the Build Pack anchor
- product vision is explicit
- IA is explicit
- visual design rules are explicit
- data model and ERD are explicit
- workflow and lifecycle model are explicit
- agent roles and handoffs are explicit
- agent per-turn contract is explicit
- agent context-awareness contract is explicit
- chat experience and input model are explicit
- context validation harness is explicit
- workflow richness and document collaboration model is explicit
- artifact review and approval model is explicit
- workflow validation harness is explicit
- pattern-pack architecture is explicit
- pattern-pack content depth standard is explicit
- artifact and RFP generation model is explicit
- scorecard governance is explicit
- scorecard default rationale is explicit
- value ledger model is explicit
- alerts and lifecycle behavior are explicit
- crawler persona verification is explicit
- sourcing failure-mode catalog is explicit
- cross-product architecture is explicit
- commercial model is explicit
- implementation sequence is explicit
- component specs and wireframes exist

## Workflow Richness And Document Collaboration

- Source defines three workflow layers: sourcing event workflow, artifact lifecycle workflow, and review/approval workflow
- sourcing event workflow supports Intake, Scope, Sourcing Strategy, RFP/RFI Package, Vendor Responses, Evaluation, Orals/BAFO, Selection, Contract/Mobilization, and Value Realization
- artifact lifecycle supports Not Started, Draft, Needs Inputs, In Review, Changes Requested, Approved, Locked, Issued/Published, Superseded, and Archived
- document collaboration supports export to DOCX, XLSX, and later PPTX/PDF where appropriate
- externally edited documents can be re-uploaded and classified against expected artifacts
- re-uploaded external edits create a new artifact version, not an in-place overwrite
- artifact versions track owner, creator, modifier, uploader, format, generated/uploaded origin, source inputs, citations, change summary, review state, approval state, lock state, and timestamps
- Source remains the system of record for workflow state even when Office or Google Docs is used as the editing surface
- audit trail records artifact generation, export, upload, version creation, review, approval, waiver, lock, issue/publish, reopen, and stage movement

## Artifact Review And Approval

- approval routing is configurable by rigor level, event value, artifact type, risk level, data sensitivity, security/compliance requirements, and stage
- approval types include informational review, required approval, legal, security, finance, executive, procurement, business sponsor, data governance, and architecture approval
- routing modes include sequential, parallel, all approvers required, any approver required, fallback approver, escalation approver, and conditional approver
- approval statuses include Not Required, Not Started, Pending, Approved, Rejected, Changes Requested, Escalated, Waived, and Expired
- approvals have owner, due date, routing mode, blocking flag, reminder cadence, escalation behavior, and decision timestamp
- waivers require authorized owner and rationale
- locked artifacts cannot be edited in place
- reopening a locked artifact creates a new version
- unresolved required comments block artifact lock
- Steward enforces approval gates
- Nexus explains approval blockers in event-specific language

## Agent Per-Turn Contract

- per-turn lifecycle defines entry condition, exit condition, failure behavior, fallback behavior, logging, and user-visible failure state
- Context Bundle assembly is required before model invocation or event-specific response generation
- Nexus, Sentinel, Atlas, and Steward roles are explicit
- deterministic state cannot be overridden by generated narrative
- model-assisted behavior is limited to narrative guidance, summaries, artifact drafts, and synthesis
- savings, vendor quality, readiness, risk, and value claims are evidence-gated
- Nexus always answers location, missing inputs, risk, decision, next action, artifact readiness, trust limits, and supporting evidence
- response formats are structured enough for UI rendering

## Agent Context Awareness

- every event-specific agent response is assembled from a `SourceAgentContextBundle`
- Context Bundle includes tenant, user, role/persona, route, event, stage, lifecycle, pattern pack, artifacts, scorecard, value ledger, risks, decisions, uploaded files, evidence, prior turns, prompt, suggested actions, and quality score
- Nexus identifies missing context when event, stage, required inputs, uploaded file summary, evidence, scorecard, or value data is unavailable
- Nexus distinguishes current event state, pattern guidance, uploaded client data, artifact state, scorecard state, value ledger state, and citations
- context quality scoring includes completeness, pattern grounding, evidence coverage, event-state grounding, missing-input awareness, and vanilla-response risk
- low context quality triggers clarification, suggested next action, request for upload, or labeled pattern-level guidance

## Context-Aware Chat/Input

- chat is a guided enterprise input surface, not a blank generic prompt box
- each Nexus response includes answer, context used, confidence, citations/evidence where applicable, recommended next action, three suggested actions, custom input option, and handoff/escalation if needed
- suggested actions are contextual to current event, stage, gates, and pattern pack
- chat supports custom prompts, suggested action selection, follow-up questions, artifact requests, risk/readiness questions, missing-input questions, file summaries, and executive language requests
- chat responses continue workflow rather than create a parallel generic conversation

## File Attachment Behavior

- attachment model supports PDF, DOCX, XLSX, CSV, PPTX, TXT/MD, and images later if needed
- each attachment tracks file name, type, uploader, upload time, event, stage, parse status, summary, extracted entities, related artifacts, evidence references, confidence, and parsing errors
- ambiguous files trigger purpose clarification before use
- Nexus can reference attachments only after parsed summaries are available or parse limitations are disclosed
- Sentinel can validate file-derived evidence and citations

## Spell-Check And Typo Tolerance

- chat tolerates typos such as `socrecard`, `vender`, and `RFP pakage`
- domain acronyms such as AMS and BAFO are preserved
- system/vendor/client terms such as SNow are not blindly corrected
- Nexus asks for clarification when correction changes meaning

## Vanilla-Response Detection

- response fails if it ignores current event when event context is available
- response fails if it ignores current stage when stage context is relevant
- response fails if it gives generic sourcing advice without event or pattern grounding
- response fails if it recommends an action without checking missing inputs or gates
- response fails if it discusses value without value ledger context
- response fails if it discusses scorecard without default or override context
- response fails if it references uploaded files without parsed file summary or evidence reference
- response fails if it does not offer next actions where appropriate
- context validation harness must score context grounding, actionability, and evidence before agent/chat implementation is considered complete

## Cycle State Usage

- every Source session starts by reading `CYCLE_STATE.md`
- current item, completed work, remaining queue, blockers, and next action are kept current
- every material task completion updates the cycle state
- every PR or commit updates the cycle state
- every blocker is logged
- continuation default respects the explicit do-not-build list

## Persona Crawler Verification

- CIO, CFO, procurement leader, CTO, PMO lead, legal/compliance reviewer, business sponsor, and sourcing lead personas are defined
- each persona has goal, starting route, scenario, questions, expected UI evidence, expected Nexus response, verdict criteria, failure signals, and rubric
- crawler scripts are defined for Source Dashboard, Nexus Engagement Canvas, Scope Workspace, Scorecard Governance, Artifact Drawer, Value Ledger, and Executive Decision View later
- acceptance includes persona usefulness, not just component rendering
- persona crawlers validate context-aware response quality and reject generic agent answers
- verdicts use ACCEPT, DEFER, or REJECT with rationale

## Failure Mode Coverage

- sourcing failure modes cover scoping, RFP, evaluation, decision, transition, and outcome risks
- each failure mode defines detection signals, downstream impact, Source capability, Nexus behavior, artifact/gate, evidence required, and acceptance test
- product capabilities map back to failure modes
- failure modes are visible in Nexus guidance, gates, alerts, artifacts, scorecards, or value tracking

## Workflow Validation Harness

- workflow validation scenarios define fixture state, attempted action, expected result, Nexus explanation, Steward enforcement, evidence needed, and acceptance criteria
- workflow validation outcomes include PASS, BLOCK, DEFER, WAIVER_REQUIRED, and FAIL
- harness blocks moving to Vendor Responses when RFP package is not approved/locked
- harness blocks beginning Evaluation when scorecard is not locked
- harness blocks Rich-tier RFP generation when required inputs are missing
- harness blocks strategic sourcing readiness without legal/procurement review path
- harness blocks artifact lock when required reviewer comments are unresolved
- harness blocks approval without assigned approval owner
- harness blocks stage advancement when required artifact is Needs Inputs unless waiver is explicitly allowed
- harness requires re-uploaded offline edits to create a new version
- harness prevents citing uploaded documents before parsing/validation
- harness prevents vendor response completion when pricing template is missing unless exception is approved
- harness prevents realized value claims without measurement owner and evidence
- harness prevents approval skips without waiver rationale
- workflow validation is distinct from context validation: context validation checks grounded response quality, while workflow validation checks whether Source permits or blocks workflow actions correctly

## Pattern-Pack Content Depth

- pattern packs include identity, detection signals, diagnostic questions, required inputs, stage gates, artifact templates, scorecard defaults, risks, interventions, evidence base, Nexus guidance, and learning loop
- first three pattern packs have detailed depth expectations:
  - Data & AI Modernization Sourcing
  - AMS / Managed Services Sourcing
  - Digital Product Build Vendor Selection
- no pattern pack is implementation-ready if it is only thin config

## Cross-Product Architecture

- Source is defined as a workflow product inside AbarVa
- Pattern Fabric, Agent Fabric, Artifact Studio, Control Tower, and Value Ledger shared boundaries are explicit
- Source-specific domain objects are explicit
- Source does not depend on `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`
- Control Tower and Value Ledger future aggregation paths are clear

## Commercial Model

- annual platform subscription and per-event Source fee structure are documented
- event-size and rigor slabs are documented
- larger events require stricter gates, audit trail, scorecard lock, executive memo, and value ledger
- base platform, per-event fee, and premium future offers are separated
- commercial model reinforces event seriousness instead of seat-only workflow pricing

## Source Dashboard

- answers active, waiting, stuck, value, owner, and next action
- shows event list/table
- includes Nexus attention without becoming a chatbot
- no unnecessary charts
- no disconnected card sprawl

## Event Canvas

- shows event header, lifecycle, stage, owner, value, and readiness
- includes journey tracker, stage panel, workspace, Nexus panel, and artifact access
- preserves context

## Journey Tracker

- reflects real workflow state
- shows active, complete, blocked, approval-needed, reopened, and future stages
- click behavior is defined
- not decorative

## Nexus Panel

- shows stage summary, readiness, lifecycle status, missing inputs, risks, next action, owner, due date, evidence confidence, and recommended actions
- not a generic chatbot

## Scorecard Governance

- uses pattern defaults
- supports edits and rationale
- validates total weight = 100%
- flags material changes
- requires approval and lock before evaluation

## Artifact Drawer

- shows artifact metadata
- supports status, tier, confidence, owner, inputs, and citation placeholders
- uses dignified stubs
- no fake content
- supports future version history, external upload status, review state, approval state, and lock state before production use

## Value Ledger

- shows projected value line items
- includes assumptions, confidence, timing, measurement method, owner, and milestones
- realized value is clearly deferred until measured

## Lifecycle Alerts

- shows severity, owner, action, due date, and aging
- links alerts to relevant event surfaces
- critical alerts are surfaced first

## Implementation Readiness

Implementation may start only when:

- relevant Build Pack files are reviewed
- relevant wireframe is reviewed
- relevant component spec is reviewed
- acceptance criteria are clear
- slice is explicitly approved
