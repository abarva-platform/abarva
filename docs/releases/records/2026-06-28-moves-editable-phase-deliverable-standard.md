# 2026-06-28-moves-editable-phase-deliverable-standard — Moves Editable Phase Deliverable Standard

## Release ID

`2026-06-28-moves-editable-phase-deliverable-standard`

## Status

`candidate`

## Plain-English Summary

Moves phase-end artifacts now carry a formal package standard: important client-facing deliverables need an editable Word-equivalent record, a visual HTML review companion, workshop/session evidence, provenance labeling, and a derived-visualization inventory. P2 current-state/process deliverables must read like human consulting documents with an executive summary, table of contents, storyline, narration, process context, org/ways-of-working context, and workshop evidence.

## Layer Impact

- `global-control-lane`: Adds shared Moves prompt/persistence rules for all tenants so generated artifacts carry editable-document and provenance requirements.
- `client-data-lane`: No migration or data mutation. Existing client evidence remains unchanged; generated artifact metadata will include the new package contract after rollout.

## Client Applicability

- All clients: Yes, for Moves phase-end deliverables.
- Specific clients: Lakeshore P2 is the first live-review target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/lib/programs/phase-deliverable-package-contract.ts`.
- Updated `src/lib/deliverables/strategic-moves-artifact-standard.ts` so prompts require Word-equivalent phase records, executive summary, TOC, storyline/narration, workshop evidence, and provenance labels.
- Updated `src/lib/deliverables/persist-move-generated-artifact.ts` so generated artifacts persist package metadata: output role, provenance category, required companion outputs, Word sections, and workshop evidence.
- Added `docs/design/strategic-moves/EDITABLE_PHASE_DELIVERABLE_STANDARD.md`.
- Updated `docs/strategy/MOVES-ARTIFACT-GOLD-STANDARD.md` to replace the old HTML-only master wording with editable Word plus HTML companion language.
- Extended `src/lib/deliverables/__tests__/visual-and-prompt.test.ts`.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/phase-deliverable-package-contract.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/persist-move-generated-artifact.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts`
- Pending: `npm run release:check` after this record is normalized to the release template.

## Rollout Plan

Merge to main, deploy through the approved Azure Container Apps main release lane, then regenerate or inspect a Moves phase artifact to confirm the prompt and persisted artifact metadata carry the editable Word/workshop/provenance package contract. No database migration is required.

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

This release defines and binds the package standard. It does not yet implement automatic DOCX generation for every existing HTML artifact or backfill already-generated artifacts in Azure Blob. Those should be handled by the export/backfill lane after the current P2 review gate is live-visible.
