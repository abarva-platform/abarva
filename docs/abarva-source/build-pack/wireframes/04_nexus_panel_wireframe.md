# 04 Nexus Panel Wireframe

## 1. Purpose Of The Screen Or Component

The Nexus Panel is the persistent advisory rail. It should behave like the AI sourcing lead for the current event or dashboard context, not like a generic chatbot.

## 2. Primary User Question

"What should I do next, why, and what evidence or risk supports that recommendation?"

## 3. Text-Based Wireframe

```text
+--------------------------------------+
| Nexus                                |
| Event: Data & AI Modernization       |
| Stage: Scope | Readiness: 62%        |
| Status: Waiting on Client            |
+--------------------------------------+
| Recommendation                       |
| Do not advance to sourcing strategy  |
| until the application inventory and  |
| analytics workload baseline are      |
| attached.                            |
+--------------------------------------+
| Missing Inputs                       |
| 1. Application inventory             |
|    Owner: Client PMO Lead | Due: not set |
| 2. Analytics workload baseline       |
|    Owner: Client PMO Lead | Due: not set |
+--------------------------------------+
| Risks                                |
| ! Vendor sizing will be unreliable.  |
| ! Commercial comparison will skew.   |
+--------------------------------------+
| Recommended Actions                  |
| [Request inputs] [Open scope]        |
| [Draft data request later]           |
+--------------------------------------+
| Evidence Confidence: Medium          |
| Handoff: Sentinel should validate    |
| input sufficiency before gate.       |
+--------------------------------------+
```

## 4. Layout Zones

- Context header: event, stage, readiness, lifecycle status.
- Recommendation block.
- Missing inputs.
- Risks.
- Recommended actions.
- Evidence confidence and agent handoff note.
- Future prompt input only after the guidance contract is stable.

## 5. Above-The-Fold Content

- Nexus identity.
- Current stage and readiness.
- One clear recommendation.
- Missing input count and owners.

## 6. Interaction Notes

- Recommended actions should be buttons with workflow meaning, not decorative chips.
- `Request inputs` later creates an alert/task.
- `Open scope` focuses the SourceActiveStageWorkspace.
- Handoff notes later route to Sentinel, Atlas, or Steward.
- Free-text chat should not be the primary interaction in the first slice.

## 7. Responsive Behavior

- Desktop: persistent right rail.
- Tablet: collapsible right rail.
- Mobile: sticky summary card with a full-screen Nexus drawer.

## 8. What Should Not Appear

- No generic "How can I help?" chatbot starter.
- No fabricated confidence or citations.
- No broad answer with no next action.
- No unrelated portfolio chatter inside event context.
- No AI generation controls before artifact structure is approved.

## 9. Acceptance Criteria

- Nexus answers where we are, what is missing, what is at risk, what decision is needed, and what happens next.
- The panel names owner, aging, due date when known, and evidence confidence.
- The panel supports agent handoffs conceptually without implementing orchestration yet.
- The panel is useful even when no chat input exists.
