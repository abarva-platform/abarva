# 2026-09-18-source-approval-activity-log - Put Lifecycle Decisions Back In The Activity Table

## Release ID

`2026-09-18-source-approval-activity-log`

## Status

`candidate`

## Plain-English Summary

Roughly a dozen Source routes write an entry to the event activity table whenever someone does something — accepting an artifact, repairing one, uploading evidence, changing a gate criterion. The one action that was missing was the lifecycle decision itself: approve, reject and send-back wrote nothing. The write existed until a 7 July 2026 refactor removed it, and `source_event_approved` had no writer anywhere in the repository afterwards.

The approval record still captured who approved and why, so this was a hole in the activity trail rather than a loss of the approval itself. It is now filled: each decision writes its own entry, with the actor, their role, the stage, the reason, and metadata carrying the lifecycle transition, the approval action, whether it was a self-approval, and the stage the decision intended to advance to.

## Layer Impact

`global-control-lane`. One API route gains an activity write through the existing Source write adapter. No schema, migration, adapter or projection change — `insertActivityLog` and `source_event_activity` already exist and are used by sibling routes.

## Client Applicability

- All clients: Source event approval, rejection and send-back.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: writes an activity entry after the approval record commits. Each of the three decisions has its own action type (`source_event_approved`, `source_event_rejected`, `source_event_sent_back`) so the table can be read without inferring the decision from free text.
- `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts`: four tests.

### Two ordering decisions

1. **The entry is written as soon as the approval record commits, before stage advancement.** The human decided; if the advance then fails, the decision still happened and must still be in the trail. The metadata therefore records `intendedAdvanceStageTo` — what the decision was meant to do — rather than the outcome of a later write.
2. **A failed activity write does not fail the request.** The approval is already persisted at that point, so returning an error would misreport a committed decision. The failure is logged loudly instead, matching the sibling routes. The audit hole this closes was invisible for ten weeks; a silent catch would rebuild it.

## QA / Validation

- `src/app/api/v1/source/events`: **29 of 29 pass**, including four new cases — an approval records actor, stage and lifecycle states; a self-approval is marked in the metadata; a rejection gets its own action type; a failed activity write leaves the approval at 200 and logs `activity_insert_failed`.
- Mutation check: removing the activity write fails four tests.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance: **not run** — blocked, host machine locked.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Approve an event and confirm a `source_event_approved` row appears in `source_event_activity` for that event with the actor and stage; repeat for a rejection.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Rows already written are ordinary activity entries and need no migration.

## Audit Evidence

PR link, the four new test results, and the mutation result to be added when available. After deploy, the proof is a `source_event_approved` row in `source_event_activity` for a real approved event.

## Known Gaps

- Nothing reads these entries yet on a user-facing surface: `listSourceEventActivityEntries` currently has no callers. This restores the record, not a screen. Displaying the decision trail — including the self-approval marker the approval screen refers to — is a separate change.
- The inline approval queue on the events list still lacks the self-approval notice and rationale minimum that the dedicated approval route enforces.
