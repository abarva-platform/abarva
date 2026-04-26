# Source Scope Stage Workspace Review

Date: 2026-04-26
Slice: Source Scope Stage Workspace implementation
Status: ready for PR

## Design Compliance

I read and applied the following canonical design guidance before implementation:

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_SCOPE_STAGE_WORKSPACE.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/04_AbarVaJourneyMap.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

Locked decisions applied:
- warm off-white/ivory primary canvas and restrained dark panel usage,
- table-forward layout with compact cards,
- minimal icon/symbol usage,
- visible journey state with clear stage position,
- contextual Nexus guidance with 3 choices + custom pattern only in workspace,
- no full dashboard/chat-as-primary behavior.

## Files Changed

- `src/components/source/SourceScopeStageWorkspace.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/__tests__/integration/source/source-scope-stage-workspace.test.ts`
- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/39_SOURCE_SCOPE_STAGE_WORKSPACE_REVIEW.md`

## Stage Behavior

The Scope workspace is now rendered when active stage is `scope`.

Behavior now includes:
- Stage readiness panel with `Ready / Partially Ready / Blocked / Low Context` and score.
- Gate signal for Sourcing Strategy transition (`yes / no / defer / waiver required` behavior via deterministic label).
- Stage goal summary with in-scope / out-of-scope / assumptions / ambiguities.
- Top mission signal from deterministic mission report.
- Required baseline and missing-input impact list.
- Artifact placeholder section for Scope Document / Minimum Data Request / RFP Outline / Responsibility Matrix.
- Nexus guidance card with top recommendation, concise context, suggested next actions, and custom option.

## Pricing Readiness Behavior

- Scoring is deterministic and seeded from event data readiness fields.
- Missing required inputs and low-context rows influence readiness state.
- Gate impact links missing required input count to pricing-readiness implication.
- Loaded and Available are explicitly distinguished from Usable Evidence and used in panel copy.

## Data Readiness Integration

- Scope workspace reads `SourceDataReadinessPanel` for stage-aware evidence posture.
- Uses seeded projection from admin-setup contract helper when available.
- Preserves deterministic output and includes readiness states used by Source event canvas shell.

## Nexus Guidance Behavior

- Nexus remains lead guide in Scope stage and surfaces:
  - current pricing-readiness summary,
  - a recommended next action,
  - compact 3-choice strip and custom option.
- No new model calls or workflow/scheduler behavior introduced.

## Artifact Placeholder Behavior

No artifact create/upload/review workflow is implemented.
Placeholders are display-only status rows for:
- Scope Document
- Minimum Data Request
- RFP Outline
- Retained/Vendor Responsibility Matrix

## Tests Added / Updated

### Scope test: `src/__tests__/integration/source/source-scope-stage-workspace.test.ts`

- verifies scope workspace rendering for seeded Data & AI event,
- verifies pricing-readiness/state and stage signal,
- verifies required baseline categories and loaded/usable distinction,
- verifies artifact placeholder visibility,
- verifies deterministic boundary checks (no model/upload/parsing/API/workflow/scheduler behavior).

### Existing shell test update: `src/__tests__/integration/source/source-event-canvas-shell.test.ts`

- updated expected strings to match Scope stage workspace placement (`Scope stage workspace`) and Scope current-state language,
- preserved broader deterministic boundary checks.

## Validation

- `npx jest src/__tests__/integration/source/source-scope-stage-workspace.test.ts`
- `npx eslint src/components/source/SourceScopeStageWorkspace.tsx src/components/source/SourceActiveStageWorkspace.tsx src/components/source/NexusEngagementCanvas.tsx src/lib/source/mock-seed.ts src/lib/source/types.ts src/lib/source/index.ts src/__tests__/integration/source/source-event-canvas-shell.test.ts src/__tests__/integration/source/source-scope-stage-workspace.test.ts`
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts src/__tests__/integration/source/source-scope-stage-workspace.test.ts`
- `npx jest src/__tests__/integration/source/source-data-readiness-panel.test.ts`
- `npm run build -- --webpack`
- `npm run build`

## Production Readiness Impact

Scope-stage workspace is deterministic UI work within the Source event shell.

No production-readiness gate promotions were made in this slice.

- No `docs/build/production-readiness.json` update was required because this is a deterministic workspace shell addition with seeded visibility and no new cross-component readiness gates met.
- `docs/build/production-readiness.json` remains aligned to current Source status assumptions.

## What Remains Future

- Route authentication visual review and any manual smoke hardening still live outside this workspace slice.
- Full RFP readyness / release guardrails, artifact drawer behavior, workflow engine, approval engine, upload/parsing, and value ledger are explicitly out of scope.
- Further Scope workspace tuning should follow `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_SCOPE_STAGE_WORKSPACE.md` and this review packet.
