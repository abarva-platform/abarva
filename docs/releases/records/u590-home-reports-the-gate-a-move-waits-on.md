# U-590 — Home reports the gate a Move is waiting on

## Release ID

`2026-10-08-home-reports-the-gate-a-move-waits-on`

## Status

`candidate`

## Plain-English Summary

Home has an attention queue: the short list of things the signed-in user is supposed to
act on today. One of the kinds it can show is "a phase gate is waiting for your
approval" — which, for a product whose whole shape is phase-by-phase approval, is close
to the most important row it could carry.

It never showed one. Not for any Move, not for any client.

The queue decided a gate was pending by scanning the Move's recorded-gates array and
looking for an entry that was NOT approved. That reading can only ever fire if something
writes an entry meaning "this gate is waiting". Nothing does:

- The one path a product gate approval takes writes the Move's current phase and does not
  touch the recorded-gates array at all, so the array does not grow as gates are approved.
- The single live write to that array appends a BARE NUMBER, and only at the terminal
  handoff past the last gate. The old reader skipped non-objects outright, so even that
  entry was invisible to it.
- The only function in the tree that writes a complete gate record — phase, status and a
  signed timestamp — has zero callers.
- Fixture seeds write APPROVED records.

So every entry the reader could ever encounter was either approved or skipped, and the
`gate_pending` row was structurally unreachable. A Move parked at a phase whose gate had
never been approved produced silence, because "waiting" was inferred from the presence of
a record rather than from the absence of an approval.

This change asks the question the other way round: a Move sitting at phase N is waiting on
phase N's gate unless something affirmatively records that gate as approved.

That phrasing is self-correcting against the write behaviour above, which is why it does
not need the array to grow. Approving a gate advances the Move's current phase, so the
pending row moves forward with the Move — approve P2 and the row becomes P3, which is
true — instead of latching onto a phase whose approval the array never receives.

Two things are worth being precise about. First, this loosens and tightens no gate: it
changes one read on an attention surface and nothing that evaluates, blocks or approves
anything. Second, the volume on that surface genuinely changes — the queue went from
never carrying this row to carrying one per active Move whose current-phase gate is not
recorded as approved. That is the fix rather than a side effect, but it is a visible
change and not a silent one.

## Layer Impact

Release lane: `global-control-lane` — shared Home attention behaviour for all clients,
not feature-gated.

- `4 PRODUCTS` — Home. Which attention-queue rows are derived from a Move's recorded
  phase state. No projection of layer 3 changes, no gate changes, no stored data changes.

No change to layers 1, 2, or 3. No schema change and no migration: both inputs the new
reading uses were already selected by the existing Home read adapter and already present
on the row it returns. No new query, and no change to either read-adapter implementation.

## Client Applicability

- All clients: yes — shared Home attention behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The previous reading produced no row under any data this tree
  writes, so there is no prior behaviour a flag could preserve.

## Changes Included

- `src/lib/home/pending-gate-queue.ts` (new) — owns the decision "which gate is this Move
  waiting on", and documents why it is keyed on the current phase rather than on an
  unapproved record. Exports `pendingGatePhase` plus `recordsGateApproval`, which reuses
  the approval vocabulary already established elsewhere in the tree
  (`approved` / `signed_off` / `complete` / `completed`, plus the timestamp and actor
  fields) rather than restating a sixth definition of "approved".
- `src/lib/home/aggregate.ts` — the inline presence-scan is replaced by the shared
  derivation. The emitted row's id shape and detail wording are unchanged.
- `src/lib/home/__tests__/pending-gate-queue.test.ts` (new) — 15 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no route contract change, no workflow change, no worker change, no adapter
interface change.

## QA / Validation

- `npx jest src/lib/home/__tests__/pending-gate-queue.test.ts` — **PASS** (15 tests).
- `npx jest src/lib/home` — **PASS for this change**: 40 suites / 375 tests, of which
  8 suites / 22 tests fail. Those same 8 suites and 22 tests fail identically on the
  unmodified base (39 suites / 360 tests, 8 failed / 22 failed), so they are pre-existing
  and not attributable here. The delta is exactly `+1` suite and `+15` passing tests. The
  pre-existing failures are in `home-summary-runtime`, `home-summary-snapshot`,
  `local-cxo-runtime`, `panel-inventory`, `v6-context-browser`,
  `know/home-consultant-text-synthesis`, `know/home-know-tenant-binding` and
  `v6/home-v6-context-findings` — none of which touches the changed modules.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS**
  (exit 0, zero diagnostics).
