# 2026-10-07-source-event-mobile-gate-layout

## Release ID

`2026-10-07-source-event-mobile-gate-layout`

## Status

`candidate`

## Plain-English Summary

The Source event workspace now uses a compact journey control on narrow screens. The step list stacks above the active step, and the fixed progress action spans the usable screen width without colliding with Ask aVa. The evidence and approval rules are unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Products (Source): responsive presentation and workspace navigation only.
- Canonical model, source adapters, and client intake: unchanged.

## Client Applicability

- All clients: yes, for the Source event workspace on narrow screens.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Collapse the event journey and workspace rail behind an accessible control on narrow screens, preserving navigation in both directions.
- Stack the focused step list above the active step and keep it scrollable.
- Give the fixed progress area usable mobile width and separate Ask aVa from it.
- Add a focused interaction test for the compact rail's Files-to-stage round trip.

## QA / Validation

- The compact rail test failed before implementation, then the Files-to-stage round-trip test exposed a missing return action. Both passed after the change.
- Mutation check: forcing the rail content closed while leaving `aria-expanded` functional failed the focused test; the mutation was reverted.
- Canvas analytics suite: 40 suites, 293 tests passed.
- TypeScript check with Node 24 and an 8 GB heap: passed.
- ESLint on changed TypeScript files: passed.
- Signed-in narrow-screen replay is required after deployment before calling the layout live-proven.

## Rollout Plan

Squash-merge a reviewed PR to `main`, then use only the repo-owned ACA main workflow. Verify digest-pinned template, serving revision, and required workers separately. Replay the event at a narrow viewport while signed in. No migration or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: template, 100%-traffic revision, and worker images must match the approved digest.
- Live signed-in proof required: yes, compact navigation, fixed progress action, and non-overlap with Ask aVa.

## Rollback Plan

Revert this presentation PR through a new reviewed PR and let the repo-owned main workflow deploy it. No data rollback is needed.

## Audit Evidence

The PR diff, focused and suite test output, typecheck, release gate, main deployment record, ACA image readback, and signed-in narrow-screen replay.

## Known Gaps

This change does not alter evidence readiness, legal approval, or supplier NDA coverage. The compact layout is pending signed-in verification until the new image serves traffic.
