# 2026-09-23-t726-toolchain-fixture-manifest — Declare what the execution toolchain needs to run

## Release ID

`2026-09-23-t726-toolchain-fixture-manifest`

## Status

`candidate`

## Plain-English Summary

The operator toolchain under `scripts/exec/` has eight small programs and a behavioural test suite
for each. Several of those suites work by copying the programs into a scratch directory and running
them there, against synthetic documents, so a test never touches a real operator file.

Each suite kept its **own hand-written list** of which programs to copy, and nothing anywhere stated
the real answer. Those lists went stale twice inside a single working session — each time because one
program started using another, and each time the suite found out by crashing.

Crashing is the cheap outcome. The same list also decides what the copied programs can *see* while
they run, and one list was already wrong in the quiet way when this change began: a suite copied three
programs, and one of them looks for a fourth by filename at run time rather than importing it.
Nothing crashed. The program simply reported a different answer inside the scratch directory than it
reports in the real one — and the suite stayed green, because none of its cases happened to ask the
question where the two answers differ.

This change removes the lists. A scratch directory now gets the whole toolchain, declared in one
place and read from disk every time, so a program added tomorrow reaches every scratch directory
without anyone remembering to update anything. The new suite proves it the hard way: it adds a real
new program to a copy of the toolchain, makes two real programs use it, and then runs each of the
four sibling suites from that copy. Before the change all four fail. After it, all four pass.

One further defect was found while proving this one, and is fixed here: when a program in this
directory wrongly decides it was *run* rather than *imported*, every suite that imports it prints
nothing and exits successfully — which continuous integration reads as a pass. That is measured, not
hypothetical: forcing that mistake made three suites report zero results and exit 0. The entry-guard
case in the CLI suite now covers every program in the directory rather than the two that had the
original defect, so the mistake now fails loudly.

A second finding is **recorded and not fixed here**: two of the programs have no such guard at all, so
importing either one runs it. They are exempted by name, and the exemption is written so that it
fails the moment either is fixed and the name is not removed.

## Layer Impact

- **Release lane: `internal-admin`.** This is AbarVa-only operational tooling — the two-lane
  execution toolchain and the CI workflow that runs its contracts. No client, tenant or public
  surface is reachable from any file in this change.
- **Control / tooling only.** `scripts/exec/` is the operator execution toolchain and its CI
  workflow. No product surface, no route, no API, no data-plane read or write, no tenant data, no
  migration, no schema, no agent prompt or retrieval path.
