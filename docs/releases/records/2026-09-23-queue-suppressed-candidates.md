# 2026-09-23-queue-suppressed-candidates — The work queue says why it is empty

## Release ID

`2026-09-23-queue-suppressed-candidates`

## Status

`candidate`

## Plain-English Summary

The internal queue that tells agents which piece of work to take next was reporting
"0 items are claimable" and nothing else. It was not wrong — but it was unusable,
because an exhausted backlog and a single over-eager filter produce the identical
sentence and imply opposite next moves: stop, or go and check some branches.

Measured on the live operator documents, the filter chain runs 424 items → 83 → 62 →
15 → 14 → 14 → **0**. Every one of the fourteen survivors is removed by the last rule
alone: an expired claim whose line names a branch or a pull request is treated as work
still in flight and withheld. That rule is correct and is not changed here. Its own
original filing declared the gap it leaves — evidence that a branch *exists* is not
evidence that it is *alive* — and deliberately ruled out the live GitHub read that
would close it, because this generator does not reach the network.

What was broken is the report, in two ways:

1. **Zero was unexplained.** The file stated the number and not the arithmetic behind
   it. It now renders the funnel on every run: how many items each rule removed and
   how many were left, and, when the result is zero, which single rule emptied it.
2. **The list that mattered was diluted about nine to one.** The file already named
   every suppressed id and told the reader to check each branch and pull request
   before taking one — 132 ids, of which only 14 would become claimable if freed. An
   instruction costing 132 lookups to recover 14 rows does not get carried out. Those
   14 are now named separately, as the only ids standing between the queue and a
   claimable row.

The dilution was not theoretical. The four suppressed candidates in the reporting
agent's own lane were checked against the live repository while preparing this change:
all four had merged roughly 37 hours earlier and all four branches were already
deleted. The queue was still describing them as work someone was on.

Nothing a client sees changes. No product route, no data plane and no runtime code is
touched.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only operator tooling. It is not
`global-control-lane`: nothing under `src/` imports this script, so no shared app or
control-plane behaviour changes.

- **Control / tooling only.** `scripts/exec/` produces the internal execution board and
  queue and is not imported by the application.
