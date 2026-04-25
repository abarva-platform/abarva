# 07 Artifact Drawer Wireframe

## 1. Purpose Of The Screen Or Component

The Artifact Drawer shows generated and pending sourcing work products for the current event without forcing the user to leave the event canvas.

## 2. Primary User Question

"Which artifacts exist, which need inputs or review, and which can I open?"

## 3. Text-Based Wireframe

```text
+----------------------------------------------+
| Artifacts                                     |
| Event: Data & AI Modernization SI Selection  |
| 4 drafted | 2 need inputs | 0 locked          |
+----------------------------------------------+
| Sourcing Event Brief                          |
| Tier: Rich | Status: Needs Review             |
| Confidence: Medium | Owner: Sourcing Lead     |
| Required inputs: none                         |
| Citations: 4 attached                         |
| [Open] [Send to review later]                 |
+----------------------------------------------+
| Minimum Data Request                          |
| Tier: Rich | Status: Draft                    |
| Confidence: High | Owner: Nexus               |
| Required inputs: none                         |
| Citations: Pattern pack defaults              |
| [Open]                                        |
+----------------------------------------------+
| RFP/RFI Package                               |
| Tier: Outline | Status: Needs Inputs          |
| Missing: application inventory, workload base |
| [Open prerequisites]                          |
+----------------------------------------------+
| Vendor Selection Memo                         |
| Tier: Stub | Status: Not Started              |
| Locked until Evaluation and Selection stages  |
+----------------------------------------------+
```

## 4. Layout Zones

- Drawer header: event name and artifact counts.
- Artifact list grouped by status or stage.
- Artifact metadata: type, tier, status, confidence, owner, required inputs, citations.
- Primary action per artifact.
- Stub explanation for future-phase artifacts.

## 5. Above-The-Fold Content

- Artifact counts.
- Artifacts that need review or inputs.
- RFP/RFI package prerequisites.

## 6. Interaction Notes

- `Open` routes to `/source/events/[eventId]/artifacts/[artifactId]` after artifact route approval.
- `Open prerequisites` focuses missing inputs in the active workspace.
- Drawer close returns user to canvas without route loss.
- Future version can filter by stage, status, and owner.

## 7. Responsive Behavior

- Desktop: right-side drawer overlaying part of the canvas.
- Tablet: large side sheet.
- Mobile: full-screen drawer with sticky close and artifact summary.

## 8. What Should Not Appear

- No fake artifact body previews when prerequisites are missing.
- No "coming soon" filler.
- No unvalidated AI generation button.
- No export controls for incomplete artifacts unless clearly labeled.
- No artifact list disconnected from stages.

## 9. Acceptance Criteria

- Each artifact shows status, tier, confidence, owner, required inputs, citations placeholder, and primary action.
- Stub artifacts explain why they are locked or incomplete.
- The drawer supports progressive disclosure and preserves event context.
- Artifact generation is not triggered from the drawer until the generation model is approved.
