# 2026-08-22-moves-artifact-placeholder-visual-gate — Moves Artifact Placeholder Visual Gate

## Release ID

`2026-08-22-moves-artifact-placeholder-visual-gate`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now fail the quality gate when visible visual scaffold remains in a client-facing artifact, such as placeholder matrices, placeholder diagrams, or visual-to-be-inserted text. The change keeps unfinished exhibit scaffolding from looking like an approved executive package.

## Layer Impact

- **Release lane:** `global-control-lane`
- **Layer 4 Products:** Updates the deterministic Moves artifact quality validator before export. No canonical data, registry, tenant input, projection, migration, or runtime routing behavior changes.

## Client Applicability

- All clients: Applies to all Moves-generated deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts`
- `src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts --runInBand`
- Pass: `npx eslint src/lib/deliverables/orchestrator/quality-validator.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Initial `npm run release:check` was blocked by this release record using non-template headings; the record was corrected and the gate will be re-run before PR.

## Rollout Plan

Merge through the normal repository PR process. The repo-owned ACA main deploy workflow may rebuild the web image after merge, but this change only affects the deterministic quality gate used before artifact export.

## Deployment Authority

- Repo-owned deploy workflow: Approved session path if main deploy runs after merge.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds from main.
- ACA runtime invariant: Required only if a main deploy is produced.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for the validator unit change; artifact export proof should be captured in a later artifact-quality acceptance pass.

## Rollback Plan

Revert the validator and test changes. No data rollback, migration rollback, or tenant cleanup is required.

## Audit Evidence

- Validator regression test blocks visible placeholder labels in section content.
- Validator regression test blocks placeholder labels in exhibit metadata.
- Local validation commands are listed in the QA section.

## Known Gaps

- This does not redesign DOCX/PPTX templates.
- This does not convert HTML preview artifacts into final DOCX/PPTX deliverables.
- This does not replace weak visuals with professional diagrams; it only prevents visible placeholder scaffolding from passing the quality gate.
