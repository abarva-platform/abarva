# U-592 — The phase rail marks the gates the product records

## Release ID

`2026-10-08-phase-rail-marks-the-gates-the-product-records`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

The engagement detail page opens with a dense strip of signals, and below them a
rail with one marker per phase of a Strategic Move. Under each phase it says
whether that phase's gate has been approved and, when a record can date it,
when. Two of the strip's cells read dates off the same rail: when the baseline
was locked, and roughly when the next gate is due.

For a Move walked through the product, four of the six markers could never
light. The rail asked only the denormalized gate array on the engagement row.
The phase-advance statement does not write that column at all, and the only
reachable control that appends to it is the terminal handoff at the last phase —
so approving the gate at the second, third, fourth or fifth phase of the walk
appended nothing the rail could see. A sponsor who had cleared four gates in the
product read a rail that said none had been cleared, on the surface whose entire
job is to show how far the engagement has come.

The two date cells were worse than blank. Their only source was a date on that
same array, which the walked path never writes, so they read "baseline not yet
locked" and "no gate history yet" no matter how many gates had actually been
approved and dated.

The record that holds those approvals was already being written and simply was
not being read here. Every phase advance inserts a phase-snapshot row for the
phase being left, stamped approved when an approver is recorded and carrying the
moment of the write. This change has the rail read both records, and has the
page hand it the snapshots it had already loaded for the activity pulse beside
it. The four middle markers now light on a real walk, and both date cells have
something true to show.

Three decisions are worth stating because they are judgement calls. The
approval and its date are both asked of the module that already states that
union for the activity pulse, so this adds a second reader of one rule rather
than a second definition of it. An approval that no record can date is still
marked — it reports the gate as approved with no date rather than inventing one,
because an undated approval is an approval. And the component's snapshot input
is a required parameter, not an optional one: a correct derivation behind a host
that forgets to pass its records is a fix nobody sees, so the type system now
refuses that arrangement at the only place the strip is mounted.

## Layer Impact

Release lane: `global-control-lane` — shared console behaviour, identical for
every client and not feature-gated.

- **Layer 4 (Products)** — read-only. An existing projection of existing
  layer-3 records, corrected to read the record that holds them. No new product
  owns the data.
- **Layer 3 (Canonical model)** — unchanged. No schema change, no migration, no
  write path touched. The snapshot rows read here are already written by the
  phase-advance and gate-approval paths.
- **Layers 1-2 (Intake, adapters)** — untouched.

## Client Applicability

- All clients: yes — the strip behaves the same for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The rail already rendered and the markers already had
  markup; they were being handed a record that is silent for four of six
  phases. Gating the corrected read would preserve the defect behind the flag.

## Changes Included

- `src/lib/programs/engagement-phase-rail.ts` — the rail now takes the phase
  snapshots alongside the gate array and asks `buildGateApprovalEvents` for
  both the approval and its date, so the marker set, the baseline-lock date and
  the next-gate date all derive from whichever record actually holds the
  approval. Phases approved by a record that cannot date them are marked
  without a date.
- `src/lib/programs/__tests__/engagement-phase-rail.test.ts` — 9 cases added
  (21 total). Each new case names its no-snapshot counterpart so the
  assertions cannot pass for a rail that ignores the new input.
- `src/components/engagement/EngagementMetaStrip.tsx` — takes the snapshots as
  a **required** prop and passes them to the rail.
- `src/components/engagement/__tests__/EngagementMetaStrip.gate-rail.test.tsx`
  — new, 6 cases. The first suite this component directory has ever had.
- `.github/workflows/ai-surface-control-catalog.yml` — wires
  `src/components/engagement` as a directory into the required catalog job, so
  the new suite is merge-blocking and so the next suite written there is too.
- `src/app/(maestro)/engagements/[engagementId]/page.tsx` — passes the phase
  snapshots it already loads to the strip. One line; no new query.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new runtime dependency, no new database read, no change to any write path.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/engagement-phase-rail.test.ts`
  — 21/21. Directory-wired to the required **AI surface control catalog** check,
  so the extended suite is merge-blocking with no workflow edit.
- **PASS** — `npx jest src/components/engagement` — 6/6, through the workflow
  step added by this change.
- **PASS** — `npx jest src/lib/programs/__tests__` (the whole directory, as CI
  runs it) — 170 suites / 2196 tests, no regression.
- **PASS** — mutation sweep, 6 mutations, **6 killed**, run against both suites
  together with explicit per-file paths. The mutations: the rail ignoring the
  snapshots (8 failures); dropping the undated-approval arm so a dateless
  approval reads as unapproved (7); never carrying a date onto a marker (9);
  the component dropping the prop on the way through, which is the dark-fix
  case (3); the baseline date reading the wrong phase (3); and removing the
  render guard so every marker shows (2). Baseline restored and re-run green at
  27/27 after each.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` on all five changed source files, exit 0, no warnings.
