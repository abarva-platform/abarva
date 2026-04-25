# 06 SourceActiveStageWorkspace

## 1. Component Purpose

`SourceActiveStageWorkspace` renders the main working surface for the current stage. The first approved stage experience should focus on the Scope stage for Data & AI Modernization SI Selection.

## 2. Primary Users

- Sourcing lead
- PMO lead
- Procurement leader
- Client PMO Lead
- CTO delegate

## 3. Primary User Question

"What work must be completed in this stage before we can move forward?"

## 4. Business Role In The Product

This component is where stage-specific work happens. It translates Source's workflow model into practical work surfaces such as scope definition, assumptions, dependencies, risks, and readiness.

## 5. Information Hierarchy

- First: stage goal, readiness, gate state.
- Second: required inputs and missing items.
- Third: in-scope/out-of-scope, assumptions, dependencies, risks.
- Hidden: editing workflows until approved.

## 6. Visual Hierarchy

- Stage readiness and gate status lead.
- Missing inputs are prominent.
- Scope boundaries are structured in paired panels.
- Risks are visible but not alarmist.

## 7. Layout Zones

- Stage header.
- Required inputs.
- In-scope/out-of-scope.
- Assumptions/dependencies.
- Risks.
- Gate summary and Nexus recommendation.

## 8. Data Required

- Active WorkflowStage.
- RequiredInput objects.
- Scope items.
- Out-of-scope items.
- Assumption list.
- Dependency list.
- RiskFlag list.
- Readiness score and StageGate.

## 9. Empty State

If no active stage is selected, show "Select a stage to continue" only in developer or invalid state. Normal event canvas should always have an active stage.

## 10. Loading State

Skeleton stage header, input rows, and section panels.

## 11. Error State

Show "Stage workspace could not load" and preserve event context. Do not show stale stage data.

## 12. Interactions

- Missing input row can later open upload/link action.
- Scope items can later be edited after review.
- Gate footer can later request Steward validation.
- For first slice, interactions can be static/focus-only.

## 13. Nexus Role

Nexus explains why the stage is or is not ready and recommends the next action based on missing inputs and risks.

## 14. Agent Handoffs If Applicable

Sentinel can validate evidence sufficiency for required inputs. Steward can validate whether the gate is ready.

## 15. Accessibility Notes

- Section headings must be clear.
- Required input statuses must include text.
- Gate status should be readable by screen readers.

## 16. Responsive Behavior

- Desktop: two-column content sections inside center workspace.
- Tablet: stacked sections with compact rows.
- Mobile: single-column card stack.

## 17. Design Anti-Patterns

- Do not build a long intake form first.
- Do not include downstream RFP generation controls when scope is blocked.
- Do not fabricate scope evidence.
- Do not bury the readiness blocker.

## 18. Acceptance Criteria

- Scope stage shows goal, required inputs, in-scope, out-of-scope, assumptions, dependencies, risks, readiness, and gate status.
- Missing application inventory and analytics workload baseline are visible for the golden event.
- Gate is not ready when required inputs are missing.
- No downstream UI is implemented in this component.

## 19. Implementation Notes

Start with a Scope-stage renderer. Later stages can be added as explicit subcomponents after their specs are approved.

## 20. Files To Modify

- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`
- `src/lib/source/mock-seed.ts` only if needed for static scope data.

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
