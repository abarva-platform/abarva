# Next Slice Plan: Source Agent Mission Queue

## 1. Purpose

Plan a deterministic Source agent mission queue that turns Nexus, Sentinel, Atlas, and Steward into active sourcing agents without building schedulers, persistence, UI, API routes, model calls, upload/parsing, workflow engines, or approval engines.

The queue should produce Source-specific mission read models from existing deterministic foundations:

- SourceAgentContextBundle.
- Context validation report.
- Workflow validation report.
- Deterministic multi-agent briefing.
- Seeded/current Source context.

This plan prepares the implementation slice only. It does not implement the read model.

## 2. Relationship To Agent Mission Model

The platform Agent Mission Model defines generic mission types, states, priorities, triggers, and handoffs. Source should specialize that model for sourcing work:

- Sourcing events.
- Sourcing stages.
- Scope readiness.
- RFP readiness.
- Vendor response completeness.
- Scorecard governance.
- Pricing and negotiation risk.
- Data/evidence readiness.
- Value at stake.
- Executive decisions.

Source missions must preserve the platform rules:

- Agents are context-first, not prompt-first.
- Missions are tied to context, workflow, evidence, patterns, validation, readiness, or user intent.
- Missions should expose next action, blocker, owner, evidence state, confidence, or due date only when useful.
- Missions should never imply background jobs, persistence, model calls, or proactive notification behavior until explicitly implemented.

## 3. Source-Specific Mission Types

Use the platform mission type vocabulary, with Source-specific examples:

| Mission type | Source meaning | Primary agent |
|---|---|---|
| `next_action` | The next sourcing action for the current event/stage. | Nexus |
| `evidence_gap` | Missing or weak evidence for sourcing decisions, RFP sections, vendor claims, or value assumptions. | Sentinel |
| `gate_check` | Whether a sourcing stage can proceed. | Steward |
| `artifact_review` | Readiness of RFP, scope, scorecard, memo, or transition checklist artifacts. | Nexus / Sentinel / Steward |
| `data_readiness` | Whether required event/source data is present, parsed, connected, or usable evidence. | Steward / Sentinel |
| `value_risk` | Value at stake, projected value confidence, or value exposure. | Atlas |
| `executive_brief` | CIO/CFO/steering committee decision brief. | Atlas |
| `vendor_response_gap` | Missing or inconsistent vendor response content. | Nexus / Sentinel |
| `scorecard_governance` | Scorecard lock, override rationale, weighting risk, or approval need. | Steward / Nexus |
| `approval_follow_up` | Required Source gate, waiver, stakeholder, CFO, legal, or sourcing approval. | Steward |
| `workflow_blocker` | BLOCK result from workflow validation or Source stage gate. | Steward / Nexus |
| `pattern_signal` | Applicable Source pattern, anti-signal, commercial trap, or sourcing archetype cue. | Nexus / Sentinel |
| `validation_defer` | Intentional defer, such as unparsed uploaded document citation. | Sentinel / Steward |
| `low_context_warning` | Source guidance is only pattern-level or seeded, not client-specific. | Sentinel |

## 4. Source Triggers

Initial deterministic read-model triggers should be simple strings, not background jobs:

- `dashboard_load`
- `event_load`
- `stage_focus`
- `context_validation_report`
- `workflow_validation_report`
- `multi_agent_briefing`
- `missing_inputs_detected`
- `workflow_block_detected`
- `validation_defer_detected`
- `value_at_stake_detected`
- `vendor_response_gap_detected`
- `scorecard_not_locked`
- `data_readiness_gap`
- `user_question`

Future runtime triggers from the platform model, such as daily/nightly scans and artifact uploads, should remain planned until schedulers, upload/parsing, persistence, and evidence infrastructure are explicitly approved.

## 5. Mission State Model

Use the platform mission states:

- `proposed`
- `active`
- `waiting`
- `blocked`
- `completed`
- `dismissed`
- `escalated`
- `deferred`

Initial read model should produce only deterministic non-mutating states:

- Use `active` for current next actions and live findings.
- Use `blocked` for workflow validation BLOCK results or gate blockers.
- Use `waiting` for missing client/vendor/owner inputs.
- Use `deferred` for intentional validation defers.
- Use `proposed` for useful but non-blocking recommendations.

Do not implement completed/dismissed/escalated persistence in the first read model.

## 6. Mission Priority Model

Use platform priority levels:

- `critical`
- `high`
- `medium`
- `low`

Source priority inputs:

- Value at stake.
- Stage gate impact.
- Workflow blocker severity.
- Missing data/evidence severity.
- Aging or due date if present in context.
- Executive decision need.
- Vendor response exposure.
- Scorecard governance risk.
- Validation defer impact.

Recommended first-pass deterministic rules:

- `critical`: workflow BLOCK that prevents safe stage progress, approval release, evaluation, or citation readiness.
- `high`: value-at-risk mission, missing inputs for active event, vendor response gap, or scorecard governance issue.
- `medium`: pattern signal, low-context warning, artifact readiness issue, or non-blocking evidence gap.
- `low`: informational executive phrasing or background context note.

