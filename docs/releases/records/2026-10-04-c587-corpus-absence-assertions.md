# 2026-10-04-c587-corpus-absence-assertions — Replace two self-falsifying absence assertions with the mechanism each was a proxy for

## Release ID

`2026-10-04-c587-corpus-absence-assertions`

## Status

`candidate`

## Plain-English Summary

Two test cases in the operator-tooling directory were written the wrong way round. Instead of
checking that a reader behaves correctly, they checked that a particular piece of text was **absent**
from a working document that the team's own agents append notes to. That makes the test depend on
what people happen to have written lately rather than on whether the code is right — and, worse,
writing a note *about* the test is enough to break it. One of the two had already failed that way
once, in an earlier change.

This release replaces both with assertions about the mechanism each was standing in for, so each
case now fails when the code regresses and cannot fail merely because somebody wrote something down.
It also records the full audit behind that: of the fifteen suites in the directory, twelve mention
the working documents, five actually read them, and exactly two held an assertion of this shape.
The other candidates were examined and ruled out with a stated reason rather than skipped.

No product behaviour changes. No runtime, schema, tenant data, route or user-facing surface is
touched.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. No client-facing surface and no
data plane is involved, so this is neither `global-control-lane` nor `client-data-lane`.

None of the four data-operating-model layers is affected. This is repo-owned developer tooling:
two test files under `scripts/exec/`. No intake tab, source adapter, canonical object or product
projection changes, and no tenant data is read or written.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator/agent execution tooling and its tests
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-merge-coverage.test.mjs`
  - Removed the case asserting that a merge's full forty-character commit hash does not appear
    anywhere in the operator register.
  - Added two cases that assert the same property by disabling one of the reader's two match
    channels at a time: with the hash matcher off the merge is still named and every naming line is
    matched by its pull request; and every line that names the merge earns that through its own
    subject pull request.
  - Removed the now-unused raw read of the register from that block, so nothing there treats the
    document as a substring haystack. The register is still read once, through the grammar's own
    entry parser.
- Both suites' skip lists, which guard the no-operator-corpus path, now name the cases that exist.
  One label was already stale before this change and the other was invalidated by it; a skip naming
  a removed case reports a coverage state nobody has.
- `scripts/exec/id-collision.test.mjs`
  - Removed the case asserting that one named item id is not reported as a duplicate filing by the
    live backlog.
  - Added two cases that assert the reader behaviour actually responsible: no id is reported as
    filed twice within a single backlog section, and that collapse is load-bearing on the live
    corpus rather than a precaution.

## QA / Validation

Baseline measured over the same scope on `main` `bdc59a6198` before any edit.

| suite | before | after |
|---|---|---|
| `register-merge-coverage.test.mjs` | 52 passed, 0 failed | 53 passed, 0 failed |
| `id-collision.test.mjs` | 71 passed, 0 failed | 72 passed, 0 failed |

0 failing before, 0 failing after, in both. Each count rises by one because one absence case was
replaced by two mechanism cases.

Both suites were also run with **no operator corpus at all**, which is the state on every CI runner,
because that is where these cases are reported rather than executed:

| suite | `main`, no corpus | after, no corpus |
|---|---|---|
| `register-merge-coverage.test.mjs` | 47 passed, 0 failed, 3 skipped | 47 passed, 0 failed, 4 skipped |
| `id-collision.test.mjs` | 60 passed, 0 failed, 3 skipped | 60 passed, 0 failed, 4 skipped |

Same passes, one more counted skip in each, and no silent pass in either direction. That `+1` is a
second, smaller correction this change owes: each suite's skip list named a case that **no longer
exists** — one label was already stale from the earlier repair, and this change would have
invalidated the other. A skip naming a removed case reports a coverage state nobody has, so both
lists now name the cases that actually stand there.

Both suites were also run with **no operator corpus at all**, which is the state on every CI runner,
because that is where these cases are reported rather than executed:

| suite | `main`, no corpus | after, no corpus |
|---|---|---|
| `register-merge-coverage.test.mjs` | 47 passed, 0 failed, 3 skipped | 47 passed, 0 failed, 4 skipped |
| `id-collision.test.mjs` | 60 passed, 0 failed, 3 skipped | 60 passed, 0 failed, 4 skipped |

Same passes, one more counted skip in each, and no silent pass in either direction. That `+1` is a
second, smaller correction this change owes: each suite's skip list named a case that **no longer
exists** — one label was already stale from the earlier repair, and this change would have
invalidated the other. A skip naming a removed case reports a coverage state nobody has, so both
lists now name the cases that actually stand there.

All fifteen suites under `scripts/exec/` run green: `append-claim` 94, `build-execution-queue` 215,
`build-source-board` 106, `cli-entry` 34, `deploy-proof-resolver` 44, `fossil-claims` 91,
`id-collision` 72, `queue-provenance` 30, `register-citation-check` 22, `register-merge-coverage` 53,
`register-time-authority` 343, `signed-in-proof-reconcile` 127, `toolchain-manifest` 17,
`worktree-retention` 27, `worktree-sweep-hazard` 38 — 0 failed, 0 skipped throughout.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exits **0** with no
diagnostics (exit code judged, not grepped). `npx eslint` on both changed files exits **0**.

### Red-first, on the defect rather than on a hypothetical

The deleted hash case was shown to be falsifiable by an ordinary act of writing. One claim line was
appended to a **copy** of the register — a line that announces no merge and names nothing as a
handle, merely quoting the hash while discussing the assertion. That case went red; all four
mechanism cases in the same block stayed green. That is the whole defect: the test reports that the
document was written in, not that the reader is wrong.

Measured drift behind it: the ten-character prefix an earlier change had already removed for this
exact reason stood at 1 occurrence in the register when that change was taken and 3 immediately
after. On `main` today it is at **6** in the register, 7 in the backlog and 3 in the pulse file, and
every one of those occurrences is prose about the calibration rather than anybody naming the merge.
Forty characters was not a different class, only a slower clock.

The replacement was then checked against three successively worse writes, including a line carrying
the full forty-character hash **as a handle** alongside the pull request as its subject. All cases
stayed green: 53 passed, 0 failed.

For the backlog case, the drift was in its stated reason. Its comment said the id was simply not on
disk. The id is on disk in item position three times — a filing heading, that section's own table
row, and a progress note — and two of the three classify as filings. What held the case up was the
reader collapsing a heading and its own table row within one section into a single filing. The
reader was doing the work the comment credited to the corpus, and an ordinary second filing of that
id would have turned the case red while the reader was right.

### Necessity proved by mutation on the mechanism, never on the corpus

The corpus cannot be controlled, so every necessity proof below mutates code.

| mutation | effect |
|---|---|
| the hash branch stops requiring a no-pull-request provenance, so a bare hash mention can earn a naming verdict | `every line that names this merge earns it through its own subject pull request` **fails** (4 failed overall) |
| the pull-request branch additionally requires a hash hit | `with the SHA matcher off the merge is still named` **fails** (5 failed overall) |
| the filing collapse key loses its section, so a heading and its own table row become two filings | `no id is reported as filed twice within a single backlog section` **fails** (15 failed overall), and the live backlog goes from 66 reported duplicate ids to 134 — including the very id the deleted absence case was guarding |

Each mutation was reverted and the suites re-run green (53 and 72, 0 failed) before the change was
committed; `git diff --stat` confirms no module file is modified by this release.

A first draft of the hash repair was **discarded** for committing the same defect it was fixing: it
substituted a synthetic hash of forty `f`s and a pull request numbered 999999999, and both are
literals an agent can write. Appending one ordinary line that mentioned those synthetic values to a
copy of the register turned the new case red, because the subject parser read the number as that
line's own subject. That is recorded in the test's comment, because a synthetic constant is not
safer than a real one — it is only less likely to be typed, which is the same bet on a slower clock.

### The enumeration the item asked for

Twelve of fifteen suites under `scripts/exec/` reference the operator documents; **five** actually
read a live one. Across those five live blocks, exactly **two** cases asserted the absence of a
literal from a corpus agents write into. Both are repaired above. The remaining candidates were
examined and ruled out, each with a reason:

| location | shape | verdict |
|---|---|---|
| `id-collision.test.mjs` zero-count with the claim window closed to 0.001h and `now` pinned to a past instant | `=== 0` on a live-register count | **absence is genuinely the property under test** — the window is the parameter, and register stamps are read from a clock at write time, so no appended line can land inside a 3.6-second window days in the past. It is the negative control for the positive case above it. Left unchanged, with the reason stated here. |
| `fossil-claims.test.mjs`, six zero-counts | `=== 0` / `<= 1` on counts of **failure** lists produced by running the real parser | **not in the class** — the presence direction. Appending material can only give the parser more to resolve. |
| `register-time-authority.test.mjs`, two blocks | byte-presence of a named register fragment plus a sha256 of the line it was cut from | **not in the class** — presence, chosen deliberately because the register is append-only, so absence would mean the line was rewritten. |
| `build-execution-queue.test.mjs` zero-counts over the suppressed-candidate replay | `=== 0` over a **mutated copy** of the corpus | **not in the class** — the mutation is the mechanism under test. |

Outside `scripts/exec/`, one suite elsewhere names the operator document paths
(`src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts`); it compares them as strings in a
JSON record and never reads the files, so it is not in the class.

No new CI job is wired. The requiredness question for corpus-reading cases is owned elsewhere and is
deliberately not pre-empted here.

## Rollout Plan

Merge to `main` by squash. No Azure Container Apps image build, no deploy, no migration, no feature
flag, no runtime rollout — the change is two test files that run under `node` in the existing
workflows. It takes effect for the next run of those suites.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the squash commit. There is no state to unwind: no migration, no runtime object, no document
is written by this change. The previous assertions would return with it, including the one already
proven falsifiable, so a revert should be paired with a decision about what replaces them.

## Audit Evidence

- PR for this release record, and its squash commit on `main`.
- Suite output quoted above, reproducible from a clean checkout at the merge commit:
  `for f in scripts/exec/*.test.mjs; do node "$f"; done`
- The three mutations in the necessity table, each reproducible as a one-line edit to
  `scripts/exec/register-merge-coverage.mjs` or `scripts/exec/id-collision.mjs`, named exactly in
  that table.
- The falsification proof: copy the operator register to a sandbox `HOME`, append one line quoting
  the merge hash, and run `register-merge-coverage.test.mjs` against the pre-change file.
- `npx tsc --noEmit` exit 0; `npx eslint` exit 0 on both changed files.
- The item's own claim line in the operator register, which carries the enumeration as it stood
  before any edit.

## Known Gaps

- **The class is settled case by case, not guarded.** Nothing stops a new absence-shaped assertion
  over a live operator document from being written tomorrow. A durable enumerator was scoped for
  this change and deliberately **not** shipped: the honest versions either over-report (223
  assertion sites in the five corpus-reading suites match these shapes textually, 329 across all
  fifteen, and nearly all of them sit over controlled fixtures) or depend on a hand-curated literal
  list or a declaration marker, and a marker is not a control that runs. A successor item is filed with the recommendation — perturb a sandbox copy of
  the corpus and re-run each suite, reporting any case whose verdict flips — together with the
  calibration that approach still needs.
- The non-vacuity half of the backlog repair (`the collapse is load-bearing on the live corpus`) is
  a measurement of the corpus rather than of the reader, and is labelled as such in the test. It can
  only move away from zero as the backlog grows.
- The claim line for this item declared two files that were not written, for the reason in the first
  gap above.
