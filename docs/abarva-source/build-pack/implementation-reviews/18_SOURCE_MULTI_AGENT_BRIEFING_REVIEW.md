# Source Multi-Agent Briefing Review

## 1. Files Changed

- `src/lib/source/multi-agent-types.ts`
- `src/lib/source/multi-agent-briefing.ts`
- `src/lib/source/index.ts`
- `CYCLE_STATE.md`
- `docs/abarva-source/build-pack/implementation-reviews/18_SOURCE_MULTI_AGENT_BRIEFING_REVIEW.md`

## 2. Functions Added

Added in `src/lib/source/multi-agent-briefing.ts`:

- `buildSourceMultiAgentBriefing`
- `buildNexusBriefing`
- `buildSentinelBriefing`
- `buildAtlasBriefing`
- `buildStewardBriefing`
- `getSourceMultiAgentSuggestedActions`
- `summarizeSourceMultiAgentBriefing`
- `formatSourceMultiAgentBriefingAsMarkdown`

Types added in `src/lib/source/multi-agent-types.ts`:

- `SourceAgentName`
- `SourceAgentBriefingMode`
- `SourceAgentBriefingInput`
- `SourceAgentBriefing`
- `SourceMultiAgentBriefing`
- `SourceSuggestedAgentAction`
- `SourceMultiAgentOverallReadiness`

## 3. Agent Responsibilities Implemented

### Nexus

Nexus is the lead sourcing agent. It reads the SourceAgentContextBundle and produces the operational command read:

- current event or portfolio scope;
- current stage and lifecycle;
- missing inputs;
- blockers;
- risks;
- recommended next action;
- three suggested actions plus custom input where appropriate;
- handoff recommendation when evidence, gates, or executive synthesis are needed.

### Sentinel

Sentinel is the evidence and pattern validation agent. It reads context quality, citation coverage, missing context, and context validation report output:

- weak or missing evidence;
- missing citations;
- low-confidence or deferred context validation;
- claims Nexus should not overstate;
- validation notes and evidence caveats.

### Atlas

Atlas is the executive synthesis agent. It reads event value, risk, blockers, and evidence posture:

- value at stake;
- projected vs realized value distinction;
- executive risk/tradeoff framing;
- CIO/CFO-style next action;
- caveats when value is seeded or not measured.

### Steward

Steward is the governance and gate integrity agent. It reads the workflow validation report and deterministic context blockers:

- BLOCK outcomes;
- intentional DEFER outcomes;
- failed expectations;
- remediation by fixture;
- cannot-proceed reasons;
- gate and waiver path guidance.

## 4. Sample Deterministic Briefing Summary

Smoke target:

- event: Data & AI Modernization SI Selection
- context scope: event
- context validation: 10 fixtures, 8 pass, 2 defer, 0 reject
- workflow validation: 12 total, 11 BLOCK, 1 DEFER, 0 mismatches

Sample combined summary:

> Briefing version source-multi-agent-briefing/v1. Data & AI Modernization SI Selection cannot move cleanly until 4 missing inputs are resolved. Client-specific citation coverage is incomplete for valueAtStakeUsd, projectedValueUsd, riskStatus. Value is projected or seeded; Atlas should not present it as realized savings. Workflow validation has an intentional defer that must remain blocked until the missing capability exists. Overall readiness: blocked.

Highest priority action:

- Collect or waive missing inputs before advancing the sourcing workflow.

## 5. How Each Agent Uses Context Differently

| Agent | Primary Context Used | Output Focus |
| --- | --- | --- |
| Nexus | SourceAgentContextBundle event/stage/lifecycle/missing inputs/allowed action state | Sourcing progress, next action, 3 choices plus custom |
| Sentinel | Context quality, citation coverage, context validation report, missing evidence | Evidence readiness, validation defers, weak claims |
| Atlas | Value ledger, event value, risks, blockers, evidence posture | Executive synthesis, value/risk/tradeoffs |
| Steward | Workflow validation report, blockers, failed expectations, defers | Gate enforcement, cannot-proceed reasons, remediation |

## 6. Context Validation And Workflow Validation Representation

Context validation is represented through:

- suite verdict;
- pass/defer/reject counts;
- remaining context gaps;
- intentional defers;
- reject reasons;
- evidence/citation caveats in Sentinel and Nexus notes.

Workflow validation is represented through:

- suite headline;
- suite verdict;
- mismatch count;
- BLOCK explanations;
- intentional DEFER explanations;
- remediation by fixture;
- remaining workflow gaps;
- Steward cannot-proceed reasons.

The briefing keeps BLOCK outcomes as expected enforcement, not implementation failure, when fixture expectations match.

## 7. Three Choices Plus Custom Behavior

Nexus returns three context-specific suggested actions plus custom input.

For blockers:

- Show gate blockers
- Show required approvals
- Explain waiver path
- Ask something else

For missing Scope inputs:

- Show missing inputs
- Generate minimum data request
- Explain scope readiness
- Ask something else

Other agents also expose deterministic action options, but Nexus remains the front-door agent.

## 8. Remaining Gaps

- This is a library/reporting layer only; it is not rendered in UI.
- No Source API route exposes the briefing.
- No model call produces narrative; all text is deterministic.
- No persistence or audit record is written.
- No upload/parsing implementation exists.
- No workflow engine or approval engine exists.
- Suggested actions are deterministic descriptors, not executable UI actions.
- Atlas value language still depends on seeded value context and must not be treated as realized value.

## 9. Validation Results

Commands run:

- `npx eslint src/lib/source/multi-agent-briefing.ts src/lib/source/multi-agent-types.ts src/lib/source/index.ts`
- `npx tsc --noEmit --pretty false`
- deterministic smoke check with `npx tsx -e "...build Source context...run reports...build briefing...print markdown..."`

Results:

- ESLint passed.
- TypeScript passed.
- Deterministic smoke check passed after importing the context fixture helper from `src/lib/source/context-test-fixtures`.

## 10. Out-of-Scope Confirmation

No chat UI, Source UI, API route, model call, upload/parsing, event canvas, scorecard UI, artifact drawer UI, value ledger UI, vendor workflow, AI/RFP generation, workflow engine, approval engine, artifact versioning, document export/import, `/programs`, `/preview`, or `/demo` work was done.
