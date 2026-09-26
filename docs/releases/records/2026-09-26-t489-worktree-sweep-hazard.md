# 2026-09-26-t489-worktree-sweep-hazard — Name the process that sweeps an agent's worktree, before it creates one

## Release ID

`2026-09-26-t489-worktree-sweep-hazard`

## Status

`candidate`

## Plain-English Summary

The execution protocol tells every agent, as its first instruction, to create a
git worktree under `/tmp`. Nothing had ever checked whether something else on the
machine deletes things there.

At `2026-09-26T00:19Z` a checkout created that way vanished mid-session between
two commands about ninety seconds apart, taking uncommitted work with it; the
next command failed with `uv_cwd ENOENT`. A second, independent run of the same
scheduled task lost a worktree in the same window. The register, the pulse file
and the task instructions were all silent on who sweeps that directory, on what
trigger, and with what age bound — so there was no way to answer the question,
and no way to warn the next agent.

This adds a control that answers it by **reading the host's own declarations**:
launchd job definitions, and the scripts they run. Run it on the path you are
about to hand to `git worktree add` and it reports whether a declared job
deletes under that path, which job, on what schedule, and after how long.

It deliberately does not hardcode a verdict about `/tmp`. A gate asserting
"/tmp is unsafe" in prose could not notice the rule changing, could not be wrong
in a way anyone sees, and would say nothing at all about a root nobody had
thought of — which is the exact failure shape the whole `scripts/exec`
directory exists against.

On the operator host the control finds, unprompted, one real scheduled sweeper of
the prescribed root:

```
SWEPT /private/tmp/exec-item
  com.apple.tmp_cleaner
  /System/Library/LaunchDaemons/com.apple.tmp_cleaner.plist
  StartCalendarInterval Hour 0   ->  /usr/libexec/tmp_cleaner
  declares /tmp, age bound 3 day(s), on atime AND mtime AND ctime
```

That job consults no branch, no index and no claim.

## What the evidence settles, and what it does not

Stated plainly, because the item asked for the sweeper to be *named* and only
part of that is proven.

**Proven, read-only and reproducible.** `com.apple.tmp_cleaner` is a real,
scheduled, unbounded-by-our-rules sweeper of the exact directory the protocol
prescribes. Its age bound is three days on access, modification *and* inode
change time; a worktree held across a long item crosses that bound with no
second warning; and it would not spare one holding unpushed commits.

**Proven not to be the actor at 00:19Z**, on four independent grounds:

1. its bound is three days and the deleted checkout was about twenty-one
   minutes old;
2. it removes a directory only when that directory is *empty* and its own
   mtime is past the bound, and a live checkout is neither;
3. it cannot reach `.git/worktrees/<name>` inside the repository, yet every
   `exec-*` administrative entry but the two live ones is gone, and the item
   records that `git worktree list` no longer named the checkout — only
   `git worktree remove` or `git worktree prune` removes an administrative
   entry;
4. the second run that lost a worktree in the same window lost one under the
   session scratchpad, not under `/tmp/exec-*`, so the actor was not keyed on
   the naming the task file prescribes.

`scripts/exec/worktree-retention.mjs` is also not a candidate: it never removes
anything, and it calls a worktree `removable` only on three independent proofs
that the deleted checkout failed on four counts.

**Not settled.** Which process issued the 00:19Z removal. The signature is whole
registered worktrees removed together with their administrative entries,
selectively, regardless of age, dirty tree or live claim — while 772 other
entries under `/private/tmp`, 147 of them predating the window, were untouched.
That is the signature of `git worktree remove --force` driven from
`git worktree list`, not of an age-based file cleaner. Naming the caller needs
privileged log access this run did not have, and it is recorded as not verified
rather than guessed at.

The remedy the item offers as the alternative — *change the instruction that
sends agents to `/tmp`* — does not depend on settling that, and the proven
sweeper alone justifies it.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only execution tooling and its CI
contract; no client-facing capability, no feature gate.

