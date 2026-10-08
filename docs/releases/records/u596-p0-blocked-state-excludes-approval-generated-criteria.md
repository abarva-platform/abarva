# U-596 — A ready P0 stops describing itself as blocked

## Release ID

`2026-10-08-p0-blocked-state-excludes-approval-generated-criteria`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

P0 Originate is the first step of a Move. Its gate rule carries three hard
checks. Two of them — `program_seed_recorded` and `value_hypothesis_seed` —
are evaluated from the signed origination brief, and the only thing in the
product that signs the origination brief is the P0 gate approval itself. So in
every pre-approval P0 state both read as open hard criteria, and there is no
control anywhere a reader could use to clear either one first.

The phase workspace counted them as blockers anyway. The result is that a P0
that was genuinely ready to approve told the reader, in seven places at once,
that it was not:

- The decision card titled itself **"P0 cannot advance yet"** and set its own
  state to `blocked`.
- Its explanation read **"Resolve 2 hard gate blockers before advancing."**
- The next action read **"Clear hard blockers."**
- The gate summary line read **"Blocked by: Origination brief signed off with
  archetype classification."** — naming, as the thing standing in the way, the
  record that approving would create.
- The "why" label read **"Why blocked"**.
- A note headed **"Why some checks are still open"** told the reader to upload
  a source file for this Move, review its extracted content, and come back —
  work they had already completed, since that note rendered precisely when the
  source evidence requirement was satisfied.
- And all of that rendered beside an enabled **"Approve gate →"** button that
  worked, directly above the same two criteria annotated **"Completed by
  approving this gate."**

So the screen contradicted itself twice over: it told the reader to go and do
something they had already done, and it called the gate blocked while offering
a working control that would close it.

The fix is to separate the two readings. A new module partitions a phase's open
hard criteria into the ones a reader can act on and the ones the gate approval
completes on its own, and the blocked-state reckoning uses only the first list.
The per-criterion "Completed by approving this gate" annotation keeps using the
same declaration, so the two now agree by construction instead of by
coincidence.

Three judgement calls worth stating.

`sponsor_assigned` is deliberately **not** in the set, even though at P0 it too
can pass off the signed brief. It also passes on a recorded sponsor alone, so
recording a sponsor is a real control a reader can use before approval, and it
stays a genuine blocker. Hiding it would be the same defect in the opposite
direction.

The carve-out is P0-only. Its entire basis is the brief that the P0 close
signs, so at P1 and later every open hard criterion stays actionable; the
partition is a no-op there.

The logic is a new module rather than an edit to the gate model, because the
workspace component is a heavily contended file and the declaration needed a
home where a suite could reach it and a guard could pin it against the gate
rule it describes.

## Layer Impact

Release lane: `global-control-lane` — shared gate-presentation behaviour,
identical for every client and not feature-gated.

- **Layer 4 (Products)** — presentation only. The change alters which open
  criteria drive a blocked label; it does not alter what the gate evaluates,
  what the approval writes, or whether an approval succeeds.
- **Layer 3 (Canonical model)** — unchanged. No schema change, no migration,
  no write path touched. `evaluateGate` and the P0 close helper are untouched,
  and the server remains the sole authority on whether an approval passes.

## Client Applicability

- All clients: yes — the P0 gate rule is tenant-independent.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gating a corrected label would preserve the wrong label
  behind the flag.

## Changes Included

- `src/lib/programs/p0-approval-generated-gate-criteria.ts` — new. Declares
  the two P0 hard criteria that the gate approval completes, a predicate over
  them, and `partitionOpenHardGateCriteria`, which splits a phase's open hard
  criteria into actionable and approval-generated and is a no-op outside P0.
  The module note records why each key is in the set and why
  `sponsor_assigned` is not.
- `src/lib/programs/__tests__/p0-approval-generated-gate-criteria.test.ts` —
  new, 15 cases.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the
  blocked reckoning (`isGateBlocked`, the hard-blocker count in the decision
  text, the primary-blocker name, and the P0 "why some checks are still open"
  note) reads the actionable list. The locally declared set of
  approval-generated keys is gone; the two annotation sites now call the
  shared predicate.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 7 new cases that render the P0 host.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new runtime dependency, no change to any write path, no new flag.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/p0-approval-generated-gate-criteria.test.ts`
  — 15/15. `src/lib/programs/__tests__` is the directory-wired invocation of
  the required **AI surface control catalog** check, so the file is
  merge-blocking without a workflow edit.
- **PASS** — `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 254/254, including the 7 new cases and no regression in the 247 that were
  already there. This suite is named by exact path in that same required
  check, so the added cases are merge-blocking; a *new* file in that directory
  would not have been, which is why the render cases were appended to the
  listed suite rather than given a file of their own.
