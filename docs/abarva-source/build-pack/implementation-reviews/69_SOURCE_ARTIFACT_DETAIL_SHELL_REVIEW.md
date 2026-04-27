# 69 Source Artifact Detail Shell Review

## Design Files Cited

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/10_AbarVaArtifactStrip.md`
- `docs/platform-design/experience-system/components/11_AbarVaReviewApprovalPanel.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

## Wireframe Requirements Addressed

- Nexus editorial now leads the route.
- Artifact metadata strip is explicit.
- Version, owner, evidence state, review state, approval placeholder, and related gate are visible above the fold.
- Context-used disclosure is explicit.
- Evidence/review rail region is present.
- Action layer covers evidence, version history, missing inputs, and custom follow-up with defined anchor behavior.
- Deterministic caveat remains explicit and upload/re-upload behavior is deferred honestly.

## Files Changed

- `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx`
- `src/components/source/SourceArtifactDrawer.tsx`
- `src/__tests__/integration/source/source-artifact-detail-shell.test.ts`

## What The Shell Now Shows

- Nexus-led artifact review frame rather than a read-only content dump.
- Metadata strip and related stage-gate visibility.
- Deterministic missing-input disclosure.
- Review/evidence rail with governance notes.
- Version history and approval placeholders without pretending a runtime exists.

## What Remains Deferred

- Real upload and parsing lifecycle.
- Stored version history and re-upload mechanics.
- Approval routing or comments workflow.
- Export/import behavior.
- Model-driven custom follow-up.

## Validation Results

- Focused Jest planned for `src/__tests__/integration/source/source-artifact-detail-shell.test.ts`
- Scoped ESLint planned on changed files
- Build and diff hygiene planned

## Production Readiness Impact

- No readiness promotion.
- This is a deterministic wireframe-compliance shell only.

## Scope Confirmation

- No model calls added.
- No upload/parsing runtime added.
- No workflow engine added.
- No approval engine added.
