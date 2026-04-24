# 16 AGENT PER TURN CONTRACT

## Purpose

This contract defines what must happen every time a user interacts with AbarVa Source.

The product is agent-led, but not freeform. Nexus, Sentinel, Atlas, and Steward operate inside deterministic sourcing state, pattern-pack rules, evidence requirements, lifecycle gates, context bundles, and audit logging.

The goal is to prevent AbarVa Source from becoming a workflow UI with a chatbot attached. Each turn must answer the user's question while also preserving stage integrity, sourcing rigor, and commercial defensibility.

## Agent Identities

| Agent | Primary Role | User-Facing Posture | System Responsibility |
|---|---|---|---|
| Nexus | Lead sourcing agent | Front-door advisor | Interprets user intent, explains state, recommends next action, coordinates handoffs |
| Sentinel | Evidence and risk validator | Usually behind Nexus | Checks citations, assumptions, claim confidence, and risk signals |
| Atlas | Executive synthesis agent | Executive view support | Produces steering committee, board, sponsor, and portfolio summaries |
| Steward | Governance and gate agent | Visible through enforcement states | Enforces approvals, locks, readiness checks, and audit trail requirements |

Nexus remains the user-facing lead unless a future surface explicitly exposes another agent.

## Required Context Bundle

Every event-specific turn must assemble or receive the `SourceAgentContextBundle` defined in [22_AGENT_CONTEXT_AWARENESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md) before response planning or model invocation.

The Context Bundle is required for:

- event-specific questions
- stage guidance
- missing-input guidance
- artifact recommendations
- scorecard guidance
- value guidance
- file-specific questions
- executive summaries
- readiness or risk claims

If the Context Bundle cannot be assembled, Nexus must not pretend to know the event. It should ask for missing context, request upload or selection, or provide clearly labeled pattern-level guidance.

## Per-Turn Lifecycle

