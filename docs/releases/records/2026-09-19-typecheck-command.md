# 2026-09-19-typecheck-command — One typecheck command that cannot report a crash as a pass

## Release ID

`2026-09-19-typecheck-command`

## Status

`candidate`

## Plain-English Summary

Until this change the repository had no single command for checking TypeScript types.
`package.json` defined none, the two CI jobs that run the compiler invoked it two different
ways, and every engineer and every release record wrote a third by hand.

The hand-written form has a specific failure. On a full check of this project the compiler
exhausts the default memory limit: it aborts, exits non-zero, and prints about ninety lines
of runtime crash trace that contain no type error at all. The common habit of filtering that
output for the words `error TS` therefore returns nothing, and a crash is read as a pass —
with any genuine type error inside that run invisible. A release record already on `main`
carries a correction saying exactly this about a check it had previously reported as passing.

There is now one command, `npm run typecheck`. It clears any cached compiler state before it
starts so the answer never depends on an artifact left by an earlier run, raises the memory
limit above the level at which this project dies, and — the point of the exercise — tells the
three possible outcomes apart. A clean check exits 0. Reported type errors exit 1. A compiler
that produced no verdict at all exits 3 and says `CRASHED` in plain words, so the absence of
an answer can no longer be mistaken for a good one. Both CI jobs now run that one command, so
what runs locally and what runs in CI are the same thing.

The backlog item behind this change blamed a stale incremental-build cache for reporting
errors on files that had already been fixed. That mechanism was driven on `main` in both
directions and does not reproduce; the finding is recorded below rather than quietly dropped.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only engineering and CI capability. It is
deliberately not `global-control-lane`: no shared app or control-plane behaviour changes, and
nothing in the deployed image differs.

- **Layer 4 (Products):** none. No product surface, route, component, prompt, agent control,
  schema or data path is touched.
- **Developer tooling and CI:** the only layer affected. One new script, one new npm entry,
  and the command two existing workflow steps invoke.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — engineering tooling and CI only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/typecheck.mjs` (new) — the command: clears build-info, applies a memory
  floor, classifies the outcome, exits 0 / 1 / 3.
- `src/__tests__/behaviors/typecheck-command.test.ts` (new) — 14 behavioural cases driving a
  byte-copy of the real script inside scratch projects.
- `package.json` — one added script, `typecheck`.
- `.github/workflows/production-readiness-gate.yml` — the `TypeScript typecheck` step now runs
  `npm run typecheck`.
- `.github/workflows/reasoning-layer-guard.yml` — the same, for its full-project step.

## QA / Validation

**The defect, reproduced on clean `main` at `b35ed8c00` before any edit.** A cold bare
`npx tsc --noEmit` exits **134**, prints **90 lines** of runtime crash output, matches
`error TS` on **0** of them, and writes no build-info. The filtered form reads as clean.

**The item's stated mechanism does not reproduce, and it was driven rather than read.** With a
build-info recording a clean project, introducing a type error is still reported (exit 2, one
diagnostic). With a build-info recording that error, restoring the file gives exit 0. The
compiler versions files by content hash, so an edit is always re-checked and a fix is always
believed. Clearing the build-info is still the right contract — it removes a dependency on
earlier state rather than a demonstrated bug — but the reproducible defect was the crash.

**Failing first, identical file either side:** 14 failed / 14 total before, **14 passed / 14
after**. Every case failed against `main`, because the command did not exist.

**Scope baseline, same command either side** (`npm run test:behaviors`, changed files removed
to measure the "before"): **29 suites / 290 tests / 0 failing before → 30 / 304 / 0 after**.

**End-to-end on the real project, not only in scratch:** `npm run typecheck` exits **0** in
~47s and prints `typecheck: clean`, leaving no build-info behind. With one deliberate type
error injected into a real source file it exits **1** and prints that diagnostic; the file was
byte-restored and the restore confirmed.

**Ten mutations, ten caught**, each byte-restored with the restore confirmed by `diff -q`:
classify non-zero-without-diagnostics as clean (1 failed); delete the signal branch (1);
delete the build-info removal (1); drop `--incremental false` (2); drop the memory merge (1);
lower the floor to 4096 (1); let the floor override a higher caller value (1); delete the
missing-compiler branch (1); delete the npm script (1); return a workflow to the bare command
(2).

**Two of those ten survived their first attempt and the gaps were closed rather than
recorded.** Deleting the signal branch survived, because every crash the suite drove was
non-zero *and* diagnostic-free, which the fallthrough already handles; the branch only matters
when a compiler dies *after* printing partial diagnostics, and a case for that was added.
Deleting the missing-compiler branch survived, because a missing entry point already exits
non-zero with no diagnostic — the branch changes the message, not the verdict, so the case now
asserts the message names `npm ci`. Both mutations fail after the additions.

- `npm run typecheck`: **exit 0**, clean.
- `npx eslint` on both new files: **exit 0**, no output.
- Both workflow files parse under a real YAML loader, and their typecheck steps resolve to
  `npm run typecheck`.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: recorded on the PR.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in the deployed image changes. The repo-owned
main deploy workflow will build and deploy the merge commit as it does for every merge, and
the runtime invariant is read back afterwards as usual, but no product behaviour is altered
by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image content changes.
- ACA runtime invariant: read back after the post-merge deploy, as standing practice.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no route, component, copy, prompt, schema or data
  path changes. There is nothing a signed-in session could observe.

## Rollback Plan

Revert the PR. The two workflow steps return to their previous inline commands and the npm
script and its script file are removed. No migration, no data change, no runtime state.

## Audit Evidence

- The PR, its diff and its CI run.
- The behavioural suite, which runs in the `Behavior coverage floor` job through
  `npm run test:behaviors`.
- Both workflow jobs' own logs, which now show `npm run typecheck` and its verdict line.

## Known Gaps

- **Other invocations of the compiler are not converted.** Historical status files, audit logs
  and older release records quote hand-written forms. They are records of past runs and are
  left as written; the anti-regression case covers the two workflows that typecheck today, not
  every string in the repository's history.
- **The memory floor is a measured number, not a derived one.** 6144 is what both CI jobs
  already used and what completes here; a project that grows past it will crash again, and the
  difference is that the crash will now say so and exit 3 instead of reading as a pass.
- **`tools/source-crawl` keeps its own `typecheck` script** against its own tsconfig. It is a
  separate package with a separate project and is out of scope.
