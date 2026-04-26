# Next Slice Plan: Agent Mission Activity UI

## 1. Purpose

Plan how Source and the broader AbarVa product should display agent missions without building UI in this slice.

The goal is to make Nexus, Sentinel, Atlas, and Steward visibly useful without turning the product into a generic chatbot, noisy feed, or avatar-led experience. Agent activity should show concrete mission work tied to workflow, evidence, validation, patterns, readiness, and user intent.

## 2. Relationship To Experience System Agent Activity UI Pattern

This plan follows `docs/platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md`.

Binding rules:

- Show agents only when they add decision value.
- Use mission counts and next actions, not noisy feeds.
- Keep agents visible but secondary to the work.
- Keep primary canvas warm off-white and calm.
- Avoid large avatars, excessive icons, decorative symbols, and generic chatbot prompts.
- Show context used, owner, due date, confidence, and evidence state only when useful.

## 3. Where Missions Appear

### Source Dashboard

Use a compact agent activity strip or small Nexus mission preview.

Show:

- Nexus next action for the most exposed event.
- Sentinel evidence gap count.
- Steward blocked gate count.
- Atlas value-at-risk brief readiness.

Do not show:

- Freeform chat input.
- Long mission feed.
- Event canvas expansion.

### Source Event Detail

Use a right-side mission panel and inline recommendations near stage gates, data readiness, artifacts, vendor responses, and scorecard governance.

Show:

- Current stage mission.
- Gate blocker/defer.
- Missing inputs.
- Evidence confidence.
- Suggested actions.

### Programs

Use compact strip or inline recommendations near phase readiness, workshop preparation, artifact review, and approval gates.

Do not duplicate Source-specific sourcing logic.

### Intelligence

Use Sentinel-led inline recommendations for pattern signals, anti-signals, evidence gaps, and low-confidence findings.

### Control Tower

Use Atlas executive briefs and high-priority mission summaries only. Keep it concise and value/risk oriented.

### Admin/Setup

Use Steward-led readiness missions for data, connector, permissions, parsing status, and evidence usability.

Do not create a duplicate Source setup process.

## 4. UI Variants

### Compact Strip

Best for dashboards and portfolio views.

Example:

```text
Nexus: 3 actions ready
Sentinel: 2 evidence gaps
Steward: 1 blocked gate
Atlas: executive brief ready
```

### Right Mission Panel

Best for event detail, program workbench, or deep workflow pages.

Panel should show:

- Primary mission.
- Agent owner.
- Context used.
- Recommended next action.
- Evidence/confidence state when relevant.
- Owner/due date when relevant.
- Three choices plus custom where useful.

### Inline Recommendation

Best beside the object being affected:

- Stage gate.
- Artifact.
- Vendor response.
- Data readiness item.
- Scorecard criterion.
- Approval item.

Keep to one finding, one reason, and one action.

### Executive Brief

Best for Atlas and Control Tower.

Show:

- Decision needed.
- Value at stake.
- Risk.
- Confidence caveat.
- Recommended executive action.
- Operational follow-up owner.

### Background Drawer

Best for lower-priority missions, history, dismissed missions, deferred missions, and audit review.

The drawer is not the primary experience.

## 5. Rules For Minimalism

- Prefer text-first mission labels.
- Use agent marks sparingly.
- Show only active/high-value missions above the fold.
- Collapse low-priority missions.
- Do not show more than one primary mission per surface region.
- Do not make every agent speak at once.
- Avoid badge overload.
- Avoid saturated risk colors unless something is truly blocked or high-risk.

## 6. Avoiding Agent Spam

Agent activity should be hidden or collapsed when:

- Mission is low priority.
- Mission is informational only.
- Mission duplicates an already visible workflow state.
- Mission is waiting on future infrastructure.
- Mission does not change the user's next action.
- User has dismissed it.

Agents should not produce a feed of every validation observation.

## 7. When To Hide Missions

Hide or collapse missions when:

- The page already clearly shows the state.
- The mission is stale or superseded.
- There is no owner/action.
- Context is too weak and the only useful output is a low-context warning.
- Multiple missions repeat the same blocker.
- The mission is completed, dismissed, or intentionally deferred.

## 8. How To Show Three Choices Plus Custom

Use three choices plus custom only when it helps move work forward.

Source examples:

- Show missing inputs.
- Generate minimum data request.
- Explain scope readiness.
- Ask something else.

Workflow blocker examples:

- Show gate blockers.
- Show required approvals.
- Explain waiver path.
- Ask something else.

Do not show choices when:

- There is only one valid action.
- The output is purely informational.
- The user is already in a form or approval flow.
- Options would add clutter.

## 9. Data Contract

Future UI should consume a deterministic mission read model with fields such as:

- `missionId`
- `agentName`
- `missionType`
- `title`
- `summary`
- `priority`
- `state`
- `trigger`
- `sourceEventId`
- `stageId`
- `relatedArtifactId`
- `evidenceStatus`
- `blockerReason`
- `recommendedAction`
- `suggestedActions`
- `handoffTarget`
- `contextUsed`
- `createdAt`

The UI must not infer mission truth from display copy. It should receive explicit state, priority, blocker, evidence, and action fields.

## 10. What Not To Build

Do not build in this UI plan slice:

- UI components.
- Chat UI.
- API routes.
- Model calls.
- Scheduler/background jobs.
- Persistence.
- Upload/parsing.
- Event canvas expansion.
- Scorecard UI.
- Artifact drawer UI.
- Value ledger UI.
- Vendor flow.
- RFP generation.
- Workflow engine.
- Approval engine.
- Artifact versioning.
- Document export/import.
- `/programs`, `/preview`, or `/demo` work.

## 11. Acceptance Criteria

The future UI slice is acceptable only if:

- It cites the Experience System Agent Activity UI Pattern.
- It consumes deterministic mission data, not ad hoc copy.
- It keeps the UI calm and premium.
- It shows next action and context used where useful.
- It avoids agent spam.
- It avoids large avatars and decorative agent surfaces.
- It does not create chat UI.
- It does not create model calls.
- It does not create new routes.
- It does not expand Source event canvas, scorecard, artifact drawer, value ledger, vendor flow, or RFP generation.

## Production Readiness Note

No `production-readiness.json` update is recommended for this plan. It does not change runtime readiness, gates, blockers, test evidence, deployment evidence, or production status.
