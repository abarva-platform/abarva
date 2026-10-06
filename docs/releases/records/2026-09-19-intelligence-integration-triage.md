# 2026-09-19-intelligence-integration-triage — Wire the Intelligence integration directory, with a self-clearing quarantine

## Release ID

`2026-09-19-intelligence-integration-triage`

## Status

`candidate`

## Plain-English Summary

A directory of 33 integration tests for the Intelligence surface had never been run
by any CI job. Running it for the first time produced 26 failing suites and 133
failing assertions — a number large enough to look like a wall of broken product
code. It is not. The triage found **one cause, not 133 problems**.

131 of the 133 failures are a single shape: the test opens a source file **as
text** and asserts substrings of it, and that file does not exist. 107 are
`ENOENT` from `readFileSync`; 24 are `existsSync(...) === true` on a path that is
gone. Every path they name sits under a component directory and a set of route
trees that were retired when the Intelligence surface was rebuilt — none of those
files exists anywhere in the repository any more. So those 25 suites are stale
contracts for a surface that was deliberately replaced. They are not evidence of
a defect in shipping code, and they were never coverage of behaviour even while
they were green: asserting the shape of source text is not asserting what the
product does.

The remaining 2 failures were in the one suite that **does** describe code that
ships, and that suite was repaired rather than excluded. One assertion matched a
source literal together with its surrounding quote characters, so it tracked the
formatter rather than the behaviour and went red when the quote style changed.
The other named on-screen copy that is absent from the file it reads — and its
five sibling *negative* assertions named copy that exists nowhere in `src/`, so
that whole case passed vacuously: it would have passed against an empty file.
That is precisely the "gate you cannot fail" this backlog exists to refuse, so
the guard now runs over the whole advisory surface, where the copy could actually
come back.

The other 25 suites are quarantined by name, with reasons — and the quarantine
does something the existing Source one does not. Every entry records the retired
paths whose **absence** is its reason, and a check asserts each of them is still
absent. Restore any one of those files and the check fails and says to re-run the
suite. An exclusion that cannot outlive its cause is a control; a list of names
nobody re-measures is how a temporary carve-out becomes permanent.

## Layer Impact

Release lane: `global-control-lane` — shared CI and test tooling for the whole
repository, with no client-scoped data, schema or runtime behaviour in it.

- **Layer 4 (Products) — none.** No product code changed. No route, component,
  adapter, loader, projection, schema or tenant record was touched.
