# 2026-09-30 — Moves Current-State Original Evidence Retention

## Release ID

`2026-09-30-moves-current-state-original-evidence`

## Status

`candidate`

## Plain-English Summary

Current-state documents uploaded through the P2 readiness flow are retained in the Move Artifact Vault after both sensitivity checks pass. The evidence review record links to that original, and reviewers can reopen or download it while checking the extracted facts. If the original cannot be durably stored, the upload does not proceed to evidence registration.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Moves upload/review behavior for all clients.
- **Products:** Updates the Moves P2 upload and review experience to expose the retained original.
- **Source adapters:** The existing extraction and review path now records the source artifact ID alongside extracted evidence.
- **Canonical model:** No schema change. Original bytes remain in Blob and `move_artifacts`; extracted evidence and review decisions remain in their existing governed records.

## Client Applicability

- All clients: Moves users uploading current-state documents through the P2 readiness flow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Persist the uploaded source as a Blob-backed `uploaded_evidence` Move artifact only after scan-before-extract and post-extract sensitivity checks pass.
- Link the source artifact ID from the governed evidence review record.
- Expose Open original and Download original actions during review, fenced to the same tenant and Move.
- Fail closed if the source artifact is not durably stored.
- Add regression coverage for safety ordering, durable storage, review linkage, and Move-scoped original downloads.

## QA / Validation

- Targeted Jest: 6 suites, 119 tests passed.
- Typecheck: passed.
- ESLint: passed for changed TypeScript files.
- Test CI coverage census: regenerated and check passed.
- Release check: passed (`node scripts/release-check.mjs --base origin/main --head HEAD`).
- Signed-in deployed smoke: not run yet.

## Rollout Plan

Merge through the protected main branch, then deploy the exact main commit using the repo-owned ACA main deploy workflow. Verify the approved digest across the web template, 100%-traffic revision, and required worker jobs before signed-in validation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Not yet built.
- ACA runtime invariant: Not yet verified.
- Worker image invariant: Not yet verified.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; upload a synthetic current-state file, verify its Artifact Vault original link, and complete the human review path.

## Rollback Plan

Revert the application change through a new protected-main PR and deploy that main commit through the repo-owned ACA workflow. Existing artifact and evidence records remain valid; no migration rollback is required.

## Audit Evidence

Attach the PR, required CI results, exact ACA deploy workflow run and digest invariant output, plus signed-in smoke evidence after deployment.

## Known Gaps

The code change does not itself prove a full P0–P5 synthetic journey. That remains a separate live workflow acceptance task after deployment.
