# 2026-10-02-release-check-runs-every-gate — The release check runs every gate it lists

## Release ID

`2026-10-02-release-check-runs-every-gate`

## Status

`candidate`

## Plain-English Summary

`npm run release:check` is a list of eleven gates. It used to load all eleven into one process,
one after another. Two of those gates end the process with a success status when they pass. So
whichever of the two was reached first ended the whole run as a pass, and every gate listed after
it was never started. Nothing in the output said so: the run simply stopped after a line that
read as a pass.

Measured on `main` before this change:

- On a change that touches release-relevant files, the run always ended at the ninth gate. The
  tenth and eleventh gates never ran.
- On a change that touches no release-relevant files, the run ended at the fourth gate. Gates
  five to eleven never ran.

Each gate now runs as its own process. A gate that ends its process ends only itself, and the
release check reads its exit status. The release check prints which gate it is running, then a
summary that names every gate with its verdict, and it exits non-zero if any gate did not pass or
if no gate is listed at all.

The two gates that had never run inside the release check were both failing when run on their
own. Neither failure was a defect in product code. In both cases the gate itself had drifted
while nothing was running it, and each is repaired here:

- The Home route gate required `/home` to mount a reader component that the route stopped
  mounting when it moved to the current executive readout. The gate now requires the component
  the route mounts today, and refuses the old reader as a retired surface.
- The context truth gate runs a script that imported a module index which also re-exports a
  server-only module, so the script threw on import before checking anything. The script now
  imports the corpus from the module that defines it.

One consequence to expect: a change with no release-relevant files used to skip seven gates
without saying so. It now runs all eleven.

## Layer Impact

**Release lane: `global-control-lane`** — shared build and release control behavior, for every
change to the repository, with no feature gate.

- **Products:** none. No route, component, API, schema, tenant data, prompt or answer path is
  touched, and nothing a signed-in user can reach changes.