None of the four product layers. This is platform tooling in `scripts/exec`
plus its CI contract and operator documentation. No tenant data, no adapter, no
canonical model, no product surface reads or writes anything changed here.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — agent execution tooling and its CI contract
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/worktree-sweep-hazard.mjs` — new. Parses launchd job
  definitions and cleaner scripts, resolves a candidate root through
  `fs.realpathSync` (including the part that does not exist yet, since an agent
  asks *before* `git worktree add` creates it), and classifies it `swept` /
  `not_swept` / `unknown`. CLI exits `1` / `0` / `2`.
- `scripts/exec/worktree-sweep-hazard.test.mjs` — new. 38 assertions across 21
  cases; 8 mutations, 8 caught.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new contract.
- `scripts/exec/README.md` — the rule, the measured output, and the two
  mutations that survived their first fixture.

## QA / Validation

Everything below was run from an own worktree off `origin/main` `66361b113`,
never the shared checkout.

**The suite, and the failing-first order the protocol requires.** The test was
written before the module existed and failed `ERR_MODULE_NOT_FOUND`. With the
module: **38 passed, 0 failed.**

**Baseline over the same scope, measured in a separate clean worktree at
`origin/main` rather than from a stash** — the scope being every behavioural
suite the `execution-queue-toolchain` workflow runs:

| | before (clean `origin/main`) | after (this branch) |
|---|---|---|
| suites the workflow runs | 12 | 13 |
| failing | **1** | **1** |

**The one failure is pre-existing and is not mine.** `id-collision.test.mjs`
fails identically on an untouched checkout of `origin/main`, on the case *"the
reader classifies far more of the corpus as updates than as filings"* — an
assertion over the **live operator corpus**, whose ratio this run changed by
regenerating the board and queue from the repo-owned generators before picking
an item. It is quoted here as the baseline, never as a count this change caused,
and it is filed separately rather than folded in: a suite whose verdict depends
on a file CI cannot see is the failure mode `worktree-retention.mjs --check` is
already documented against in the same directory.

No other suite changed state, and the added suite accounts for the extra one.

**Mutation proof — the fix broken deliberately, each reverted after.** Eight
mutations of the module, each caught by named cases:

| # | mutation | result | cases that failed |
|---|---|---|---|
| M1 | `resolveDeep` → `path.resolve` (stop following symlinks) | caught | 7, 8 |
| M2 | `containsPath` → bare `startsWith` | caught | 9c |
| M3 | unreadable host → `not_swept` instead of `unknown` | caught | 12, 12b, 16 |
| M4 | short-circuit to `not_swept` when the root is younger than the bound | caught | 9, 10, 11, 11b |
| M5 | `readdir` failure reports `readable: true` | caught | 5, 12, 12b, 16 |
| M6 | drop the unrecognised-flag refusal | caught | 17, 17b |
| M7 | drop the declared age bound | caught | 1b, 6c, 11b |
| M8 | drop the shebang bound on which programs are read | caught | 20, 20b, 20c |

**Two of those survived their first fixture, and that is the substantive part of
this record.**

*M2 survived.* The prefix-impersonation case used `/tmpfoo/exec-x` against a
`/tmp` sweeper and passed with the boundary check removed. It never reached the
boundary: after resolution the sweeper's root is `/private/tmp` and `/tmpfoo`
resolves to itself, so no prefix relationship held in either form. A negative
control that cannot fail is the shape this directory exists against. The case now
builds two real sibling directories, `<tmp>/swept` and `<tmp>/sweptfoo`, asserts
that the sibling's resolved path *does* textually start with the swept root, and
only then reads the verdict — so it fails when the boundary is removed.

*M8 survived.* Dropping the shebang bound changed no verdict, because a Mach-O
binary contains no shell variable assignment. It is a blast-radius bound rather
than a correctness guard, and it had nothing asserting it. Case 20 now pins what
it buys: a program that is not a script declares nothing **even when its bytes
carry the declaration text**, which is what stops the control pattern-matching
its way across several hundred system binaries.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` — exit code judged, not grepped, because a bare run exits `134` on this
host (a V8 out-of-memory crash emitting no diagnostics, which greps clean).

