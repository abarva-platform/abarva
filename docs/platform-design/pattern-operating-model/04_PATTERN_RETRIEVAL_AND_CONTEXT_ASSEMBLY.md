# Pattern Retrieval and Context Assembly

## Purpose

Define how AbarVa selects pattern context for agents.

## Selection Inputs

Pattern context should be selected by:

- Product surface.
- Event/program type.
- Workflow stage.
- User role.
- Question intent.
- Missing inputs.
- Artifact being generated.
- Scorecard state.
- Validation state.
- Uploaded evidence.

## Runtime Context Assembly

For every agent turn, pattern context should be assembled from:

1. Work object context.
2. Workflow/stage context.
3. Relevant pattern ids.
4. Selected pattern sections.
5. Missing required inputs.
6. Evidence and citation state.
7. Validation results.
8. Agent response mode.

## Section Retrieval by Agent

### Nexus

Retrieve:

- applicability
- requiredInputs
- guidanceRules
- artifactTemplates
- scorecardDefaults
- pricingLevers
- negotiationLevers
- validationRules

### Sentinel

Retrieve:

- applicability
- signals
- antiSignals
- evidenceRequirements
- risks
- validationRules
- evidenceBase

### Atlas

Retrieve:

- executive implications
- value levers
- benchmark/baseline sections
- risk summaries
- pattern outcome observations

### Steward

Retrieve:

- validationRules
- approval requirements
- gate requirements
- evidenceRequirements
- audit expectations

## Example: Source Data and AI Modernization in Scope

Runtime pattern context should include:

- Required inputs for Scope.
- Scope readiness rules.
- RFP section guidance.
- Value levers.
- Scorecard defaults.
- Failure modes.
- Evidence requirements.

## Context Limits

Agents should retrieve sections, not whole pattern documents, unless the user explicitly asks to inspect the pattern.

## Missing Context Rule

If a required pattern section indicates missing inputs, the agent must disclose the gap before giving decision-grade guidance.