- **Platform tooling / CI.** One workflow gains two steps, one npm check is
  added, one behavioural test is generalised, one test suite is repaired.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — CI and test tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/integration-suites.yml` — two new steps: the quarantine
  check, and a separate jest run naming `src/__tests__/integration/intelligence`
  with generated exclusion flags. It is a separate step rather than another path
  on the existing command because its exclusion list is specific to this
  directory; folding the flags into the green command would apply an
  Intelligence-shaped ignore list to every other directory's run.
- `scripts/quality/intelligence-integration-quarantine.json` — the 25 excluded
  suites, the 2 excluded loose root files, three named clusters, and the retired
  paths each entry is waiting on.
- `scripts/quality/intelligence-integration-ignore-args.mjs` — generates the
  `--testPathIgnorePatterns` flags from that list. Only the flags are generated;
  the runner and the path stay in the workflow command, because the
  "Changed integration suites have a CI owner" gate registers a suite only when a
  workflow command names a test runner **and** the suite or a containing
  directory. A wrapper script satisfies neither.
- `scripts/quality/check-intelligence-integration-quarantine.mjs` — refuses a
  stale, malformed, duplicated, **expired** or growing list. New npm script
  `check:intelligence-integration-quarantine`; registered in
  `docs/architecture/ci-gate-registry.json` as a `pr-gate`.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — the case
  that held the Source workflow to its enumeration is now table-driven over both
  quarantined directories, so `intelligence` is held to the same rule with one
  implementation rather than a copy. `intelligence` is removed from the
  known-dark set.
- `src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts`
  — repaired: quote-agnostic mapping assertions, a non-vacuous copy guard over
  the whole advisory surface, and an explicit note on the contradiction below.

## QA / Validation

Measured in a clean worktree branched from `origin/main` `b664cfb56`, same scope
before and after.

**Baseline, the directory as it stood:** 33 suites — **26 failed / 133 failing
assertions / 609 passing / 742 total**. The backlog item's numbers were exact.

**Classification of all 133 failing assertions:**

| Shape | Count |
|---|---|
| `ENOENT` — `readFileSync` of a path that does not exist | 107 |
| `existsSync(...) === true` on a path that does not exist | 24 |
| A stale literal in a file that **does** exist | 2 |

**After:** the wired command runs **8 suites / 131 assertions, all passing**, in
0.9s. The 25 quarantined suites run nowhere, and their 609 "passing" assertions
are deliberately **not** claimed as coverage — a quarantined suite is not
covered, and counting those would be the overstatement this work exists to refuse.

Commands and results:

- `npx jest src/__tests__/integration/intelligence --no-coverage --ci $(node scripts/quality/intelligence-integration-ignore-args.mjs)` → **8 passed / 8 total, 131 tests passed**.
- The pre-existing wired command, re-run for regression → **147 passed, 1 skipped of 148 suites; 4,272 passed, 20 skipped of 4,292** — identical to `main`. (The 1 skipped suite is the separate open item, not caused here.)
- `npx jest --runTestsByPath src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` → **9 passed / 9** (8 before; the table-driven case yields one per quarantined directory).
- `npm run check:intelligence-integration-quarantine` → exit 0, "25 excluded of 33 suites; 8 run on every PR; 30 retired paths are watched for return."
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**, no diagnostics. (Exit code judged, not grepped: a bare `npx tsc` exits 134 on an OOM crash with no output, which reads as a false clean.)
- `npx eslint` over every changed source file → exit 0.

**Every control was broken deliberately and confirmed to fail.** A gate that
cannot fail is not a gate:

| Mutation | Expected | Observed |
|---|---|---|
| Create one retired file the quarantine is waiting on | quarantine check fails | **exit 1**, named the 9 suites whose reason expired |
| Rename the wired path in the workflow command | coverage case fails | **2 failed / 7 passed** |
| Delete one `alsoIgnored` entry, so a red root file rejoins the run | enumeration case fails | **1 failed / 8 passed** |
| Change one alias→canonical tenant mapping in the page | repaired mapping case fails | **1 failed / 5 passed** |
| Reintroduce retired copy into an advisory source file | repaired copy guard fails | **1 failed / 5 passed** |
| Remove the advisory framing from the route metadata | repaired framing case fails | **1 failed / 5 passed** |

Every mutation was reverted and the suites returned to green before commit; the
working tree was confirmed clean of probe edits.

**A contradiction found by running the suites, worth recording:**
`intelligence-route-shell-wiring.test.ts` asserts that a tenant-scoped
Intelligence route page **exists**, while `context-corpus-explorer-route.test.ts`
asserts the same path does **not** exist — and that second assertion passes. Two
suites in one directory holding opposite contracts for one route. It is recorded
in the quarantine rather than resolved by weakening either side, because which
contract is right is a product question about the retired route tree.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow runs on merge as usual.
No runtime behaviour changes: no product code, no migration, no flag, no env var,
no image or template change of substance beyond the ordinary rebuild.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this change mutates no Container App, revision, traffic weight, flag, secret or job
- Approved image digest: whatever the main deploy workflow produces for the merge SHA
- ACA runtime invariant: verified after merge — Container App template digest must equal the 100%-traffic revision digest, and both worker jobs must match
- Worker image invariant: unchanged by this release; asserted after deploy
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — no user-visible surface changes

## Rollback Plan

Revert the merge commit. Nothing outside CI configuration and test files is
touched, so a revert restores the previous state exactly; no migration or data
rollback is involved. A narrower rollback is available if the new job is the only
problem: delete the two workflow steps and the directory stops running, leaving
the rest of the change inert.

## Audit Evidence

- The PR, its full check run, and the merge SHA
- The `Integration suites that pass on main` job log, which must show the new
  Intelligence step reporting 8 suites / 131 tests on a real runner — not only
  locally on one machine
- `scripts/quality/intelligence-integration-quarantine.json`, which is the
  triage itself: 25 suites, each naming the retired paths that are its reason
- The ACA deploy run keyed at or after the merge SHA, and the runtime invariant
  output

## Known Gaps

- **25 suites still do not run**, and saying "the directory is wired" without
  saying that would be false. They need rewriting against the surface that ships
  or deleting with the reason recorded — not the retired tree restored to satisfy
  a text match. The quarantine ceiling only goes down.
- The contradicting route contract above is **unresolved**, and deliberately so:
  it is a product question, not a test-repair question.
- The two loose root suites the path pattern also selects are excluded and
  **untriaged**. Each needs its own item; neither was measured beyond confirming
  it is red.
- One repaired assertion is still a source-text match, now quote-agnostic rather
  than quote-literal. Converting it to behaviour needs the page's private helper
  exported, which is a product change and out of scope here.
- None of these 8 suites has ever executed on a CI runner. They passed locally on
  one machine; the first several runs after merge are where environment-dependent
  flake would show.
