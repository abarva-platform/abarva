# Pattern Authoring Standard

## Purpose

Define the structured contract every AbarVa pattern should follow.

## Required Pattern Fields

Every pattern should include:

- `patternId`
- `name`
- `type`
- `domain`
- `archetype`
- `applicableStages`
- `applicabilitySignals`
- `antiSignals`
- `requiredInputs`
- `diagnosticQuestions`
- `guidanceRules`
- `artifactTemplates`
- `validationRules`
- `evidenceRequirements`
- `agentUsage`
- `confidenceLevel`
- `version`
- `owner`
- `examples`
- `relatedPatterns`
- `outcomeObservations`

## Field Guidance

### Pattern Id

Stable identifier used by manifests, context bundles, citations, validation fixtures, and generated artifacts.

### Type

One or more taxonomy values from `01_PATTERN_TAXONOMY.md`.

### Domain

Surface or operating domain: Source, Programs, Intelligence, Control Tower, Admin/Setup, or cross-platform.

### Archetype

The specific work archetype: AMS, IMS, Data Modernization, Digital Build, AI Program, Admin Readiness, etc.

### Applicable Stages

Stages or phases where the pattern applies. If stage-agnostic, say so explicitly.

### Applicability Signals

Observable facts that indicate the pattern should be considered.

### Anti-Signals

Signals that indicate the pattern should not be applied.

### Required Inputs

Inputs needed before the pattern can support decision-grade guidance.

### Diagnostic Questions

Questions agents ask when required inputs are missing or ambiguous.

### Guidance Rules

Actionable rules agents can use in responses.

### Artifact Templates

Sections, outlines, or structured content the pattern can provide for deliverables.

### Validation Rules

Deterministic readiness or gate rules derived from the pattern.

### Evidence Requirements

Evidence needed before the pattern can support client-specific claims.

### Agent Usage

How Nexus, Sentinel, Atlas, and Steward may use the pattern.

### Outcome Observations

Post-event observations that can improve the pattern over time.

## Authoring Rules

- Pattern claims should distinguish expert guidance from client-specific evidence.
- Pattern sections should be short enough for retrieval and context assembly.
- Pattern examples should include good and bad usage.
- Pattern updates require version history and owner accountability.

