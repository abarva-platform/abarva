# u647 — The gate panel names one blocked cause

## Release ID

`2026-10-09-u647-gate-blocked-cause`

## Status

`candidate`

## Plain-English Summary

The phase approval screen tells a reviewer why the gate will not let the Move
advance. It says it in three places at once: a decision sentence, a "Why
blocked" primary line, and the label on the next-action control.

Four things can block the gate: the evidence readiness check could not run,
required evidence is still awaiting upload and human review, the phase's own
input questions are not complete, or a hard gate criterion is open. All four
were written out by hand, separately, in each of those three slots — and the
copies did not agree.

- The decision sentence resolved all four, in order.
- The next-action label resolved only three of them, in a **different** order,
  with **no arm for incomplete phase inputs at all** — so it fell through to
  "Clear hard blockers".
- The primary line looked at nothing but the hard criteria, and collapsed every
  cause onto "Blocked by an open hard gate." whenever it had no criterion name
  to print.

So one panel described one state three different ways. Rendered at a phase
whose only open item was its capture, with its single hard criterion met, the
screen read:

> Complete 7 phase inputs before Approve & Build. · **1/1 hard gates met** ·
> **Clear hard blockers** · Why blocked · **Blocked by an open hard gate.** ·
> **Clear hard blockers**

A reviewer who trusts the headline goes looking for a hard gate that the same
panel reports as met, and the one sentence that names the real remedy is the
one surrounded by three that contradict it. In a second reachable state — the
readiness check unable to run while two hard criteria were open and evaluated —
the three slots named three different causes simultaneously: the decision
sentence said readiness could not be verified, the primary line named a
criterion, and the action said to refresh evidence status.

The cause is now a value, resolved once. `resolveGateBlockedCause` returns
`null` when nothing blocks the gate — which is what "is this gate blocked"
means on this surface — and otherwise returns the cause together with every
sentence the panel renders for it. The three slots read that one answer, so
they cannot name different causes, and a new cause does not compile until a
sentence is written for each slot.

The resolved order is the one the decision sentence already used, and it is
deliberate: an unverifiable readiness read makes every count below it
untrustworthy, so it is reported rather than shown as a count of zero; and
incomplete phase inputs rank above hard criteria because the hard criteria are
downstream of the answers, so prescribing a sign-off before the questions are
answered prescribes an action the reviewer cannot take.

Behaviour that is deliberately unchanged: when the criteria were never
evaluated, the primary line still says the gate state could not be read rather
than naming a cause, and a genuinely open hard criterion is still named.

## Layer Impact

`global-control-lane` — shared product-surface copy and the reckoning behind
it, on the phase approval surface. No schema, no data-plane, no migration, no
route, no write path. Layer 4 (Products) only: a projection states what the
state it already read actually says. Layer 3 is untouched — no figure, count,
or canonical value changes, and no new read is introduced.

## Client Applicability

- All clients: yes — the phase approval surface is shared product behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The surface renders on both the capture-v2 and the legacy
  phase hosts, so the change is not flag-gated and is not dark for either.

## Changes Included

- `src/lib/programs/gate-blocked-cause.ts` — new. The ordered cause roster
  (`GATE_BLOCKED_CAUSE_ORDER`), the resolver, and the three sentences per cause.
  Not `server-only`, so a suite can import it directly.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the blocked
  reckoning, the decision sentence, the primary line, and the next-action label
  all read the resolver. `isGateBlocked` is now "a cause was found".
- `src/lib/programs/__tests__/gate-blocked-cause.test.ts` — new, 12 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 7 new render cases on the live host; one pre-existing assertion retargeted
  (see Known Gaps).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__` — 203 suites, 2879 tests.
- **PASS** `npx jest src/components/strategic-moves` — 58 suites, 927 tests.
- **PASS** `npx jest --runTestsByPath` on the two suites this change owns — 293
  tests, including the 7 new render cases and the 12 new module cases.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
--noEmit` — exit 0.
- **PASS** `npx eslint` on the four touched files — 0 errors (2 pre-existing
  unused-import warnings in the host component, untouched by this change).
- **PASS** prettier. The host component and its test file were checked in place
  against the base commit: the test file is clean at base and stays clean; the
  host component already warned at base, so only the lines this change adds
  were brought to prettier's form, and the two pre-existing warning hunks were
  left alone rather than swept into this diff.
- **PASS** mutation testing — 11 designed mutants, **10 of 10 behavioural
  mutants killed**, 1 behaviour-neutral mutant surviving by construction:
  - the defect itself (drop the phase-inputs arm) — killed by 7 cases;
  - readiness ranked after required evidence (the old label order) — killed;
  - hard criteria ranked above phase inputs — killed by 2;
  - the phase-inputs action label colliding with the hard one — killed by 5;
  - the gate-closed guard dropped — killed;
  - the required-evidence verb inverted — killed;
  - the hard primary line ignoring the criterion name — killed by 3;
  - the next-action label reverted to its old three-arm ladder — killed by 3;
  - the primary line reverted to its old collapse — killed by 3;
  - the decision sentence losing its capture arm — killed by 3.
  - **Surviving, and correctly so:** reverting the decision sentence to its own
    hand-written ladder changes no output, because that ladder's order and
    prose are what the resolver was built from. It is a refactor with no
    behaviour delta, and no behavioural test can kill it. What holds it instead
    is the pair of order mutants above and the capture-arm mutant.
  - One mutant was first reported SURVIVED and was a **false survival**: the
    replacement left unbalanced parentheses, so the host suite failed to parse
    and only the module's 11 cases ran. Re-run with a valid revert, it was the
    behaviour-neutral case above — and the same re-run exposed a real coverage
    hole, below.
