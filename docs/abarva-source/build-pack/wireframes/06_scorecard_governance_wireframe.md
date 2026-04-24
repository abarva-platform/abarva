# 06 Scorecard Governance Wireframe

## 1. Purpose Of The Screen Or Component

The Scorecard Governance screen controls how vendor evaluation criteria are generated, edited, justified, approved, locked, and used.

## 2. Primary User Question

"Can this scorecard be trusted before vendors are evaluated?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| Scorecard Governance                                    Status: Client Edited   |
| Event: Data & AI Modernization SI Selection | Total weight: 100% | Rigor: Enhanced |
+--------------------------------------------------------------------------------+
| Criteria                              Default  Edited  Rationale        Change |
| Data platform modernization capability 20%     20%     Pattern default  None   |
| Migration factory / delivery approach  15%     20%     Delivery risk    Material |
| Domain/data model expertise            15%     15%     Pattern default  None   |
| Cloud platform expertise               15%     10%     Cloud already set Material |
| Governance/security/quality            10%     10%     Pattern default  None   |
| Commercial model                       10%     10%     Pattern default  None   |
| AI/GenAI enablement roadmap            10%     10%     Pattern default  None   |
| Change/adoption and operating model     5%      5%     Pattern default  None   |
+--------------------------------------------------------------------------------+
| Validation: Total = 100% PASS | Material changes require rationale: PASS       |
| Approval: Not approved | Lock: Disabled until Steward readiness passes         |
+--------------------------------------------------------------------------------+
| Audit Trail                                                                    |
| Pattern default generated -> Client edited -> Rationale added -> Pending review |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Scorecard header: event, status, rigor, total weight validation.
- Criteria table: default weight, edited weight, rationale, material-change indicator.
- Validation strip.
- Approval and lock controls.
- Audit trail placeholder.
- Nexus explanation panel can be adjacent or inline.

## 5. Above-The-Fold Content

- Scorecard lifecycle status.
- Total weight validation.
- Criteria and edited weights.
- Approval/lock state.

## 6. Interaction Notes

- Weight editing belongs in EvaluationCriteriaEditor, not this shell.
- Material changes require rationale before review.
- Lock action is disabled until total = 100%, rationale is complete, and Steward readiness passes.
- Nexus explains weighting tradeoffs.
- Sentinel validates evidence or risk claims later.

## 7. Responsive Behavior

- Desktop: wide table with validation strip.
- Tablet: grouped criteria rows.
- Mobile: criteria cards with default/edited/rationale visible.

## 8. What Should Not Appear

- No vendor scores before the scorecard is approved and locked.
- No hidden default-to-edited differences.
- No editable scorecard without audit trail.
- No lock action when weights do not total 100%.
- No ungoverned override.

## 9. Acceptance Criteria

- Default and edited weights are both visible.
- Total weight validation is explicit.
- Material changes are flagged and require rationale.
- Approval and lock states are clear.
- Audit trail is represented even before persistence is implemented.
