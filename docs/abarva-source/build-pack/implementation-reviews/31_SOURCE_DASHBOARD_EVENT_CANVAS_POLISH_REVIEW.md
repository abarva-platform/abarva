# Source Dashboard And Event Canvas Polish Review

Date: 2026-04-26
Slice: Source dashboard and event canvas minor polish
Status: ready for PR

## Authenticated Review Findings Addressed

- Dashboard pressure panel and event table needed safer responsive containment at narrower desktop widths.
- Dark Source command read was useful but visually dominant.
- Agent mission preview needed Nexus to read as the lead sourcing guide while Sentinel, Atlas, and Steward stayed secondary.
- Event journey map showed discontinuous canonical stage numbering, such as 1, 2, 3, 8, 10.
- Data readiness placeholder had too much empty vertical space beside the mission preview.
- Developer-facing deterministic copy was too visible for a product baseline.

## Design Compliance

Design files cited:

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/04_source_dashboard_wireframe.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/04_AbarVaJourneyMap.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/14_AbarVaThreeChoicesInput.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

Wireframes followed:

- Source dashboard remains table-forward, with one command read and the event operating queue visible early.
- Source event canvas keeps event context, journey progress, current-stage workspace, Nexus guidance, data readiness, and artifact/review placeholders.

Visual decisions applied:

- Warm off-white remains the primary canvas.
- Dark navy remains limited to the dashboard command read.
- Source table and pressure panels now have stronger containment for narrow desktop widths.
- Journey progress now uses continuous visible step numbers instead of discontinuous canonical stage numbers.
- Nexus is visually emphasized in the mission preview while other agents remain secondary.
- Developer-facing deterministic boundary copy is de-emphasized into context language.

Deviations:

- Data readiness remains a placeholder in this slice because the deterministic panel is the next approved implementation slice.
- The event canvas still uses read-only shell placeholders for artifacts and approvals; drawer behavior, approvals, and artifact versioning remain out of scope.

## Files Changed

- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/components/source/NexusEngagementCanvas.tsx`
- `src/components/source/SourceJourneyTracker.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/components/source/PersistentNexusPanel.tsx`
- `src/components/source/SourceStagePanel.tsx`
- `docs/abarva-source/build-pack/implementation-reviews/31_SOURCE_DASHBOARD_EVENT_CANVAS_POLISH_REVIEW.md`

## What Was Polished

- Dashboard shell adds explicit overflow containment and slightly tighter spacing.
- Command read font, padding, and shadow are slightly reduced so the table appears sooner.
- Mission preview orders Nexus first when available and gives Nexus a slightly stronger treatment.
- Event table minimum width and cell wrapping were tightened to reduce clipping.
- Alert panel content now wraps more safely in light mode.
- Event canvas grid now protects the main column from overflow.
- Journey map visible numbering is continuous by rendered stage.
- Data readiness placeholder is shorter and aligned to the top of the mission/readiness grid.
- Nexus panel no longer shows visible "no model calls" copy.

## What Was Not Changed

- No new Source routes.
- No API calls.
- No chat input.
- No upload/parsing.
- No scorecard UI.
- No artifact drawer behavior.
- No value ledger UI.
- No vendor flow.
- No workflow or approval engine.
- No runtime Source data model changes.

## Screenshot / Manual Review Status

Manual authenticated review findings were used as the source for this polish. A fresh authenticated screenshot was not captured in this slice because the work is bounded to straightforward findings already reviewed and validation remains local.

## Validation Results

Passed:

- `npx eslint src/components/source/AbarVaSourceDashboard.tsx src/components/source/SourcingEventTable.tsx src/components/source/SourceAlertPanel.tsx src/components/source/NexusEngagementCanvas.tsx src/components/source/SourceJourneyTracker.tsx src/components/source/SourceStagePanel.tsx src/components/source/SourceActiveStageWorkspace.tsx src/components/source/PersistentNexusPanel.tsx src/components/source/foundationStyles.ts src/lib/source/mock-seed.ts`
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/source/source-dashboard-route-smoke.test.ts src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand`
- `npm run build`
- `git diff --check`

## Production Readiness Impact

No `docs/build/production-readiness.json` update is expected. This is a visual polish slice that does not change Source runtime readiness, data/evidence readiness, workflow gates, blockers, or production evidence.

## Out Of Scope Confirmation

No model calls, Claude/OpenAI calls, chat UI, upload/parsing implementation, scorecard UI, artifact drawer behavior, value ledger UI, vendor flow, AI/RFP generation, workflow engine, approval engine, artifact versioning, document export/import, `/programs`, `/preview`, or `/demo` work was done.
