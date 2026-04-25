# Implementation Governance

## Rules

- No UI implementation unless page spec, wireframe, and component specs exist.
- One page or surface per slice.
- No broad redesigns.
- No mixing UI with backend/model/API work.
- No model calls in visual slices.
- No upload/parsing implementation inside design slices.
- Screenshots are required after visual changes where possible.
- If auth blocks screenshot capture, document it.
- Codex must cite which design files it followed.
- `CYCLE_STATE.md` must be updated after each UI slice when the slice affects operating state.
- Agent response UI must follow `13_AGENT_RESPONSE_DESIGN_SYSTEM.md`.
- Suggested action UI must follow `14_THREE_CHOICES_PLUS_CUSTOM_PATTERN.md`.
- Context-awareness UI must follow `15_CONTEXT_AWARENESS_UI_RULES.md`.

## Slice Template

Each UI slice should state:

- Target surface.
- Design files followed.
- Agent response mode and interaction pattern followed, if agent guidance is present.
- Allowed files.
- Explicit out-of-scope list.
- Validation commands.
- Screenshot/manual review status.
- Acceptance criteria.

## Stop Conditions

Stop on:

- Missing design spec.
- Missing wireframe.
- Auth/security ambiguity.
- Unexpected unrelated file changes.
- Failed validation.
- Visual review recommending redesign.
