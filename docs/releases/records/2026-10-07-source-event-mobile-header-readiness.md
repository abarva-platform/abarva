# 2026-10-07-source-event-mobile-header-readiness

## Release ID

`2026-10-07-source-event-mobile-header-readiness`

## Status

`candidate`

## Plain-English Summary

The Source event stage header stacks its title and readiness count on narrow screens so neither is clipped. Readiness calculations and approval gates are unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Products (Source): responsive header presentation only.
- Canonical model, source adapters, and client intake: unchanged.

## Client Applicability

- All clients: yes, on narrow Source event screens.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add a mobile layout hook to the stage header.
- Stack the stage title and readiness count below the 900px breakpoint.
- Pin the layout hook in the Source event journey smoke test.

## QA / Validation

- The focused test failed before the header hook was added and passed afterward.
- Run the Source analytics suite, typecheck, lint, and release check before merge.
- Verify the signed-in header at 320px, 390px, and desktop widths after deployment.

## Rollout Plan

Squash-merge a reviewed PR to `main`, then use only the repo-owned ACA main workflow. Verify digest-pinned template, 100%-traffic revision, and worker images before signed-in browser replay. No migration or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- Live signed-in proof required: yes, including responsive header and progress area.

## Rollback Plan

Revert the presentation PR through a reviewed PR and redeploy with the repo-owned workflow. No data rollback is needed.

## Audit Evidence

The PR diff, focused and suite test output, typecheck, release gate, main deployment record, ACA image readback, and signed-in viewport replay.

## Known Gaps

This change does not advance evidence, approve a gate, or change the Source event data model.
