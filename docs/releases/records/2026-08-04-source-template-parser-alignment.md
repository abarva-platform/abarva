# 2026-08-04-source-template-parser-alignment — Source Template Parser Alignment

## Release ID

`2026-08-04-source-template-parser-alignment`

## Status

`candidate`

## Plain-English Summary

Source evidence uploads that are wired to deterministic fact parsers now download templates whose
headers match the parser contract. If a template-bound upload writes zero facts, the UI shows a
parse warning instead of implying the upload completed the evidence step.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: Source workbook downloads and upload feedback are aligned to the existing
deterministic parser contract.

Layer 3 Projections / facts: no canonical schema or table change. Existing `source_event_facts`
write behavior remains unchanged when files contain valid parser headers.

## Client Applicability

- All clients: Source users on the existing Source analytics upload path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `source_analytics` gating remains unchanged.

## Changes Included

- Source input-template headers for fact-backed requirements are derived from `template-fact-map`.
- Evidence requirement labels/descriptions now match the parser-backed facts currently supported.
- Source upload client treats `factsWritten === 0` on template-bound uploads as a visible parse
  warning.
- Tests cover all four fact-backed evidence requirements and the zero-facts warning path.

## QA / Validation

- `npx jest src/lib/source/exports/__tests__/input-template.test.ts src/lib/source/facts/__tests__/template-fact-map.test.ts src/lib/source/facts/ingest/__tests__/ingest-template-upload.test.ts 'src/app/api/v1/source/[eventId]/facts/ingest-file/__tests__/route.test.ts' src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand --verbose`
- `npx jest src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand --verbose`
- `npx jest 'src/app/api/v1/source/\[eventId\]/facts/ingest-file/__tests__/route.test.ts' --runInBand --verbose`
- `npx jest src/lib/source/exports/__tests__/input-template.test.ts --runInBand --verbose`
- `npx eslint src/lib/source/exports/input-template.ts src/lib/source/exports/__tests__/input-template.test.ts src/lib/source/canonical-specs/evidence-requirements.ts src/components/source/canvas/analytics/sample-view-model.ts src/components/source/canvas/analytics/upload-artifact.ts src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx`

`npx tsc --noEmit --pretty false` was attempted and is blocked by existing unrelated missing
imports in the Home page.

## Rollout Plan

Merge through PR. Runtime activation follows the approved Azure Container Apps main deployment
workflow for the web app. No migration, manual data load, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime deployment.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: must be verified by the normal deploy proof if deployed.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for a deployed claim that template download/upload behavior is live.

## Rollback Plan

Revert the PR. This restores the previous template download headers and upload-feedback behavior.
No data migration rollback is required.

## Audit Evidence

- PR diff for the files listed above.
- Focused Jest output.
- Focused ESLint output.
- Optional signed-in browser proof after deploy: download each fact-backed Source template, upload a
  valid row, and confirm nonzero facts-written feedback.

## Known Gaps

This release aligns the product to the parser contract that exists today. It does not add a new
ticket-history parser or promote uploaded Source evidence into the broader governed context/corpus
layer.
