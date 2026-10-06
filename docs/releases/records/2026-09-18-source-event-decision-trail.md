# 2026-09-18-source-event-decision-trail - The Trail The Approval Screen Promised

## Release ID

`2026-09-18-source-event-decision-trail`

## Status

`candidate`

## Plain-English Summary

The Source New workspace's approvals view told the reader that "the approval
record, actor and evidence live in the governed event flow" — and then showed
none of it. A reader was pointed at a decision trail they could not see.

The trail was being written. `listSourceEventActivityEntries` read it back and
**had no callers anywhere in the product**, so every recorded approval, rejection
and send-back sat in a table nothing displayed.

This renders it on the approvals view, which is a surface a route actually
mounts, and fixes a second defect found on the way: the reader returned `[]` both
when the trail was empty and when the read failed.

## Layer Impact

`global-control-lane`. One UI surface, one read path, one route. No schema
change, no write path change, no tenant data touched.

## Client Applicability

- All clients: the approvals view of a Source New event now shows recorded
  decisions instead of only pointing elsewhere.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Why the destination changed

The obvious wiring was reader → `workspace-tabs/LogTab`, whose `ActivityEntry`
type the reader already imported. **`LogTab` is in
`docs/architecture/unreachable-components.json`** — no route mounts it. Wiring
the reader to it would have produced a complete pipeline into a surface no user
can open, which is the failure this repo has been finding all week.

So the trail renders in `SourceNewWorkspace`'s approvals view instead, which
`src/app/(maestro)/source/new/[eventId]/page.tsx` renders. `LogTab` is left
unmounted and unchanged apart from taking its type from the reader rather than
owning it — mounting or retiring it is a separate decision.

## The second defect

```ts
if (error) { console.error(...); return []; }
```

An empty array meant two different things: no decisions recorded, or the
decision log could not be read. On an approval surface that resolves the
ambiguity toward the reassuring answer. The reader now returns a discriminated
`SourceEventActivityResult`, and the view keeps three states apart:

| State | What the reader sees |
|---|---|
| Entries | The recorded decisions, with actor, action and reason |
| Empty, read succeeded | "No decisions have been recorded against this event yet" |
| Read failed | "The decision trail could not be read, so this is not a statement that no decisions were recorded" |

A fourth state covers a caller that passes no trail at all, so a future page
mounting this component cannot silently render as "empty".

## Changes Included

- `src/lib/source/activity-log.ts`: owns `ActivityEntry`; returns
  `SourceEventActivityResult` instead of a bare array.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: renders the
  trail in the approvals view.
- `src/app/(maestro)/source/new/[eventId]/page.tsx`: reads it and passes it.
- `src/components/source/canvas/workspace-tabs/LogTab.tsx`: takes the type from
  the reader.
- Tests for both layers.

## QA / Validation

- `SourceNewWorkspace.test.tsx`: **19 of 19 pass** (4 new). Status: **pass**.
- `activity-log.test.ts`: **5 of 5 pass**, new suite driving the real reader
  against a mocked client. Status: **pass**.
- Four mutations, each applied to real source and reverted:

| Mutation | Result |
|---|---|
| An unreadable trail falls through to the empty-state message | caught |
| The reader reports a failed read as an empty result | caught |
| The approvals view stops rendering the trail | caught, 4 cases |
| The raw read error is shown to the user | caught |

  Status: **pass**. Mutation 2 was **not** caught by the component suite alone —
  the component never calls the reader. That miss is why the reader has its own
  suite; a guard only one layer tests has an untested layer.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` after deleting
  `tsconfig.tsbuildinfo`: **exit 0**, zero diagnostics. Status: **pass**.
- ESLint over all six changed files: **exit 0**. Status: **pass**.
- `release-check`: see Audit Evidence. Captured as an exit status, not read off
  a pipe.
- Signed-in acceptance: **not performed**. See Known Gaps.

## Rollout Plan

Squash-merge after required checks pass. Rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable at authoring time.
- ACA runtime invariant: to be proven on the deploy that carries this SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: **Yes** — this changes what a signed-in user
  sees on an approval surface.

## Rollback Plan

Revert through a new PR. The reader's return type changes with it; it has no
other callers, so the revert is self-contained.

## Audit Evidence

PR link, both suite results, the four mutation results, and the typecheck and
lint exit codes.

## Known Gaps

- **Not signed-in proven.** No event was opened in a browser and no decision was
  recorded to see it appear. The three states are proven against the real
  component and the real reader, not against a live event.
- The failure state is proven with a mocked client error, not a real outage.
- `LogTab` stays unmounted. This change does not decide whether the canvas log
  surface should exist.
- The trail shows the raw ISO timestamp. Formatting it for a reader is a
  presentation decision that belongs with whoever owns this surface's copy.
- The view reads at most 100 entries, the reader's existing limit. An event with
  more has an older trail that is silently not shown, and nothing says so.

## Correction — 2026-09-19

The QA section above says `SourceNewWorkspace.test.tsx`: **19 of 19 pass** and
`activity-log.test.ts`: **5 of 5 pass**, each `Status: pass`.

Both were true of a local run and **enforced by nothing**. Neither file was
named by any workflow, and no scoped jest script reaches
`src/lib/**/__tests__` or `src/components/**/__tests__`. So the decision-trail
guard — whose entire purpose is that a failed read must not render as "no
decisions have been recorded" — could have been deleted, or the discriminated
result reverted to a bare array, without a single CI check going red.

A green PR is not evidence that a test in it ran. The record should have said
"passes locally; not wired into CI", and the wiring should have shipped with
the change.

Both suites are now named in `.github/workflows/ai-surface-control-catalog.yml`.
The claim that they run is verified by finding the filenames in a completed
run's job log, not by the PR being green.

