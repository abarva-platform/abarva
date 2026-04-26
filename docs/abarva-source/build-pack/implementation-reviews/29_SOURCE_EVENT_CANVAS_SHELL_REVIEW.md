# Source Event Canvas Shell Review

Date: 2026-04-26
Slice: Source event canvas shell implementation
Status: ready for PR

## Files Changed

- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/components/source/NexusEngagementCanvas.tsx`
- `src/components/source/SourceJourneyTracker.tsx`
- `src/components/source/SourceStagePanel.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/components/source/PersistentNexusPanel.tsx`
- `docs/build/production-readiness.json`
- `docs/abarva-source/build-pack/implementation-reviews/29_SOURCE_EVENT_CANVAS_SHELL_REVIEW.md`

## Shell Behavior

The `/source/events/[eventId]` route now renders a bounded Source event canvas shell instead of a thin placeholder. The shell remains deterministic and read-only.

The first viewport is structured around:

- event context strip,
- horizontal journey map,
- current-stage workspace,
- compact agent mission preview,
- data readiness placeholder,
- artifact/review placeholder,
- persistent Nexus guidance panel.

The seeded Data and AI event keeps Scope as the working stage and makes the application inventory / analytics workload baseline gap visible without claiming the event is ready for RFP, scorecard, vendor evaluation, or realized value.

## Journey Map Behavior

`SourceJourneyTracker` now uses the warm Source shell styling and makes the current blocked stage visually obvious. Completed stages remain calm, blocked stages show the blocker reason, and future stages remain subdued. The journey map is read-only and does not mutate workflow state.

## Nexus Panel Behavior

`PersistentNexusPanel` now presents Nexus as the lead sourcing guide:

- what matters now,
- recommended next action,
- top deterministic mission,
- suggested actions as visual guidance,
- quiet handoff,
- explicit shell boundary.

No chat input, freeform prompt, model call, API call, persistence, or workflow mutation was introduced.

## Mission Preview And Data Readiness Placeholders

The shell builds a deterministic Source agent mission report from the existing Source context bundle, context validation report, workflow validation report, and multi-agent briefing helpers. It shows only the top few missions and keeps Sentinel, Atlas, and Steward signals secondary.

Data readiness appears only as a placeholder consumed from future Admin/Setup state. It does not create a duplicate Source setup process and does not parse or upload files.

## What Remains Stubbed

- full event canvas workflow,
- chat UI,
- model-assisted Nexus behavior,
- upload/parsing,
- scorecard UI,
- artifact drawer behavior,
- value ledger UI,
- vendor response flow,
- workflow engine,
- approval engine,
- artifact versioning,
- document export/import,
- authenticated screenshot/manual visual review.

## Validation Results

Passed:

- `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/components/source/NexusEngagementCanvas.tsx src/components/source/SourceJourneyTracker.tsx src/components/source/SourceStagePanel.tsx src/components/source/SourceActiveStageWorkspace.tsx src/components/source/PersistentNexusPanel.tsx`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('production-readiness.json parses')"`
- `npx tsx` direct server-render smoke for seeded `evt-source-data-ai-si-selection`
- `npm run build -- --webpack`
- `npm run build`

## Production Readiness Impact

`docs/build/production-readiness.json` was updated conservatively:

- Source status remains `scaffolded`.
- No testing gate was promoted.
- No pilot or production readiness claim was added.
- The Source blocker now distinguishes the new deterministic event canvas shell from the still-missing full workflow, persistence, scorecard, artifact, vendor, and value-ledger capabilities.
- A note records the event canvas shell implementation and its explicit boundaries.

## Out Of Scope Confirmation

No model calls, chat UI, upload/parsing, scorecard UI, artifact drawer behavior, value ledger UI, vendor flow, AI/RFP generation, workflow engine, approval engine, artifact versioning, document export/import, `/programs`, `/preview`, or `/demo` work was done.
