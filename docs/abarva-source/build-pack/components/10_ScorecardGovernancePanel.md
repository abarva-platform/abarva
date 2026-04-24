# 10 ScorecardGovernancePanel

## 1. Component Purpose

`ScorecardGovernancePanel` governs the vendor evaluation scorecard lifecycle from pattern-pack default through client edits, rationale, review, approval, lock, and use.

## 2. Primary Users

- Procurement leader
- Sourcing lead
- Evaluation chair
- CIO/CTO sponsor
- Legal/compliance reviewer

## 3. Primary User Question

"Is this scorecard ready and governed enough to use for vendor evaluation?"

## 4. Business Role In The Product

The panel protects vendor evaluation integrity. It ensures criteria and weights are traceable, justified, approved, and locked before vendor scoring begins.

## 5. Information Hierarchy

- First: scorecard status and total weight validation.
- Second: default versus edited weights.
- Third: material changes and rationales.
- Fourth: approval, lock, and audit trail.

## 6. Visual Hierarchy

- Lifecycle status at top.
- Validation strip near the scorecard table.
- Material changes flagged in-row.
- Lock action is prominent only when ready.

## 7. Layout Zones

- Scorecard header.
- Criteria/weight table.
- Validation strip.
- Approval and lock controls.
- Audit trail.
- Nexus explanation.

## 8. Data Required

- EvaluationScorecard.
- EvaluationCriteria list with defaultWeight, editedWeight, rationale, materialChange.
- Total weight validation.
- Approval status.
- Lock status.
- Audit event summaries.

## 9. Empty State

Show "No scorecard has been generated for this event" and explain that scorecard defaults come from the selected pattern pack.

## 10. Loading State

Skeleton header, validation strip, and criteria rows.

## 11. Error State

Show "Scorecard governance could not load" and disable approval/lock actions.

## 12. Interactions

- Edit criteria opens EvaluationCriteriaEditor.
- Material changes require rationale.
- Review action moves lifecycle to Reviewed later.
- Approve and lock are disabled until validation passes.

## 13. Nexus Role

Nexus explains why the default criteria fit the event archetype and what tradeoffs client edits introduce.

## 14. Agent Handoffs If Applicable

Sentinel validates criteria evidence and risk. Steward enforces approval/lock readiness.

## 15. Accessibility Notes

- Validation messages must be explicit.
- Edited and default weights require labels.
- Lock/approve disabled state needs reason text.

## 16. Responsive Behavior

- Desktop: table with inline validation.
- Tablet: grouped rows.
- Mobile: criteria cards.

## 17. Design Anti-Patterns

- Do not start vendor scoring before lock.
- Do not hide default weights after edits.
- Do not permit total weights other than 100%.
- Do not allow material changes without rationale.

## 18. Acceptance Criteria

- Shows lifecycle status.
- Shows default and edited weights.
- Validates total = 100%.
- Flags material changes and requires rationale.
- Shows approval, lock, and audit trail placeholders.

## 19. Implementation Notes

Use scorecard logic from `src/lib/source/scorecard.ts`. Keep editing behavior inside `EvaluationCriteriaEditor`.

## 20. Files To Modify

- `src/components/source/ScorecardGovernancePanel.tsx`
- `src/components/source/EvaluationCriteriaEditor.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/scorecard.ts`
- `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