- **PASS** — the new cases render the workspace host rather than asserting on
  a helper's return. The defect's visible half is JSX, so each case mounts the
  component at P0 and reads the decision surface, the note, the approval
  control and the gate list.
- **PASS** — mutation sweep, **7 mutations, 7 killed**. On the call sites:
  reverting `isGateBlocked` to count every open hard criterion (2 cases fail);
  reverting the note's condition (1); reverting the primary-blocker name (1).
  On the module: disabling the carve-out so nothing is ever approval-generated
  (7); inverting it so every P0 criterion is swallowed (4); pointing the phase
  guard at P1 instead of P0 (8); and adding `sponsor_assigned` to the declared
  set (4). The last two are the ones that matter most — the over-suppression
  mutations are caught by the complement cases, which assert that an uncovered
  source file and a genuine non-approval-generated criterion *both still
  block*, so the fix cannot degrade into a blanket suppression.
  Baseline restored after every mutation and re-verified byte-identical to the
  pre-mutation files; the restored baseline re-runs green at 269/269.
- **PASS** — `npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the four changed source files, exit 0. Two
  pre-existing unused-import warnings in the workspace component are
  unchanged and untouched by this PR.
- **PASS** — census regenerated honestly: `testFiles 2847 → 2848 (+1)`,
  `coveredTestFiles 2682 → 2683 (+1)`, `uncoveredTestFiles` unchanged at
  `165`, and the check reports "coverage shape matches the committed census".
  Covered rising with uncovered flat is what proves the new suite is
  merge-blocking rather than merely present.
- **NOT RUN** — live signed-in walk. This record does not claim `live-proven`.

## Rollout Plan

Merge to main. The change is read-side and becomes active with the next
repo-owned ACA main deploy. No migration, no flag, no env var, no worker job,
no traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: not applicable at merge; the main deploy workflow
  pins the digest it builds.
- ACA runtime invariant: unchanged by this PR.
- Worker image invariant: unchanged — no worker job touched.
- Feature/env flag update path: none required.
- Live signed-in proof required: **yes**, before this is called `live-proven`.
  It is observable on the P0 phase workspace of a Move whose source evidence
  has been uploaded and human-approved: the decision card should read ready,
  the "why some checks are still open" note should be absent, and the two
  brief-dependent criteria should still carry their "Completed by approving
  this gate" annotation. The render half is pinned in CI, so the live walk
  confirms it rather than being the only proof of it.

## Rollback Plan

Revert the PR. The change is additive and presentational: the new module's only
caller is the workspace component changed here, and reverting restores the
previous reckoning and the local key set. No migration to unwind, no written
data to reconcile, no flag to flip. Reverting cannot strand an approval,
because the server-side gate evaluation and the P0 close helper are unchanged.

## Audit Evidence

- PR URL and its CI run, including the required **AI surface control catalog**
  check, which runs the new module suite through its directory-wired step and
  the amended workspace suite through its exact-path step.
- The mutation sweep summary in this record's QA section.
- The census readings above, reproducible by regenerating on the same base.
- The declarations this change defers to: the P0 → P1 gate rule's hard checks
  and the evaluators that read the signed origination brief. The module's own
  suite asserts every key in the set is a hard check that rule really
  declares, and that at least one hard check stays outside the set — so the
  carve-out cannot silently grow to cover a real blocker, and cannot become
  vacuous.

## Known Gaps

- **The note's wording stays evidence-specific.** The "why some checks are
  still open" note now renders only when something actionable is open, but its
  text still names the source-file upload as the remedy. At P0 the actionable
  set is dominated by that very requirement, so the text is right in the case
  that remains; it would read oddly if a future P0 hard check were added that
  is actionable for some other reason. Narrowing the condition was in scope
  here; rewriting the copy to branch per cause was not.
- **`sponsor_assigned` at P0 can still be refused after an approval attempt.**
  It is treated as actionable, which is correct, but if no sponsor is recorded
  it may also fail the server's check. The refusal now names its own cause, so
  this is a worse-message case rather than a dead end, and it is not changed
  here.
- **`src/components/strategic-moves/__tests__` is wired by exact path, not by
  directory**, and the coverage census currently ranks it first in "next to
  wire" at critical risk with one unrun file of 47. That wiring shape is the
  blind spot the catalog's own comment warns about, and it is why this change
  appended to a listed suite. Measured and reported, not fixed here.
- The workspace component remains a very large client component with no test
  host for its server-side page. Unchanged by this PR.
- Not `live-proven`. See QA and Deployment Authority.
