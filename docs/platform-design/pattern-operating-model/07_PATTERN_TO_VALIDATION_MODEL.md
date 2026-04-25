# Pattern to Validation Model

## Purpose

Define how patterns power deterministic validation fixtures and gates.

## Validation Domains

Patterns should support:

- Context validation.
- Workflow validation.
- Artifact readiness.
- Scorecard readiness.
- Value ledger readiness.
- Approval readiness.
- Vendor response completeness.

## Pattern-Derived Fixture Shape

Each validation fixture should include:

- Pattern id.
- Fixture id.
- Surface.
- Work object type.
- Stage or phase.
- Fixture state.
- Attempted action or prompt.
- Expected result.
- Required pattern sections.
- Evidence needed.
- Agent explanation.
- Remediation.

## Outcome Types

- PASS: expected safe behavior occurs.
- BLOCK: unsafe action is prevented.
- DEFER: context is intentionally missing or unready.
- WAIVER_REQUIRED: action can proceed only with explicit waiver and rationale.
- FAIL: deterministic expectation is violated.

## Examples

- Cannot move to Evaluation if scorecard is not locked.
- Cannot cite uploaded document before parsing and validation.
- Cannot generate Rich-tier RFP artifact when required inputs are missing.
- Cannot mark value realized without measurement owner and evidence.

## Context Validation Link

Context validation checks whether the agent response is grounded in the pattern and current context.

## Workflow Validation Link

Workflow validation checks whether Source or Programs permits or blocks an action correctly.

## Artifact Readiness Link

Artifact readiness checks whether the artifact has enough inputs, evidence, review, and approval state to be issued or trusted.

