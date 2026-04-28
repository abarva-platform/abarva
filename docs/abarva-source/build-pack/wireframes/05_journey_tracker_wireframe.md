# 05 Journey Tracker Wireframe

## 1. Purpose Of The Screen Or Component

The Journey Tracker shows where a sourcing event is in the universal Source lifecycle and whether each stage is complete, active, blocked, awaiting approval, reopened, locked, or not started.

## 2. Primary User Question

"Where are we in the sourcing lifecycle, and can we move forward?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| Journey                                                                        |
| [Complete] Intake                                                              |
| [Active + Blocked] Scope                 Readiness 62% | Gate not ready        |
| [Locked] Sourcing Strategy              Requires Scope gate                    |
| [Locked] RFP / RFI Package              Requires sourcing strategy approval    |
| [Not Started] Vendor Responses                                                   |
| [Not Started] Evaluation                                                         |
| [Not Started] Orals / BAFO                                                       |
| [Not Started] Selection                                                          |
| [Not Started] Contract / Mobilization                                            |
| [Not Started] Value Realization                                                  |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Tracker title and stage summary.
- Stage rail with 10 universal stages.
- Per-stage state indicator.
- Current stage readiness/gate indicator.
- Locked-stage prerequisite message on hover/click.

## 5. Above-The-Fold Content

- Current stage.
- Prior completed stage.
- Next locked stage and prerequisite.
- Readiness/gate state.

## 6. Interaction Notes

- Completed and active stages are selectable.
- Locked future stages do not navigate; they show prerequisites.
- Reopened stages show why the stage reopened and which downstream artifacts may be stale.
- Blocked state links to missing inputs or alerts.
- Needs Approval state links to Steward gate explanation.

## 7. Responsive Behavior

- Desktop: horizontal tracker in event canvas header or vertical compact rail if embedded in left panel.
- Tablet: horizontal scroll with stage labels retained.
- Mobile: current, previous, next stage summary with an expandable full journey list.

## 8. What Should Not Appear

- No decorative-only progress bar.
- No percentage completion without gate reasoning.
- No hidden blockers.
- No stage jumping around required gates.
- No custom one-off workflow per event in the initial product.

## 9. Acceptance Criteria

- The tracker includes Intake, Scope, Sourcing Strategy, RFP/RFI Package, Vendor Responses, Evaluation, Orals/BAFO, Selection, Contract/Mobilization, and Value Realization.
- It supports Not Started, Active, Complete, Blocked, Needs Approval, and Reopened states.
- Locked future-stage behavior is explicit.
- Readiness and gate status are visible for the active stage.
- The tracker is tied to state logic, not decoration.
