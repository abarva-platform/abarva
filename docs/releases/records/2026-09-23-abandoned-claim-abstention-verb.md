# 2026-09-23-abandoned-claim-abstention-verb — A dead claim gets a move the work queue can read

## Release ID

`2026-09-23-abandoned-claim-abstention-verb`

## Status

`candidate`

## Plain-English Summary

The execution work queue hides an item when the newest claim for it names a
branch or a pull request, because that is evidence somebody is working on it
somewhere other than in the log. A separate operator tool checks those branches
against the repository and answers one of four verdicts. One of them is
*abandoned*: the branch is gone and no pull request was ever opened, so that
claim produced nothing at all.

That verdict was correct and had nowhere to go. The tool deliberately refuses to
write a release line for it, because a release says the work merged and closing
undone work silently is the failure this whole backlog exists against. What it
offered instead was a sentence — go and re-check the item. Re-checking changes
nothing in the register, and the register is the only thing the queue reads, so
the suppression could never expire. Measured on the live operator documents
before this change: the queue offered **zero** items to work on, and the entire
reason was eight claims from four days earlier that the checker had already
judged dead.

There was already a verb for "I am not taking this" — an abstention — and the
queue generator could not read it. It parsed the abstention as an ordinary fresh
claim, so the one line that could free an item **held that item for three hours
first**.

Two changes, and they meet in the middle. The checker now hands back the exact
abstention command for an abandoned claim, the same way it already hands back a
release command for a finished one. The queue generator now reads an abstention,
and reads it narrowly: an abstention *takes nothing*, so it never counts as a
claim, and the item still resolves from the newest line that actually asserts
ownership. What an abstention does is withdraw the work-in-flight suppression of
the expired claim it supersedes. So a dead claim clears the instant the line is
written, while a live holder is untouched by somebody else declining their work.

It does not say the work is finished. These items render under their own heading
that calls them **unverified**, and the next person to take one has to check the
item against `main` first. That separation is the point of the change.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operator tooling. No client-facing
surface ships in this release.

- **Layer 4 (Products):** none. No product surface, route, API, model prompt,
  schema or tenant read path is touched.
- **Operator tooling only:** two scripts under `scripts/exec/` and their
  behavioural suites. Neither is imported by anything under `src/`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — the execution queue and claim register are internal
  operator documents
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — reads `announcesAbstention` from
  `scripts/exec/register-time-authority.mjs`, the register's own reader, rather
  than spelling the grammar a second time. An abstention is transparent to the
  resolution of an item and vetoes the in-flight suppression of the expired
  claim it supersedes; a new `lapsed` bucket renders those ids under a heading
  that states the item is unverified.
- `scripts/exec/fossil-claims.mjs` — new `abstainCommandFor`, the executable
  move for the `abandoned` verdict, printed by the CLI beside the verdict.
- `scripts/exec/build-execution-queue.test.mjs` — nine behavioural cases plus a
  real-corpus replay.
- `scripts/exec/fossil-claims.test.mjs` — eighteen cases on the emitted command.

No migration, no schema, no workflow, no runtime image, no dependency change.

## QA / Validation

**Baseline over the same scope, both sides extracted the same way.** "Before" is
a clean `git archive origin/main scripts/exec` extraction, not the working tree.
Both sides run with `HOME` pointed at an empty directory so the real-corpus
cases skip on both, which is the shape a CI runner sees.

| | suite | passing | failing | skipped |
|---|---|---|---|---|
| before | `build-execution-queue.test.mjs` | 157 | 0 | 0 |
| after | `build-execution-queue.test.mjs` | 166 | 0 | 1 |
| before | `fossil-claims.test.mjs` | 50 | 0 | 3 |
| after | `fossil-claims.test.mjs` | 68 | 0 | 3 |

The deltas are exactly the cases added — nine and eighteen. No pre-existing case
changed verdict or count. With the operator documents present the queue suite is
169/0, the extra three being the real-corpus replay. The whole toolchain is
green on the branch: `append-claim` 50/0, `build-execution-queue` 166/0,
`build-source-board` 23/0, `cli-entry` 19/0, `fossil-claims` 68/0,
`id-collision` 60/0, `queue-provenance` 30/0, `register-time-authority` 255/0,
`toolchain-manifest` 17/0, `worktree-retention` 22/0.

**Red first, and separately for each side.** With all nine cases present and the
generator restored to its `origin/main` bytes, the queue suite ran **159 passed
/ 6 failed** — the six that describe the defect. The other three are negative
controls that pass on unchanged code, which is what makes the six mean
something. The resolver suite could not even collect against `origin/main`:
`SyntaxError: The requested module './fossil-claims.mjs' does not provide an
export named 'abstainCommandFor'`.

**Twenty-two mutations applied, twenty-two caught.** Every mutation was applied
to a copy of the original bytes, confirmed to have changed the file before the
suite ran — a no-op mutation reads exactly like a coverage gap — and the file
restored and `cmp`-verified afterwards.

| | mutation | cases failed |
|---|---|---|
| M1 | abstention branch never taken (the `main` behaviour) | 6 |
| M2 | the supersession test always true | 2 |
| M3 | abstention recorded but no longer transparent | 6 |
| M4 | the veto dropped; abstained claims stay in flight | 4 |
| M5 | the veto extended to expired claims that were never suppressed | 1 |
| M6 | the veto applied before the TTL guard, so it can free a live claim | 2 |
| M7 | supersession by stamp alone, no append-order tie-break | 1 |
| M8 | the `lapsed` heading never rendered | 4 |
| N1 | the abandoned-verdict guard dropped from the command | 6 |
| N2 | the command emits `--action release` | 3 |
| N3 | the command carries `--branch` | 1 |
| N4 | the command computed but never printed by the CLI | 1 |
| N5 | the missing-stamp fallback removed | 1 |
| N6 | the "unverified" wording dropped from the command | 1 |
| N7 | `releaseCommandFor` widened to answer for an abandoned claim | 4 |
| N8 | the command carries `--files` | 1 |