- Canonical model, adapters, intake and all seven products are untouched. Nothing under `src/`
  changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — the two-lane execution toolchain and its CI workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/toolchain-manifest.mjs` — **new.** `toolchainFiles()` (every non-suite file beside
  it, read from disk on each call), `copyToolchainInto(dest, { dir, exclude })`,
  `missingToolchainFiles(fixtureDir, dir)`, `isSuiteFile(name)`, plus a `--json` CLI behind the
  shared entry guard from item T-723.
- `scripts/exec/toolchain-manifest.test.mjs` — **new.** 17 cases.
- `scripts/exec/build-execution-queue.test.mjs`, `scripts/exec/build-source-board.test.mjs`,
  `scripts/exec/queue-provenance.test.mjs`, `scripts/exec/cli-entry.test.mjs` — each hand-written
  copy list replaced by the declared manifest.
- `scripts/exec/cli-entry.test.mjs` — the entry-guard case generalised from two named modules to
  every module in the directory, with a self-retiring exemption for the two that have no guard.
- `.github/workflows/execution-queue-toolchain.yml` — one new step, `Run the toolchain manifest
  contract`.

No file outside `scripts/exec/`, `.github/workflows/execution-queue-toolchain.yml` and this record is
touched.

## QA / Validation

**Red first, over the same scope, on clean `origin/main` `64633102f`. None of these numbers is
absolute.**

| | manifest suite | four converted suites |
|---|---|---|
| new suite, sibling suites unconverted | **13 passed / 4 failed** | n/a |
| after conversion | **17 passed / 0 failed** | all green |

The four failures are the four acceptance cases, and each one is a sibling suite genuinely failing
inside the case: `build-execution-queue.test.mjs` and `build-source-board.test.mjs` crashed on
collection, `queue-provenance.test.mjs` read **27 passed / 3 failed** — the same 27/3 item T-723
recorded when this happened by accident — and `cli-entry.test.mjs` read 13/4.

**Sibling suites, before and after.** `append-claim` 50/0, `build-execution-queue` 140/0,
`build-source-board` 23/0, `queue-provenance` 30/0, `register-time-authority` 233/0,
`worktree-retention` 22/0 — unchanged either side. `cli-entry` moves 17/0 → **20/0**: the three added
cases are the generalised entry-guard contract described below.

**The known positive, measured by execution before any code was written, and now a permanent case.**
A queue file that exists, read by `queue-provenance.mjs` from two directories:

```
repo directory          -> verdict "unstamped"
three-file hand copy    -> verdict "generator_missing"
```

Nothing threw. `queue-provenance.mjs` names `build-execution-queue.mjs` by path, not by import, so a
short copy changes the answer instead of failing. The suite that owned that list stayed green because
its cases only drive the branch where both collapse to `absent`.

**Eighteen mutations. Seventeen caught on first measurement; the eighteenth survived, and closing it
is part of this change.**

Caught by the manifest suite: `isSuiteFile` always false (15/2); `toolchainFiles` frozen to a
constant list (7/10); `toolchainFiles` dropping non-`.mjs` files (13/4); `exclude` no longer
withholding (15/2); excluding a file that does not exist permitted (16/1); `missingToolchainFiles`
always empty (16/1); the CLI never running (15/2); `copyToolchainInto` copying nothing (12/5) or
skipping the first file (13/4); and each of the four converted suites reverted to its old hand list
(16/1 each).

Caught by the CLI suite: the exemption list emptied, padded with a guarded module, or naming a file
that does not exist (19/1 each). These hold down the exemption in both directions — it cannot quietly
grow, and it cannot outlive the defect it names.

**The survivor, and why it is the most important number here.** Forcing the entry guard in
`toolchain-manifest.mjs` to answer "run" made the manifest suite, `build-execution-queue.test.mjs`
and `cli-entry.test.mjs` each print the CLI's output and **exit 0 having run zero cases**. CI reads
that as a pass. It is this directory's founding defect reached from a new direction, and this change
had widened its reach by giving three more suites a CLI module to import.

It is closed rather than reported. `cli-entry.test.mjs` now imports **every** module in the directory
in one child process and requires the output to be exactly `IMPORTED_CLEANLY`, and that suite no
longer statically imports the manifest — it runs its CLI instead — so it stays executable when a
guard elsewhere in the directory is wrong. Under the same mutation it now reads **19 passed / 1
failed**, exit 1.

**Found while closing it, recorded and not fixed: `build-execution-queue.mjs` and
`build-source-board.mjs` have no entry guard at all.** Measured one module per child process:
importing either one runs it. T-723 gave four modules the shared guard and never looked at these two.
Fixing them is not in this change and those files are untouched; the finding is filed as item T-727.
The exemption that lets this change ship asserts each exempt module **still** runs on import, so the
day either gains a guard the case fails until the name is removed.

**Gates.** `npx eslint scripts/exec/` exit 0, zero problems.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0 with
`tsconfig.tsbuildinfo` removed first, judged by exit code and not by grepping its output.
`node scripts/release-check.mjs --base origin/main --head HEAD` exit 0.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and deploys on merge as it
does for every commit; nothing here changes what that workflow ships, because no file in this change
is part of the web image's behaviour. The new CI step runs on any pull request touching
`scripts/exec/**`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command is issued by this change.
- Approved image digest: whatever the repo-owned workflow produces for the merge commit; this
  release neither pins nor selects one.
- ACA runtime invariant: to be proven after merge as for any commit — Container App template image
  equal to the 100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; no worker job definition is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, structurally.** Nothing under `src/` changes, so no product
  surface can differ.

## Rollback Plan

`git revert` the squash commit. The change is additive plus four localised test edits and one CI
step; reverting restores the previous hand-written lists exactly and removes the new suite and its
workflow step. No migration, no data, no flag, no runtime state.

## Known Gaps

- **Two programs in this directory still run when they are imported**, and this change does not fix
  them: `build-execution-queue.mjs` and `build-source-board.mjs` have no entry guard. They are
  exempted by name from the generalised entry-guard case, the exemption asserts they still have the
  defect so it cannot outlive it, and the work is filed as item T-727. Today nothing imports either
  one, so the exposure is latent rather than live — but this change does put both into every scratch
  directory, so a future fixture that imported one would run a generator instead of loading it.
- **The manifest suite itself still exits 0 silently if its own entry guard is wrong.** It imports
  the manifest module statically, so a guard that answers "run" ends the process before any case.
  What closes the hole is that `cli-entry.test.mjs` does *not* import it and fails loudly on the same
  mutation, so CI cannot go green. A per-suite guarantee — every suite proving it reported — is not
  attempted here and is not filed; the directory-wide assertion is the control that exists.
- **`copyToolchainInto` copies README.md** along with the executables, because the rule is "every
  non-suite file" and not an extension allowlist. That is deliberate: an allowlist is a list, and a
  list going stale is this item. The cost is one harmless file per scratch directory.
- **Nothing forces a future suite to use the manifest.** A new suite could write its own copy list
  and no control would object. The four that exist are converted; a lint rule or a directory-wide
  assertion against literal `.mjs` filename arrays was considered and not built, because an assertion
  over source text is the shape that passes without running anything.

## Audit Evidence

- The pull request for this record and its CI run, including the `Run the toolchain manifest
  contract` step and the seven sibling suite steps.
- The counts above, each reproducible locally: `node scripts/exec/toolchain-manifest.test.mjs` and
  the seven sibling suites.
- `node scripts/exec/toolchain-manifest.mjs --json`, which prints the files any fixture must contain.
- Item T-726 in the execution backlog, and item T-727 for the two unguarded generators.
