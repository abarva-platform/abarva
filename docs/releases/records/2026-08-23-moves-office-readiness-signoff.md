# 2026-08-23-moves-office-readiness-signoff — Scan generated Office deliverables before Moves sign-off

## Release ID

`2026-08-23-moves-office-readiness-signoff`

## Status

`candidate`

## Plain-English Summary

Moves deliverable sign-off now scans generated DOCX and PPTX companion files linked to the current deliverable version before allowing approval. If a generated Office companion cannot be read, sign-off stops instead of treating the artifact as clean. If the companion contains client-visible readiness blockers, the existing readiness gate refuses sign-off unless the reviewer explicitly acknowledges those findings and leaves an audit record.

## Layer Impact

- **Layer 4 — Products / `global-control-lane`:** Updates the Moves sign-off API and generated-artifact quality control. It reads existing generated artifact registry rows and Blob bytes for the current deliverable version; it does not create, mutate, delete, or promote canonical data.

## Client Applicability

- All clients: Yes, wherever Moves generated deliverables and sign-off are enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts`
- `src/lib/deliverables/shared/office-text-extract.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts' --runInBand` — pass, 15/15.
- Full lint, typecheck, release gate, PR checks, deploy proof, and signed-in proof are required before marking released.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the resulting image. No manual Azure command, data-plane load, migration, registry activation, or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Standard workflow invariant applies.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, sign-off should reject a generated Office companion that cannot be scanned or that contains readiness blockers.

## Rollback Plan

Revert the PR and let the repo-owned ACA deploy workflow roll forward to the reverted image. No data rollback is needed because this release changes read-time sign-off validation only.

## Audit Evidence

- PR URL: pending.
- CI/check run: pending.
- ACA deploy run: pending.
- Signed-in proof bundle: pending.

## Known Gaps

- Client-approved replacement uploads continue to use the existing upload extraction path and are not scanned by this generated-draft readiness gate.
- The gate scans generated Office artifacts linked to the current deliverable version; unrelated or stale companion files are ignored.
