# Source — record who accepted a piece of evidence

## Release ID

2026-10-05-source-evidence-acceptance-actor

## Status

Merged — **migration authored, not applied.** Not deployed and not live-proven by this record.

## Plain-English Summary

The product could say a piece of evidence had reached a usable state and could not say **who decided
that**. The reviewer existed only in the activity log, which is a narrative; a readiness gate reads
rows, not narratives. The sibling table `source_event_gate_criterion_states` has carried
`reviewer_user_id` since the same original migration, so the pattern was established and simply
absent here.

This adds `accepted_by_user_id`, `accepted_by_name` and `accepted_at` to
`source_event_evidence_states`, and has the structured-review route write them.

It was found while trying to wire the `define` readiness step. That step needs a baseline evidence
disposition, and `isResolvedDisposition` accepts only an *accepted* disposition — which requires an
acceptor — or an explicitly audited absence. With no acceptor stored anywhere, an event whose
baseline had been reviewed and accepted would have been told *"accept baseline evidence or record
why it is unknown"*: an instruction to redo work already done. The step was not wired; this is the
missing fact that makes it possible to wire honestly later.

## Layer Impact

Release lane: **global-control-lane**.

Three nullable columns, one partial index, one route writing them, and the row/view types carrying
them. No behaviour changes for any existing reader, because every existing reader ignores fields it
does not know about.

**Deliberately unconstrained.** Several paths raise evidence state — structured review, availability
review, answer, upload sync — and only the structured-review path is updated here. A CHECK requiring
an acceptor on an accepted row would make every path not yet updated fail at the database, turning a
governance improvement into an outage. The constraint belongs in the change that finishes the last
writer.

## Client Applicability

All clients receive this, through the shared global control lane, once the migration is applied.
There is no per-client gating and no feature flag. No client sees a behavioural change: the columns
are additive and nullable, and the only new write records an actor that was previously discarded.

## Changes Included

- `supabase/migrations/20261005150000_source_evidence_acceptance_actor.sql` — columns, comments, index.
- `src/app/api/v1/source/[eventId]/evidence/[requirementId]/review/route.ts` — records the reviewer.
- `src/lib/source/canvas-substrate/types.ts` — row type, view type, mapper.
- `src/__tests__/integration/source/source-evidence-acceptance-actor-migration.test.ts` — contract.

## QA / Validation

| Check | Status |
|---|---|
| Contract suite | PASS — 6 cases |
| Adjacent suites (canvas substrate, source evidence) | PASS — 9 suites, 78 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — exit 0 |
| Migration applied | **NOT RUN — authored only** |
| Fresh-database replay | CI runs it on the PR |
| Signed-in acceptance | NOT RUN |

A negative assertion in the new suite failed on its first run: it checked the migration contained no
`NOT NULL`, and `NOT NULL` appears in the partial index predicate
`WHERE accepted_by_user_id IS NOT NULL` — a filter, not a constraint. The assertion is now scoped to
the `ALTER TABLE` statement, with a control proving the slice is non-empty. This is the second
loose-negative-assertion defect in two migrations; both were in the test, neither in the schema.

## Rollout Plan

Merge to `main`. The migration is **not** applied by merging. Applying it is a separate, explicitly
authorised run of the repo-owned migration workflow naming this file.

Until it is applied, the route's write of the three columns will fail against a database that lacks
them. The structured-review path is therefore gated on the apply, and the apply should be taken
before the next deploy that includes this route change.

## Deployment Authority

Repo-owned main deploy workflow for code. Repo-owned migration workflow for the apply, on named
authorisation. No ad-hoc database command.

## Rollback Plan

Before apply: revert the commit; no database has changed. After apply: the columns are additive and
nullable and may be left in place; reverting the route change alone restores the previous behaviour.

## Audit Evidence

- The suite asserts the three columns, the absence of a breaking constraint, the partial index, and
  that the route's update payload carries all three fields — with a control proving the payload slice
  it inspects is the real one.
- Both the migration comment and the view type state that a null acceptor means *unknown*, not
  *unaccepted*, so a later reader cannot quietly infer a negative from absence.

## Known Gaps

- **Only one of four write paths records the actor.** Availability review, answer and upload sync
  still do not. Until they do, a null acceptor is common and means nothing.
- No constraint enforces an acceptor on an accepted row; that is owed once the last writer lands.
- The `define` readiness step is still not wired. This removes its blocking fact; the wiring is a
  separate slice.
- Not applied, not deployed, not live-proven. No signed-in readback.
