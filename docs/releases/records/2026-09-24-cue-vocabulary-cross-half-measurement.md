# 2026-09-24-cue-vocabulary-cross-half-measurement — measure the claim gate's two cue vocabularies before deciding whether to merge them

## Release ID

`2026-09-24-cue-vocabulary-cross-half-measurement`

## Status

`candidate`

## Plain-English Summary

The operator claim gate reads two kinds of subject out of an append-only register
line: item identifiers and repository paths. Each has grown its own set of
narrative cues that say "this line is talking ABOUT that subject rather than
claiming it" — a negation in front of it, an attribution behind it, and so on.
Those two sets were built separately, one filing at a time, and a previous change
published which cue *positions* each half covers. It did not publish which
*words* each half reads, and the two are not the same. The practical cost is a
correct claim being refused, and it has happened: one run lost its chosen item to
a refusal whose cause took four separate rules to work out.

This change measures the difference rather than guessing at it. It adds a table
of twenty-three narrative forms, each written twice — once about an item
identifier and once about a path, with the cue in the same position both times —
and re-derives, by running each sentence through the real parser, whether each
half actually reads it. It then counts what merging the two vocabularies would
cost: for every subject the gate holds today, whether the other half's cues would
hand it back. A new read-only command prints both, over any register or over
none.

**It changes no verdict.** No cue is widened, no word is added to either half,
and the gate answers every question today exactly as it did before. The output is
a measurement and the reasoning it supports.

**What the measurement found, and the recommendation it produces.** The two
vocabularies should NOT be merged into one shared table, and the reason is not a
preference. Twenty-one of the twenty-three forms are read by one half only. In
one direction the cost is severe and specific: the path half's negation list
contains `released`, which is correct for a path — a path named in a release is
being handed back — and destructive for an identifier, because an identifier
named in a release *is the release's subject*. Measured over the live register,
merging that direction would silence 142 held subjects across 103 distinct
identifiers, every one of them a release announcement, and the consequence is
proven by execution rather than argued: when a release line's subject is vetoed,
the release stops being findable, the older claim decides, and the item reads as
held by an owner who has already let it go. A wrong refusal on the act that frees
work is the worst available direction.

The other direction is small and benign — five held subjects on two register
lines, both of which are lines explaining that they are deliberately *not*
claiming what they name. Those are refusals that should not be happening. Acting
on them means widening a live veto, which moves real holds, so it is recorded as
follow-on work rather than folded into a measurement.

## Layer Impact

Release lane: `internal-admin`.

Operator tooling only. No layer of the data operating model is touched: no client
intake, no source adapter, no canonical model, no product surface. Nothing here
is imported by the application or reachable from any route.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — adds `CUE_FORMS`,
  `recomputeCueVocabulary`, `cueVocabularyDivergences` and
  `crossHalfCueMovement`, plus a read-only `--cross-cues` command. No existing
  veto, pattern, bound or verdict is modified.
- `scripts/exec/register-time-authority.test.mjs` — twenty-one new behavioural
  cases.
- This record.

## QA / Validation

Every number below is from this branch, same command and same scope on both
sides.

- **Baseline, read from the merge base rather than from the working tree**:
  `node scripts/exec/register-time-authority.test.mjs` at `ec06daeff` →
  **290 passed, 0 failed**.
- **Red first**: the new cases were written and run before the implementation
  existed → **290 passed, 13 failed**. Three of the thirteen initially passed
  vacuously over an empty list; each was given its own non-emptiness condition
  before any implementation was written, which is what took the red count from
  8 to 13.
- **Green after**: **311 passed, 0 failed**.
- **Mutation**: nine mutations applied to the implementation, nine caught, the
  suite restored and re-run green after each. Two details are worth recording
  because they are the method working rather than decoration. One mutation
  survived and was a genuine coverage gap — the measurement counted subjects
  that are already free, which cannot move — closed by two negative-control
  cases and confirmed caught on both the path and the item side. A second
  survivor was verified to be a **no-op** before it was believed: `true !== false
  && X` is `X`, so it read like a coverage gap and was not one. It was rewritten
  to remove the condition outright and then failed 37 cases.
- **Dependent suite**: `node scripts/exec/append-claim.test.mjs` → 61 passed,
  0 failed. The claim gate imports this module, so it is run too.
- `npx eslint` on both changed files → exit 0, no findings.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` →
  **exit 0**, zero diagnostics. Judged on the exit code, not on a grep: a bare
  invocation exits 134 on this machine and emits nothing.
- **The gate still answers**: `--preclaim` run read-only against the live
  register returns `already-yours` for this run's own claim, 1 file requested,
  0 contended.
- **Read-only proven, not asserted**: a suite case reads the fixture register's
  bytes back after the command runs and fails if they changed.

## Rollout Plan

Merge to `main` via squash. The repo-owned Azure Container Apps deploy workflow
runs on merge as it does for every change; nothing in this change is served by
the web runtime, so the deploy is a no-op for behaviour and is verified only for
the runtime invariant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: whatever the main deploy workflow builds for the squash
- ACA runtime invariant: to be proven from the deploy run's own
  `runtime-invariant-proof.json` after merge
- Worker image invariant: same source
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface renders anything
  from this change and no route imports it

## Rollback Plan

Revert the squash. There is no migration, no data write, no flag and no runtime
dependency, so a revert is complete on its own. The two new exports are additive;
nothing outside the module and its suite calls them.

## Known Gaps

- **The decision this measurement exists to inform is stated as a recommendation,
  not taken.** The measurement says the two vocabularies must not be merged into
  one shared table; nothing in this change enforces that, beyond one suite case
  that fails if the destructive lemma is ever added to the identifier half.
- **The five benign refusals are not repaired.** Two register lines are being
  read as claiming files they explicitly say they are not claiming. Repairing
  that means widening a live veto, which moves real holds and belongs in its own
  bounded change with its own before/after count. No identifier was minted for it:
  the band this lane files from is exhausted, which is itself an open decision.
- **Only the vocabulary crosses over in the measurement, not the reach.** The two
  halves also bound their front cues in different units — one in words, one in
  characters — and a character bound cannot cross the full stop inside a filename.
  That divergence is recorded by the existing cue surface and is not measured
  here; two of the borrowed patterns carry their own reach inside the pattern, so
  borrowing the cue necessarily borrows that much of its bound, and the code says
  so where it happens.
- **The live half of the measurement is an opportunistic replay.** It reads
  whatever register it is pointed at, so its numbers age. With no register it
  prints the form table and exits 0 rather than failing, deliberately: a control
  that inverts the moment its corpus is unavailable is worse than one that says
  what it did not measure.

## Audit Evidence

- The pull request and its CI run.
- `node scripts/exec/register-time-authority.mjs --cross-cues --file <register>`
  reproduces the measurement on any register; with no `--file` it prints the form
  table alone and exits 0.
- The suite output above, and the mutation log in the pull request body.
