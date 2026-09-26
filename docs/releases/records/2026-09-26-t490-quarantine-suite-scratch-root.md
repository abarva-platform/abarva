# 2026-09-26-t490-quarantine-suite-scratch-root — The second quarantine suite stops writing the shared tree

## Release ID

`2026-09-26-t490-quarantine-suite-scratch-root`

## Status

`candidate`

## Plain-English Summary

A test-quality check guards a small list of Source workspace test suites that are deliberately
held out of CI. The suite that proves the check works also measured something else: that the
coverage census really does credit those held files. It measured that by **rewriting the real
list file in the working tree**, running the census against the modified copy, and putting the
original back in a `finally`.

This is the same defect a sibling change closed on a different list one run earlier, and this
suite was *more* aware of the hazard than that one: its own comment said the case "is the one
thing in the suite that writes to a tracked file", and it asserted the restore rather than
assuming it. That is exactly why it was worth a separate item. **Asserting the restore does not
close the window.** The restore was never the problem; the interval before it was.

Two corrections to the filing, both from measurement rather than reading:

- **The window is not brief.** The mutated list was live for the whole census run — **9.81 s of
  a 10.0 s suite run**, measured on `87785644b`. Roughly thirty-one readers parse that
  directory, so this was ten seconds per run in which any of them could read a wrong list.
- **The write is invisible to every content check.** Across a run the file's mtime moved
  `1790407679 → 1790407827` while its sha256 stayed `76dc8989…` and `git status` stayed clean.
  That is why the same defect survived in two suites at once, and it is why the new regression
  case asserts **mtime**, not bytes.

The fix adds **no new override**. The acceptance asked us to check before adding a flag, because
a second override is a second thing to keep honest — and the check came back negative: the thing
under test here is the census, and `buildCensus(root)` already takes its root. So the suite now
builds a scratch root outside the repository that is the real tree everywhere except the one
file it shadows, and measures there. Nothing in the working tree is touched.

The scratch root is not a fixture, and that is asserted rather than argued: the suite drives the
census over an overlay holding the list **unchanged** and requires the same number the real
repository gives. An overlay that diverged would make every delta measured on it a fiction, so
it is checked in the same run that uses it.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only developer tooling. Not `global-control-lane`:
nothing here is shared app or control-plane behaviour that any client request reaches.

- **Layer 4 / test tooling only.** One test file changed. No product surface, no route, no read
  model, no prompt, no canonical model object, no tenant data, no migration, no auth or RLS.
- **No change to what any control enforces.** `check-source-workspace-quarantine.mjs` is
  untouched — no flag, no new argument, no new default. Every rule it applied before it applies
  now, and its CLI still exits 0 with the same message.
- **No change to the guarded list.** `scripts/quality/source-workspace-quarantine.json` is
  byte-identical and, as of this change, mtime-identical after a suite run.

## Client Applicability

**Internal only — no client receives this change.** No client-facing behaviour changes, no
tenant is affected, and no client data is read, written or projected. This is repository tooling
that runs in CI and on developer machines, so the audience is the engineering team and the CI
runner, not any client or demo surface.

## Changes Included

- `scripts/quality/check-source-workspace-quarantine.test.mjs`
  - `overlayRootShadowing(repository, relativeFile, contents)` builds a scratch root under
    `os.tmpdir()` that symlinks every top-level repository entry except the spine down to the
    shadowed file, which is rebuilt as real directories with linked children. The census reads
    `package.json`, `src`, `.github/workflows`, `docs/architecture` and the script paths its
    commands name; `readdirSync` follows a symlinked directory, so each of those reads lands on
    the real tree and the measurement still speaks about THESE files rather than files shaped
    like them.
  - The scratch base is asserted to be outside the repository **before** the directory is
    created. Checking afterwards orphaned the directory it had just made on the one path where
    the check fires — a write into the tree left behind by the assertion meant to prevent
    writes into the tree. Found while running mutation M3; corrected, and M3 re-run to confirm
    it now leaves nothing behind.
  - The single census-driving measurement is memoised, and the committed list's mtime is
    observed **inside** that memo, around the one real invocation. A case taking its own
    `before` reading would be vacuous whenever another case had already triggered the
    measurement: the write it looks for would be in the past by the time it looked.
  - Three cases replace the one that wrote the tree: the mtime regression case, the
    delta-of-exactly-one case, and the overlay-faithfulness case.
- `docs/releases/records/2026-09-26-t490-quarantine-suite-scratch-root.md` — this record.

## QA / Validation

### The headline proof

A full suite run no longer touches the committed list. `scripts/quality/source-workspace-quarantine.json`
mtime `1790407827` before and `1790407827` after, sha256 `76dc8989…` unchanged, `git status`
clean. Before this change the same reading moved `1790407679 → 1790407827`.

### Mutations — each caught by the case written for it

Run against the fixed tree, one at a time, restoring between each.

