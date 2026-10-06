# 2026-10-02 — Moves File Upload Applies the Sensitive-Data Guard Before Storage

## Release ID

`2026-10-02-moves-file-upload-sensitive-data-guard`

## Status

`candidate`

## Plain-English Summary

The product refuses uploads that appear to contain personal or regulated identifiers. The check runs before the file is stored, and a refused file is not kept, indexed, or opened for review.

One upload path in Moves — the general file upload on a Move's Files tab — did not run that check before storing. It saved the file first. A later check inside evidence processing only changed how the file was parsed; the file stayed stored and was opened for ordinary human review, with nothing on screen saying it had been flagged. A reviewer who approved it would have made it available to generation.

This change runs the same guard on that path before anything is stored: first on the file's bytes, then on the text decoded from Office and PDF files, whose contents a byte scan cannot see. A flagged file is refused with the standard response and nothing is saved. The Files tab tells the uploader the file was not uploaded and why.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves upload behavior for every client; not behind a feature flag.

- **Client intake — Moves file upload:** A control that already applies to the product's other upload paths now applies to this one. No rule is relaxed and no detection rule is changed.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/current-state-doc-ingest.ts`: `assessMoveUploadSensitivity` — the two-layer check (raw bytes, then decoded text) as one function a route calls before storing.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts`: call it before the artifact write, for every upload family; return the standard quarantine response on a hit.
- `src/components/strategic-moves/FileCabinetPanel.tsx`: a plain-language message when an upload is refused for this reason.
- Tests for the function and for the route.

## QA / Validation

- Targeted Jest: pass — the new function suite (5), the route suites (9), and the neighbouring ingestion and file-panel suites (42).
- Route test asserts that a flagged file of each upload family returns the quarantine response and that neither the artifact write nor evidence ingestion is called; a clean file is stored and ingested as before.
- Mutation checks: with the route guard removed, 4 route tests fail; with the decoded-text layer skipped, the Office-file test fails.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: a synthetic test file carrying fabricated identifier patterns was accepted through the Files tab, stored, and listed as ordinary evidence awaiting review. The assistant did not use it while it was pending.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, upload the same synthetic test file through the Files tab of a synthetic workflow and confirm it is refused and nothing new is listed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Files stored through this path before the change were not screened before storage and are not re-screened by this change.
- If the document parser cannot read a file, only the raw-byte check applies; an unreadable file is not refused for being unreadable.
- The decoded text of a refused Office or PDF file may remain in the parser's content-hash cache. This is the same behavior as the other Moves upload path.
- The later check inside evidence processing is unchanged: on a hit it still records the evidence with deterministic parsing and opens it for review. After this change it is reachable from this route only when the pre-storage parse fails and the later parse succeeds.
- A refused upload is not written to an audit log by this route.
