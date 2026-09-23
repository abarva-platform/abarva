# 2026-09-23-t739-live-corpus-empty-verdict — A live-corpus case must not require its corpus to be full

## Release ID

`2026-09-23-t739-live-corpus-empty-verdict`

## Status

`candidate`

## Plain-English Summary

Four cases across three operator-tooling suites asserted a property of a *mutable
operator document* rather than of any code: that a particular bucket in the generated
work queue is not empty. One of them says so in its own name — "the live corpus has
suppressed candidates to replay, so this case is not vacuous".

That bucket holds claims that look in-flight but are not. It empties when those claims
are resolved, which is exactly the outcome the same suites exist to prove. So the
suites went red because the corpus had **improved**, and they went red only on an
operator machine: where the operator documents are absent — every CI runner — the same
cases skipped instead. A case that cannot fail where it runs, and fails only where
nothing gates it, is the unfailable gate this directory was built against, pointing
the other way.

The item asked for a verdict between three options — a counted skip, a synthesised
candidate, or deletion with the reason recorded. **The verdict taken is that a live
corpus is an opportunistic replay, never a precondition**, and it is implemented in all
three parts:

- The bare "the bucket is not empty" assertion is **deleted**, with the reason recorded
  beside the code that replaced it. Nothing about the behaviour under test is proven by
  that bucket being full: candidate extraction, newest-claim precedence, the branch
  grammar and the abstention mechanism are each already pinned by hermetic fixtures in
  the same two suites.
- An empty bucket is now a **counted skip that names the state**, not a vacuous pass.
  It used to be both at once, which is the quieter half of the defect: with zero ids,
  the two checks in the middle of each block filtered zero ids, found zero problems and
  reported PASS.
- The decision between those states is one exported function with its own cases, so
  "empty" cannot silently become "pass" again by someone reading `ids.length === 0` as
  "nothing to assert, carry on".

One further change makes the replay able to fail *where it runs*: the root it reads the
corpus from is now overridable. Fixed to `~/Downloads`, the replay could never be handed
a corpus that holds a candidate, so the direction the item asks to be proven second —
that the case fails when given a real candidate it mishandles — was not demonstrable on
this machine at all. It is demonstrated below.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only operator tooling. No client-visible
capability, nothing to feature-gate, no product surface that can observe it.

- **Layer 4 — Products:** none. No file under `src/` is touched.
- **Platform tooling:** the claim/queue toolchain in `scripts/exec/`.

