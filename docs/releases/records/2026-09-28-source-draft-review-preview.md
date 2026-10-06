# 2026-09-28 Source draft review preview

## Release ID

`2026-09-28-source-draft-review-preview`

## Status

`candidate`

## Plain-English Summary

The Files review queue could offer final-file acceptance without a way to inspect the generated draft in that workspace. This release adds a collapsed, read-only preview of the current artifact's AI-prepared body. The preview is explicitly not a client-final artifact and does not enable export or approval.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event Files review queue only.
- Layer 3 Canonical Model: No schema, fact, authority, or stored-artifact change. Opening the preview reads the selected canvas body through the existing authenticated, client-scoped endpoint and renders it as escaped text.

## Client Applicability

- All clients: Source events with a registered generated draft and its matching canvas body.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Show a collapsed draft preview only when the current-stage lifecycle is `ai_draft`; fetch its body on demand so the event page remains metadata-only.
- Render the body as text, not HTML, and retain the separate client-final upload, artifact authority, stage approval and external-export controls.
- Do not preview registry-only content, another artifact's body, or an unregistered canvas body; failed or mismatched reads display an error without a review receipt. Switching events clears the prior preview even when artifact codes match.

## QA / Validation

- Pass: red-first mounted tests first found no preview, then proved that an inline-only implementation did not work with the live metadata-only page. The corrected preview fetches only when opened and does not accept or export anything.
- Pass: negative mounted tests keep registry-only and cross-artifact text out of the preview, hide an unregistered canvas body, reject a mismatched read response, show a retry after a failed read, and clear a loaded body on event switch.
- Pass: removing the AI-draft lifecycle guard exposed an unregistered row and failed the mounted tests; removing the response artifact-code match failed the mismatch test. Both mutations were restored.
- Pass: 18 related suites / 178 tests, TypeScript `tsc --noEmit`, and scoped ESLint on the corrected head.
- Pass: release check and diff check on the corrected head.
- Not run: post-deployment signed-in draft review; required after the exact main deployment.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only through the repo-owned ACA main workflow. Verify digest-pinned web and workers, then open the generated draft preview signed in and inspect its content and authority labels before any final acceptance decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert via a reviewed PR and the same main deploy workflow. No data rollback or migration is required.

## Audit Evidence

PR, applicable CI, main deploy run, runtime readback and signed-in replay are recorded in the private execution ledger.

## Known Gaps

The preview is not a file download, edited final, consulting-quality approval, stage decision, supplier contact, or external release. A reviewed client-final upload remains a separate action.
