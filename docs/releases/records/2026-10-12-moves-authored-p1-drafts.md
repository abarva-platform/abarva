# 2026-10-12-moves-authored-p1-drafts — Initial authored phase documents

## Release ID

`2026-10-12-moves-authored-p1-drafts`

## Status

`candidate`

## Plain-English Summary

An authorized workspace author can upload an unsigned Word draft to the declared P1 Charter or Discovery Workshop Guide when that document has no version yet. The original bytes, file hash, uploaded origin and exact document version are retained. Approval is a separate action that checks the exact stored file, current version and approved evidence basis.

## Layer Impact

Release lane: `experimental`.

- Layer 3 control records: append a real document/version/file receipt and lifecycle record. Existing catalog definitions and signed history are preserved. A missing identity for an already code-declared document type is registered atomically with the draft.
- Layer 4: a permissioned upload control in the existing Documents card and an exact authored-version approval path. No model, capture promotion, context indexing or phase advancement runs on upload.

## Client Applicability

- Release lane: `experimental`.
- All clients: no default expansion.
- Specific clients: the registry-declared synthetic demo tenant only.
- Internal only: no new admin or data-build surface.
- Public/demo only: generic mechanisms and synthetic QA fixtures.
- Feature flag: `moves_authored_p1_draft_upload_v1`, tenant policy. Existing records retain their display; stored authored provenance remains visible when the new actions are disabled.

## Changes Included

- A DOCX-only initial authored-draft API with declared key/phase, upload/author permissions, actual package/extraction/sensitivity/financial-visibility checks and a reviewed file checksum.
- Mandatory original-byte retention and download/hash verification before admission success. A request-specific file namespace preserves prior artifacts. Partial storage and uncertain admission have explicit responses and stable retry identities.
- An absent-only Azure transaction that creates the document, immutable uploaded version and lifecycle together. Existing and signed document rows cannot be overwritten. Replay returns the recorded IDs only for the matching immutable request/file/uploader scope.
- Separate approval locks the exact document version, file receipt and tenant scope, retaining uploaded origin and workspace-actor attribution. It preserves the normal readiness and current-evidence refusals.
- A pure receipt reader for UI provenance; the parser and database modules stay server-side. Canonical identity and the declared physical storage alias are bound separately so the existing original download route reads the retained bytes.
- No new schema migration, authoring template, model call, loader, selected-ROM write, source attestation or gate action.

## QA / Validation

- PASS: 141 focused assertions in seven suites after reconciliation to actual main, including flag-off, permission/read failures, exact bytes, replay, signed history, source/visibility refusals and current-version approval.
- PASS: 17 planted defects were caught and restored. No surviving mutation was credited as a pass.
- PASS: Node.js 24 typecheck and changed-file lint on the scoped source; current-main checks are recorded with the candidate.
- PASS: real component HTML with the actual module CSS at 1440/390, light/dark; a phone-width defect was repaired. Local layout checks do not claim a signed-in runtime action.
- PASS: local orphan, route/export reachability and six context/corpus validators on the scoped candidate. Manual, coverage and tenancy artifacts are genuinely regenerated after main integration. PASS: generated manual/coverage/tenancy checks and all 11 release gates after this record.
- PASS: 176 affected model-context/admission assertions across eight existing suites after the actual main integration.
- Coverage: genuinely regenerated 2861 covered suites versus actual reconciled main 2860, exactly one new covered route suite. No count tuning, test relocation or filler.
- Runtime: not verified for this release. CI: the new published head must complete every check attempt and legacy context before readiness.

## Rollout Plan

Review the exact candidate, complete local gates and complete exact-head CI. Perform the fresh actual fetched-ref collision guard across every open Moves/shared-census contender, including drafts, and current-main applicability rechecks immediately before readiness and protected squash merge. Publish through the repo-owned ACA main deployment. Verify its digest, runtime invariant and health. A separately approved operator performs the exact same-Move upload/approval and readbacks.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: no branch/local/ad-hoc build, template, environment or traffic changes.
- Approved image digest: supplied by the successful workflow for the deployed main ancestor; not yet known for this candidate.
- ACA runtime invariant: digest-pinned web template and sole 100% traffic revision must match the approved digest and healthy/running/provisioned state.
- Worker image invariant: every worker required by the deployed update-worker script must match that digest.
- Feature/env flag update path: controlled repository release only.
- Live signed-in proof required: exact same-Move document/version, original downloaded bytes/hash and actual actor/approval readbacks. No local test or HTTP 200 substitutes for it.

## Rollback Plan

Disable the new upload/approval actions through the authorized repository release lane. Preserve stored original files, version history and signed pointers; no deletion, reset or regeneration of protected documents. Read-only authored provenance remains visible. A later rollback affecting shared runtime still requires the approved digest and runtime proof.

## Audit Evidence

- Exact source, scoped decision and local gate outputs are retained in the internal release tracker for this release ID.
- PR, current-head CI, fresh fetched-ref/current-main proofs and exact squash are added when published and landed.
- Successful ACA workflow, approved image/digest, independent template/revision/worker/health proof and separately approved operational receipts remain distinct evidence.

## Known Gaps

The new runtime and actual initial upload/approval are unverified. Authored upload is distinct from native model generation and canonical context admission/indexing/retrieval/cite proof. Stored drafts earn no engine quality score or independent human/client/Finance attestation. Fresh same-case deliverable quality, all required Office formats, approved figures/formulas/citations and full journey acceptance remain open.
