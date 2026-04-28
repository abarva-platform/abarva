# 08 Value Ledger Wireframe

## 1. Purpose Of The Screen Or Component

The Value Ledger connects sourcing events to projected value, realized value, measurement methods, ownership, milestones, and variance explanation.

## 2. Primary User Question

"What value is projected, how will it be measured, and later, was it realized?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| Source Value Ledger                                      Portfolio value $63.3M |
| Projected value is visible now. Realized value activates after measurement.     |
+--------------------------------------------------------------------------------+
| Event: Data & AI Modernization SI Selection                  Projected $18.5M  |
| Measurement owner: Finance Transformation Lead | Confidence: Medium            |
+--------------------------------------------------------------------------------+
| Value Line Item                    Projected Source        Confidence Timing    |
| Legacy platform migration savings  $7.4M     run-cost base Medium     Year 1-2 |
| Report rationalization productivity$4.8M     workload base Low        Year 1   |
| Vendor consolidation savings       $3.6M     vendor spend Medium      Year 1   |
| AI-enabled delivery acceleration   $2.7M     pattern pack Low         Year 2   |
+--------------------------------------------------------------------------------+
| Measurement Method                                                            |
| Compare run-rate cost, report support effort, vendor spend, and delivery cycle |
| time against approved baseline after mobilization milestones.                  |
+--------------------------------------------------------------------------------+
| Realized Value                                                                 |
| Not active yet. Requires contract/mobilization and measurement evidence.        |
| Variance placeholder: scope, execution, external, measurement, combined.        |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Ledger header: portfolio projected value and explanation.
- Event grouping: event name, projected value, measurement owner, confidence.
- Projected value table.
- Measurement method block.
- Realized value placeholder.
- Variance placeholder.

## 5. Above-The-Fold Content

- Portfolio value.
- Primary event projected value.
- Line-item breakdown.
- Measurement owner and confidence.

## 6. Interaction Notes

- Event rows can later deep-link to event canvas.
- Line items can later open assumption/evidence details.
- Realized value stays locked until measurement evidence is available.
- Variance categories should be visible but not populated without actuals.

## 7. Responsive Behavior

- Desktop: grouped ledger table.
- Tablet: event summary cards with compact line-item rows.
- Mobile: one event and one line item per card stack.

## 8. What Should Not Appear

- No realized value claims before evidence exists.
- No unexplained variance.
- No single large value number without line-item sources.
- No confidence score without measurement explanation.
- No CFO-facing dollar claim without assumptions.

## 9. Acceptance Criteria

- Projected value includes source of value, assumptions, confidence, timing, measurement method, owner, and milestones.
- Realized value clearly indicates whether it is active or not.
- Variance categories are defined but not fabricated.
- Data & AI Modernization includes the four required example value line items.