**Live demonstration on the operator host, read-only.** The CLI on the
prescribed root returns `1` and names `com.apple.tmp_cleaner`, its plist, its
`StartCalendarInterval Hour 0` schedule, its program and its three-day bound.
On a worktree root inside the repository's own `.claude/worktrees/` it returns `0` with the
honest qualifier attached: *no DECLARED sweeper reaches this root; 421 job(s) on
this host declare nothing this can read, so this is not a proof of safety*.

**Where the wiring stops, stated rather than implied.** CI runs the behavioural
suite over fixtures and over real temporary directories. It cannot assert on the
operator's launchd, and case 21 — the only case that reads the real host — skips
where `/System/Library/LaunchDaemons` does not exist, because a gate asserting on
a subject it cannot see is the unfailable kind. On this host case 21 ran; on a
Linux runner it will print `SKIPPED`. So the preflight is an operator control in
the same shape as `worktree-retention.mjs --check`: available, and only as good
as its being invoked — which is why the operator task file is being changed in
the same breath to invoke it and to stop prescribing a swept root.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by application
code, no route, job, image, flag or environment variable changes, and no product
surface reads it. The operator-facing half is an instruction change in the
scheduled task file, which lives outside this repository and takes effect on the
next run of that task.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime artifact changes
- Shared runtime mutators: none
- Approved image digest: unchanged
- ACA runtime invariant: unaffected; nothing in the container image changes
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface renders, returns or
  reads anything this touches

## Known Gaps

1. **The 00:19Z actor is still unnamed.** This control names a real, scheduled
   sweeper of the prescribed root and proves it is *not* that actor. What issued
   the removal is not settled; the signature points at
   `git worktree remove --force` driven from `git worktree list`, and naming the
   caller needs privileged log access this run did not have. Recorded as not
   verified rather than guessed at.
2. **`not_swept` is not a proof of safety, by construction.** 421 launchd jobs on
   the operator host declare nothing this control can read, and a job that
   removes things in a form it does not parse is invisible to it. The count
   travels with every verdict so that it cannot be read as zero, but the gap is
   real. `/var/folders` — which `os.tmpdir()` returns on macOS and which *is*
   swept, by a binary that declares nothing — classifies `not_swept` today and is
   the concrete example of this gap.
3. **The preflight is an operator control, not a CI gate.** CI cannot see the
   operator's launchd, so case 21 skips on a Linux runner and the contract CI
   enforces is the parsers and the CLI over fixtures. Whether the preflight is
   actually invoked before `git worktree add` depends on the scheduled task file,
   which lives outside this repository. That is the same wiring boundary
   `worktree-retention.mjs --check` is already documented against, and it is the
   reason the instruction change is part of closing this item rather than an
   optional extra.
4. **The pre-existing `id-collision.test.mjs` failure is untouched.** It asserts
   a ratio over the live operator corpus and therefore changes verdict when that
   corpus changes. Filed separately; deliberately not folded in.

## Rollback Plan

Revert the PR. The control is additive and nothing imports it, so a revert
removes one CI step and two files; no migration, no data, no runtime state.

## Audit Evidence

- PR: recorded on merge
- CI: `Execution queue toolchain` → `Run the worktree sweep-hazard contract`
- Local: `node scripts/exec/worktree-sweep-hazard.test.mjs` → `38 passed, 0 failed`
- Mutation table above, eight of eight caught, two of them only after their
  first fixture was proved vacuous
- `node scripts/exec/worktree-sweep-hazard.mjs --check-root /tmp/exec-item --json`
  on the operator host, for the named sweeper and its declared bound
