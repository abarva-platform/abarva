# 2026-06-28-moves-editable-phase-deliverable-standard — Moves Editable Phase Deliverable Standard

## Release ID

`2026-06-28-moves-editable-phase-deliverable-standard`

## Status

`candidate`

## Plain-English Summary

Moves phase-end artifacts now carry a formal package standard and runtime output behavior: important client-facing deliverables create an editable Word-equivalent record, a visual HTML review companion, workshop/session evidence requirements, provenance labeling, and a derived-visualization inventory. P2 current-state/process deliverables must read like human consulting documents with an executive summary, table of contents, storyline, narration, process context, org/ways-of-working context, and workshop evidence.

## Layer Impact

- `global-control-lane`: Adds shared Moves prompt/persistence/rendering rules for all tenants so generated artifacts create editable-document companions and carry provenance requirements.
- `client-data-lane`: No migration or destructive data mutation. Existing client evidence remains unchanged; newly generated or review-regenerated artifacts will add companion records to the Move artifact vault.

## Client Applicability

- All clients: Yes, for Moves phase-end deliverables.
- Specific clients: Lakeshore P2 is the first live-review target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/lib/programs/phase-deliverable-package-contract.ts`.
- Added `src/lib/deliverables/phase-word-equivalent.ts` to render a real editable `.docx` phase record with cover, TOC, executive summary, storyline, evidence status, workshop evidence, client-to-complete fields, derived visualization inventory, and provenance rules.
- Updated `src/lib/deliverables/strategic-moves-artifact-standard.ts` so prompts require Word-equivalent phase records, executive summary, TOC, storyline/narration, workshop evidence, and provenance labels.
- Updated `src/lib/deliverables/persist-move-generated-artifact.ts` so generated artifacts persist both the HTML visual review companion and a separate DOCX editable phase record, with output role, provenance category, required companion outputs, Word sections, and workshop evidence.
- Updated the review/regenerate route so client feedback creates both the regenerated HTML companion and a Word-equivalent review draft.
- Added a deterministic fast lane for packaging-only sponsor-review feedback that asks for an editable Word-equivalent phase record. This creates the review-required HTML companion plus DOCX without waiting on a full Claude rewrite, while leaving substantive rewrite feedback on the existing model-backed regeneration path.
- Updated the File Cabinet API and UI labels to distinguish `Editable deliverable`, `Visual review companion`, `Word-equivalent`, and `HTML review view` without exposing storage internals.
- Added `docs/design/strategic-moves/EDITABLE_PHASE_DELIVERABLE_STANDARD.md`.
- Updated `docs/strategy/MOVES-ARTIFACT-GOLD-STANDARD.md` to replace the old HTML-only master wording with editable Word plus HTML companion language.
- Extended focused tests for the package standard, DOCX rendering, persistence, review-regenerate companion creation, and File Cabinet labels.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand`
- Pass: `npx jest src/lib/deliverables/__tests__/phase-word-equivalent.test.ts src/lib/deliverables/__tests__/persist-move-generated-artifact.test.ts 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate/__tests__/route.test.ts' --runInBand`
- Pass: `npx jest src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand`
- Pass: focused review/regenerate regression covers the deterministic editable Word-equivalent fast lane and proves it skips the model call while saving both HTML and DOCX artifacts.
- Pass: scoped ESLint on touched source and test files.
- Pass with pre-existing unrelated blockers only: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reports the known missing `js-yaml`, Azure Document Intelligence, and `@axe-core/playwright` declarations/modules; no new errors from this release.
- Pending: `npm run release:check` after final validation.

## Rollout Plan

Merge to main, deploy through the approved Azure Container Apps main release lane, then regenerate or review-regenerate a Moves phase artifact to confirm File Cabinet shows both the editable Word-equivalent record and the HTML visual review companion. No database migration is required.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow.
- Shared runtime mutators: None.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the digest-pinned image for the merged SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming browser-visible completion.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision if artifact generation or File Cabinet metadata rendering regresses. Because this change has no migration and no destructive data mutation, rollback is code-only.

## Audit Evidence

- Source files listed in Changes Included.
- Focused Jest output.
- Scoped ESLint output.
- Release check output.
- Post-deploy artifact metadata/prompt proof once deployed.

## Known Gaps

This release does not automatically backfill every historical HTML artifact. Existing records receive the editable companion when regenerated or repackaged through the product path. Live P2 sponsor-review proof remains required before P2 can be treated as final or before P3/P4/P5 generation proceeds.

During live proof on the first deployed candidate, the packaging review request returned `504 stream timeout` because the route waited on a full model-backed HTML regeneration before saving the DOCX. The follow-up fast lane is the corrective action: packaging/editable-record requests are deterministic and should complete as a normal browser action; substantive rewrite requests still use the full regeneration path.
