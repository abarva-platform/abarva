# 22 AGENT CONTEXT AWARENESS

## Purpose

Nexus must never answer from only the user's raw prompt. Every Source agent response must be assembled from a Source Agent Context Bundle that grounds the answer in the sourcing event, user role, workflow stage, pattern pack, artifacts, uploaded documents, scorecard state, value ledger, risks, decisions, evidence, and citations.

This is a load-bearing product requirement. AbarVa Source should feel like an agent-led enterprise sourcing workbench, not a plain chatbot attached to a dashboard.

## Core Rule

No event-specific response is valid unless it can answer:

- which event it is about
- which stage or surface it is about
- which Source state was used
- which pattern guidance was used
- which evidence or uploaded files were used
- what is deterministic, model-assisted, or evidence-gated
- what is missing or uncertain
- what action should happen next

## SourceAgentContextBundle

Future conceptual type:

```ts
type SourceAgentContextBundle = {
  tenant: SourceTenantContext;
  user: SourceAuthenticatedUser;
  userRole: SourceUserRole;
  persona: SourcePersona;
  route: SourceRouteContext;
  surface: SourceSurfaceId;
  sourcingEvent?: SourceEventContext;
  sourcingArchetype?: SourcingArchetype;
  rigorLevel?: RigorLevel;
  workflowStage?: SourceWorkflowStageContext;
  lifecycleStatus?: EventLifecycleStatus;
  stageReadinessScore?: number;
  nextAction?: string;
  nextActionOwner?: string;
  dueDate?: string;
  agingDays?: number;
  blockers: SourceBlocker[];
  requiredInputs: SourceRequiredInput[];
  missingInputs: SourceRequiredInput[];
  risks: SourceRisk[];
  decisions: SourceDecision[];
  stageGates: SourceStageGate[];
  artifacts: SourceArtifactContext[];
  artifactStatuses: SourceArtifactStatus[];
  scorecard?: SourceScorecardContext;
  scorecardDefaultWeights: SourceScorecardCriterion[];
  scorecardOverrides: SourceScorecardOverride[];
  scorecardLockStatus?: SourceScorecardLockStatus;
  projectedValueLedger: SourceValueLedgerLine[];
  realizedValueLedger?: SourceValueLedgerLine[];
  uploadedFiles: SourceAttachment[];
  parsedFileSummaries: SourceAttachmentSummary[];
  selectedPatternPack?: SourcePatternPackContext;
  relevantPatternSections: SourcePatternSection[];
  evidenceCitations: SourceEvidenceCitation[];
  priorConversationTurns: SourceChatMessage[];
  userPrompt: string;
  normalizedIntent: SourceUserIntent;
  systemProposedActions: SourceSuggestedAction[];
  contextQuality: SourceContextQualityScore;
};
```

The type above is conceptual. It defines required product behavior before implementation chooses final file names or runtime shape.

## Context Assembly Pipeline

| Step | Action | Required Outcome |
|---|---|---|
| 1 | Receive user input | Capture raw prompt, clicked action, attachment event, or workflow command |
| 2 | Normalize input and detect intent | Map typos, synonyms, workflow terms, and suggested actions to a Source intent |
| 3 | Resolve user identity and role | Determine tenant, actor, permissions, user role, and likely persona |
| 4 | Resolve current route and Source surface | Determine dashboard, event canvas, scope workspace, scorecard, artifact, value, or future vendor surface |
| 5 | Resolve current sourcing event if present | Attach event id and event name when route or prompt refers to a known event |
| 6 | Load sourcing event state | Load archetype, rigor, owner, value, lifecycle, active stage, alerts, and next action |
| 7 | Load workflow stage state | Load stage readiness, gate status, required inputs, missing inputs, due dates, and blockers |
| 8 | Load lifecycle/wait-state data | Load aging, waiting reason, stuck reason, escalation threshold, and owner |
| 9 | Load artifacts, risks, decisions, scorecard, and value ledger | Assemble all event-side decision objects relevant to the turn |
| 10 | Load uploaded file metadata and parsed summaries | Include file list, parse status, summary, extracted entities, confidence, and parsing errors |
| 11 | Retrieve relevant pattern pack | Load the event's pattern pack and version |
| 12 | Retrieve relevant pattern sections | Select stage guidance, required inputs, scorecard defaults, artifact rules, risks, and interventions |
| 13 | Retrieve evidence and citations | Load evidence needed for claims about value, risk, readiness, vendors, or artifacts |
| 14 | Build Context Bundle | Produce a complete `SourceAgentContextBundle` with quality scores |
| 15 | Determine response mode | Choose deterministic, model-assisted, evidence-gated, or missing-context response |
| 16 | Generate response through Nexus or route to Sentinel/Atlas/Steward | Use Nexus as the front door and route validation or synthesis as needed |
| 17 | Render response with citations, suggested actions, and confidence | Return structured response, context used, evidence, next action, and suggested actions |
| 18 | Log response, context used, and user feedback | Record context ids, evidence ids, prompt, response, action, acceptance, deferral, or rejection |

