# Moves Evidence Phase Assignment

## Release ID

`2026-10-03-moves-explicit-evidence-phase`

## Status

`candidate`

## Plain-English Summary

Evidence uploads now carry an explicit phase selected by the uploader. The selector defaults to the phase currently being viewed, but allows an authorized user to assign a file to the phase it actually supports. This avoids silently classifying evidence based on page navigation.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Moves upload UI exposes the evidence phase and confirms the selected phase after upload.
- **Canonical model:** No schema or identity changes. The existing phase field remains the persisted scope for uploaded evidence.
- **Source adapters:** No changes.

## Client Applicability

- All clients: same Moves upload behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- File Cabinet phase selector and phase-aware upload confirmation.
- Regression tests for default and explicit phase assignment.

## QA / Validation

- `FileCabinetPanel.evidence-review.test.tsx` and `route.sensitive-guard.test.ts`: 16/16 passed.
- `npm run typecheck`: clean.
- ESLint and Prettier: clean for changed code and tests.
- Release check, CI, and signed-in runtime verification: pending.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned ACA main deploy workflow. The change is active for all Moves uploads after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending workflow run.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Must be verified after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; upload a file with a selected non-current phase and verify the persisted evidence phase and gate impact.

## Rollback Plan

Revert the UI change through a follow-up PR and deploy via the same repo-owned workflow. Existing phase metadata is not migrated or rewritten.

## Audit Evidence

- PR and CI checks: Pending.
- Deployment workflow and runtime proof: Pending.
- Signed-in upload/readback: Pending.

## Known Gaps

Existing records retain the phase they were assigned at upload time. This change does not infer or rewrite historical phase metadata.