- Layers 1–4 of the enterprise information architecture are untouched. No tenant data,
  no schema, no adapter, no migration, no product surface, no auth or RLS change.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — the execution-queue toolchain used by agents and operators.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs`
  - The claimable filter was a `.filter().filter()` chain; it is now a declared list of
    stages, each with a label and a predicate, folded once. **The filter and the report
    read the same list.** A report that re-derived the rules a second time could
    disagree with the filter it claims to describe, which is the failure mode this
    directory exists against.
  - `renderClaimableFunnel()` renders the stage table on **every** run, not only when
    the count is zero. A block that appears only in the failing case is exercised only
    in the failing case.
  - A new line under *Already claimed or in flight* names the suppressed candidates —
    the ids the in-flight rule alone removes — with their count against the full
    in-flight total, and says what check settles each one. It states plainly that the
    generator does not read the network, so it can say which ids are worth a lookup and
    not whether any of them is alive.
- `scripts/exec/build-execution-queue.test.mjs` — five cases (27a–27e).
- `docs/releases/records/2026-09-23-queue-suppressed-candidates.md` — this record.

**Explicitly not changed**, so that any movement is attributable to the report alone:
`readClaims()`, the in-flight predicate, the claim TTL, the bucket assignment, and
every individual claimable filter. No network call is added to the generator.

## QA / Validation

**Proven unchanged rather than asserted.** The queue was generated twice over
byte-identical copies of the operator documents — once with the generator extracted
from `origin/main`, once from this branch — and diffed. The only differences are the
two new sections and the queue-provenance stamp, which is the sha256 of the
generator's own bytes and necessarily moves when the generator changes. Every
claimable row, lane section, bucket list and count is byte-identical. That is the
evidence that turning the chain into a fold changed no behaviour.

**Red before green, same suite, same scope.** The five cases were written and run
against the unmodified generator first: **140 passed / 0 failed → 142 passed / 3
failed** with the cases and no fix → **145 passed / 0 failed** after. Two of the five
pass in both states by design and are named below.

**Whole toolchain over the same eight commands:** 559 passed / 0 failed before, 564
passed / 0 failed after. Only the queue suite moved. No suite changed verdict.

**Nine mutations, nine caught — and each was first confirmed to change the rendered
output**, because a mutation that changes nothing reads exactly like a coverage gap:

| # | mutation | caught by |
|---|---|---|
| 1 | the suppressed-candidate line is deleted | 27a |
| 2 | the line names the full in-flight list instead of the subset | 27a |
| 3 | the funnel block is dropped from the output | 27d, 27e |
| 4 | candidates are read from the first stage, not the last | 27a |
| 5 | the section renders unconditionally, so it can be empty | 27c |
| 6 | the zero-claimable verdict sentence is removed | 27e |
| 7 | the funnel reports a count it did not measure (off by one) | 27a, 27d |
| 8 | the full in-flight line is replaced by the subset | 27b |
| 9 | the in-flight stage is removed from the filter entirely | 27a, 27d, 27e |

Mutations 2, 7 and 8 are the ones worth naming. Each leaves a plausible-looking file
in place: a list is still rendered, a table is still rendered, a count is still
printed. Only an assertion on *which* ids and *which* counts can tell them from the
correct output, which is why 27a asserts the exclusions (`T-902` and `T-903` must not
appear) and not merely the inclusion.

**Two of the five cases are guardrails and pass before and after.** 27b holds the full
in-flight list open — narrowing the report to candidates must not stop the other
suppressed ids being named, because a live claim on an unclaimable item is still a
collision warning. 27c is a negative control: with nothing suppressed the section must
be **absent**, not present and empty. `Array.every` is true of no elements and `0 of 0`
compares two empty lists, so a section rendered unconditionally would satisfy a header
check while asserting nothing — the vacuity shape this backlog opened on. Mutation 5
is the mutation that proves 27c can fail.

**One fixture defect found and fixed while measuring, recorded rather than smoothed
over.** The case aimed at the "states no acceptance" rule originally wrote an em dash
in the acceptance cell, matching how the rendered board displays an empty one. The
filter tests the trimmed string and `—` is a character like any other, so the item
passed the rule the case existed to exercise and the funnel row read zero. The fixture
now writes a genuinely empty cell. A fixture that cannot reach the branch it names
proves nothing about it.

File restored byte-for-byte after each mutation and confirmed with `cmp`.

`npx eslint` exit 0. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit **0** with zero diagnostics, judged by exit code — a bare run
exits 134 on this machine with no output, which piped into `grep` reports a false
clean. `node scripts/release-check.mjs --base origin/main --head HEAD` exit 0.

## Rollout Plan

Merges to `main` through the normal squash path. The generator is run on demand by
operators and agents; the next run renders the new sections. There is no migration, no
flag and no sequencing requirement.

## Deployment Authority

The repo-owned ACA main deploy workflow ships every merge to `main`. This change alters
no runtime image behaviour: nothing under `src/` imports this script, so no product
surface can observe it. No ad-hoc Azure command is used, no shared traffic is shifted
by hand, and no data-build job is run.

## Rollback Plan

Revert the commit. The generated `EXECUTION_QUEUE.md` is not version-controlled and is
rewritten on the next run, so a revert restores the previous rendering immediately with
no cleanup. No state is migrated and nothing persists.

## Audit Evidence

- `scripts/exec/build-execution-queue.test.mjs`, cases 27a–27e, run in CI by the
  execution-queue toolchain workflow.
- The before/after generation diff described under QA.
- The funnel itself is audit evidence of a kind that did not exist before: every
  generated queue now carries the arithmetic that produced its claimable count.

## Known Gaps

- **The in-flight rule still reads existence, not life, and this change does not fix
  that.** It makes the gap legible and bounded — fourteen ids instead of a hundred and
  thirty-two — rather than closing it. Closing it needs a live repository read, which
  this generator deliberately does not perform. Whether that boundary should move is a
  decision, not an implementation detail, and it is not taken here.
- **A suppressed claim is never retired by anything.** An expired in-flight claim whose
  work merged stays suppressed indefinitely, because nothing appends the release line
  that would free it. Today that costs nothing, since all fourteen are finished or
  belong to another lane; the mechanism, however, guarantees that a future
  claimed-and-abandoned item is never offered again. Filed separately rather than
  guessed at here, because every available fix is a threshold or a network call and
  both are choices.
- The funnel's stage labels are prose and are rendered, so they are part of the
  artifact's contract with its readers; the suite pins the counts and the decisive
  label, not the exact wording of every row.
