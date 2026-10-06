# 2026-09-23-generator-entry-guard — Execution-queue generators stop running on import

## Release ID

`2026-09-23-generator-entry-guard`

## Status

`candidate`

## Plain-English Summary

Two scripts that generate the internal execution board and work queue would start
generating the moment another file imported them, rather than only when an operator
ran them. Every other script in that directory already asks "was I run, or was I
imported?" before doing anything; these two never asked. They now do, using the same
shared check as their six siblings.

Nothing a client sees changes. No product route, no data plane, no runtime code is
touched: nothing under `src/` imports these scripts. The defect was loud today only
because nothing imports them yet — a test fixture that copies the whole directory and
imported one would have silently run a generator over that fixture's own synthetic
documents and written files inside it.

The behavioural suite that covers this carried an exemption listing both scripts, and
that exemption was written to retire itself: it asserted each exempt script *still*
had the defect, so fixing them made it fail until the names came out. They came out in
this change, which is the exemption working as designed.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operator tooling. It is not
`global-control-lane`: no shared app or control-plane behaviour changes, because nothing
in the running application imports these scripts.

- **Control / tooling only.** `scripts/exec/` is the operator toolchain that produces
  the internal execution board and queue. It is not imported by the application.
- Layers 1–4 of the enterprise information architecture are untouched. No tenant data,
  no schema, no adapter, no product surface.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — the execution-queue toolchain used by agents and operators.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — body wrapped in `runCli()`, invoked only
  when `isDirectInvocation(import.meta.url)` from `scripts/exec/cli-entry.mjs`.
- `scripts/exec/build-source-board.mjs` — same.
- `scripts/exec/cli-entry.test.mjs` — `EXEMPT_UNGUARDED` emptied; the two cases that
  policed the exemption moved behind an `else`, and the now-live empty case given an
  assertion of its own rather than inheriting two unfailable ones.

**The generator bodies keep their module indentation deliberately.** Re-indenting them
would have made both files whole-file rewrites, and both are read byte-for-byte:
`build-execution-queue.mjs`'s own sha256 is the queue-provenance stamp, and
`build-source-board.mjs`'s own sha256 is the stamp the queue checks a summary against.
Left at column zero, each diff is the guard alone, so a reviewer can confirm the body
is unchanged and the moved digests are attributable to exactly those lines.

## QA / Validation

**Re-verified before any edit**, by execution on `d2dce9f805e67292026bdb1312ccaaae7c23748d`,
one importer per module in a temp directory: both modules exit `1` printing generator
output where the six guarded modules print `IMPORTED_CLEANLY`.

**Red first, same suite, same command.** `node scripts/exec/cli-entry.test.mjs`:
**17 passed / 2 failed** with the exemption emptied and the generators unfixed →
**19 passed / 0 failed** after. (The case count moves 20 → 19: two exemption cases
collapse into one while the list is empty.)

**Clean baseline over the whole toolchain, same eight commands either side** — before:
140 / 23 / 258 / 50 / 22 / 30 / 20 / 17 = **560 passed, 0 failed**; after:
140 / 23 / 258 / 50 / 22 / 30 / 19 / 17 = **559 passed, 0 failed**. No suite changed
verdict.

**The body is unchanged in behaviour, measured rather than asserted.** Both generators
were run from a pre-change checkout and from this branch over identical copies of the
operator documents. `source-board.html` is byte-identical. `EXECUTION_QUEUE.md` and
`source-board-summary.json` differ in exactly the two self-hash stamps and the
generation timestamp — which is the provenance control noticing that the generator
changed, not a regression.

**Five mutations, five caught**, each file byte-restored afterwards and the suites
re-run green:

| mutation | caught by | result |
|---|---|---|
| queue generator: guard deleted, `runCli()` unconditional | `cli-entry.test.mjs` | 17 / 2 |
| board generator: guard deleted, `runCli()` unconditional | `cli-entry.test.mjs` | 17 / 2 |
| both guards **inverted** (`!isDirectInvocation`) | `cli-entry.test.mjs` **and** both generator suites | 17 / 2, plus `FAIL fresh summary is accepted and the queue renders` / `ENOENT … EXECUTION_QUEUE.md` |
| a name put back into `EXEMPT_UNGUARDED` after the fix | `cli-entry.test.mjs` | 19 / 1 — "THE EXEMPTION RETIRES ITSELF" refuses the stale exemption |
| a directory read returning no modules | the empty case asserts `modules.length > 0` | would fail rather than pass vacuously |

The inverted-guard mutation is the one worth naming: a guard that answers "imported"
to everything passes every import case and breaks the CLI, so the import cases alone
could not prove the guard is right. The generator suites catch it.

**The per-module case earns its place, and the mutation run showed why.** With only the
queue generator unguarded, the batch importer's stderr reads
`Run: node scripts/exec/build-source-board.mjs …` — that is the *queue* generator's own
message telling the operator to run the board, so the batch evidence names the wrong
file. The per-module case reports `runs its CLI on import=build-execution-queue.mjs`.
The batch also stops at the first module that exits, so a second offender behind the
first is invisible to it.

Typecheck `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
`tsconfig.tsbuildinfo` removed first, judged by exit code. ESLint over the changed
files. `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` imports these scripts, so the
ACA image is unaffected in behaviour. The operator board and queue are regenerated from
merged `main` afterwards so the live artifacts carry the new generator stamps.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is part of this change.
- Approved image digest: not applicable — no runtime behaviour changes.
- ACA runtime invariant: unaffected; will be read back after the merge deploy as routine.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This change is not reachable from any product
  surface; a signed-in session could not observe it.

## Rollback Plan

Revert the PR. The three files are self-contained and have no migration, no data and no
runtime coupling. After a revert the operator board and queue must be regenerated once,
because the generator hashes return to their previous values.

## Audit Evidence

- The PR and its CI run of `.github/workflows/execution-queue-toolchain.yml`, which runs
  all eight suites in this directory, including `cli-entry.test.mjs`.
- The red-first and post-fix suite output quoted above.
- The A/B generation showing `source-board.html` byte-identical across the change.

## Known Gaps

- The **item id band `T-500`–`T-599` is exhausted** for Claude Code and the queue
  generator says so on every run. That is item T-701(b) and is a range decision for the
  owner, not an agent's to guess. Untouched here.
- The board run reports **10 backlog ids absent from `scripts/exec/source-stage-map.json`**
  (`T-709`–`T-714`, `T-720`, `T-723`, `T-728`, `T-729`), so the queue cannot offer them
  and currently shows **0 claimable rows**. Mapping is its own item in another change;
  this one deliberately does not touch the map.
