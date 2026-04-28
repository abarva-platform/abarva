# Context Builder

## Purpose

Context Builder assembles trusted context for a work object before an agent responds or a model call is allowed.

## Work Objects

Context Builder must support:

- Tenant.
- Program.
- Program phase.
- Source event.
- Source stage.
- Vendor.
- Artifact.
- Pattern.
- Dataset.
- Executive portfolio.

## Responsibilities

- Load work-object state.
- Load workflow state.
- Load evidence and source references.
- Load relevant patterns and prior decisions.
- Assess missing context.
- Produce readiness and confidence labels.
- Produce a typed context bundle.

## Required Output

Every context bundle should include identity, work object, state, evidence, missing inputs, workflow status, pattern context, conversation context when available, and quality/readiness assessment.

## Rules

UI does not assemble prompts. Agents do not fetch arbitrary context. Context Builder is the boundary between product state and agent response.

## Failure Behavior

If required context is missing, Context Builder returns a thin or blocked state. Agents must disclose the gap instead of generating unsupported answers.