No canonical model, adapter, intake, migration or tenant data is involved.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/fossil-claims.mjs`
  - `CORPUS_MODES` — `absent` | `empty` | `replay`. Only `replay` may produce a pass.
  - `liveCorpusPlan({ documentsPresent, candidateIds })` — returns the mode, exactly one
    of `replay`/`skip`, the candidate list (copied), and a `reason` a skip can print.
    `absent` outranks the candidate list: a list cannot have been read from documents
    that were not read. A missing or non-array list is `empty`, never a replay over
    whatever was passed.
  - `liveCorpusRoot({ env, home })` — `EXEC_OPERATOR_ROOT` when set and non-blank,
    otherwise `<home>/Downloads`. The default is unchanged.
- `scripts/exec/fossil-claims.test.mjs`
  - Ten cases for the contract above.
  - The live block takes its root from `liveCorpusRoot()`, and its three checks become
    two: the deleted one is the non-empty precondition, and the reason is recorded in a
    comment that survives the diff.
- `scripts/exec/build-execution-queue.test.mjs`
  - `skipLive(name, why)` — a skip that is counted **and named**. The live block used to
    increment the counter once for a block containing three named checks, so three
    checks became one unnamed skip.
  - The live replay is gated on `liveCorpusPlan`. The non-empty precondition is deleted;
    the two behavioural checks run under `replay` and are skipped, named, otherwise.
    A non-zero exit from the board/queue pair now yields a skip that says so rather than
    a replay over an empty list.
- `scripts/exec/toolchain-manifest.test.mjs` — **unchanged**. Its one failure was the
  queue suite it runs as its acceptance, and it clears with that suite.
- This record.

### Why not a synthesised candidate in CI, which the item also offered

A synthesised candidate is the right answer for the *mechanism*, and the mechanism
already has one: both suites build whole fixture corpora in a temp directory and assert
the abstention behaviour over them, with no operator document in sight. Adding a second
synthetic corpus for the live block to consume would duplicate those cases while still
calling itself a live-corpus replay — a case that reads like an audit of the real
documents and is not one. The live block stays an audit of the real documents, and says
plainly when it had nothing to audit. `EXEC_OPERATOR_ROOT` is what lets a fixture corpus
be supplied deliberately, by a mutation proof or a future runner job, without the suite
pretending a fixture is the corpus.

## QA / Validation

Every number below is from this branch's worktree, and each pair is over the same scope.

**Baseline on `origin/main` `9a7bfdad8`, before any edit.** Four failures, one cause.

| suite | passed | failed | skipped |
|---|---|---|---|
| `fossil-claims` | 70 | **1** | 0 |
| `build-execution-queue` | 167 | **2** | 0 |
| `toolchain-manifest` | 16 | **1** | — |

**After.**

| suite | passed | failed | skipped |
|---|---|---|---|
| `fossil-claims` | 78 | 0 | **2** |
| `build-execution-queue` | 166 | 0 | **2** |
| `toolchain-manifest` | 17 | 0 | — |

The skips are the point, not a cost: four checks that used to be one bare skip or a
vacuous pass are now four named, counted skips carrying the reason they did not run.

**Red first.** The ten contract cases were written before the function existed and the
suite would not load: `SyntaxError: The requested module './fossil-claims.mjs' does not
provide an export named 'CORPUS_MODES'`. Because an import-level red proves nothing
about the individual cases, each one is instead pinned by a mutation below.

**Mutations: three applied, three caught.** Each edits the shipped module, runs the
suites, and is restored from a byte copy taken before the edit — never from a git ref.

| # | mutation | `fossil-claims` | `build-execution-queue` |
|---|---|---|---|
| 1 | an empty corpus resolves to `replay` — i.e. `main`'s semantics | 78 / **2** | 167 / **1** |
| 2 | a `replay` plan also reports `skip` | 76 / **2** | — |
| 3 | `liveCorpusRoot` ignores the override | 75 / **3** | — |

Mutation 1 is the important one and it is worth reading twice. Under it, the queue
suite's failure is the **pre-existing failure from `main`, reproduced exactly** —
`claimable 7 -> 7 over 0 candidates` — and in the `fossil-claims` suite the two live
checks go back to reporting PASS over zero ids. That is the vacuous pass, measured
rather than argued: the same two checks that pass under the mutation are skipped by the
shipped code.

**The replay still fails when handed a real candidate it mishandles.** This is the
second direction the item asked for, and it was not demonstrable before this change.

A corpus was built in a temp directory from a copy of the four live operator documents
plus one synthetic expired claim, giving it exactly one suppressed candidate. Nothing
wrote to the operator root; the suite copies documents into its own temp directory.

| run | result |
|---|---|
| queue suite against that corpus, shipped code | **168 / 0**, no skips — the replay ran |
| the same, with the abstention writer mutated to write a line the generator reads as a fresh claim | **165 / 3** |

The three failures name the destination, not merely the departure: `now held by the
abstaining run: T-458`, and `claimable 6 -> 6 over 1 candidates`. That mutated writer
is the exact historical defect an earlier item was filed against, and the case catches
it. The writer was restored from a byte copy immediately afterwards.

The extraction half was proven the same way, with a two-file fixture corpus naming a
candidate the register does not resolve: `fossil-claims` goes to **79 / 1** with
`no claim line for: T-905`, where it reports **78 / 0 / 2** against the real corpus.

**Sibling suites — all ten, over the same documents.**

| suite | `origin/main` | this branch |
|---|---|---|
| `append-claim` | 50 / 0 | 50 / 0 |
| `build-execution-queue` | 167 / **2** | **166 / 0 / 2 skipped** |
| `build-source-board` | 35 / 0 | 35 / 0 |
| `cli-entry` | 19 / 0 | 19 / 0 |
| `fossil-claims` | 70 / **1** | **78 / 0 / 2 skipped** |
| `id-collision` | 70 / 0 | 70 / 0 |
| `queue-provenance` | 30 / 0 | 30 / 0 |
| `register-time-authority` | 258 / 0 | 258 / 0 |
| `toolchain-manifest` | 16 / **1** | **17 / 0** |
| `worktree-retention` | 22 / 0 | 22 / 0 |

`queue-provenance` is unchanged and that is load-bearing: the queue generator's own
bytes are its provenance stamp, and this change does not touch that file.

**Lint.** `npx eslint` over the three changed files — exit 0, no findings.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— **exit 0**, zero diagnostics. Judged on the exit code, not on a grep.

**CI coverage, read rather than assumed.** `.github/workflows/execution-queue-toolchain.yml`
triggers on `scripts/exec/**` and runs both changed suites by name, on their own steps
(`node scripts/exec/build-execution-queue.test.mjs`, `node scripts/exec/fossil-claims.test.mjs`).
On the runner both will report the `absent` mode — named skips now, rather than one
anonymous one.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA workflow ships every merge; this change
alters no runtime behaviour, so the deploy is incidental to it rather than the point of
it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no Azure command is run by this change
- Approved image digest: whatever that workflow builds from the merge SHA
- ACA runtime invariant: to be proven from the run keyed to the merge SHA, in a register
  addendum. Not asserted here.
- Worker image invariant: unchanged by this release
- Feature/env flag update path: none. `EXEC_OPERATOR_ROOT` is read by two test suites
  and by nothing that runs in a deployed image.
- Live signed-in proof required: **no**, as a property of the change — nothing under
  `src/` is touched, so no product surface can differ.

## Rollback Plan

Revert the single commit. The four cases return to requiring a non-empty bucket, which
means they return to red on an operator machine and to skipped on a runner. No
migration, no data, no runtime state, and no committed artifact is regenerated.

## Audit Evidence

- The PR and its CI run
- The baseline, after, mutation and fixture-corpus tables above, each reproducible from
  the suites; the fixture-corpus runs are reproducible with `EXEC_OPERATOR_ROOT`
- The deleted case's reason, recorded in `fossil-claims.test.mjs` beside what replaced it
- `liveCorpusPlan`'s own ten cases, which are what stop `empty` becoming `pass` again

## Known Gaps

- **The live replay is still a skip on every CI runner**, because the operator documents
  are not in the repository. It is now a *named* skip per check rather than one anonymous
  skip for a block of three, and the behaviour it would replay is covered hermetically —
  but the audit itself runs only where those documents exist. Supplying a frozen corpus
  to the runner via `EXEC_OPERATOR_ROOT` is now possible and is not done here; it needs a
  decision about which corpus is authoritative, which is an operator call.
- **The four cases were red on an operator machine for the hours between their filing
  and this change**, and at least one merge went out with them red and named as
  pre-existing — the preceding item's own record tabulates them that way. The repair is
  here; the process gap — a red suite tolerated because it is attributed elsewhere — is
  not something this change can close.
- **No new item was filed** for the remaining gap above. The `T-500`–`T-599` band the
  queue assigns to this lane reports 0 of 100 free, which the queue itself calls a range
  decision rather than something to work around.
- **No signed-in acceptance**, and none is owed. See Deployment Authority.