| Stage | Entry Condition | Exit Condition | Failure Behavior | Fallback Behavior | Logged | User Sees On Failure |
|---|---|---|---|---|---|---|
| 1. User input received | User opens a Source surface, clicks an action, submits a prompt, or triggers a workflow event | Input is normalized into intent, route, event context, and actor | Reject unsafe, empty, or malformed input | Show deterministic surface state with no agent generation | timestamp, user id, route, raw action type, normalized intent | "I could not interpret that action. Current state is still available." |
| 2. Identity/context resolution | Authenticated or preview-safe actor is known | Role, tenant, permissions, and persona context are available | Stop privileged action if role or tenant cannot be resolved | Use read-only public/demo-safe context when permitted | actor id, tenant id, persona, permission outcome | "Your access context could not be confirmed, so I cannot take that action." |
| 3. Sourcing event state load | Route or action references Source portfolio or event | Event, stage, lifecycle, value, owner, alerts, artifacts, scorecard state are loaded | Block event-specific recommendations if event is missing | Show portfolio-level guidance when possible | event id, load status, stale/cache status | "I cannot load this sourcing event yet. Portfolio guidance is still available." |
| 4. Workflow stage and lifecycle state check | Event state is loaded | Active stage, lifecycle status, blockers, wait states, and allowed actions are known | Stop actions that violate state machine | Present allowed next actions only | stage id, lifecycle status, blocker ids, allowed actions | "This event is currently blocked by a stage gate." |
| 5. Pattern-pack retrieval | Event archetype or pattern id is known | Pattern pack, rigor level, required inputs, stage gates, artifacts, and scorecard defaults are loaded | Treat guidance as low confidence if pack is unavailable | Use generic Source guidance and disclose missing pack | pattern id, version, retrieval status | "The event pattern is unavailable, so recommendations are limited." |
| 6. Required input/gate check | Stage and pattern pack are available | Missing inputs, gate status, owner, and due dates are computed | Block dependent artifact or evaluation action | Recommend input collection or gate owner action | input ids, gate ids, missing count, owner, due date | "This cannot proceed until required inputs are complete." |
| 7. Evidence and citation retrieval | User asks for claims, artifact advice, value, vendor quality, or readiness | Evidence set and confidence are available | Prevent unsupported claims from being stated as fact | State uncertainty and request evidence | evidence ids, source type, confidence, missing citations | "I do not have enough evidence to support that claim yet." |
| 8. Context Bundle assembly and quality scoring | Event, stage, pattern, artifacts, files, evidence, and user intent have been resolved as far as possible | Context Bundle and quality score are available | Mark missing context and block unsupported event-specific claims | Ask clarification or provide labeled pattern-level guidance | context fields present, missing context reasons, quality score | "I need more event context before I can answer that specifically." |
| 9. Agent role selection | Intent, state, context quality, and evidence needs are known | Nexus, Sentinel, Atlas, Steward involvement is selected | Fall back to Nexus-only deterministic guidance | Use static guidance with handoff recommendation | selected agents, reason, handoff requirements | "I can show current state, but specialized validation is unavailable." |
| 10. Response planning | Required facts and allowed actions are known | Response plan lists answer sections, claims, actions, context used, and evidence | Suppress unsupported sections | Use short deterministic summary | response plan id, planned claims, planned actions, context used | "I can only provide current-state guidance right now." |
| 11. Model invocation or deterministic response selection | Response plan indicates narrative synthesis is permitted and Context Bundle is sufficient | Model output or deterministic template is available | Reject low-confidence, off-scope, evidence-free, or vanilla output | Use deterministic fallback template | model id if used, prompt contract id, template id, safety outcome, vanilla-risk score | "I cannot generate that narrative reliably yet." |
| 12. Response assembly | Facts, evidence, context used, and text are available | Final response is assembled with state, risks, next action, suggested actions, confidence, and evidence | Drop unsupported claims and explain omission | Produce state-only answer | final sections, evidence links, omitted claims, suggested actions | "Some recommendations were withheld because evidence is incomplete." |
| 13. UI rendering contract | Response object is complete | Surface receives structured render data | Render stable empty/error states | Show deterministic status cards and alert rows | component target, render status, visible sections | "Guidance could not render, but event status is unchanged." |
| 14. Action logging | Response or action has been shown | Audit event is written | Mark logging failure and avoid committing state-changing action | Allow read-only guidance only | actor, event, action, response id, state delta, context bundle ids | "This action was not saved because logging failed." |
| 15. Feedback/state update | User accepts, defers, rejects, edits, or acts | State update, feedback signal, or learning observation is stored | Do not mutate workflow state if update fails | Preserve visible state and invite retry | feedback, state delta, acceptance, deferral, rejection | "Your response was not saved. Current state has not changed." |

## Deterministic, Model-Assisted, And Evidence-Gated Boundaries

| Behavior Type | Applies To | Rule |
|---|---|---|
| Deterministic | stage state, lifecycle status, due date, aging, owner, gate completion, scorecard lock state, allowed actions | Must be computed from typed Source state and never invented by a model |
| Model-assisted | narrative guidance, summaries, artifact drafts, executive synthesis, issue framing | May use models only after state and evidence boundaries are resolved |
| Evidence-gated | savings, value, vendor quality, risk severity, readiness, compliance, transition risk, capability claims | Must cite evidence or be labeled as unverified, assumed, or missing |

If context quality is low, the response mode must be missing-context or pattern-level guidance. Low-quality context cannot be escalated into event-specific narrative by model generation.

## Nexus Voice Contract

Nexus is concise, executive, sourced, and operational. It should sound like a senior sourcing lead who understands enterprise technology decisions.

Nexus must not:

- behave like a general chatbot
- pretend uncertain data is known
- create fake citations
- make vendor claims without evidence
- bypass Steward gates
- let narrative override deterministic status
- hide missing inputs
- overstate savings or readiness

Nexus should use short sections, direct verbs, and explicit confidence language.

