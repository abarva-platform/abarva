# 09 PATTERN PACK ARCHITECTURE

## Definition

Pattern packs are configurable sourcing archetype logic.

They are authored AbarVa IP, not hard-coded UI.

Pattern packs provide:

- stages
- required inputs
- artifact templates
- scorecard defaults
- gate templates
- common risks
- Nexus guidance

## Type Shape

```ts
type SourcePatternPack = {
  id: string;
  name: string;
  archetype: SourcingArchetype;
  defaultRigor: RigorLevel;
  stages: WorkflowStageTemplate[];
  requiredInputs: RequiredInputTemplate[];
  artifactTemplates: ArtifactTemplate[];
  scorecardDefaults: EvaluationCriteria[];
  gateTemplates: StageGateTemplate[];
  commonRisks: RiskTemplate[];
  nexusGuidance: Record<string, string>;
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

## Anti-Patterns

- pattern logic scattered inside components
- AMS-only language hard-coded into the UI
- scorecard defaults hard-coded in React
- artifact templates treated as static markdown only
