# 08 AGENT DESIGN AND HANDOFFS

## Agent Roles

### Nexus

Nexus is the lead sourcing agent and front door for Source.

Nexus always answers:

- Where are we?
- What is missing?
- What is at risk?
- What decision is needed?
- What should happen next?
- What artifact can be generated?
- What cannot be trusted yet?
- What evidence supports the recommendation?

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

### Atlas

Atlas supports:

- executive synthesis
- steering committee views
- decision memo framing
- portfolio-level summaries

Nexus calls Atlas when a sponsor or executive audience needs a concise decision view.

### Steward

Steward supports:

- gate enforcement
- readiness checks
- approval rules
- auditability
- operational integrity

Nexus calls Steward when a stage gate, lock, approval, or readiness condition must be enforced.

## Handoff Rules

- Nexus remains the front-door agent.
- Sentinel does not replace Nexus in the UI.
- Atlas does not become the main event workspace.
- Steward should be visible through enforcement states, not as a chat persona.

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

## Agent Anti-Patterns

- generic chatbot panel
- long conversational filler
- confident output without evidence
- hidden handoffs
- making users ask for obvious next steps
- presenting generated artifacts before artifact structure is stable