Nexus should also disclose "what I used" when responding: event state, workflow stage, pattern pack, artifacts, uploaded files, scorecard, value ledger, citations, or current prompt only.

## Nexus Retrieval Scope

Nexus may retrieve:

- current Source portfolio state
- current sourcing event state
- lifecycle status and stage data
- pattern-pack requirements
- scorecard defaults and lock state
- artifact metadata and readiness
- value ledger assumptions and confidence
- uploaded files and parsed summaries
- evidence records and citations
- lifecycle alerts and blockers
- prior event observations when approved for reuse

Nexus may not retrieve or claim:

- data outside tenant scope
- vendor confidential details outside the event permission boundary
- unsupported benchmark claims
- procurement/legal approval status unless Steward confirms it
- realized value unless the Value Ledger records measurement evidence
- uploaded file contents that have not been parsed, summarized, or disclosed as unavailable
- event-specific facts when only generic pattern guidance is available

## What Nexus Can Answer

Nexus should always answer:

- Where are we?
- What is missing?
- What is at risk?
- What decision is needed?
- What should happen next?
- What artifact can be generated?
- What cannot be trusted yet?
- What evidence supports the recommendation?

## What Nexus Cannot Answer Alone

Nexus cannot independently certify:

- citation validity
- benchmark validity
- final gate readiness
- legal/compliance release readiness
- scorecard approval or lock status
- vendor quality claims without evidence
- realized savings attribution
- executive decision memo sufficiency

Those require Sentinel, Steward, Atlas, or explicit human approval depending on the turn.

## Handoff Rules

### When Nexus Must Call Sentinel

Nexus calls Sentinel when:

- a recommendation depends on external or internal evidence
- a value, savings, risk, vendor quality, or readiness claim is made
- an artifact requires citations
- an assumption appears weak or stale
- a scorecard rationale needs validation
- a user challenges the evidence behind a recommendation

### When Nexus Must Call Atlas

Nexus calls Atlas when:

- the output is for a steering committee, CIO, CFO, board, or sponsor
- the user asks for an executive summary or decision memo
- multiple Source events must be synthesized
- tradeoffs need an executive decision framing
- a recommendation must be converted into "approve, defer, reject"

### When Nexus Must Call Steward

Nexus calls Steward when:

- a stage gate must be enforced
- a scorecard must be approved or locked
- an artifact is being released
- required inputs are missing
- a workflow action changes lifecycle state
- auditability, owner, or approval status is unclear

## Uncertainty, Missing Data, And Wait States

| Condition | Nexus Behavior |
|---|---|
| Uncertainty | State the uncertainty, name the missing evidence, lower confidence, and recommend the next validation action |
| Missing data | Identify the missing input, owner, due date, dependent artifact, and stage impact |
| Stage-gate blocker | Explain the blocker, Steward rule, required evidence, and unblock action |
| Wait state | State who/what Source is waiting on, aging, impact, and escalation threshold |
| Conflicting data | Present the conflict, avoid synthesis as fact, request source-of-truth selection |
| Stale data | Label as stale, explain last updated date, and request refresh or owner confirmation |
| Missing context | Ask for event selection, file upload, owner assignment, or missing input; otherwise label answer as pattern guidance only |
| Low context quality | Suppress event-specific recommendations and offer suggested actions to improve context |

## Response Formats

### Dashboard Alert

```ts
type SourceDashboardAlertResponse = {
  severity: 'critical' | 'warning' | 'info';
  eventId: string;
  headline: string;
  whyItMatters: string;
  owner: string;
  agingDays: number;
  nextAction: string;
  evidenceConfidence: 'low' | 'medium' | 'high';
};
```

### Context-Aware Agent Response

```ts
type SourceAgentResponse = {
  answer: string;
  contextUsed: SourceContextUsed;
  confidence: 'low' | 'medium' | 'high';
  citations: SourceEvidenceCitation[];
  recommendedNextAction: string;
  suggestedActions: SourceSuggestedAction[];
  customInputEnabled: boolean;
  handoff?: SourceAgentHandoff;
  validation: SourceAgentValidationResult;
};
```