- **Build and release tooling:** the release check's runner is replaced, its gate list becomes a
  data file, two gates are corrected so that they pass on the code as it is, and one test suite,
  one workflow step, one `package.json` script and one gate-registry entry are added.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository release controls only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/release-check.mjs` — no longer imports any gate. It hands the gate list and its own
  arguments to the runner and exits with the runner's exit code.
- `scripts/release-control/release-gates.mjs` (new) — the eleven gates, in the same order as
  before.
- `scripts/release-control/run-release-gates.mjs` (new) — starts each listed gate as a child of
  the same Node binary, passes the arguments through unchanged, and turns each child result into
  a verdict: exit 0 passes; any other exit status, a signal, or a failure to start fails. An
  empty list fails.
- `scripts/release-control/check-home-route-surface.mjs` — requires
  `@/components/home/preview/HomePreviewAppRoot` to be imported and mounted, where it required
  `HomeSurface`; `HomeSurface` joins the retired markers. The other retired markers and the two
  retired-file checks are unchanged. The route has mounted `HomePreviewAppRoot` since commit
  `a735000145`, which also stated the same expectation in the route's boundary contract test.
- `src/scripts/intelligence/scb-truth-gates.ts` — one import changed from `@/lib/intelligence`
  to `@/lib/intelligence/loader`, which is where `corpus` is defined and is what the script
  imported when the gate was introduced in commit `6d2fdc3b74`. No check in the script changed.
  The script also refuses, with exit 2, a run in any mode other than `--static-only`, the one
  mode it implements; it used to print nothing and exit 0. It runs its checks only when it is
  the entry point, so the suite that imports it does not start a run.
- `scripts/release-control/__tests__/run-release-check-runs-every-gate-tests.mjs` (new) —
  thirteen cases, described under QA.
- `package.json` — `check:release-check-runs-every-gate`.
- `.github/workflows/release-control.yml` — one step that runs the new suite before the release
  check. The job name, its triggers and its other steps are unchanged.
- `docs/architecture/ci-gate-registry.json` — the new script, classified `pr-gate`.

The gates themselves are otherwise untouched, including the two that call `process.exit(0)`.
That is deliberate: with each gate in its own process, how a gate ends no longer matters, so a
gate added later that exits the same way cannot bring the defect back.

## QA / Validation

Every result below was judged by exit code. Node 25.9.0 locally unless stated; the suite and the
release check were also run under Node 24.15.0, the version the workflow uses.

**Baseline on `main` (`37956c4a6a`), before any edit.** Measured with a preload that marks the
start and end of each gate module's evaluation and names the caller of `process.exit`, without
editing any gate:

- Release-relevant diff: gates 1 to 8 evaluated to the end, gate 9 called `process.exit(0)`,
  gates 10 and 11 never began. Exit 0.
- No release-relevant diff: gates 1 to 3 evaluated to the end, gate 4 called `process.exit(0)`,
  gates 5 to 11 never began. Exit 0.
- Gates 10 and 11 run on their own: exit 1 each.
- The same shape in CI: the release-check step of a passing run on another pull request ends at
  the ninth gate's pass line.

**The new suite — pass, 13 of 13** (`npm run check:release-check-runs-every-gate`, exit 0; the
first twelve cases also under Node 24.15.0). It copies the real entry point and the real runner into a scratch
directory beside a fixture gate list, and reads what ran from a log the fixture gates write
themselves:

- a gate that passes by calling `process.exit(0)` does not stop the gates after it;
- the same fixtures imported into one process do stop there and still exit 0, which is the
  control showing the fixtures can produce the defect;
- a gate that exits 1, throws, sets `process.exitCode`, is killed by a signal, has no file, or
  cannot be started each fails the check on its own, and the gates after it still run;
- a failing gate fails the check whether it is listed first or last;
- an empty list fails; every gate receives the arguments;
- the context truth script exits 0 in its static mode, exits 2 with nothing on stdout in any
  other mode, and does not run when it is imported.

**The fix was then broken on purpose, and the suite failed every time — pass, 16 of 16 killed.**
Each edit was applied to the shipped files, the suite run, and the files restored and verified
byte for byte.

| edit | suite |
|---|---|
| the entry point restored to its form on `main` | exit 1, 10 cases fail |
| gates evaluated inside the runner's process instead of as children | exit 1, 10 cases fail |
| exit code ignores failed gates | exit 1, 8 cases fail |
| every child result read as a pass | exit 1, 7 cases fail |
| runner stops at the first failing gate | exit 1, 6 cases fail |
| arguments not passed to gates | exit 1, 1 case fails |
| an empty list passes | exit 1, 1 case fails |
| entry point discards the runner's exit code | exit 1, 8 cases fail |
| a gate imported into the entry point again | exit 1, 10 cases fail |
| a signal death read as a pass | exit 1, 1 case fails |
| a failure to start read as a pass | exit 1, 1 case fails |
| summary lists only failing gates | exit 1, 5 cases fail |
| one listed gate skipped | exit 1, 9 cases fail |
| the truth script returns silently outside its static mode | exit 1, 1 case fails |
| the truth script runs when imported | exit 1, 1 case fails |
| the truth script never runs | exit 1, 1 case fails |

One edit was expected to change nothing and did change nothing: `process.exit(0)` added to the
success path of a real middle gate. Under the new runner the release check still reported eleven
of eleven gates and the suite stayed green. Under the previous runner the same edit ended the run
at that gate with exit 0.

**The release check itself — pass.** `node scripts/release-check.mjs --base origin/main --head
HEAD` with this change in the working tree: eleven of eleven gates ran, eleven passed, exit 0.
Before this record existed the same command exited 1 with the release-record gate failing and
the seven gates after it still reported.

**The two repaired gates.**

- Home route gate — pass. Exit 1 before, exit 0 after. Replayed against every committed version
  of the `/home` page since the gate was added: it fails all 39 versions before `a735000145` and
  passes all 7 from it onward. With a `HomeSurface` import added to the current page it fails on
  that marker alone; with the page missing it fails.
- Context truth gate — pass. Exit 1 before (server-only import error), exit 0 after. With a
  dangling pattern reference introduced into a scratch copy of the corpus it exits 1, and exits 0
  again when the copy is restored. `npx jest --runTestsByPath
  src/scripts/__tests__/scb-truth-gates.test.ts` — pass, 6 of 6, before and after.

**Without installed packages — pass.** The release-control job installs no dependencies, so the
workflow's six steps were run in a fresh clone holding this change, under Node 24.15.0, with no
`node_modules` anywhere above it and `npx tsx` resolved to a `tsx` binary alone. All six steps
exit 0, and the release check reported eleven of eleven gates passed.

**Wiring and style — pass.**

- `npm run audit:ci-gate-registry` — exit 0 (234 scripts, 37 `pr-gate`).
- `npm run audit:ci-gate-registry-order` — exit 0.
- `npm run test:npm-script-targets` — exit 0.
- `npm run check:cli-invocation-guard` — exit 0, 3 of 3.
- `npm run check:release-record-tenant-narrative-guard`, `check:tenant-narrative-term-drift`,
  `check:release-record-lane-guard`, `check:release-record-template-contract` — exit 0 each.
- `npx eslint` on the six touched source files — exit 0, no errors or warnings.
- `npm run typecheck` — exit 0.

**Not run.** The GitHub workflow itself has not run on this change at the time of writing; the
clone above is a local stand-in for it.

## Rollout Plan

Merge to `main`. No runtime rollout: no image content, migration, flag, environment variable or
product surface changes. The release-control workflow uses the new runner and the new step from
the pull request that carries this change onward.

A pull request that adds a gate by adding an `import` line to `scripts/release-check.mjs` will
conflict with this change. The resolution is to add the gate's path to
`scripts/release-control/release-gates.mjs` instead; the new suite fails if a gate is imported
into the entry point.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this change.
- Shared runtime mutators: none. No Azure command is run and no Container App template, revision
  weight, environment variable, secret or scale setting is changed.
- Approved image digest: not applicable — no runtime image change is requested or required.
- ACA runtime invariant: unchanged; the post-merge deploy is verified as routine.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Nothing reachable by a signed-in user changes.

## Rollback Plan

Revert the pull request. That restores the previous runner, and with it the behavior in which the
gates after the first success exit do not run, so a revert should be followed by a different
repair rather than left in place. No data, schema or runtime consequence either way.

## Audit Evidence

- `npm run check:release-check-runs-every-gate`, which reproduces the twelve cases.
- The release check's own output, which now ends with a per-gate summary and a count.
- The release-control workflow run on the pull request that carries this change.
- `docs/architecture/ci-gate-registry.json`, entry `check:release-check-runs-every-gate`.

## Known Gaps

- **The context truth gate proves less than its four check names say.** In the static mode the
  release check uses, the script compares the authored patterns and expert packs with a snapshot
  built from those same values, and sets the record and vector counts itself, so those four
  checks cannot fail there. What the run does verify is that the corpus loads and passes its
  load-time integrity assertions, and that the expert-pack registry evaluates. Giving the static
  mode an independent source of truth is a separate change.
- **The script implements only its static mode.** A run in any other mode, including the live
  mode its tracker describes, is now refused with exit 2 instead of exiting 0 having checked
  nothing. The live mode itself is still not implemented.
- **The Home route gate is a text check of one file.** It reads the page source for an import
  and a mount; it does not render the route. The route's boundary contract test states the same
  expectation, is not run by any workflow, and has two failing cases about other files.
- **Nothing checks that every gate script is in the list.** A gate that exists but is not listed
  is not run. The list is a tracked file under `scripts/`, so a change to it needs a release
  record like any other.
- Two sentences in the product manual and its generator still say the release gate "imports" the
  manual check. The check is unchanged and still runs; only the wording is out of date.
