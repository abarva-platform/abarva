# 2026-10-11-intelligence-review-layout — Review layout continuity

## Release ID

`2026-10-11-intelligence-review-layout`

## Status

`candidate`

## Plain-English Summary

The advisor chat remeasures its available height when an adjacent disclosure opens or closes. Native Intelligence PDFs use a more compact matrix height so sources and follow-up questions can stay with their answer.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: shared advisor viewport measurement and Intelligence native PDF presentation.
- Canonical objects, tenant boundaries, context admission and Claude-authored answer content are unchanged.

## Client Applicability

- All clients using the shared advisor dock or Intelligence native PDF exports.
- No feature flag, environment or data-load change.

## Changes Included

- Observe disclosure `open` changes when measuring dock height.
- Reduce the native matrix plot height, retain readable labels and all original exhibit content, and compact the PDF cover heading.
- Add a regression for restoring chat height after a preceding disclosure closes.

## QA / Validation

- PASS: eighty-one tests across five viewport, prompt and unchanged-output suites.
- PASS: changed-file ESLint and a native matrix fixture with readable labels and references on the answer page.
- PASS: Node 24 TypeScript, refreshed census and all eleven release-control gates.
- Deployed signed-in PDF inspection required.

## Rollout Plan

Squash merge after local QA. Deploy through the repo-owned ACA main workflow. Verify the approved digest, full-traffic revision and required workers. Re-export the preserved signed-in ten-question session and inspect every PDF page; verify the normal chat after opening and closing the review panel.

## Deployment Authority

- Shared runtime mutator: `.github/workflows/aca-main-deploy.yml` only.
- Digest-pinned ACA template, traffic revision and worker invariants required.
- Live signed-in proof required; no feature or environment mutation.

## Rollback Plan

Revert through a PR and the same ACA main workflow. No data rollback.

## Audit Evidence

Layout diff, disclosure regression, unchanged-output tests, local QA logs, release PR, ACA invariant proof and private native PDF inspection.

## Known Gaps

Pagination depends on authored content length. This changes presentation only; it does not alter answer claims or guarantee model adherence to evidence instructions.
