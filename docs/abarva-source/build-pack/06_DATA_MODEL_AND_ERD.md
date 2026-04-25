# 06 DATA MODEL AND ERD

## TypeScript Domain Concepts

### SourcingEvent

Core unit of work.

Fields:

- id
- name
- archetype
- rigorLevel
- lifecycleStatus
- currentStageId
- owner
- blocker
- nextAction
- valueAtStake
- createdAt
- updatedAt

### SourcingArchetype

Configurable sourcing category.

Examples:

- Data & AI Modernization
- Managed Services / Outsourcing
- Digital Product Build

### RigorLevel

Controls governance depth.

Values:

- Standard
- Enhanced
- Strategic

### WorkflowStage

Stage in the sourcing journey.

Fields:

- id
- eventId
- name
- status
- readinessScore
- owner
- requiredInputs
- gate

### StageGate

Gate that controls stage progression.

Fields:

- id
- stageId
- requiredArtifacts
- requiredInputs
- approver
- status
- blocker

### RequiredInput

Input required to progress.

Fields:

- id
- eventId
- stageId
- name
- owner
- status
- dueDate
- receivedAt

### Artifact

Structured sourcing work product.

Fields:

- id
- eventId
- stageId
- type
- status
- tier
- owner
- confidence
- version

### Vendor

Vendor participating in an event.

Fields:

- id
- name
- category
- status
- contact

### VendorResponse

Vendor response package.

Fields:

- id
- eventId
- vendorId
- status
- submittedAt
- missingItems

### EvaluationScorecard

Governed scoring model.

Fields:

- id
- eventId
- status
- totalWeight
- lockedAt
- approvedBy

### EvaluationCriteria

Scorecard criterion.

Fields:

- id
- scorecardId
- label
- defaultWeight
- currentWeight
- description
- required

### ScorecardOverride

Change from pattern default.

Fields:

- id
- criteriaId
- previousWeight
- newWeight
- rationale
- materialChange
- actor
- timestamp

### RiskFlag

Risk or blocker signal.

Fields:

- id
- eventId
- severity
- title
- owner
- dueDate
- status

### Decision

Sponsor or governance decision.

Fields:

- id
- eventId
- stageId
- decisionType
- status
- approver
- rationale

### EventLifecycleStatus

Operational state for a sourcing event.

Values:

- Active
- Waiting on Client
- Waiting on Vendor
- Waiting on Procurement
- Waiting on Executive Decision
- Paused
- At Risk
- Completed
- Archived

### SourceAlert

Dashboard or event alert.

Fields:

- id
- eventId
- type
- severity
- owner
- action
- dueDate
- agingDays

### PatternPack

Authored sourcing archetype configuration.

Fields:

- id
- archetype
- defaultRigor
- stages
- requiredInputs
- artifactTemplates
- scorecardDefaults
- gateTemplates
- commonRisks
- nexusGuidance

### EvidenceCitation

Evidence reference.

Fields:

- id
- sourceId
- artifactId
- confidence
- summary
- url or internal reference

### ProjectedValueLedger

Value forecast.

Fields:

- id
- eventId
- lineItems
- assumptions
- confidence
- timing
- measurementOwner

### RealizedValueLedger

Actual measured value.

Fields:

- id
- eventId
- lineItems
- evidence
- variance
- attributionConfidence

## Text ERD

```text
SourcingEvent
  -> SourcingArchetype
  -> RigorLevel
  -> WorkflowStage[]
       -> StageGate
       -> RequiredInput[]
       -> Artifact[]
  -> Vendor[]
       -> VendorResponse[]
  -> EvaluationScorecard
       -> EvaluationCriteria[]
            -> ScorecardOverride[]
  -> RiskFlag[]
  -> Decision[]
  -> SourceAlert[]
  -> PatternPack
  -> EvidenceCitation[]
  -> ProjectedValueLedger
  -> RealizedValueLedger
```

## Existing Primitive Alignment

Potential reuse:

- program/workflow primitives from `src/lib/programs/types.db.ts`
- stage-gate concepts from existing program governance code
- tower value/risk primitives from existing Control Tower schema
- evidence registry and pattern manifest from deliverables/intelligence layer

Likely Source-specific persistence needed later:

- sourcing events
- source workflow stages
- source required inputs
- source scorecard overrides
- source artifacts
- vendor responses
- projected/realized value ledgers

## First Slice Data Rule

The first reviewed slice may use deterministic seed data behind `src/lib/source/queries.ts`, but mock data must not leak into architecture as the final persistence model.
