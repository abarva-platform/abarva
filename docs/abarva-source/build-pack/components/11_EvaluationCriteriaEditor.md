# 11 EvaluationCriteriaEditor

## 1. Component Purpose

`EvaluationCriteriaEditor` supports controlled editing of scorecard criteria weights and rationales before the scorecard is reviewed, approved, and locked.

## 2. Primary Users

- Procurement leader
- Sourcing lead
- Evaluation chair
- Client sponsor delegate

## 3. Primary User Question

"Can I adjust the scorecard while preserving governance and rationale?"

## 4. Business Role In The Product

The editor allows client-specific tailoring without losing Pattern Fabric traceability. It keeps overrides governed and auditable.

## 5. Information Hierarchy

- First: criterion name, default weight, edited weight.
- Second: delta/material-change flag.
- Third: rationale.
- Fourth: validation and save/review action.

## 6. Visual Hierarchy

- Weight inputs are clear but not visually louder than criteria meaning.
- Material changes are flagged beside rationale.
- Validation feedback stays near total weight and changed rows.

## 7. Layout Zones

- Criteria editing list/table.
- Total weight validation.
- Material-change rationale fields.
- Save/review controls.
- Audit note.

## 8. Data Required

- EvaluationCriteria id, label, description, defaultWeight, editedWeight, rationale, materialChangeThreshold.
- Scorecard total.
- Validation result.
- User/editor identity later.

## 9. Empty State

Show "No criteria available to edit" and route users back to scorecard generation/pattern-pack selection later.

## 10. Loading State

Skeleton editable rows and validation footer.

## 11. Error State

Show "Criteria could not load" and disable save.

## 12. Interactions

- Edit weight.
- Add rationale.
- Material-change flag appears when delta crosses threshold.
- Save disabled if total != 100% or required rationales missing.
- Cancel returns to governance panel.

## 13. Nexus Role

Nexus explains the implication of weight changes and suggests whether rationale is strong enough for review.

## 14. Agent Handoffs If Applicable

Steward enforces validation and lock rules. Sentinel may validate rationale if it cites evidence or risk.

## 15. Accessibility Notes

- Inputs need labels and validation messages.
- Total validation must be announced.
- Material-change status cannot rely only on color.

## 16. Responsive Behavior

- Desktop: editable table.
- Tablet: grouped criteria rows.
- Mobile: card-per-criterion with sticky total validation.

## 17. Design Anti-Patterns

- Do not hide the default weight.
- Do not allow saving invalid totals.
- Do not permit rationale-free material changes.
- Do not turn the scorecard into a spreadsheet clone.

## 18. Acceptance Criteria

- Supports editable weights and rationale.
- Shows default and edited values.
- Validates total weight equals 100%.
- Flags material changes and blocks save until rationale exists.
- Preserves audit placeholder.

## 19. Implementation Notes

All validation rules should be pure helpers in `src/lib/source/scorecard.ts`. Component handles display and local editing state only.

## 20. Files To Modify

- `src/components/source/EvaluationCriteriaEditor.tsx`
- `src/lib/source/scorecard.ts`
- `src/lib/source/types.ts`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
