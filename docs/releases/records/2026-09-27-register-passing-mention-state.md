# 2026-09-27-register-passing-mention-state — a register line that names a pull request without being about it

## Release ID

`2026-09-27-register-passing-mention-state`

## Status

`candidate`

## Plain-English Summary

The operator register is an append-only log, and `scripts/exec/signed-in-proof-reconcile.mjs`
compares each release record's own account of its signed-in proof against what that log says
happened. It finds the log's line for a record by matching the pull request number.

Matching on the number alone was too generous. Log lines cite each other's pull requests
constantly — as a stack base, as a rebase reference, as the reason two pieces of work collide on
one file, inside an explicit *exclusion* of that pull request's files, or as an announcement of
follow-up work. In every one of those cases the line names the number while being **about
something else**, and the reader was treating it as that record's deciding line. So a verdict could
be read from a sentence about somebody else's work, and the reported "the log has N lines about
this release" overstated how much the log actually says.

This change teaches the reader which pull request a line is *about*, and reports a line that only
names one as its own state, `passing-mention` — distinct from "the log spoke about this release and
said nothing" and from "the log never mentioned it". It refuses rather than guesses: a row in the
new state is unresolved and says so, with the exact clause and register coordinates a person needs
to settle it.

The rule read is **structural, not a phrasing rule**. The five live cases are five different
spellings of one structure, and widening a phrase to cover a fifth spelling is how a refusal
becomes a wrong answer. The structure is the register's own subject grammar, and the same
first-written-wins subject contest already exists in `scripts/exec/fossil-claims.mjs` for *item
ids*, against this exact defect ("register lines routinely narrate another lane's item in
passing"). This asks that question about *pull requests*:

1. A line whose lead asserts an **outcome** is an outcome line, whatever fields follow it.
2. Otherwise a claim lead, or a declared `branch` / `files:` scope field, makes it a **claim** —
   which has no pull request of its own, because a claim is written before the work exists.
3. Otherwise the subject is the **first** pull request written in the lead field.

Rule 1's precedence over rule 2 is load-bearing and is pinned by a case: a genuine
`RELEASED item … through PR #n | …` line carries a file list of its own, and without the precedence
the reader would call it a claim and refuse the one row it legitimately decides.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operator tooling. No client-facing surface ships here.

- **Layer 4 — products:** none. No product surface, route, component, prompt or read model is
  touched.
- **Operator tooling / CI:** `scripts/exec/signed-in-proof-reconcile.mjs` and its contract suite.
  The suite already runs in `.github/workflows/execution-queue-toolchain.yml`, so the new cases are
  executed on every pull request rather than only locally.

No canonical object, tenant fixture, migration, adapter, projection or governed bundle changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator release bookkeeping only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs`
  - new state `PASSING_MENTION`, and the two mention roles `SUBJECT` / `PASSING`
  - new exported readers `subjectPullRequest`, `mentionRole`, `mentionClause`
  - `reconcileRecord` now partitions the lines matched by pull request into the ones *about* the
    record and the ones that merely name it. Only the first kind competes to be the deciding line.
  - rows carry `registerSubjectLines`, `registerPassingLines` and `registerPassingClauses`
    alongside the existing `registerLines`, which is what was overstating them
  - `formatReport` prints the new bucket, every passing clause with its stamp and identity, what the
    row *would* have read before this item, and a corpus-wide line naming how many matched lines
    name a number while being about other work
- `scripts/exec/signed-in-proof-reconcile.test.mjs` — 14 cases (see QA below)

## QA / Validation

Base: `origin/main` `12be546480`. Baseline and after are the same suite over the same scope.

| step | result |
|---|---|
| `node scripts/exec/signed-in-proof-reconcile.test.mjs` before the fix, tests added | **113 passed, 14 failed** |
| same suite after the fix | **127 passed, 0 failed** |
| every other suite in `scripts/exec/` | unchanged; see the pre-existing failure noted under Known Gaps |
| `npx eslint` on both changed files | exit 0, no findings |
| `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` | **exit 0**, zero diagnostics (the exit code is judged, not a grep — a bare run exits 134 on the operator host) |

**The first red run was a crash, not a case count, and that was fixed before it was trusted.** One
case failed and the next call threw `TypeError: mentionRole is not a function`, taking the other 112
cases with it — indistinguishable from a suite that found nothing. The calls now go through
wrappers, so a missing export fails the case that asked for it. The 113/14 above is the measurement
taken after that repair.

**Five mutations, five caught, each by a distinct case set** — so no guard here is redundant and
none is doing another's work:

| mutation | cases that go red |
|---|---|
| drop rule 1's precedence over rule 2 | 2 — both "BOTH DIRECTIONS" cases; the genuine release line becomes a claim |
| drop the claim-lead rule only | 3 — the collision explanation, the exclusion, and the selection case |
| drop the scope-field rule only | 5 — the stack base, the follow-up, and all three row/report cases |
| let passing mentions compete for the deciding line again | 2 — the row case and the selection case |
| first-written-wins → last-written-wins for the subject | 7 — including 5 pre-existing attribution cases, which pin the ordering independently |

**Both directions, on real lines.** The five known positives are quoted from the live register with
their stamps and identities, truncated to the lead field the rule reads. The control is also a real
line — a genuine `RELEASED item … through PR #n` line that carries a file list — and it must keep
deciding its row. A sixth case takes that same control line and asserts the number it cites in
passing is classified `passing`, so a classifier that answered `subject` unconditionally would fail
it.

### What the live corpus does, per row

Run over the operator register, 181 records in population. **Each of the five the item names
moves**, and the two kinds of movement are different:

| pull request | how the line names it | before | after |
|---|---|---|---|
| #8297 | a rebase reference on a line about another pull request | `register-silent` / `unread` | **`passing-mention`** |
| #8260 | a stack base | `register-silent` / `unread` | **`passing-mention`** |
| #8200 | an announcement of follow-up work | `register-silent` / `unread` | **`passing-mention`** |
| #8303 | a file-collision explanation, but a line about #8303 also exists | `register-silent`, decided by the collision line | `register-silent`, **decided by the line about #8303** |
| #8296 | an explicit exclusion, but three lines about #8296 also exist | `register-silent`, decided by the exclusion | `register-silent`, **decided by a line about #8296** |

The last two are the reason the mechanism is *line selection* and not only a new verdict: a claim
naming one pull request beat a release line naming two under "fewest first", so a passing mention
was winning the selection outright.

**No settled verdict changes, and that is the honest answer the item asked for.** Over the whole
corpus:

| verdict | before | after |
|---|---|---|
| `agree` | 34 | **34** |
| `disagree` | 0 | **0** |
| `ambiguous` | 9 | **9** |
| `no-register-line` | 75 | **75** |
| `inexact-attribution` | 26 | 2 |
| `register-silent` | 37 | 32 |
| `passing-mention` | — | 29 |

Nothing left `agree`, `disagree` or `ambiguous`, so no row that had a resolved account of its proof
lost one, and no row gained one. The value is entirely in what stops being overstated: 24 of the 26
`inexact-attribution` rows were not batch-cited at all — every line matching them named the number
while being about other work — and 5 `register-silent` rows were reading a sentence about somebody
else's release. The direction of error stays the safe one throughout: this reader refuses more often
and asserts nothing new.

## Rollout Plan

Merge to `main`. No runtime rollout: these are operator scripts, not application code. Nothing is
built, deployed, flagged or migrated, and no Container App revision or traffic weight is affected.

## Deployment Authority

- Repo-owned deploy workflow: not exercised — no runtime artifact changes
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a — no image, env var, flag, scale or secret is touched
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: **no.** Nothing in this change renders, serves or answers anything
  to a signed-in user. It is one operator script and its suite, and the item says so. Stated plainly
  rather than left blank, because a blank field has been read as a debt.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write and no runtime state, so the
revert is complete on its own. The reader returns to treating a passing mention as the deciding
line, which is the behaviour this record describes.

## Audit Evidence

- The pull request for this record, and the `execution-queue-toolchain` check on it, which runs
  `node scripts/exec/signed-in-proof-reconcile.test.mjs`
- The before/after and mutation numbers in QA above, reproducible with
  `node scripts/exec/signed-in-proof-reconcile.test.mjs` at this commit and at `12be546480`
- The corpus table is reproducible on the operator host with
  `node scripts/exec/signed-in-proof-reconcile.mjs --register ~/Downloads/EXECUTION_CLAIMS.md --json`.
  CI cannot see that register, which is why no case asserts over it and why the quoted lines carry
  their stamp and identity.

## Known Gaps

- **A mid-flight claim line that reports its own merge is classified `passing`.** The register's
  claim lines carry a `files:` field, so rule 2 calls them claims — including one that says
  "MERGED" about the very pull request it names. The cost is a refusal, never a wrong verdict, and
  the row lands in `passing-mention` rather than being resolved from a line that is in fact about
  it. Sharpening this needs the claim's own subject item joined to that item's pull request, which
  is a second join this reader does not have.
- **29 `passing-mention` rows are now unresolved and reported.** They are not repaired by this
  change and must not be closed by loosening the rule. Each prints its clauses, stamp and identity
  so a person can settle it, which is the same disposition the `unread` rows got.
- `scripts/exec/id-collision.test.mjs` has **1 failing case** on the operator host, and it is
  **pre-existing and unrelated**: it asserts a ratio over the live operator backlog, which this
  change does not touch, and it is skipped on CI runners where that document is absent. It needs a
  backlog item, which cannot be filed today — the `T-500`–`T-599` band is exhausted, so a new
  T-lane id needs a range decision rather than a careful reading.
