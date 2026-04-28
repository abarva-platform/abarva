# Visual Acceptance Criteria

## Review Gate

Before approving any AbarVa workflow UI for release, confirm:

- Primary canvas is warm off-white unless intentionally justified.
- Dark surfaces are sparse and purposeful.
- The page answers the primary user question in first viewport.
- Primary next action is visible and specific.
- Value, risk, status, and owner are visible.
- Journey stage is visible where workflow progress matters.
- Agent guidance is contextual and specific.
- Agent activity is mission-value oriented, not a generic assistant transcript.
- Response mode is appropriate for the surface (status, guidance, decision, low-context, etc).
- Context used, missing context, and confidence are visible when relevant.
- Context claims are tied to the active object and current stage.
- Three choices plus custom appears only when it helps move work forward.
- No generic chatbot wrappers.
- Tables and strips are scannable and not visually noisy.
- No icon or symbol clutter.
- Badges and chips do not dominate the page.
- No fake certainty language when data is seeded/demo.
- Responsive behavior is stable.
- Manual or screenshot review attached.

## Mandatory Context-First Checks

- Generic text repeated across unrelated events or programs is rejected.
- If confidence is low or partial, the UI must surface what is missing.
- If a response is a recommendation, it must show evidence basis and guardrails.

## Deterministic Design Evidence Rules

- Agent guidance must include the event/program name and current stage.
- Missing context should be shown as a first-class state.
- Blockers and next action must map to workflow gates or evidence dependencies.
- No page can be approved if guidance is context-free.

## Required Review Output

Every visual review should produce:

- Decision: approve as baseline, approve with polish, or hold for redesign.
- What works.
- What is weak.
- Must-fix items.
- Recommended next slice.
- Screenshot/manual review status.
- Whether the page can support real user workflow versus static narrative.

## Source Workflow Checklist

- Stage map is visible and accurate.
- Stage context guides action.
- Context-used strip is present where guidance references evidence.
- Evidence states are not hidden behind dense walls of text.
- Decision-oriented pages include risk/value tradeoff and blocker signals.
