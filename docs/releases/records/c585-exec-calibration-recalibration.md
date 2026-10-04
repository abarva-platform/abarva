# 2026-10-04-c585-exec-calibration-recalibration — Re-read two corpus-reading calibration cases and settle both as drifted

## Release ID

`2026-10-04-c585-exec-calibration-recalibration`

## Status

`candidate`

## Plain-English Summary

Two cases in the `scripts/exec/` toolchain suites read the live operator corpus rather than a
fixture, and both were failing. Each one's own failure message says the calibration may have moved
and the case should be re-read. This change does that re-reading and settles both as **drifted** —
the corpus moved, the readers did not — then restates each calibration in terms of a property that
is actually invariant instead of one that was only ever a proxy.

**No reader changed.** Both `scripts/exec/id-collision.mjs` and
`scripts/exec/register-merge-coverage.mjs` are byte-for-byte identical to `origin/main`. They were
edited only to mutation-check the restated assertions, and every edit was reverted. No threshold was
widened, and no case was deleted or loosened to reach green.

### Case 1 — the filing/update balance

`id-collision.test.mjs` asserted that the reader classifies more of the backlog as progress notes
(`update`) than as new findings (`filing`), for a stated reason: "a log this size is mostly progress
notes; a reader that thought otherwise would be counting them as findings." It was true when written
on 2026-09-23. Today the live backlog reads filings=835, updates=653.

Two controls establish that the corpus moved rather than the reader, and they vary one thing each:

- **Corpus fixed, reader varied.** The 2026-09-23 reader (`abdc6e43a7`) — the exact revision that was
  green when this case was written — scores *today's* backlog at filings=835, updates=653. Identical
  to today's reader, to the occurrence. The classifier has not changed its answer about this corpus
  at all, so the "reader regressed" branch is excluded by execution rather than by argument.
- **Reader fixed, corpus varied.** On prefixes of the live backlog, today's reader gives 437/497 at
  40%, 604/618 at 70%, 673/624 at 80%, 835/653 at 100% — a single monotone crossover inside the
  newest third. A regressed classifier would have moved the early prefixes too; they still satisfy
  the old assertion.

Later sections of the backlog file many new ids per section and narrate comparatively little, so the
aggregate tipped. What did **not** tip, at any prefix from 20% to 100%, is *where* each kind lives:
narration is written as headings, new items arrive as rows of a filing table. Per channel, with no
flip anywhere in the corpus's history:

| prefix | heading: updates / filings | table: filings / updates |
|---|---|---|
| 20% | 131 / 15 | 229 / 99 |
| 40% | 254 / 48 | 389 / 243 |
| 60% | 301 / 88 | 444 / 261 |
| 70% | 322 / 100 | 504 / 296 |
| 80% | 324 / 105 | 568 / 300 |
| 100% | 325 / 109 | 726 / 328 |

The restated case asserts both channel directions. That is the structural fact the original sentence
was reaching for; the aggregate ratio was a proxy for it that the corpus outgrew.

### Case 2 — the fixed-width SHA probe

`register-merge-coverage.test.mjs` asserted that a fixed ten-character probe finds **no** handle on
one named merge while the reader's grammar still resolves it to `NAMED` — `!raw.includes(sha.slice(0,
10)) && verdict === NAMED`. It recorded why the item had originally listed that merge as unnamed: the
first investigation grepped a short prefix and found nothing.

Which half broke was measured, not assumed. The grammar half still holds exactly — the verdict is
`NAMED`. The substring half does not: `7f0056d1e8` is now present in the register, and **every
occurrence is prose about this calibration** rather than anyone naming the merge. When C-585 was
taken the register held it once, inside a line reading "`7f0056d1e8` IS named -- the register says
RELEASED item C-605 ... PR #8520 merged". Appending the claim line that recorded this very verdict
took it to three. At twelve characters the register still holds none, so no line has ever quoted that
SHA as a handle.

That makes the old assertion **self-falsifying**: its corpus is the register, agents narrate findings
into the register, and narrating this case writes its own needle into its own haystack. No threshold
repairs that, and choosing a longer prefix because today it happens to be absent is exactly the
rubber stamp this directory exists against.

So the restatement asserts the mechanism the absence was a proxy for. Commentary lines now match as
naming roles for that merge — the claim line for this item does, with `reportsMerged: false` — and the
reader is nonetheless right because `nameMerge` *prefers* a naming line that announces the merge. That
preference was unexercised on this merge before; the decoys the old case guaranteed could not exist
are what now exercise it.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only execution tooling and its tests. No client-facing
surface, no data-plane object, no product behaviour, so neither `global-control-lane` nor
`client-data-lane` applies; the change is on by default, so it is not `experimental`.

- **Two test files only.** No product module, route, schema, adapter, prompt, migration, or workflow
  is modified.
- No layer of the data operating model is touched.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — execution-toolchain test calibration.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/id-collision.test.mjs` — the aggregate filing/update assertion replaced by two
  per-channel assertions, with the measured history and the reason the original was right when
  written recorded in place.
