# Source Data Readiness Contract Panel Review

Date: 2026-04-26
Status: ready for review

## Files Changed

- `src/components/source/SourceDataReadinessPanel.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/__tests__/integration/source/source-data-readiness-panel.test.ts`
- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/37_SOURCE_DATA_READINESS_CONTRACT_PANEL_REVIEW.md`
- `docs/build/production-readiness.json`

## Summary

The Source event canvas now consumes the deterministic Admin/Setup readiness contract projection for the Data & AI Modernization event instead of relying only on event-local seeded rows.

The data readiness panel displays a compact progress-to-100 read:

- 34% toward event data readiness
- 3/5 required categories ready
- 2 required gaps
- loaded / available / usable evidence distinctions preserved

This is event data readiness, not production readiness and not live monitoring.

## Design Compliance

Design files cited:

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/04_AbarVaJourneyMap.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/14_AbarVaThreeChoicesInput.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

`docs/abarva-source/SOURCE_VISUAL_DIRECTION_LOCK.md` was not present on main.

Visual decisions applied:

- warm off-white / warm-white panel treatment
- compact table/list hybrid
- text-first readiness states
- restrained blue progress fill
- no noisy icons
- no chat prompt
- no upload or connector affordance
- no dark full-page panel

Deviations: none. The progress bar is intentionally compact and advisory because this is deterministic contract data, not live Admin/Setup monitoring.

Screenshot/manual review status: not captured in this slice; validation is server-rendered component smoke plus build.

## Deterministic Behavior

The event canvas builds the Source-facing readiness projection from `buildSourceDataReadinessProjectionFromAdminSetup({ eventId })` and passes both the projected rows and summary into `SourceDataReadinessPanel`.

If a future event has no contract projection yet, the workspace falls back to existing event readiness rows.

## Explicitly Out Of Scope

- no real upload/parsing
- no connectors
- no Admin UI
- no API calls
- no persistence
- no evidence ledger runtime
- no model calls
- no scorecard/artifact/value UI
- no workflow engine

## Validation Results

- `npx jest src/__tests__/integration/source/source-data-readiness-panel.test.ts --runInBand`
- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand`
- `npx eslint src/components/source/SourceDataReadinessPanel.tsx src/components/source/SourceActiveStageWorkspace.tsx src/__tests__/integration/source/source-data-readiness-panel.test.ts src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- JSON parse check for `docs/build/production-readiness.json`

All validation passed.

## Production Readiness Impact

This slice improves Source / Outsourcing UI/data-readiness evidence by showing the deterministic contract projection in the event canvas and making progress against 100% visible.

It does not promote Source beyond `scaffolded` because live Admin/Setup integration, tenant-bound readiness, upload/parsing, evidence ledger runtime, authenticated visual QA, and production workflow persistence remain incomplete.

## Recommended Next Slice

Add smoke coverage that specifically verifies the event canvas includes the contract-backed data readiness panel and its progress read after this UI path is merged.