**Two escapes were found inside the work and are reported rather than tidied
away**, both the same shape this backlog exists against — an assertion that
could not fail:

- *The missing-stamp case.* It asserted only that a stampless entry still
  produces a string containing `--action abstain`. Removing the fallback leaves
  a command reading `the claim of null`, which contains that flag, so the
  mutation survived its first run. The case now asserts the command contains
  neither `null` nor `undefined`.
- *The real-corpus case.* It asserted that each replayed id leaves the in-flight
  bucket. Under M1 — the behaviour on `main` — every id still left that bucket,
  because the abstention was read as a fresh claim and they all moved to `held`
  instead. The assertion passed against the exact defect it exists to catch. It
  now asserts the destination too: not in flight, and not newly held.

**Proven on the real ids, not only on fixtures.** The eight suppressed claims are
on disk, four days old, and are the reason the live queue was empty, so the
replay runs against a copy of the operator documents rather than a synthetic
register. It is a case in the suite, skipped where those documents are absent —
which is every CI runner — so it is repeatable rather than a number typed into
this record. It asserts the mechanism only; whether a given claim is genuinely
abandoned is the resolver's answer and needs a network the suite does not use.

**The live bucket movement, measured rather than predicted.** Three renders, one
frozen snapshot of the register, one variable at a time.

| bucket | `origin/main` generator | this branch | this branch, after the eight abstentions |
|---|---|---|---|
| claimable | 0 | 1 | **9** |
| held by a live claim | 1 | 1 | 1 |
| expired, in flight | 128 | 127 | 119 |
| claim lapsed (new) | — | 0 | 8 |
| expired, idle | 89 | 89 | 89 |
| explicitly released | 161 | 162 | 162 |
| suppressed candidates | 9 | 8 | **0** |

**One item moves before any abstention is appended, and it is worth naming.**
The register already contains one real abstention line, written this morning
against an id whose newest owning line — from two days earlier — is an explicit
release. Read as a claim it expired into *do not take*; read as transparent, the
item resolves from that release, which is the register's last word that actually
asserts ownership. That same id was the one candidate the resolver could not
answer, so the candidate list is now entirely actionable: eight ids, eight
verdicts, eight commands.

**The eight abstentions in the third column were written by the real writer**,
from the command the resolver printed, into a copy of the register. Every one of
the eight then appears as a claimable row carrying its own acceptance text.

`node scripts/release-check.mjs --base origin/main --head HEAD` passes.
`npx eslint scripts/exec/` exits 0 with no errors and no warnings.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exits 0
with zero diagnostics, judged by exit code rather than by grep.

Not run, because nothing in this change can reach them: the Jest suites under
`src/`, and any signed-in acceptance.

## Rollout Plan

Merge to `main`. There is no runtime rollout: both files are operator scripts and
no product image or route depends on either. Each run regenerates the board and
the queue from its own checkout, so the first regeneration after merge carries
the change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for every commit; this change alters nothing it deploys.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release.
- ACA runtime invariant: unaffected — no file under `src/`, no Dockerfile, no
  workflow and no dependency changes.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no, and this is a property of the change rather
  than an omission. No product surface changes, so a signed-in session on this
  SHA would see an identical one and there would be nothing for an acceptance to
  look at.

**Queue-provenance note.** The stamp printed in `EXECUTION_QUEUE.md` is the
sha256 of the generator's own bytes, so editing it moves the stamp and the append
helper refuses a claim whose stamp does not match the generator beside it. That
is the documented fail-closed behaviour: a concurrent agent holding the previous
copy is refused rather than allowed to append against a queue it did not
generate, and regenerating from its own checkout clears it. The queue in the
operator root is regenerated as part of this run.

## Rollback Plan

Revert the single commit. No migration, no data change, no deployed artifact, so
the revert is complete on merge, and a regenerated queue immediately returns to
the previous bucket assignment.

Abstention lines already appended to the register are **not** rolled back, and do
not need to be: the register is append-only audit history, and with the old
generator each such line simply reads as an ordinary claim again — which is where
this started.

## Audit Evidence

- The pull request and its CI run, in particular the `execution-queue-toolchain`
  workflow step that runs both suites on a Linux runner.
- The three-column bucket table is reproducible: copy the four operator
  documents into a scratch directory beside the toolchain, render the queue with
  each generator, then append the abstentions the resolver prints and render
  again.

## Known Gaps

- **A deliberate deviation from the filed shape, recorded rather than left to be
  discovered.** The item recommended reading an abstention as "neither held nor
  in flight". Taken literally, the newest line wins, and one run declining work
  would evict another run's live claim — the collision the register exists to
  prevent, reached through the repair for the opposite defect. The rule shipped
  is narrower: transparent always, vetoing the suppression only where the
  superseded claim has already expired. The looser reading is pinned as a
  failing case, so it cannot be reintroduced quietly.
- The abstention verb is not keyed to the identity that wrote the dead claim, so
  any run may clear an expired claim it did not write. That is intended — the
  abandoned claims are four days old and their authors are long gone — but it
  means the register carries no assertion that the abstaining run had standing.
  The pre-claim gate keys releases per identity and this does not.
- The measurement above is one register at one time. Bucket counts on a later
  register will differ, and that is expected.
- This says nothing about whether an item's work was ever done. Every lapsed id
  is explicitly unverified, and the next taker re-verifies it against `main`.