## Deterministic, Model-Assisted, And Evidence-Gated Behavior

### Deterministic Behavior

The following must come from stored Source state and must not be invented by a model:

- current stage
- lifecycle status
- owner
- due date
- aging
- missing inputs
- scorecard lock state
- artifact status
- stage gate completion
- value ledger fields already stored
- uploaded file list

### Model-Assisted Behavior

The following may be model-assisted only after Context Bundle assembly:

- advisory narrative
- synthesis
- artifact draft language
- risk explanation
- decision memo language
- executive summary
- tradeoff explanation
- pattern interpretation

### Evidence-Gated Behavior

The following require evidence, citations, or explicit low-confidence labeling:

- projected savings claims
- vendor comparisons
- readiness assertions
- value realization statements
- risk severity statements
- recommendation confidence

## Response Grounding Rules

Nexus must:

- cite or reference the current event context when answering event-specific questions
- identify missing context if the event is not selected or required data is unavailable
- avoid inventing vendor facts, savings assumptions, client facts, or artifact content
- avoid presenting generic sourcing advice as event-specific guidance
- state whether an answer is based on pattern guidance, uploaded client data, current event state, artifact state, scorecard state, value ledger state, or citation evidence
- show confidence as high, medium, or low
- expose "what I used" in the UI: event state, pattern pack, artifact, uploaded file, scorecard, value ledger, or citation

## Anti-Vanilla Safeguards

A response is invalid or suspect when:

- it could apply to any company
- Nexus does not mention the current event, current stage, or relevant pattern when those are available
- Nexus recommends an action without checking stage gates
- Nexus gives a scorecard recommendation without using pattern defaults or override history
- Nexus discusses value without referencing value ledger assumptions
- Nexus drafts RFP language without identifying missing inputs and assumption status
- Nexus answers a file-specific question without referencing the uploaded file summary or citation
- Nexus sounds like a general-purpose consultant rather than the Source sourcing lead

## Context Quality Scoring

Future conceptual type:

```ts
type SourceContextQualityScore = {
  contextCompleteness: 0 | 1 | 2 | 3 | 4 | 5;
  patternGrounding: 0 | 1 | 2 | 3 | 4 | 5;
  evidenceCoverage: 0 | 1 | 2 | 3 | 4 | 5;
  eventStateGrounding: 0 | 1 | 2 | 3 | 4 | 5;
  missingInputAwareness: 0 | 1 | 2 | 3 | 4 | 5;
  vanillaResponseRisk: 0 | 1 | 2 | 3 | 4 | 5;
  overallConfidence: 'low' | 'medium' | 'high';
  missingContextReasons: string[];
};
```

### Score Definitions

| Score | Context Completeness | Pattern Grounding | Evidence Coverage | Event-State Grounding | Missing-Input Awareness | Vanilla Risk |
|---:|---|---|---|---|---|---|
| 0 | no context | no pattern | no evidence | no event state | ignores missing data | generic |
| 1 | route only | product-level only | unsupported | mentions Source only | vague missing-data mention | high |
| 2 | event only | pattern named | pattern guidance | event named | names some missing data | medium-high |
| 3 | event + stage | relevant section | event data | event + stage + status | ties gaps to stage | medium |
| 4 | event + stage + objects | section + rules | artifact/file/value evidence | event + stage + status + objects | ties gaps to gates/artifacts | low |
| 5 | full bundle | pattern + failure modes + levers | cited evidence + confidence | full event state | missing inputs, owners, due dates, impacts | very low |

## Low-Quality Context Behavior

When context quality is low, Nexus should:

- ask a clarification question
- offer suggested next actions
- request file upload
- say exactly what is missing
- provide a pattern-level answer clearly labeled as pattern guidance, not event-specific advice
- avoid creating artifacts, value claims, vendor comparisons, or readiness assertions

## Context Used Disclosure

Every Source agent response should be able to expose:

```ts
type SourceContextUsed = {
  eventStateUsed: boolean;
  patternPackUsed?: string;
  patternSectionsUsed: string[];
  artifactsUsed: string[];
  uploadedFilesUsed: string[];
  scorecardUsed: boolean;
  valueLedgerUsed: boolean;
  citationsUsed: string[];
  deterministicFieldsUsed: string[];
  missingContext: string[];
};
```

## Future Implementation Targets

- `SourceAgentContextBundle`
- `SourceContextQualityScore`
- `SourceContextUsed`
- `SourceAgentResponse`
- `SourceAgentValidationResult`

## Acceptance Standard

Agent context awareness is acceptable only when:

- every agent response is assembled from a Context Bundle
- event-specific answers reference current event and relevant stage or surface
- deterministic state is preserved outside model generation
- evidence-gated claims cannot be stated as fact without support
- missing context triggers clarification, limited pattern guidance, or request for evidence
- context quality and vanilla-response risk can be measured