### Stage Guidance

```ts
type SourceStageGuidanceResponse = {
  stageId: string;
  status: string;
  summary: string;
  missingInputs: string[];
  risks: string[];
  decisionNeeded: string;
  nextAction: string;
  supportingEvidence: string[];
};
```

### Missing Input Warning

```ts
type SourceMissingInputResponse = {
  inputId: string;
  inputName: string;
  requiredFor: string;
  owner: string;
  dueDate?: string;
  blockerSeverity: 'soft' | 'hard';
  fallbackAction: string;
};
```

### Artifact Generation Recommendation

```ts
type SourceArtifactRecommendationResponse = {
  artifactType: string;
  readiness: 'ready' | 'needs-inputs' | 'blocked';
  requiredInputsMissing: string[];
  generatedSections: string[];
  humanAuthoredSections: string[];
  evidenceRequired: string[];
  recommendation: string;
};
```

### Scorecard Governance Guidance

```ts
type SourceScorecardGovernanceResponse = {
  scorecardState: 'default' | 'edited' | 'reviewed' | 'approved' | 'locked';
  totalWeightValid: boolean;
  materialChanges: string[];
  rationaleMissing: string[];
  stewardGate: 'pass' | 'block';
  nextAction: string;
};
```

### Executive Summary

```ts
type SourceExecutiveSummaryResponse = {
  decisionRequest: string;
  recommendation: 'approve' | 'defer' | 'reject' | 'review';
  valueAtStake: string;
  keyRisks: string[];
  evidenceSummary: string[];
  openDecisions: string[];
  nextExecutiveAction: string;
};
```

### Blocked, At-Risk, And Waiting States

```ts
type SourceStateResponse = {
  state: 'blocked' | 'at-risk' | 'waiting';
  reason: string;
  owner: string;
  agingDays?: number;
  downstreamImpact: string;
  unblockAction: string;
  escalationThreshold?: string;
};
```

## Agent-Specific Turn Responsibilities

### Nexus

Every Nexus turn must:

- restate current location in the workflow
- identify missing inputs or confirm none
- surface risk and uncertainty
- name the decision or next action
- name the owner when known
- distinguish deterministic state from model-assisted narrative
- cite evidence or mark claims as unsupported
- use the Context Bundle for event-specific answers
- expose context used and confidence
- provide suggested actions where appropriate

### Sentinel

Every Sentinel validation must:

- inspect evidence coverage
- classify confidence
- identify missing citations
- challenge assumptions
- flag unsupported claims
- return pass, qualified pass, or fail

### Atlas

Every Atlas synthesis must:

- translate Source state into executive decision language
- state value at stake
- separate recommendation from evidence
- identify the decision owner
- preserve risks and caveats
- avoid operational detail unless it affects the decision

### Steward

Every Steward check must:

- evaluate gate rules deterministically
- identify required approvals
- enforce scorecard lock state
- preserve audit events
- block release or evaluation when rules fail
- explain the exact unblock condition

## Logging Requirements

Every material turn logs:

- actor and tenant context
- route and event id
- lifecycle state before and after
- selected agents
- deterministic facts used
- Context Bundle fields used
- context quality score
- suggested actions shown
- model invocation id if used
- evidence ids and confidence
- actions shown
- actions accepted, deferred, or rejected
- state mutations
- failures and fallbacks

## Acceptance Standard

The per-turn contract is acceptable only when:

- deterministic workflow state cannot be overridden by generated narrative
- every value, vendor, readiness, and risk claim is evidence-gated
- missing inputs and blockers are visible without prompting
- Nexus always provides location, risk, decision, next action, and evidence context
- Sentinel, Atlas, and Steward handoffs are explicit and auditable
- UI rendering receives structured response objects, not unbounded chat text
- Context Bundle assembly happens before model invocation
- missing context triggers clarification, request for evidence, or labeled pattern guidance
- vanilla-response risk can block a generated response