- **PASS** — the host wiring is pinned by typecheck, not only by convention:
  the component's snapshot prop is required, so a host that stops passing it
  fails `tsc` rather than silently reinstating the blind spot.
- **PASS** — the rendered half is pinned, not just the derivation. The marker
  markup carried a test identifier with **zero** assertions behind it anywhere
  in the tree before this change; the new component suite reads each marker's
  own rendered text, and the two date cells' rendered text, with the
  no-snapshot counterpart asserted beside each.
- **PASS** — date assertions are derived from the instant under test rather
  than written out, so they assert which record supplied the date instead of
  the runner's locale and offset. A hardcoded short date failed on this host
  for a reason unrelated to the defect, which is how that was found.
- **PASS** — census regenerated honestly. Base regenerated on a clean checkout
  of the same commit reads `2843 / 2678 / 2677` with 509 directories; the
  committed file on main reads `2842 / 2677 / 2676`, so main carries one file of
  inherited drift this branch does not cause. This branch reads
  `2844 / 2679 / 2678` with 510 directories and `uncoveredTestFiles` unchanged
  at `165` — base + 1 on each counter, which is what proves the new suite is
  merge-blocking rather than merely present.
- **NOT RUN** — live signed-in walk. Requires a signed-in session and a Move
  with a gate approved in-app. This record does not claim `live-proven`.

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
  Observable on the engagement detail page for a Move with a gate approved at
  any of the middle phases: the marker under that phase, and the baseline-lock
  and next-gate dates in the signal row above it.

## Rollback Plan

Revert the PR. The change is read-only and additive: the rail gains an input and
the page passes an existing variable. Reverting restores the previous
single-record read. No migration to unwind, no written data to reconcile, no
flag to flip. The workflow step added here can be reverted with it; doing so
returns the component directory to running nowhere, which is the state this
change found it in.

## Audit Evidence

- PR URL and its CI run, including the required **AI surface control catalog**
  check, which runs both the extended suite and the new one.
- The mutation sweep summary in this record's QA section.
- Base-versus-branch census readings above, which an auditor can reproduce by
  regenerating the census on a clean checkout of the same base commit.
- The write sites that justify the read: the phase-advance snapshot insert in
  the programs write adapter, in both of its implementations.

## Known Gaps

- **The page still has no test host, so the hand-off is pinned by typecheck
  rather than exercised.** The prop is required, which means the page cannot
  stop passing something; it does not prove the page passes the *right* thing
  rather than an empty array. That query sits in a server component alongside
  two equally untested neighbours, and giving the page a host would pin all
  three. It is named here and not taken.
- **Three surfaces outside this change still read the gate array alone** and
  therefore still cannot see a gate approved in the product: the engagement
  list summary's baseline-locked and next-gate dates, the summary tile's gate
  counting, and the home attention queue's pending-gate derivation. Two of the
  three were measured this run and are modules already registered as having no
  importers, so correcting them would ship an invisible fix; the third is a
  different concern that counts criteria rather than approvals. None is changed
  here, deliberately.
- **The sixth phase colour still reuses the fifth.** Carried from the prior
  change on this surface. A distinct colour is a design decision, not a
  correctness one.
- **Two array-date readings remain unconsolidated.** The shared module validates
  a recorded date before using it; the entry-matching helper beside it returns
  any non-empty string. This change made the rail use the validating one, which
  leaves the other helper with no product caller outside the predicate that
  wraps it. Retire-or-consolidate is owed and is not taken here.
- **The denormalized array is still not made correct by this change.** It is
  still not appended to for the middle phases, and the terminal append still
  carries a bare number. This change makes one more reader stop depending on
  that; whether the array should become a gate ledger at all, when the snapshot
  table already is one, remains a governance decision.
- Not `live-proven`. See QA and Deployment Authority.
