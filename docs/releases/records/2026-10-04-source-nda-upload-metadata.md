# 2026-10-04 Source NDA upload metadata

## Release ID

`2026-10-04-source-nda-upload-metadata`

## Status

`candidate`

## Plain-English Summary

The synthetic NDA template upload control now sends stage and document-family values that the governed artifact registry accepts. The upload remains a receipt, not template publication, Legal approval, or NDA coverage.

## Layer Impact

Release lane: `experimental`, synthetic lab event only.

Layer 4 Source form metadata only. Layer 3 artifact registry validation and tenancy checks are unchanged.

## Client Applicability

- All clients: No new control.
- Specific clients: None.
- Internal only: No.
- Public/demo only: The existing lab-only synthetic template upload control.
- Feature flag: Existing lab tenant guard; no new flag.

## Changes Included

The Stage 05 upload form uses canonical `rfp` stage and non-deliverable `other` artifact family for an `nda_template` PDF. No route, schema, provider, approval, or contact policy change.

## QA / Validation

A signed-in upload returned `invalid_metadata` before the change, with no template published. A red-first mounted form test reproduced the unsupported stage key. A deliberate family regression to `legal` also failed the test and was restored. Focused tests, typecheck, scoped lint, and release checks are required before merge.

## Rollout Plan

Squash merge after applicable checks and review, then use only the repo-owned ACA main deployment workflow. Recheck the immutable web template, active 100%-traffic revision, and required worker images. Replay the exact synthetic upload signed in and separately verify the artifact row before any publication decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on `main`.
- Shared runtime mutators: None from this branch.
- Approved image digest: Read back from the successful main workflow.
- ACA runtime invariant: Template and 100%-traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, upload receipt and persisted file readback.

## Rollback Plan

Revert this form-only change by PR and redeploy through the main workflow. No migration rollback is involved.

## Audit Evidence

The PR, hosted checks, ACA run, digest readback, and signed-in replay will be recorded after they exist.

## Known Gaps

The existing test PDF lacks distinct provider signing anchors. Uploading or publishing it does not make it sendable through the e-signature route. Provider configuration, contact authority, signatures, and four-of-four NDA coverage remain separate gates.
