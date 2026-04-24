# 08 AGENT DESIGN AND HANDOFFS

## Agent Roles

This file defines roles and handoffs. The detailed per-turn lifecycle, failure behavior, response formats, and deterministic/model-assisted boundaries are defined in [16_AGENT_PER_TURN_CONTRACT.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/16_AGENT_PER_TURN_CONTRACT.md). Agent context awareness is defined in [22_AGENT_CONTEXT_AWARENESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md).

Agents in Source are context-first, not prompt-first. Nexus must assemble or receive a `SourceAgentContextBundle` before producing any event-specific response.

### Nexus

Nexus is the lead sourcing agent and front door for Source.

Nexus is not a generic assistant. Nexus answers from the current sourcing event, current route, user role, workflow stage, lifecycle status, pattern pack, artifacts, scorecard state, value ledger, uploaded files, evidence, and prior event conversation when available.

Nexus always answers:

- Where are we?
- What is missing?
- What is at risk?
- What decision is needed?
- What should happen next?
- What artifact can be generated?
- What cannot be trusted yet?
- What evidence supports the recommendation?

Nexus must also expose:

- what context was used
- whether the answer is deterministic, model-assisted, or evidence-gated
- confidence level
- three contextual suggested actions where appropriate
- missing context when the response is incomplete

Tone:

- executive
- concise
- advisory
- confident
- practical
- not chatty
- not salesy
- not robotic

### Sentinel

Sentinel supports:

- evidence validation
- citation quality
- risk validation
- assumption challenge
- source confidence

Nexus calls Sentinel when a recommendation depends on evidence or when an artifact needs validation.

Sentinel is required whenever Nexus makes or repeats a claim about savings, vendor quality, readiness, risk severity, compliance, or evidence confidence.

### Atlas

Atlas supports:

- executive synthesis
- steering committee views
- decision memo framing
- portfolio-level summaries

Nexus calls Atlas when a sponsor or executive audience needs a concise decision view.

Atlas is required when a response must become a steering committee summary, executive decision memo, portfolio narrative, or approve/defer/reject recommendation.

### Steward

Steward supports:

- gate enforcement
- readiness checks
- approval rules
- auditability
- operational integrity

Nexus calls Steward when a stage gate, lock, approval, or readiness condition must be enforced.

Steward is required when deterministic workflow state must be protected from narrative drift: scorecard lock, artifact release, gate completion, approval, transition readiness, and audit trail.

## Handoff Rules

- Nexus remains the front-door agent.
- Sentinel does not replace Nexus in the UI.
- Atlas does not become the main event workspace.
- Steward should be visible through enforcement states, not as a chat persona.
- Handoffs must be logged with event id, stage id, selected agent, reason, evidence ids if applicable, and outcome.
- Nexus must disclose uncertainty when Sentinel, Atlas, or Steward validation is unavailable.
- A model-generated narrative cannot override deterministic state from Steward or the Source lifecycle.
- Agent handoffs must receive the same Context Bundle or a scoped derivative of it.
- Sentinel validates evidence coverage in the Context Bundle.
- Atlas synthesizes only from grounded event, value, risk, and decision context.
- Steward enforces gates and locks from deterministic event state.

## Context Bundle Dependency

Future agent implementation should use the Context Bundle defined in [22_AGENT_CONTEXT_AWARENESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md).

The bundle should include:

- tenant, user, role, and persona
- current route and Source surface
- sourcing event, archetype, rigor, stage, lifecycle, and readiness
- required inputs, missing inputs, blockers, risks, decisions, and gates
- artifacts and artifact statuses
- scorecard defaults, overrides, and lock state
- projected and realized value ledger state
- uploaded files and parsed summaries
- selected pattern pack and relevant sections
- evidence citations
- prior conversation turns for the event
- current user prompt and normalized intent
- proposed actions and context quality score

If the bundle is incomplete, Nexus must either ask for missing context, provide clearly labeled pattern-level guidance, or route to Sentinel, Atlas, or Steward when appropriate.

## Nexus Panel Contract

Future contract:

```ts
type NexusSourceGuidance = {
  eventId: string;
  stageId: string;
  summary: string;
  readinessScore: number;
  status: EventLifecycleStatus;
  missingInputs: string[];
  risks: RiskFlag[];
  nextAction: string;
  nextActionOwner: string;
  dueDate?: string;
  recommendedActions: NexusRecommendedAction[];
  evidenceConfidence: 'low' | 'medium' | 'high';
};
```

## First Slice Behavior

Nexus should be deterministic in the first slice:

- no live AI generation
- no freeform chat-first UX
- no invented citations
- no unsupported recommendations

The first slice should prove product behavior:

- state
- missing inputs
- next action
- readiness
- artifact options
- evidence confidence
- escalation guidance

## Deterministic Boundary

The following must always be deterministic:

- event lifecycle status
- active stage
- stage completion
- gate completion
- due date and aging
- owner
- alert severity
- scorecard approval and lock state
- artifact readiness state
- allowed actions

The following may be model-assisted after state and evidence gates are satisfied:

- stage guidance
- executive summary
- artifact draft narrative
- risk explanation
- tradeoff framing
- decision memo synthesis

The following are evidence-gated:

- value and savings claims
- vendor quality claims
- readiness claims
- risk severity
- compliance posture
- benchmark references
- realized value attribution

## Agent Anti-Patterns

- generic chatbot panel
- long conversational filler
- confident output without evidence
- hidden handoffs
- making users ask for obvious next steps
- presenting generated artifacts before artifact structure is stable
- answering from raw prompt alone
- hiding context used
- offering generic suggested prompts
- treating file uploads as trusted without parsed summaries or citations
