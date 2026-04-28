# Agent-Centric Enforcement Review

## Files Strengthened

- `docs/platform-design/experience-system/07_AGENTIC_INTERACTION_PATTERNS.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/13_AGENT_RESPONSE_DESIGN_SYSTEM.md`
- `docs/platform-design/experience-system/14_THREE_CHOICES_PLUS_CUSTOM_PATTERN.md`
- `docs/platform-design/experience-system/15_CONTEXT_AWARENESS_UI_RULES.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

## Existing Strengths Found

- Agent-first tone and anti-chatbot direction were already present in all base docs.
- Stage progression and journey visibility were already specified in the Source wireframes.
- Context strip concept and response mode taxonomy were already partially defined.
- 3 choices + custom mechanism existed but lacked strict contextual gating.

## Weak Points Addressed

- Missing enforcement language (mandatory checks, anti-pattern rejection criteria, and role clarity).
- Inconsistent requirement for explicit stage and object context.
- No formal gate for low-context/partial evidence states.
- Stage wireframes lacked explicit requirement for context strip and gate-readiness signal on each stage.
- Component docs did not strictly require source/work object coupling.

## Enforcement Improvements Added

- Added a hard minimum contract for all agent surfaces: context object, stage, context source, missing context, blocker, and next action.
- Made non-generic responses and copy-reuse across clients a rejection condition.
- Added Source-specific deterministic questions for every design slice:
  - Can we release the RFP?
  - Can we cite this vendor response?
  - Can we move to Evaluation?
  - What should the steering committee know?
- Tightened 3 choices + custom with explicit conditions and suppression rules.
- Upgraded wireframe stages with required context-used strip and gate-readiness checks.
- Aligned component props and acceptance criteria to enforce context-first behavior.

## What Remains Weak

- Some pages still need active runtime conformance reviews to confirm implementation follows these docs.
- Drawer and strip interaction states still require deterministic test assertions in UI tests.
- Additional Source pages may need explicit "pattern-only" labeling where data is low.

## Test-Harness Recommendations

- Add deterministic tests that fail when any of these are missing:
  - event/program identifier
  - stage
  - context used strip
  - next action with blocker/context dependency
  - confidence/missing-context declaration
- Add Source smoke checks for each stage to ensure no page falls back to generic assistance copy.
- Add visual acceptance snapshot checks for off-white canvas and reduced icon density.
