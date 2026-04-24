# 09 PATTERN PACK ARCHITECTURE

## Definition

Pattern packs are configurable sourcing archetype logic.

They are authored AbarVa IP, not hard-coded UI.

Pattern packs must meet the content depth standard in [21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md). A pack that only names stages, artifacts, and scorecard defaults is not implementation-ready.

Pattern packs provide:

- stages
- required inputs
- artifact templates
- scorecard defaults
- gate templates
- common risks
- Nexus guidance
- detection signals
- diagnostic questions
- failure-mode mapping
- evidence requirements
- intervention levers
- learning loop observations

## Type Shape

```ts
type SourcePatternPack = {
  id: string;
  name: string;
  archetype: SourcingArchetype;
  defaultRigor: RigorLevel;
  applicableDealTypes: string[];
  antiPatterns: string[];
  detectionSignals: PatternDetectionSignal[];
  diagnosticQuestions: PatternDiagnosticQuestion[];
  stages: WorkflowStageTemplate[];
  requiredInputs: RequiredInputTemplate[];
  artifactTemplates: ArtifactTemplate[];
  scorecardDefaults: EvaluationCriteria[];
  gateTemplates: StageGateTemplate[];
  commonRisks: RiskTemplate[];
  failureModeIds: string[];
  interventionLevers: SourcingInterventionLever[];
  evidenceRequirements: PatternEvidenceRequirement[];
  nexusGuidance: Record<string, string>;
  learningLoop: PatternLearningLoopRule[];
};
```

## Example Pack: Data & AI Modernization Sourcing

- archetype: Data & AI Modernization
- default rigor: Enhanced
- required inputs:
  - application inventory
  - analytics workload baseline
  - current vendor/contract inventory
  - data platform architecture
  - delivery model split
- artifacts:
  - minimum data request
  - sourcing event brief
  - scope document
  - RFP/RFI package
  - evaluation scorecard
  - projected value ledger
- common risks:
  - missing baseline
  - scope bloat
  - value overstatement
  - platform migration risk

## Example Pack: AMS / Managed Services Sourcing

- archetype: Managed Services / Outsourcing
- default rigor: Strategic
- required inputs:
  - application portfolio
  - run spend baseline
  - service levels
  - ticket volumes
  - retained organization assumptions
- artifacts:
  - tower scope model
  - RFP package
  - transition risk assessment
  - evaluation scorecard
  - projected savings ledger
- common risks:
  - retained organization not defined
  - transition disruption
  - savings double-counting
  - automation promises without proof

## Example Pack: Digital Product Build Vendor Selection

- archetype: Digital Product Build
- default rigor: Standard
- required inputs:
  - product scope
  - release timeline
  - target team model
  - architecture constraints
  - pricing template
- artifacts:
  - sourcing event brief
  - product scope document
  - RFP/RFI outline
  - evaluation scorecard
  - projected value ledger
- common risks:
  - ambiguous scope
  - incomplete pricing
  - design/build mismatch
  - weak post-launch support

## Storage Recommendation

Later implementation should add:

- `src/lib/source/pattern-packs.ts`

This should store authored pack configuration or load it from a future persistence layer.

## Implementation Readiness Standard

A pattern pack is implementation-ready only when it includes:

- identity and anti-patterns
- detection signals with confidence tiers
- diagnostic questions with missing-data behavior
- required inputs with owners and source systems
- stage gates with evidence and approval rules
- artifact templates with generated vs human-authored sections
- scorecard defaults with rationale and override guidance
- failure-mode mapping
- sourcing levers and interventions
- evidence base and confidence levels
- Nexus guidance by stage and wait state
- observation and learning loop rules

The first three packs that must meet this standard are:

- Data & AI Modernization Sourcing
- AMS / Managed Services Sourcing
- Digital Product Build Vendor Selection

## Anti-Patterns

- pattern logic scattered inside components
- AMS-only language hard-coded into the UI
- scorecard defaults hard-coded in React
- artifact templates treated as static markdown only
