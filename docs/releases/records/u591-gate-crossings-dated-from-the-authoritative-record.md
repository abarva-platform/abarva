# U-591 — Gate crossings dated from the authoritative record

## Release ID

`2026-10-08-gate-crossings-dated-from-the-authoritative-record`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

The engagement console shows an activity pulse — the most recent things that
happened on a Move, newest first. It was built to include gate approvals
alongside conversation turns and drafted deliverables, and it already had a
colour and a glyph reserved for them. No gate approval had ever appeared in it.

The panel asked the denormalized `engagements.gates_passed` array for an entry
carrying both an `approved` status and a `signed_at` timestamp. Nothing on the
walked path writes that shape. The phase-advance statement does not write the
column at all, so phases 1 through 4 never appear in it; the single reachable
control that does append appends a bare phase number, with no status field and
no timestamp. So the condition was false at every phase, and the stream silently
omitted every gate crossing a user had performed — the one event in it that
marks governed progress rather than activity.

The timestamped record was already being written and simply was not being read.
Each phase advance inserts a phase-snapshot row for the phase being left,
stamped `approved` when an approver is recorded and carrying the moment of the
write; the terminal handoff inserts the same shape. This change reads that
record, dates each approved crossing from it, and labels it from the canonical
phase-label module rather than restating a phase name locally.

Two decisions are worth stating because they are judgement calls, not
mechanics. An approval that no record can date is reported separately rather
than dropped or given an invented time: a reverse-chronological stream has no
honest position for an undated event, but a caller should still be able to say
the approval happened. And whether a gate counts as approved is decided by the
existing shared predicate rather than re-tested here, so this adds a reader of
the approval vocabulary and not another definition of it.

## Layer Impact

Release lane: `global-control-lane` — shared console behaviour, identical for
every client and not feature-gated.

- **Layer 4 (Products)** — read-only. A projection of existing layer-3 records
  onto an existing panel. No new product owns the data.
- **Layer 3 (Canonical model)** — unchanged. No schema change, no migration, no
  write path touched. The snapshot rows read here were already written by the
  phase-advance and gate-approval paths.

## Client Applicability

- All clients: yes — the console panel behaves the same for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The panel already rendered; it was being handed an empty
  set. Gating the corrected read would preserve the defect behind the flag.

## Changes Included

- `src/lib/programs/gate-approval-events.ts` — new. Derives dated gate-approval
  events from both records, preferring the authoritative snapshot for the time,
  honouring a legacy `signed_at` when no snapshot exists, and separating
  approvals that cannot be dated.
- `src/lib/programs/__tests__/gate-approval-events.test.ts` — new, 18 cases.
- `src/app/(maestro)/engagements/[engagementId]/page.tsx` — loads the phase
  snapshots for the Move and builds the panel's gate events from the module,
  replacing the inline condition that could not be satisfied.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new runtime dependency, no change to any write path, no change to the
rendering component.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/gate-approval-events.test.ts`
  — 18/18. This is the directory-wired invocation of the required **AI surface
  control catalog** check, so the new file is merge-blocking without editing a
  workflow.
- **PASS** — `npx jest src/lib/programs/__tests__` (the whole directory, as CI
  runs it) — 169 suites / 2170 tests, no regression.
- **PASS** — mutation sweep, 11 mutations, **11 killed**. Covers the timestamp
  preference between the two records, the approved-status filter on each arm,
  the newest-wins choice within a phase, the stream ordering, the undated
  reporting, the `created_at` fallback, the canonical label, the rationale
  extraction, and per-phase date isolation on both arms. Two mutations survived
  the first sweep and were real coverage gaps, not false survivors: a
  non-approved snapshot could date a phase admitted by the array, and a date
  could bleed between phases on either arm. Both are now covered and killed.
- **PASS** — `npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on all three changed files, exit 0, no warnings.
- **PASS** — caller wiring pinned by mutation: deleting the page's call to the
  module fails typecheck (`TS2304`) and raises two unused-symbol warnings, so
  the module cannot silently stop being called.
- **PASS** — census regenerated honestly. Base regenerated on a clean checkout
  of the same commit reads `2841 / 2676 / 2675`; the committed file on main
  reads `2839 / 2674 / 2673`, so main carries two files of inherited drift that
  this branch does not cause. This branch reads `2842 / 2677 / 2676` with
  `uncoveredTestFiles` unchanged at `165` — base + 1 on each counter, which is
  what proves the new suite is merge-blocking rather than merely present.
- **NOT RUN** — live signed-in walk. Requires a signed-in session and a Move
  whose gate has been approved in-app; this record does not claim `live-proven`.

## Rollout Plan

Merge to main. The change is a read-side correction inside an existing route and
becomes active with the next repo-owned ACA main deploy. No migration, no flag,
no env var, no worker job, no traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: not applicable at merge; the main deploy workflow pins
  the digest it builds.
- ACA runtime invariant: unchanged by this PR; the standing invariant proof is
  owed by whichever deploy carries it, not by this record.
- Worker image invariant: unchanged — no worker job touched.
- Feature/env flag update path: none required.
- Live signed-in proof required: **yes**, before this is called `live-proven`.
  The panel is observable on the engagement console for a Move with at least one
  approved gate.

## Rollback Plan

Revert the PR. The change is additive and read-only: the new module has one
caller, and reverting restores the previous condition in the page. No migration
to unwind, no written data to reconcile, no flag to flip. A Move's snapshot rows
are untouched either way.

## Audit Evidence

- PR URL and its CI run, including the required **AI surface control catalog**
  check that runs the new suite.
- The mutation sweep summary in this record's QA section.
- Base-versus-branch census readings above, which an auditor can reproduce by
  regenerating the census on a clean checkout of the same base commit.
- The two write sites that justify the read: the phase-advance snapshot insert
  in the programs write adapter (both implementations) and the terminal handoff
  insert in the phase-gate-approval route.

## Known Gaps

- **The snapshot fetch itself is not unit-pinned.** The derivation is fully
  tested and mutation-proven, and the call is pinned by typecheck, but the
  one-statement query that loads the rows sits in a server component with no
  test host. It follows the same idiom as the two adjacent queries in the same
  file, neither of which is unit-tested either. Giving that page a test host is
  a separate piece of work; the live walk is what proves this half today.
- **An undated approval is computed but not yet rendered.** The module reports
  approvals it cannot date so a caller can surface them; the activity pulse is
  chronological and does not. On the walked path every approval is datable, so
  this set is empty there — it is reachable only for records written before the
  snapshot table or by a non-product writer.
- **Two readers of the approval vocabulary remain unconsolidated** elsewhere in
  the repo. This change deliberately adds a reader of the shared predicate
  rather than a fourth definition, but it does not close that older duplication.
- Not `live-proven`. See QA and Deployment Authority.
