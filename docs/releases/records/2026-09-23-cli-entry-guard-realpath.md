# 2026-09-23-cli-entry-guard-realpath — A CLI guard that silently declines is a control that never runs

## Release ID

`2026-09-23-cli-entry-guard-realpath`

## Status

`candidate`

## Plain-English Summary

Every script in `scripts/exec/` is two things at once: a module other scripts
import, and a command an operator runs. So each one has to answer a single
question — *was I run, or was I imported?* Four of them answered it four
different ways, and only one was right.

Two were wrong in the worst possible direction. They decided "imported", did
nothing at all, and **exited 0**. No error, no output, no work.

The cause is one line of path handling. `path.resolve` tidies a path; it does not
follow symlinks. On macOS `/tmp` is a symlink to `/private/tmp`, and a module's
own URL is always the fully-resolved path while the path the operator typed is
not. So whenever one of these commands was run through `/tmp`, the two never
matched and the command quietly declined to start. The operator task file tells
agents to work in `/tmp/exec-<item>-<timestamp>`, which makes the broken path the
likely one rather than an edge case.

Measured, both through a `/tmp` path:

```
node <dir>/queue-provenance.mjs --register <register>            -> no output, exit 0
node <dir>/worktree-retention.mjs --check --free-floor-gib 9999  -> no output, exit 0
```

**The second one is why this is not a tidy-up.** That command's entire contract is
to exit `1` when free disk is below a floor. It shipped earlier the same day
*because* a scheduled run had died of `ENOSPC` with 580 MiB free. Run the way the
task file tells you to run it, it reported success and checked nothing.

This replaces all of it with one shared predicate that resolves both sides and
compares actual files.

## Layer Impact

Release lane: `internal-admin` — an AbarVa-only operations capability. Platform
tooling only. No product layer is touched: not client intake, not the source
adapters, not the canonical model, not any of the seven products. Nothing under
`src/` changes, and no runtime, route, schema, migration, job or prompt is
affected.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — operator controls and their CI contract.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/cli-entry.mjs` — **new.** `isDirectInvocation(importMetaUrl, argv1)`:
  resolves both sides with `fs.realpathSync` and compares files.
- `scripts/exec/cli-entry.test.mjs` — **new.** 17 behavioural cases.
- `scripts/exec/queue-provenance.mjs` — guard replaced.
- `scripts/exec/worktree-retention.mjs` — guard replaced.
- `scripts/exec/queue-provenance.test.mjs`, `scripts/exec/build-execution-queue.test.mjs`
  — fixtures copy `cli-entry.mjs`, which the provenance module now imports.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new suite.
- `scripts/exec/README.md` — the four guards, the measurement, and the one rule.

### Two decisions worth a reviewer's attention

1. **The unknown case answers "imported", inverting this directory's fail-closed
   rule, on purpose.** Everywhere else here an unknown verdict refuses, because
   refusing costs one rerun. This is not a gate: it decides whether to *execute*
   a CLI. An unknown case answering "run" would make a plain `import` execute the
   command — and `append-claim.mjs` imports `queue-provenance.mjs` on every
   claim. Two cases hold that direction down, and mutation M6 is exactly it.
2. **`register-time-authority.mjs` is deliberately not changed.** Its guard
   matches on a filename suffix, which *does* work under a symlink, so it is
   loose rather than broken — it would also run for any file whose name ends the
   same way. It is recorded in the README rather than edited, for two reasons:
   the defect here is silent non-execution and that guard does not have it, and
   another run holds that file with an open pull request.

## QA / Validation

**Red first, over the same scope, and the red is discriminating rather than a
missing import.** The predicate was written first and both call sites left alone,
so the failure lands on the real defect: **13 passed / 4 failed → 17 / 0.** The
four are the two CLIs × (real path, symlinked path).

**The real-path cases failed too, which widens the finding.** `os.tmpdir()` is
itself reached through a symlink on macOS (`/var/folders/…` ← `/private/var/folders/…`),
so this was never only about someone typing `/tmp`. Any temporary directory did it.

**Proven against the live symptom, not only in fixtures.** The exact command that
had produced no output —
`node /tmp/exec-T723-.../scripts/exec/queue-provenance.mjs --register <register>`
— now prints its verdict. And
`worktree-retention.mjs --check` invoked the same way began actually classifying
the machine's 798 worktrees, which is slow (T-719's own record notes this) and was
stopped once it had demonstrably engaged. Engagement was the claim; the verdict
was not.

**Every suite in the directory, both sides.** Baseline from a clean extraction of
the branch point `669de4400`:

| suite | `origin/main` | this branch |
|---|---|---|
| `cli-entry.test.mjs` | — (new) | 17 / 0 |
| `queue-provenance.test.mjs` | 30 / 0 | 30 / 0 |
| `worktree-retention.test.mjs` | 22 / 0 | 22 / 0 |
| `append-claim.test.mjs` | 50 / 0 | 50 / 0 |
| `build-execution-queue.test.mjs` | 140 / 0 | 140 / 0 |
| `build-source-board.test.mjs` | 23 / 0 | 23 / 0 |
| `register-time-authority.test.mjs` | 186 / 0 | 186 / 0 |

Two went red in between and were repaired by extending a fixture's copy list, not
by weakening a case: `queue-provenance` 30/0 → **27/3**, and
`build-execution-queue` **crashed on collection** (`ERR_MODULE_NOT_FOUND` for
`cli-entry.mjs`). That is the **second time in one session** that a fixture which
copies a subset of this directory broke on a new import, and it is recorded as a
pattern rather than twice as an accident — see Known Gaps.

**Mutation check: 11 deliberate breakages, 11 caught.**

| # | mutation | result |
|---|---|---|
| M1 | `path.resolve` instead of `realpathSync` — the shipped defect | 12 / 5 |
| M2 | realpath on the module side only | 10 / 7 |
| M3 | realpath on the argv side only | 14 / 3 |
| M4 | composed-string comparison — the other shipped defect | 10 / 7 |
| M5 | suffix match — the `register-time-authority` shape | 16 / 1 |
| M6 | unknown case answers "run" instead of "imported" | 13 / 4 |
| M7 | missing `argv[1]` answers "run" | 16 / 1 |
| M8 | `queue-provenance` guard reverted to `path.resolve` | 15 / 2 |
| M9 | `worktree-retention` guard reverted to the composed string | 15 / 2 |
| M10 | `queue-provenance` CLI always runs, even on import | 15 / 2 |
| M11 | `worktree-retention` CLI always runs, even on import | 15 / 2 |

M1 and M4 restore the two bugs this item fixes, and M5 restores the third
variant, so the table is not a set of invented breakages — three of eleven are
the code that was actually on `main`. M10 and M11 are the opposite error and are
caught only by the import cases, which is why those cases exist.

**A unit test of the predicate alone would have proved nothing.** It passes
against all four guards, because the predicate was never what was wrong — the
comparison it was handed was. Both acceptance cases therefore invoke a real CLI
as a child process through a real symlink the suite creates itself, rather than
relying on `/tmp` being a symlink, which it is on macOS and is not on a Linux
runner. A suite resting on that would silently stop testing anything in CI,
which is the same shape as the defect.

- `node scripts/exec/cli-entry.test.mjs` → `17 passed, 0 failed`
- all six pre-existing suites → table above, no regression
- `npx eslint` over the changed files → exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → judged by exit code
- `node scripts/release-check.mjs --base origin/main --head HEAD` → exit 0

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` changes, so the deployed
image's behaviour is unchanged. The repo-owned ACA workflow builds and deploys the
merge commit as it does for every merge.

