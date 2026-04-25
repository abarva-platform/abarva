# AbarVa Experience System Master Anchor

## Purpose

This folder is the design source of truth for AbarVa product experience. Codex, Claude, and future implementers must read this anchor before implementing or redesigning UI across Programs, Source, Intelligence, Control Tower, or Admin/Setup.

AbarVa should not be rebuilt from prompts alone. Product work must move through this sequence:

1. Design canon
2. Page spec
3. Wireframe
4. Component spec
5. Implementation
6. Visual review

If a page or component lacks a spec or wireframe, the next step is to author the missing specification, not to improvise UI.

## Read Order

1. `00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
2. `01_BRAND_AND_VISUAL_LANGUAGE.md`
3. `02_AGENT_IDENTITY_SYSTEM.md`
4. `03_DESIGN_TOKENS_AND_USAGE.md`
5. `04_JOURNEY_PROGRESS_SYSTEM.md`
6. `05_PAGE_ARCHETYPES.md`
7. `06_PAGE_STATE_MATRIX.md`
8. `07_AGENTIC_INTERACTION_PATTERNS.md`
9. `08_DATA_TABLE_AND_PORTFOLIO_PATTERNS.md`
10. `09_ARTIFACT_REVIEW_AND_DELIVERABLE_PATTERNS.md`
11. `10_RESPONSIVE_AND_ACCESSIBILITY_RULES.md`
12. `11_VISUAL_ACCEPTANCE_CRITERIA.md`
13. `12_IMPLEMENTATION_GOVERNANCE.md`
14. `13_AGENT_RESPONSE_DESIGN_SYSTEM.md`
15. `14_THREE_CHOICES_PLUS_CUSTOM_PATTERN.md`
16. `15_CONTEXT_AWARENESS_UI_RULES.md`

Then read the relevant files in `wireframes/` and `components/` for the target surface.

## Platform Defaults

- Warm off-white is the default canvas.
- Near-black and charcoal are the default text colors.
- Dark navy panels are used sparingly for command reads, executive briefs, and agent insight moments.
- Journey progress must be visible wherever workflow state matters.
- Agents must be visible, specific, and trusted, but never visually dominant.
- Agent responses must be context-aware and action-oriented.
- Agents guide the user through the next best action; they do not merely answer.
- Tables and data must be easy to scan.
- Value, risk, owner, status, evidence, and next action must be visible before decoration.

## Prohibited Visual Drift

- No full dark-mode page as the default AbarVa experience.
- No generic chatbot panels as the primary interaction.
- No busy dashboards.
- No excessive icons or decorative symbols.
- No neon-heavy AI styling.
- No generic procurement portal layouts.
- No Sanskrit symbols.
- No decorative logo clutter.
- No mechanical agent response patterns that add clutter instead of progress.

## Build Gate

Before implementing UI, cite the design files followed. At minimum:

- This anchor
- The relevant brand/tokens/journey/data/agent pattern files
- The relevant agent response, three-choices, and context-awareness UI files
- The relevant page wireframe
- The relevant component specs

If auth blocks screenshot review, document the blocker in the implementation review.
