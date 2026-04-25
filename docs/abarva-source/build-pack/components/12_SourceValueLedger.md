# 12 SourceValueLedger

## 1. Component Purpose

`SourceValueLedger` displays projected and realized value for Source events, including assumptions, timing, measurement method, owner, milestones, actual value, variance, and attribution confidence.

## 2. Primary Users

- CFO
- CIO
- Transformation executive
- PMO lead
- Finance transformation lead

## 3. Primary User Question

"What value is at stake, how will we measure it, and did we realize it?"

## 4. Business Role In The Product

The value ledger connects sourcing workflow to measurable outcome. It prevents value from being a one-time business case claim with no realization mechanism.

## 5. Information Hierarchy

- First: projected value by event and line item.
- Second: assumptions, timing, measurement method, owner.
- Third: realized value and variance when evidence exists.
- Hidden: detailed measurement evidence until drill-in is approved.

## 6. Visual Hierarchy

- Projected value is visible but broken into line items.
- Measurement owner and confidence sit near the value.
- Realized value remains clearly inactive until evidence exists.
- Variance categories are structured and not overcolored.

## 7. Layout Zones

- Ledger header.
- Event value summaries.
- Projected value line-item table.
- Measurement method panel.
- Milestones.
- Realized value section.
- Variance section.

## 8. Data Required

- ProjectedValueLedger entries: projected value, source, assumptions, confidence, timing, measurement method, measurement owner, realization milestones.
- RealizedValueLedger entries: actual value, measurement evidence, variance, variance category, variance explanation, attribution confidence, measurement quality score.
- Event metadata.

Required Data & AI example projected value line items:

- Legacy platform migration savings.
- Report rationalization productivity.
- Vendor consolidation savings.
- AI-enabled delivery acceleration.

## 9. Empty State

Show "No projected value ledger has been created for this event" with explanation that value setup requires scope, sourcing strategy, and finance owner.

## 10. Loading State

Skeleton event value summary, line-item rows, and measurement panel.

## 11. Error State

Show "Value ledger could not load" and avoid showing partial dollar values without context.

## 12. Interactions

- Event group can route to event canvas later.
- Line item can open assumptions/evidence drawer later.
- Realized value remains locked until measurement evidence exists.
- Variance explanation opens only when actual value is present.

## 13. Nexus Role

Nexus explains which value line items are strongest, which assumptions are weakest, and what measurement evidence is required.

## 14. Agent Handoffs If Applicable

Sentinel validates evidence and attribution confidence. Atlas summarizes value for executive decision memos. Steward enforces measurement owner and milestone completeness.

## 15. Accessibility Notes

- Dollar values need labels and context.
- Confidence and variance categories must be text.
- Tables need headers or card labels.

## 16. Responsive Behavior

- Desktop: grouped ledger table.
- Tablet: event cards with line-item rows.
- Mobile: stacked event and line-item cards.

## 17. Design Anti-Patterns

- Do not show a single unsupported dollar total.
- Do not fabricate realized value.
- Do not hide assumptions.
- Do not omit measurement owner.
- Do not present low-confidence estimates as decision-grade.

## 18. Acceptance Criteria

- Shows projected value with source, assumptions, confidence, timing, measurement method, measurement owner, and milestones.
- Shows realized value only when evidence exists.
- Shows variance categories: scope, execution, external, measurement, combined.
- Includes Data & AI Modernization example line items.
- Does not create CFO-facing claims without traceability.

## 19. Implementation Notes

Value calculations and variance helpers should live in `src/lib/source/value-ledger.ts`. The component should render typed ledger entries.

## 20. Files To Modify

- `src/components/source/SourceValueLedger.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/value-ledger.ts`
- `src/app/(maestro)/source/value/page.tsx`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