- `scripts/exec/register-merge-coverage.test.mjs` — the fixed-width substring conjunct replaced by
  three assertions on the naming mechanism: that commentary decoys now exist, that the reader still
  settles the merge on the line announcing it, and that no line quotes the SHA as a full
  forty-character handle. Provenance is derived through `provenanceOf` rather than named by a
  literal, so the case does not assert its own premise.

## QA / Validation

Baseline measured by execution on a clean worktree at `origin/main` `aa23d2c31f` before any edit,
same scope after.

| suite | before | after |
|---|---|---|
| `id-collision.test.mjs` | 69 passed / **1 failed** | 71 passed / 0 failed |
| `register-merge-coverage.test.mjs` | 49 passed / **1 failed** | 52 passed / 0 failed |

**2 failing before, 0 after**, over the same scope. The pass counts rise because one case became two
and one became three; no case was removed.

All fifteen `scripts/exec/*.test.mjs` suites — the set the `Execution queue behavioral contract` job
runs — **exit 0**, judged by exit code rather than by a summary line.

**Mutation checks — 4 mutations, 4 caught**, each breaking the *reader* and confirming the restated
assertion still fails:

| mutation | result |
|---|---|
| A — filing-table rows classified as progress notes | table-channel case **fails**; heading case unaffected |
| B — narrative headings classified as findings | heading-channel case **fails**; table case unaffected |
| C — `nameMerge` prefers the last naming line (a decoy) | decoy-preference case **fails** |
| D — `nameMerge` drops the `reportsMerged` preference | caught by the pre-existing fixture case |

Mutations A and B are deliberately separated so each channel assertion is pinned with the other
satisfied; a single both-channel mutation would have left either one able to carry the case alone.

**The restatement is strictly stronger than what it replaces, and this is the measured reason to
prefer it.** Under mutation A — a classifier regression that reads every filing-table row as a
progress note — the live backlog scores filings=109, updates=1379. The **old** aggregate assertion
(`updates > filings`) *passes* under that regression and reports green. The restated table-channel
assertion fails. So the case being replaced was blind to the precise failure its own comment said it
existed to catch.

For case 2 the same holds by construction: `verdict` is `NAMED` whenever any naming line exists,
regardless of which one is selected, so the old conjunction could not see which line the reader
settled on. Mutation C changes exactly that and nothing else.

Other gates:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostic lines (not a 134 out-of-memory crash, which emits none either; the exit code is the
  judgement).
- `npx eslint` over both changed files — exit 0.
- `git diff` confirms `id-collision.mjs` and `register-merge-coverage.mjs` are unmodified.

Both suites read `~/Downloads`, so these numbers are corpus-state-dependent and are recorded against
`origin/main` `aa23d2c31f` with the operator corpus as it stood at 2026-10-04T01:2xZ. On a runner
with no operator corpus present the cases skip, which is why neither failure was ever visible in CI —
see **Known Gaps**.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` that ships to a runtime image changed, and
no flag, environment variable, workflow, or worker job is touched.

## Deployment Authority

Not applicable to shared runtime. This change cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic, or DNS.

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface changes. Stated as a conclusion, not as a
  proof that was skipped.

## Rollback Plan

Revert the squash commit. No migration, no data change, no runtime state, so revert is complete and
immediate. Reverting restores two failing corpus-reading calibration cases.

## Audit Evidence

- The pull request for this record, and its CI run.
- Per-suite before/after numbers and the four mutation results in the QA section above.
- The two-control argument for "drifted" — old reader on today's corpus, today's reader on corpus
  prefixes — both reproducible from the repo plus the operator corpus.

## Known Gaps

- **Neither case can be proven by CI, and that is unchanged by this release.** Both read
  `~/Downloads`; with no operator corpus present they skip, so a runner reports neither the old
  failures nor the new passes. The numbers above are recorded against a named corpus state because
  that is the only authority available for a corpus-reading case.
- **The requiredness half of C-585 is deliberately not taken here.** The item notes that the job
  which would run these suites, `Execution queue behavioral contract`, is required by no ruleset, and
  says to settle that first or in the same change. That question is item C-582, live-claimed by a
  concurrent run which holds the workflow and required-context files. This change therefore does not
  make these cases block anything, and does not touch a single file in that claim.
- **Case 2's restated assertions will keep accumulating decoys.** Every future run that narrates this
  calibration adds another commentary line matching as a naming role. That is now asserted as a
  growing quantity rather than a forbidden one, so it strengthens rather than breaks the case — but
  the "no full forty-character handle" assertion is a genuine tripwire: the day a line quotes that
  SHA in full, the verdict is earned differently and the case should be re-read rather than widened.
- **Case 1's per-channel invariant is measured over this corpus's history, not proven for all time.**
  It held at every prefix from 20% to 100%, which is the strongest available evidence, but it is a
  property of how agents write the backlog. If filing tables ever become the place narration is
  written, it should be re-read on the same terms as this one.