- `npx eslint` over the three changed/added source files — **PASS** (exit 0).
- `npm run audit:test-ci-coverage:write` — counts moved `2837/2672/2671/165` →
  `2838/2673/2672/165`. `uncoveredTestFiles` unchanged at `165`, and the base census
  matched its own tree before the change, so the whole `+1` is this change. The new suite
  lands in `coveredTestFiles` AND in `pullRequestCoveredTestFiles`, which is the proof it
  is CI-wired by a merge-blocking workflow rather than dark. (Grepping the census for the
  filename returns nothing and proves nothing — it records counts and directories.)
- `npm run audit:tenancy-fence-coverage:check` — **PASS** (exit 0), no drift.
- Mutation testing — **7 of 7 killed**, each applied with an asserted single-occurrence
  anchor and reverted to a byte-identical, re-verified green baseline:
  1. bare number always approves → 1 failed
  2. approval timestamp/actor fields ignored → 1 failed
  3. phase-match guard dropped → 3 failed
  4. status vocabulary ignored → 3 failed
  5. upper phase bound dropped → 1 failed
  6. approval never consulted (always pending) → 2 failed
  7. integer guard weakened → 1 failed
- Reachability measured before writing any code, on this base, and stated as counts
  rather than inferred: the complete-record gate writer has **zero** callers; the live
  gate-approval route writes the recorded-gates array at exactly **one** site, with a
  hardcoded terminal phase and a bare number; the phase-advance write adapter's SQL sets
  the current phase and does **not** include that array; and the fixture seed consulted
  writes records whose status is `approved`. Those four together are why the old row was
  unreachable rather than merely rare.
- One candidate fix was measured and **discarded**: repairing the four read surfaces that
  ask the recorded-gates array alone would have needed the union-of-two-records rule that
  an already-open sibling change introduces, so doing it here would have duplicated it.
  This change deliberately touches only the surface whose defect is independent of that
  rule.
- Live signed-in walk: **NOT RUN** — requires Anand. Not claimed as live-proven.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds and
deploys in the normal lane. No migration, no flag, no env change, no worker job change,
and no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. This branch runs no Azure command and mutates no shared
  traffic, revision weight, or Container App template.
- Approved image digest: not applicable to this record; the main deploy workflow sets it.
- ACA runtime invariant: to be proven by the main deploy workflow in its normal lane, not
  by this record.
- Worker image invariant: unchanged; no worker job contract changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes for the queue row as rendered, and **not yet
  performed**. This record claims `merged`-grade status only.

## Rollback Plan

Revert the squash commit. The change is a derivation on a read path with no stored state,
so reverting is immediate and needs no data repair:

- No migration to roll back.
- Nothing is written differently. This change persists no new field and rewrites none.
- Reverting restores the prior behaviour exactly, which is a queue that never carries this
  row.
- No generated artifact is affected or reprocessed.

## Audit Evidence

- PR URL: recorded on the pull request for this branch.
- CI: the required checks on that PR.
- Mutation log: the seven runs and their failure counts, transcribed under QA / Validation.
- Census delta: under QA / Validation.
- Pre-existing-failure attribution: the base-vs-branch suite counts under QA / Validation.
- Reachability counts (zero callers, one write site, the adapter SQL's column list): under
  QA / Validation.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed. The row's appearance on the
  rendered surface is argued from the code path, not observed.
- **The derivation reads the recorded-gates array only, not the canonical phase-snapshot
  record.** A product gate approval's canonical record lands in the phase-snapshot table,
  and this reading does not consult it. In the normal case that is harmless, because the
  same call that records the approval also advances the phase and the pending row moves
  forward with it. It is NOT harmless if an approval is recorded and the advance does not
  happen — a bypassed or partially-failed advance would leave the Move at a phase whose
  gate is approved, and this surface would keep naming that phase. Reading the union of
  both records is the correct end state and is the natural follow-up; it is left out here
  because an already-open sibling change introduces exactly that union rule and this
  change would otherwise duplicate it.
- **The queue's volume on this row changes from zero to one per eligible active Move.**
  Intended, but it is the first time this surface has carried these rows at all, so the
  rendered queue's length is worth looking at on the first signed-in walk.
- **The row is still keyed on one phase per Move.** A Move waiting on more than one gate
  cannot arise from the current phase model, so this is a property of the model rather
  than a limitation accepted here.
- **Three sibling read surfaces remain blind** to a product-approved gate because they
  read the recorded-gates array alone: the engagement detail page, the engagement meta
  strip, and the engagement list summary's baseline-locked and next-gate dates. The
  sharpest of those needs a phase-2 record carrying both an approving status and a signed
  timestamp, which nothing writes, so "baseline locked" reads empty however many gates
  were approved. Not changed here, for the duplication reason above.
- **The complete-record gate writer is still dead.** It has zero callers and clamps the
  phase it advances to in a way that could never reach the terminal phase. Retiring or
  repairing it is separate owed work and is not attempted here.
