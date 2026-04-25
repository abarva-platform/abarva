# 05 SourceStagePanel

## 1. Component Purpose

`SourceStagePanel` summarizes the current stage and gives users a compact view of required inputs, artifacts, risks, decisions, and gate status.

## 2. Primary Users

- Sourcing lead
- PMO lead
- Procurement leader
- Client owner for required inputs

## 3. Primary User Question

"What does this stage require, and what is blocking it?"

## 4. Business Role In The Product

The stage panel keeps the event canvas grounded in the current stage without overwhelming the center workspace. It is the navigation and readiness spine for stage-level work.

## 5. Information Hierarchy

- First: stage name, goal, gate status.
- Second: required inputs and missing items.
- Third: artifacts and risks.
- Secondary: decisions and owners.

## 6. Visual Hierarchy

- Stage title and gate status are topmost.
- Missing inputs receive high-signal treatment.
- Artifacts are concise links or summaries.
- Risks are brief and linked to Nexus guidance.

## 7. Layout Zones

- Stage header.
- Required inputs list.
- Artifact list.
- Risks list.
- Decisions list.
- Gate status footer.

## 8. Data Required

- Current WorkflowStage.
- Stage goal.
- RequiredInput list with status and owner.
- Artifact summaries for the stage.
- RiskFlag list.
- Decision list.
- StageGate status and readiness.

## 9. Empty State

If the active stage has no configured requirements, show "No stage requirements configured" and flag it as a configuration gap.

## 10. Loading State

Use section skeletons for stage header, inputs, artifacts, and gate footer.

## 11. Error State

Show "Stage details could not load" with no stage advancement controls.

## 12. Interactions

- Required input click focuses the matching center workspace section.
- Artifact click opens drawer or artifact page later.
- Risk click focuses Nexus risk explanation.
- Gate status click opens Steward readiness details later.

## 13. Nexus Role

Nexus interprets the stage panel for the user: which input matters most, which risk is highest, and whether a gate can move.

## 14. Agent Handoffs If Applicable

Steward validates gate readiness. Sentinel validates evidence sufficiency for inputs and risks.

## 15. Accessibility Notes

- Lists should preserve headings and labels.
- Gate status must be announced in text.
- Required input statuses cannot rely only on icons.

## 16. Responsive Behavior

- Desktop: left panel.
- Tablet: collapsible left panel.
- Mobile: expandable stage summary above workspace.

## 17. Design Anti-Patterns

- Do not turn the panel into a full form.
- Do not duplicate the entire workspace.
- Do not show future-stage artifacts as active.
- Do not hide missing inputs.

## 18. Acceptance Criteria

- Shows current stage goal, required inputs, artifacts, risks, decisions, and gate status.
- Names missing inputs and owners.
- Connects to workspace/Nexus interactions.
- Does not advance stages itself.

## 19. Implementation Notes

Keep this component display-oriented. Gate transition functions belong in `src/lib/source/lifecycle.ts`.

## 20. Files To Modify

- `src/components/source/SourceStagePanel.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