Operators gain two commands that previously did nothing when run from a temporary
directory. Nobody needs to change how they invoke them.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` mutation of any kind.
- Approved image digest: n/a — no runtime behaviour changes.
- ACA runtime invariant: proven post-merge from the deploy run at or after the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, structurally — nothing under `src/` changes.

## Rollback Plan

Revert the PR. Both guards return to their previous form, which means both CLIs
return to declining silently under a symlinked path. Nothing else depends on the
new module. No migration, no data, no runtime state.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `exec/t-723-cli-entry-guard-realpath`.
- The `Execution queue toolchain` check, step `Run the CLI entry guard contract`.
- The mutation table above; each row reproducible by applying the named breakage
  and re-running `cli-entry.test.mjs`.
- The operator register lines for item T-723, including the amendment and its
  basis for taking two paths the pre-claim gate reported as held.

## Known Gaps

- **This is the second item in one session, which the operator rules discourage,
  and the reason is that the first one's deliverable did not work.** T-720 shipped
  the `queue-provenance` CLI roughly thirty minutes earlier, with a deploy proof
  and a runtime invariant. The CLI did not run. It was found by executing the
  deliverable after the proof rather than by reading it, and the honest cost is
  that a merged, deployed, invariant-proven item shipped a broken command.
  Recorded here rather than folded quietly into T-720's record.
- **The amendment to this item's claim was appended past a false refusal.** The
  file half of the pre-claim gate named two of these files as held by another
  run, from a register line that *disclaims* them in prose — the defect that
  run's own item (T-722) exists to fix. Rather than override on the prose, that
  run's pull request was read: it changes three files, none of them these. The
  reasoning and the check are both in the register line.
- **A fixture that copies a subset of this directory breaks on every new
  import**, twice in one session now. Nothing declares which files the toolchain
  needs to run; each suite keeps its own list and finds out by crashing. A single
  exported manifest, or a fixture that copies the directory rather than a list,
  would close it. Not done here because it touches suites another run may hold,
  and it is worth its own item rather than a drive-by.
- **`register-time-authority.mjs` still has a third guard**, loose rather than
  broken, left in place for the reasons above. A fifth script inventing a fifth
  answer is now a README violation rather than an impossibility; nothing enforces
  it.
- **`--check` is still an operator control nothing invokes.** T-719 recorded that
  gap and it stands. This item makes the control run *when invoked*; it does not
  make anything invoke it.
