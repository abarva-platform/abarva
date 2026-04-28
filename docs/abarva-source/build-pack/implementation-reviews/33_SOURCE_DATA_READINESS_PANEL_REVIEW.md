# Source Data Readiness Panel Review

Date: 2026-04-26
Slice: deterministic Source data readiness panel
Status: ready for PR

## Files Changed

- `src/components/source/SourceDataReadinessPanel.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/lib/source/mock-seed.ts`
- `src/lib/source/types.ts`
- `src/__tests__/integration/source/source-data-readiness-panel.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/33_SOURCE_DATA_READINESS_PANEL_REVIEW.md`
- `docs/build/production-readiness.json`

## Seed Readiness Data

The seeded Data and AI Modernization sourcing event now includes deterministic readiness rows for:

- Application Inventory: Usable Evidence
- Workload Baseline: Requested
- Ticket History: Missing
- Vendor Spend: Available
- SLA Baseline: Missing
- Vendor Contracts: Loaded
- Security / Compliance Requirements: Low Confidence
- Retained Roles: Requested

## Panel Behavior

The panel is read-only and compact. It shows:

- data category
- requirement level
- readiness state
- evidence usability distinction
- owner
- source system or file
- last updated
- confidence
- workflow impact
- agent recommendation
- Steward/Admin handoff label

It explicitly preserves these distinctions:

- Loaded does not equal usable evidence.
- Available does not equal validated evidence.
- Requested and Missing cannot support evidence claims.
- Source consumes readiness; Admin/Setup owns setup, parsing, connector, and evidence usability work.

## What Is Deterministic Today

- Readiness rows are seeded in `mock-seed.ts`.
- The panel renders directly from the seeded Source event detail.
- Agent guidance is concise text in the read model, not chat or model output.
- Steward/Admin handoff labels are visual only.

## Future Admin/Setup Integration

Future slices should replace seeded readiness rows with a platform readiness contract owned by Admin/Setup. That future contract should supply connector, upload, parsing, permissions, evidence usability, owner, and freshness state.

This slice does not implement that integration.

## Design Compliance

Design files followed:

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`

Visual decisions applied:

- Warm off-white / warm-white surface treatment.
- Compact table/list hybrid.
- Text-first readiness states with restrained color support.
- Minimal icons; no decorative symbols.
- Workflow impact and confidence visible.
- Contextual Nexus/Sentinel/Steward/Atlas-style guidance without chat UI.

Deviations:

- The panel uses seeded Source data until Admin/Setup readiness state exists.
- The panel includes a compact table because this implementation needs to expose all required fields, but it remains read-only and bounded to the current-stage workspace.
- No external screenshot was captured in this slice; local deterministic render and build validation were used.

## Validation Results

Passed locally:

- `npx jest src/__tests__/integration/source/source-data-readiness-panel.test.ts --runInBand`
- `npx eslint src/components/source/SourceDataReadinessPanel.tsx src/components/source/NexusEngagementCanvas.tsx src/components/source/SourceActiveStageWorkspace.tsx src/lib/source/mock-seed.ts src/lib/source/types.ts src/lib/source/index.ts src/__tests__/integration/source/source-data-readiness-panel.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx jest src/__tests__/integration/source/source-dashboard-route-smoke.test.ts src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand`
- `git diff --check`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('production-readiness.json parses')"`

## Production Readiness Impact

`docs/build/production-readiness.json` is updated conservatively:

- Source remains `scaffolded`.
- Data/evidence readiness remains `scaffolded`.
- No pilot or production readiness claim is added.
- Integration evidence now mentions deterministic data readiness panel coverage after local tests pass.
- Existing upload/parsing, live evidence, authenticated visual QA, persistence, model, and workflow blockers remain.

## Explicitly Out Of Scope

- no upload controls
- no file parsing
- no connector setup
- no Admin/Setup implementation
- no API route
- no model calls
- no chat UI
- no evidence ledger implementation
- no scorecard UI
- no artifact drawer behavior
- no value ledger UI
- no vendor flow
- no workflow engine
- no approval engine
- no `/programs`, `/preview`, or `/demo` work
