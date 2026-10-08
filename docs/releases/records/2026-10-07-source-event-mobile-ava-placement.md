# 2026-10-07-source-event-mobile-ava-placement

## Release ID

`2026-10-07-source-event-mobile-ava-placement`

## Status

`candidate`

## Plain-English Summary

On narrow Source event screens, Ask aVa sits beside the journey control instead of floating over active workflow actions. Its open and close behavior is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Products (Source): responsive presentation and agent-entry placement only.
- Canonical model, source adapters, and client intake: unchanged.

## Client Applicability

- All clients: yes, on narrow Source event screens.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add an accessible Ask aVa control to the compact journey row.
- Hide the floating aVa launcher at the mobile breakpoint while retaining the desktop launcher.
- Test the mobile control's open and close states.

## QA / Validation

- The focused test failed before the mobile control was added and passed afterward.
- Run the Source analytics suite, typecheck, lint, and release check before merge.
- Replay the signed-in event at 320px and 390px to verify no control overlap, and confirm desktop retains the floating launcher.

## Rollout Plan

Squash-merge a reviewed PR to `main`, then use only the repo-owned ACA main workflow. Verify the digest-pinned template, 100%-traffic revision, and worker images before signed-in browser replay. No migration or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- Live signed-in proof required: yes, including mobile agent entry and stage action visibility.

## Rollback Plan

Revert this presentation PR through a reviewed PR and redeploy with the repo-owned workflow. No data rollback is needed.

## Audit Evidence

The PR diff, focused and suite test output, typecheck, release gate, main deployment record, ACA image readback, and signed-in viewport replay.

## Known Gaps

This change does not alter agent answers, evidence readiness, approvals, or the Source event data model.