## 7. Nexus Missions

Nexus should create missions such as:

- Generate minimum data request.
- Explain scope readiness.
- Prepare vendor reminder.
- Recommend next sourcing action.
- Identify stage-specific missing inputs.
- Convert executive direction into operational follow-up.
- Offer three choices plus custom when user action is useful.

Example:

```text
missionType: next_action
title: Scope readiness needs minimum data request
recommendedAction: Send a minimum data request before RFP release.
suggestedActions: Show missing inputs; Generate data request; Explain scope readiness; Ask something else.
```

## 8. Sentinel Missions

Sentinel should create missions such as:

- Flag unsupported RFP section.
- Validate vendor response completeness.
- Warn that uploaded files are not parsed/citable.
- Identify weak evidence for pricing assumptions.
- Identify low confidence when context is pattern-level only.
- Flag anti-signals where selected sourcing pattern may not fit.

Example:

```text
missionType: evidence_gap
title: Vendor response claim needs evidence
recommendedAction: Request supporting evidence before using the claim in evaluation.
```

## 9. Atlas Missions

Atlas should create missions such as:

- Summarize value at risk.
- Prepare executive decision brief.
- Identify portfolio pressure from delayed sourcing event.
- Explain CIO/CFO tradeoff.
- Label seeded/projected value as not yet realized.

Example:

```text
missionType: value_risk
title: Value at stake requires executive visibility
recommendedAction: Prepare an executive brief before milestone delay.
```

## 10. Steward Missions

Steward should create missions such as:

- Block RFP release.
- Require scorecard lock.
- Require approval owner.
- Require waiver path.
- Flag data readiness gap.
- Preserve workflow validation BLOCK/DEFER reasons.

Example:

```text
missionType: gate_check
title: RFP release blocked by readiness gate
recommendedAction: Resolve required data and approval gaps before release.
```

## 11. How Missions Use SourceAgentContextBundle

Mission builder should read:

- Event id.
- Event name.
- Current stage.
- Stage readiness.
- Missing inputs.
- Portfolio/value fields.
- Owner/due/aging fields where available.
- Pattern context where present.
- Attachment/evidence placeholder state where present.
- Seeded vendor response/status data where present.

Mission output should include `contextUsed` as plain-language labels, not raw internals.

## 12. How Missions Use Context Validation Report

Context validation should feed:

- `low_context_warning`
- `evidence_gap`
- `validation_defer`
- Sentinel confidence notes.
- Nexus next-action caveats.

If context validation preserves intentional defers, missions must not force them to pass.

## 13. How Missions Use Workflow Validation Report

Workflow validation should feed:

- `workflow_blocker`
- `gate_check`
- `approval_follow_up`
- `validation_defer`
- Steward cannot-proceed reasons.
- Nexus recommended remediation.

Mission builder should preserve BLOCK and DEFER semantics exactly as reported.

## 14. How Missions Use Data Readiness State

Initial implementation should use existing deterministic/seeded Source context only. It should not invent Admin/Setup runtime data.

Future data readiness inputs should include:

- Missing.
- Requested.
- Uploaded.
- Connected.
- Loaded.
- Parsed.
- Available.
- Usable Evidence.
- Low Confidence.
- Stale.
- Access Restricted.
- Not Applicable.
- Waived.

Steward should own readiness gates; Sentinel should own evidence confidence; Nexus should convert readiness gaps into next actions.

## 15. How Missions Show Up Later In UI

This slice does not build UI. Future UI should follow `docs/platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md`.

Candidate placements:

- Source dashboard compact agent activity strip.
- Source event detail right-side mission panel.
- Inline recommendation next to stage gate, artifact, scorecard, vendor response, or data readiness item.
- Atlas executive brief area when value/risk is material.
- Background mission drawer for lower-priority or historical missions.

UI must remain calm, sparse, and not chatbot-led.

## 16. What Not To Build

Do not build:

- Model calls.
- Claude/OpenAI calls.
- Chat UI.
- API routes.
- Upload/parsing.
- Schedulers.
- Background jobs.
- Persistence.
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
- `/programs`, `/preview`, or `/demo` integration.

## 17. Acceptance Criteria

The future implementation slice is acceptable when:

- Missions are deterministic and non-mutating.
- Missions are built from SourceAgentContextBundle plus validation/report inputs.
- Nexus, Sentinel, Atlas, and Steward each produce distinct Source-relevant missions.
- Mission fields match the platform mission model.
- Mission states and priorities are deterministic.
- BLOCK and DEFER semantics are preserved.
- Suggested actions support three choices plus custom where useful.
- Formatter output is useful for review.
- Tests prove no model imports, no persistence, no UI imports, no API route dependency, and no upload/parsing behavior.

## Production Readiness Note

No `production-readiness.json` update is recommended for this plan. It does not change runtime readiness, gates, blockers, test evidence, deployment evidence, or production status.