| # | Mutation | Cases failing |
|---|---|---|
| M1 | The shared-tree write restored: measure by writing the real list and restoring in a `finally`, exactly as before | 1 — the mtime case, and **only** it |
| M2 | The overlay stops linking `src`, so it is no longer the real tree | 2 — the delta case and the faithfulness case |
| M3 | The scratch base moved inside `scripts/quality` | 3 — the precondition throws, so every case driving the measurement fails, naming the reason |
| M4 | The reduced overlay drops nothing (`slice(0)` for `slice(1)`) | 1 — the delta case |

**M1 is the one that matters, and what it shows is the point of the item.** With the
shared-tree write restored, the delta case and the faithfulness case both still **pass** —
because the pre-fix code measured the right numbers. The defect was never visible in the
result, only in the filesystem, so the mtime case is the only detector there is.

### Scoped clean baseline

Measured over the same scope on both sides, the baseline in a **separate worktree** at
`origin/main` rather than a stash.

| scope | before (`cbe32f46f`) | after |
|---|---|---|
| `node --test scripts/quality/*.test.mjs scripts/exec/*.test.mjs` | 110 tests, 109 pass, **1 fail** | 112 tests, 111 pass, **1 fail** |
| `jest` over the three census behaviour suites | 3 suites, 74 tests, 0 fail | 3 suites, 74 tests, 0 fail |

**0 new failures.** The one failure is the same suite and the same case on both sides and is
**pre-existing on clean `main`**, not caused here: `scripts/exec/id-collision.test.mjs`, case
"the reader classifies far more of the corpus as updates than as filings". It fails only on a
machine that holds the operator document it reads, and is **skipped on CI** — see Known Gaps. It
is reported as a finding rather than quoted as if this change produced it.

### Other gates

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0
  diagnostics. The exit code is judged, not a grep: a bare `npx tsc --noEmit` exits 134 on this
  machine and emits nothing.
- `npx eslint scripts/quality/check-source-workspace-quarantine.test.mjs` — exit 0.
- `node scripts/quality/check-source-workspace-quarantine.mjs` — exit 0, "Source workspace
  quarantine is current (3 held suites, every reason re-measured)".

### The suite is genuinely gating

Checked through the workflow rather than assumed: `.github/workflows/unit-suites.yml:1174`
runs this file under `node --test`, and that workflow triggers on `pull_request` to `main` and
on `merge_group`. So the new regression case fails a pull request, which is what makes it a
control rather than a comment.

## Rollout Plan

Merges to `main` through the repo-owned squash path and takes effect on the next CI run. There
is nothing to enable, no flag, and no ordering constraint against any other change.

## Deployment Authority

The repo-owned ACA main deploy workflow, on merge. No ad-hoc Azure command, no traffic shift, no
registry action is performed or needed by this change: it alters a test file only and ships no
runtime behaviour.

## Rollback Plan

Revert the single commit. The guarded list, the checker and every rule it enforces are unchanged
by this release, so a revert restores the previous test-side measurement and nothing else — and
restores the shared-tree write with it.

## Audit Evidence

- Mutation table above, four mutations, each with the cases that failed.
- Before/after mtime and sha256 readings for the committed list.
- Scoped clean baseline from a separate `origin/main` worktree, stated per-item rather than as a
  count, with the pre-existing failure named.
- Typecheck exit code, scoped ESLint exit code, and the checker CLI's own exit code and output.
- The workflow file and line that runs the suite, with its triggers.

## Known Gaps

- **A case that has inverted on the only machine that runs it, found by this change's baseline
  and not fixed here.** `scripts/exec/id-collision.test.mjs` fails the case "the reader
  classifies far more of the corpus as updates than as filings" on clean `origin/main` at
  `cbe32f46f`. Measured: the reader sees **1,259 occurrences, 621 updates, 638 filings**, so the
  assertion `updates > filings` is false by a 17-row margin. Its subject is an operator document
  outside the repository, which the workflow comment says is deliberate — and the consequence is
  that on CI the document is absent, the three live-corpus cases **skip**, and the suite exits 0
  (60 passed, 0 failed, 3 skipped, verified by running it against an empty home). So this is not
  a red build: it is an assertion that cannot fail where it is enforced and has now inverted
  where it can, which is the shape of a gate that goes red as its corpus grows rather than as the
  code breaks. Out of scope for a one-item change; recorded in the execution pulse.
  It could not be filed as a new backlog id in this run: the `T-500`–`T-599` band this agent
  files from is exhausted, 0 of 100 free, which needs a range decision rather than a careful
  reading.
- **One unresolved observation, moot for this change.** During the pre-correction M3 run, three
  orphaned scratch directories sat inside `scripts/quality/` and a `git status --porcelain` in
  the same shell reported only the modified file. A direct probe afterwards showed `git status`
  *does* report an overlay-shaped untracked directory, and `core.fsmonitor` and
  `core.untrackedCache` are both unset, so the two observations disagree and no cause was
  established. It is moot for what ships: the corrected precondition creates nothing inside the
  repository on any path, which M3 was re-run to confirm.
- **The overlay's faithfulness is asserted on one number**, `untriagedUnrunTestFiles`, which is
  the number the delta is measured in. A probe during development compared the census's whole
  counts object between the real root and an unchanged overlay and found them identical, but
  the committed assertion is the single figure, because a whole-object comparison would go red
  on unrelated census drift and teach the next agent to weaken it.