- **Coverage hole found and closed during mutation.** The decision sentence was
  asserted on `mxw-decision-surface`, which **encloses the gate-why block as
  well** — so a decision sentence that had lost its cause passed on the why
  copy's wording. The assertion now reads the sentence's own element
  (`.mxw-decision-primary p`), which is what turned that mutant from surviving
  to killed by 3 cases.
- **PASS** census. Measured in a clean detached worktree of the base commit
  first: the committed census reads `2904/2740/2740` while a clean base regen
  reads `2905/2741/2741`, so **main carries +1 inherited drift** and this
  change's honest one-new-test-file regen reads `2906/2742/2742` (+2 against
  the committed file). The generator's own "committed census matches this run"
  line prints after it writes, so it is circular; the `git diff` is the
  measurement. The tenancy-fence census needed no change.
- **PASS** test-home wiring, checked before writing: `src/lib/programs/__tests__`
  is swept as a **directory** by the required AI surface control catalog
  (`npx jest src/lib/programs/__tests__`), and
  `MovesPhaseStandaloneClient.test.tsx` is named there by exact path. Neither
  new case is orphaned and **no workflow edit was needed**. The regen confirms
  it: covered rose by exactly the one file added.
- **NOT RUN** live signed-in walk. See Deployment Authority.

## Rollout Plan

Merge to `main` via squash. No migration, no flag, no env var, no worker job.
It reaches the shared Product/Lab runtime through the repo-owned ACA main
deploy workflow on the next deploy, like any other shared product change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. No other
  path is used or required.
- Shared runtime mutators: none. This change runs no Azure command, mutates no
  revision weight, and touches no Container App template.
- Approved image digest: not applicable at merge time; the main deploy workflow
  builds and pins the digest.
- ACA runtime invariant: unchanged by this release; it must be proven by
  whichever deploy carries this commit, not by this record.
- Worker image invariant: unchanged — no worker job code is touched.
- Feature/env flag update path: not applicable; no flag is added or changed.
- Live signed-in proof required: **yes, and it is owed.** The change alters what
  three slots on the phase approval panel say. The regression direction is the
  one to walk first: a phase with a genuinely open hard criterion must still
  read "Blocked by: <criterion>." with "Clear hard blockers", and an unapproved
  phase with everything closed must still read ready and offer Approve & Build.
  This release may be recorded as `deployed`; it may **not** be recorded as
  `live-proven` until that walk is captured.

## Rollback Plan

Revert the squash commit. The change is additive at the module level and a
read-only substitution at the three call sites, so a revert restores the prior
copy exactly with no state to unwind: nothing is written, no record is created,
and no stored value's meaning changes. A reverted tree needs the census
regenerated once (`npm run audit:test-ci-coverage:write`) because one test file
goes away with it.

## Audit Evidence

- The PR for this branch, its squash commit, and its CI run.
- The two suites named in QA, and the mutation tally above.
- `docs/architecture/test-ci-coverage-census.json` at `2906/2742/2742`, with the
  inherited-drift measurement recorded in QA.

## Known Gaps

- **One pre-existing assertion was retargeted, deliberately.** The case
  "an evaluated ledger still names its blocker and counts them" asserted the
  criterion name on the **primary line**. In its own fixture the readiness check
  cannot run, and that cause is reported first — the same cause the decision
  sentence and the action label on that panel were already reporting. The old
  assertion therefore pinned a panel whose three slots named three causes at
  once. The case's stated intent is evaluated-versus-unevaluated, and that is
  preserved in full: both of its unevaluated-wording absence assertions are
  untouched, and the criterion name is still asserted present — in the ledger,
  where the ledger names it. A new case pins the cause ordering explicitly, so
  the ordering is now tested where it belongs rather than as a side effect.
- **Two more hand-written copies of the same ladder remain, on a different
  strip, and are NOT fixed here.** The phase story strip derives its own
  remaining-work sentence and its own next-action label
  (`MovesPhaseStandaloneClient.tsx`, the `phaseStoryRemaining` and
  `nextOpenAction` bindings). The sentence resolves all four causes in the same
  order as the resolver and is consistent today; the **action label resolves
  only two of them** — phase inputs and hard criteria — and names neither
  readiness nor required evidence, so it has the mirror image of the defect
  fixed here. It is left out because that strip carries its own prose and its
  own counts (it reads a different evidence-gap count), and folding it in would
  make this change a rewrite of two surfaces instead of a fix to one.
  `GATE_BLOCKED_CAUSE_ORDER` is exported for exactly that follow-up: a surface
  rendering its own prose can be cross-checked against the order instead of
  re-deriving it.
- **The soft caveat list under-reports, and is NOT fixed here.** In the same
  `<ul>` as the blocked criteria, the hard half shows three and then states
  "<N> more"; the soft half shows two and states nothing. Measured by
  evaluating the rule set rather than reading it: the soft criteria per
  transition are 3 / 1 / 0 / 2 / 6 / 1, so **four open caveats can be dropped
  silently** at the busiest transition, three lines below a half that states
  its remainder. The adjacent primary line reads "Ready with caveat: <label>."
  in the singular for up to six. Confirmed rendered, not inferred: a host
  render with six open soft criteria produces exactly two rows and no
  remainder. Left out to keep one mechanism per change.
- No part of this is `live-proven`. Nothing shipped by this workstream is.
