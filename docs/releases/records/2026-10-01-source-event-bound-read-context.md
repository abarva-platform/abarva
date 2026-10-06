# 2026-10-01-source-event-bound-read-context - Bind Source reads to the opened event

## Release ID

`2026-10-01-source-event-bound-read-context`

## Status

`candidate`

## Plain-English Summary

An event detail page could authorize an event, then independently resolve a client for its facts. If the second lookup was unavailable, the page showed sample stage content instead of the event's persisted evidence. The page now receives the event and its read client from one authorized lookup.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Source product projection): the event page uses the tenant resolved with the same event. Layer 3 facts and identity records are unchanged.

## Client Applicability

- All clients: Source event detail pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add an event-bound read context to the existing scoped Source event query; retain the existing detail-only API for other callers.
- Use that context for the event page's fact-backed stage view.
- Preserve the tenant-alias and exact-event checks and update focused route/query tests.
- No schema, migration, data load, approval policy, or external-release change.

## QA / Validation

- Red-first route and query tests failed before the implementation, then passed 28/28 focused cases.
- Removing the exact-event check made the wrong-row negative fail; removing the tenant-alias check made the foreign-row negative fail. Both guards were restored and the focused suite passed.
- The adjacent stage-action suite passed 3/3 after updating its query mock.
- The wider 83-suite related test run matched its untouched baseline: 76 suites and 617 tests passed; the same seven seeded-fixture suites and 27 tests failed in both checkouts, with no new failures.
- TypeScript and scoped ESLint passed. Release check is rerun before the PR.
- Signed-in post-deploy readback is pending; code and local tests are not live acceptance.

## Rollout Plan

Squash merge through the protected main branch, then let the repo-owned ACA main workflow build and deploy the exact merge SHA. No migration or flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Only that workflow.
- Approved image digest: Record from the successful main deploy.
- ACA runtime invariant: Match digest-pinned web template and sole healthy 100%-traffic revision.
- Worker image invariant: Both required delivery-worker job templates match the web digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Reload the same Source event stage and verify the persisted checklist decision is read back without implying external release.

## Rollback Plan

Revert this PR through a new protected-branch PR and deploy via the same main workflow. No data rollback is needed.

## Audit Evidence

Focused test and mutation output, PR checks, main deploy run, immutable digest and revision readback, and a signed-in stage replay.

## Known Gaps

External legal clearance and artifact readiness remain separate from checklist readback. This release does not approve or issue a supplier package.
