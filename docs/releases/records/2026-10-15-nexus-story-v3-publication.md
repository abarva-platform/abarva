# Nexus story V3 publication

## Release ID

`2026-10-15-nexus-story-v3-publication`

## Status

`candidate`

## Plain-English Summary

Align the public entry page with the connected product story and select the approved V3 private walkthroughs. The entry page explains the reasoning engine, enterprise context, investment planning, supplier decisions and outcome review. The films retain their synthetic-reference disclosure and existing viewer approval requirements.

## Release Lane

`public-demo`

## Layer Impact

The `public-demo` lane changes Layer 4 presentation only: public landing copy, a product-vision image, and private media catalog paths and chapter times. No intake, adapters, canonical records, retrieval, tenant data, identity-provider grants or authentication policy change.

## Client Applicability

- All clients: no authenticated workspace behavior change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: root entry page; existing approved demo viewers receive the new cuts.
- Feature flag: none.

## Changes Included

- `LoggedOutLandingPage`, root metadata and link-preview metadata state the platform purpose and connected journey.
- Ordered planning phases and the two commercial paths replace overly broad outcome promises.
- A generic approved product-vision image replaces the older illustrative workspace image.
- The fixed video IDs now resolve to immutable V3 blobs with matching captions and actual chapter boundaries.
- The anonymous library description reflects the new runtime lengths.

## QA / Validation

- New presentation and catalog assertions failed on the prior copy/catalog before implementation.
- Restoring the previous executive blob path caused a focused assertion failure; restored V3 passed.
- Focused demo tests cover approval denial, private storage, scoped playback, byte ranges, captions and presentation.
- TypeScript validation passes with the repository-size heap allowance. The initial default-heap attempt did not complete.
- Focused lint reports no errors; existing image-component warnings remain.
- Local browser review: desktop and phone width, no horizontal overflow; branding and product-vision image loaded.
- Both complete MP4s decode; caption timing, chapter continuity and source hashes pass. Human voice listening is separate from automated checks.
- Four immutable private media objects were published and downloaded back with matching size/hash before catalog promotion. Prior objects remain unchanged.

## Rollout Plan

Publish and verify private assets first, then squash-merge the reviewed PR. Only `.github/workflows/aca-main-deploy.yml` may build and promote shared web traffic. Verify the serving digest and workers, then inspect the root entry page and play both cuts through the protected library.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the workflow only; no local web-template or traffic update.
- Approved image digest: resolved by the successful main workflow; recorded in private runtime proof.
- ACA runtime invariant: web template and 100%-traffic revision must match that approved digest.
- Worker image invariant: both deliverable worker jobs must match the same digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: approved-viewer playback, chapter seek and caption availability; public root copy check.

ACR build policy is unchanged: keep the shared registry Premium; the repo-owned workflow uses Docker Buildx and GitHub Actions cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`). No ad-hoc shared image build, mutable runtime image, registry pruning or traffic command is part of this change.

## Rollback Plan

Revert the presentation/catalog changes through a PR and the same main deploy workflow. The prior immutable media and captions remain available. No migration rollback or tenant-data restoration is needed. Do not make Blob storage public as a recovery shortcut.

## Audit Evidence

PR and repo-owned deploy run; focused test and mutation results; private media publication/readback proof; unchanged operator template/idle proof; browser captures of the root page and protected player. Private proof remains outside the public repository.

## Known Gaps

This release does not certify financial figures, complete every workflow, establish industry benchmarks or verify model citations across the product. The films use non-numbered commercial narration where owning-source financial proof is unresolved. Existing authentication and viewer grants are unchanged; no new access grants or invitation emails are part of this release.
