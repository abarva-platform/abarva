Date: 2026-04-26
Slice: RFP Readiness Panel
Status: done

## Scope

- Keep Scope-stage workspace deterministic and non-operative while adding a bounded RFP readiness surface.
- Add a read-only panel powered by `buildSourceRfpReadiness`.
- Display overall tier, missing inputs, required artifacts, section-readiness table, and steward/guidance notes.
- Do not add generation, upload, chat, or approval behavior.

## Files

- `src/components/source/SourceScopeStageWorkspace.tsx`
- `src/components/source/SourceRfpReadinessPanel.tsx`
- `src/__tests__/integration/source/source-rfp-readiness-panel.test.ts`
- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `src/__tests__/integration/source/source-scope-stage-workspace.test.ts`

## Design compliance

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/10_AbarVaArtifactStrip.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`
- `docs/abarva-source/NEXT_SLICE_PLAN_SCOPE_TO_RFP_READINESS_LINK.md`

## Behavior implemented

- Added `SourceRfpReadinessPanel` to render:
  - `Overall tier`
  - `Why this tier applies`
  - `Missing inputs` with severity/effect
  - `Required artifacts`
  - RFP section readiness table
  - `Gate and stewardship` notes
  - `Nexus recommendation`
- Wired panel into `SourceScopeStageWorkspace` (scope stage only) using deterministic output from `buildSourceRfpReadiness`.
- Added deterministic event-canvas and scope workspace assertions for panel presence.

## Determinism and boundaries

- Bounded to deterministic seeded data and existing read-model helpers.
- No API calls, no model calls, no upload/parsing, no artifact generation behavior in scope.

## Validation

- `npx jest src/__tests__/integration/source/source-rfp-readiness-panel.test.ts`
- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts src/__tests__/integration/source/source-scope-stage-workspace.test.ts`
- `npx eslint src/components/source/SourceRfpReadinessPanel.tsx src/components/source/SourceScopeStageWorkspace.tsx src/components/source/SourceActiveStageWorkspace.tsx src/lib/source/rfp-readiness.ts src/lib/source/mock-seed.ts src/__tests__/integration/source/source-rfp-readiness-panel.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Production-readiness impact

- No writes, no live monitoring, and no score-gated production flip introduced in this slice.
- Readiness remains informational and deterministic.

## Follow-up

- Slice 3 smoke coverage should run this panel in the event-canvas coverage set and keep the deterministic boundary checks.
