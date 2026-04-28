# Agentic Interaction Patterns

## Principle

AbarVa agents are context-first, not prompt-first. The surface should give useful guidance before the user types.

## Enforcement Standard

For every workflow-stage agent interaction, the panel must follow this minimum contract:

- The current object is explicit (event, program, artifact, or gate).
- The current stage is explicit.
- The context used is explicit.
- Missing context is explicit when input is partial.
- The panel indicates one clear next action.
- 3 choices plus custom appears only when multiple meaningful paths exist.
- The response is tied to the specific user context and does not read like generic assistant output.

This is mandatory across Source, program surfaces, steward/admin surfaces, and executive summaries.

### Mandatory Agent Responsibilities

- Nexus: orchestration lead. It should surface current workflow state, next steps, blockers, and what is safe to do now.
- Sentinel: evidence steward. It should surface confidence, citations, unsupported claims, and evidence gaps.
- Atlas: commercial and strategic context. It should surface value/risk tradeoffs and implications for decision quality.
- Steward: gate keeper. It should surface gate state, approvals, and readiness blockers.

## Core Panel Requirements

Every panel should show:

- What matters now.
- What context was used.
- What is missing.
- Confidence/readiness state when relevant.
- Recommended next action.
- Current work object and stage.
- A compact action path (not a chatbot prompt sequence).

No panel is valid if the same copy could be posted unchanged for another client or event.

## Response Patterns

### Direct Answer
Use for simple status questions. Still include stage context and confidence state where relevant.

### Guidance
Use for workflow movement questions. Include blockers and the recommended action needed before progression.

### Decision
Use for gate/approval/selection and vendor decisions. Include risks, tradeoffs, evidence state, and options.

### Low Context
Use when context is incomplete. Never hide low confidence; explicitly say what is missing and what is safe to decide now.

### Evidence
Use when context is challenged. Show evidence basis, confidence, and limits.

## Three Choices Plus Custom

Use only when it clearly helps users move forward.

- Three recommended actions.
- One custom option.
- No mechanical always-on appearance.
- Hide actions that do not materially change the workflow path.

## Context Used Strip

When output is evidence-backed, include a compact context strip that includes:

- Evidence/state sources used.
- Pattern-level vs client-specific basis.
- Missing or deferred context.
- Confidence state.

## Source Stage Enforcement Mapping

Each Source stage panel must include:

- Stage goal and current readiness.
- Event/program identity and owner.
- Context used and confidence.
- Blocker and gating reason.
- One recommended next action.
- 3 choices + custom if at least two valid alternatives exist.

Mandatory example checks:

- Can we release the RFP?
- Can we cite this vendor response?
- Can we move to Evaluation?
- What should the steering committee know?

## Mission-Driven Activity

Agent surfaces should expose mission value and not become passive chat transcripts.

Allowed mission signals:

- Next action with owner.
- Evidence blocker notes.
- Gate readiness and dependency notes.
- Risk or defer notices.

No noisy feeds, no avatar-led chatbot patterns, and no uncited or contextless claims.

## Source References

Read `16_AGENT_ACTIVITY_UI_PATTERN.md` before changing agent strips, mission panels, executive briefs, or background mission surfaces.
