# 07 PersistentNexusPanel

## 1. Component Purpose

`PersistentNexusPanel` is the right-side advisory rail for Source. It gives contextual recommendations, missing inputs, risks, evidence confidence, and next actions.

## 2. Primary Users

- CIO
- CTO
- Procurement leader
- Sourcing lead
- PMO lead
- CFO during value review

## 3. Primary User Question

"What does Nexus recommend, what is at risk, and what should I do next?"

## 4. Business Role In The Product

The panel is how Source becomes agent-led. It should guide workflow decisions and handoffs without turning into a generic chat window.

## 5. Information Hierarchy

- First: one recommendation.
- Second: current stage, readiness, lifecycle status.
- Third: missing inputs, risks, next action, owner, due date.
- Secondary: evidence confidence, artifact options, agent handoffs.
- Hidden: free-text chat until runtime contract is approved.

## 6. Visual Hierarchy

- Nexus identity is subtle but persistent.
- Recommendation card is dominant.
- Missing inputs and risks are concise.
- Actions are few and workflow-specific.
- Confidence is visible but not decorative.

## 7. Layout Zones

- Context header.
- Recommendation block.
- Missing inputs.
- Risks.
- Recommended actions.
- Evidence confidence.
- Agent handoff note.

## 8. Data Required

- Event context.
- Current stage.
- Readiness score.
- Lifecycle status.
- Missing required inputs.
- RiskFlags.
- Recommended actions.
- Owner and due date.
- Evidence confidence.
- Optional handoff targets.

## 9. Empty State

If no guidance exists, show "Nexus guidance is unavailable for this context" and list what data is missing. Do not show generic chat filler.

## 10. Loading State

Skeleton recommendation, two missing input rows, and one action row.

## 11. Error State

Show "Nexus guidance could not load" and keep workflow controls outside the panel available.

## 12. Interactions

- Recommended action buttons focus workspace sections or create structured tasks later.
- Handoff links later open Sentinel, Atlas, or Steward context.
- Free-text prompt is excluded until File 08 Stage 1-6 contract is approved for Source.

## 13. Nexus Role

Nexus answers: where are we, what is missing, what is at risk, what decision is needed, what artifact can be generated, what cannot be trusted, and what evidence supports the recommendation.

## 14. Agent Handoffs If Applicable

- Sentinel: evidence, citation, and risk validation.
- Atlas: executive synthesis.
- Steward: gate readiness, approvals, and auditability.

## 15. Accessibility Notes

- Panel should be landmarked or labeled.
- Recommendation should be readable before actions.
- Buttons must describe the target action.
- Confidence must include text.

## 16. Responsive Behavior

- Desktop: persistent right rail.
- Tablet: collapsible rail.
- Mobile: sticky summary plus full-screen panel.

## 17. Design Anti-Patterns

- Do not open with "How can I help?"
- Do not make actions vague.
- Do not fabricate citations.
- Do not bury the owner or next action.
- Do not make Nexus ornamental.

## 18. Acceptance Criteria

- Shows recommendation, status, readiness, missing inputs, risks, next action, owner, due date when available, and evidence confidence.
- Provides structured recommended actions.
- Does not implement full chat or AI generation.
- Includes clear agent handoff model for future implementation.

## 19. Implementation Notes

Define a `NexusSourceGuidance` type in `src/lib/source/types.ts`. Static first slice can derive guidance from event state before runtime wiring.

## 20. Files To Modify

- `src/components/source/PersistentNexusPanel.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
