# 2026-09-27-t496-sentinel-reasoning-canonical-path — Sentinel reasoning moves to the canonical agent path

## Release ID

`2026-09-27-t496-sentinel-reasoning-canonical-path`

## Status

`candidate`

## Plain-English Summary

Backlog item `T-496`. The live Intelligence Ask API route imported a reasoning
module from a directory the codebase retired months ago. The canonical location
is `src/lib/agent/`; the route was importing from `src/lib/agents/`, which had
survived on disk holding that single module and nothing else.

Nothing objected, and that is the whole defect. A retired directory that still
exists still resolves, so the import worked perfectly at run time and no build,
no lint rule and no type check had anything to say about it. The one thing that
did notice — a hygiene suite asserting that no file imports from a retired path —
was correct, and ran in no workflow.

This change moves the module and its suite to the canonical path, repoints every
importer, and **deletes the retired directory** so the old specifier stops
resolving. A rename that leaves the old directory behind fixes today's import
and not tomorrow's.

The hygiene suite is unedited. Its verdict pointed at the product, and the
product is what changed.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for all clients,
not feature-gated — the Intelligence Ask route is one route serving every tenant,
so an import path in it belongs in the shared control lane even though the change
carries no behavioural delta.

- **Layer 4 — Products (Intelligence).** `src/app/api/intelligence/ask/route.ts`
  now imports the Sentinel reasoning entry points from the canonical module path.
  No behaviour, prompt, contract, request shape or response shape changes: the
  module is byte-identical at its new path (git records all seven files as 100%
  renames), and the route's two import specifiers are the only lines edited in
  it.
- **Platform tooling.** The moved suite ran in no workflow at either path. It is
  now wired as a directory in the `Unit suites` job, and its line leaves the
  dark-directory baseline in this same change, which that ratchet asserts as set
  equality in both directions.

No data-plane, schema, migration, RLS, auth or tenancy surface is touched.

## Client Applicability

- All clients: yes, in the sense that the Intelligence Ask route is shared — but
  the change is an import path and a test wiring, with no behavioural delta.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. There is nothing to gate; the module is unchanged.

## Changes Included

- `src/lib/agents/sentinel-reasoning/**` → `src/lib/agent/sentinel-reasoning/**`
  — seven files, 100% renames (`index.ts`, `intent-classifier.ts`,
  `state-machine.ts`, `model.ts`, `types.ts`, `db.ts`, and the
  `__tests__/state-machine.test.ts` suite). The retired `src/lib/agents/`
  directory is deleted, not emptied.
- `src/app/api/intelligence/ask/route.ts` — two import specifiers repointed.
- Four suites and two operator scripts repointed to the canonical path:
  `src/app/api/intelligence/ask/__tests__/route.source-contract-authority.test.ts`,
  `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`,
  `src/__tests__/integration/intelligence/model-input-hash-route.test.ts`,
  `scripts/smoke/foundation-fix-1-retrieval-wiring.spec.ts`,
  `scripts/smoke/sentinel-tenant-pin.spec.ts`,
  `scripts/eval/sentinel-golden/it-productivity.ts`.
- `src/app/api/intelligence/ask/__tests__/t496-sentinel-reasoning-canonical-path.test.ts`
  — new behavioural suite, four cases, named in the Ask step of the `Unit suites`
  job beside the two sibling route suites. First written under
  `src/__tests__/behaviors/`; see **A gate this change failed, and why the gate
  was right** below for why it moved.
- `.github/workflows/unit-suites.yml` — one directory step for the moved module's
  suite, and the new suite named in the existing Intelligence Ask step.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — one
  line removed, 154 → 153 entries.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

**Why the existing guard was not enough, measured rather than argued.**
`src/__tests__/hygiene/canonical-paths.test.ts` is a byte scan over source lines
and requires the literal word `import` on the line. On the state this item was
filed against it therefore reported **one** violation — the route's `import
type` line — and was blind to the other reference in that same file and to the
`jest.mock` call sites naming the identical retired path in three suites. A
sharper regular expression is the same defect with a longer fuse, so the new
suite asserts what a byte scan cannot.

**Red first.** The new suite's first run was a collection failure on the base
commit: the canonical specifier did not exist yet, so jest refused the file
before any case ran (`Could not locate module @/lib/agent/sentinel-reasoning`).
That is an honest "red before" but it credits no individual case, so each case
was proved separately by mutation below.

**Clean baseline, measured in a separate worktree at the same base commit
`be3c7dc27e` — not a stash.** Same scope, eleven suites (ten before the new one
exists):

| | suites | cases |
|---|---|---|
| before | 1 failed / 9 passed of 10 | 1 failed / 75 passed of 76 |
| after | 0 failed / 11 passed of 11 | 0 failed / 80 passed of 80 |

The one failing case before is the hygiene guard naming `route.ts:13`. The +1
suite and +4 cases after are the new suite. No suite in scope moved from passing
to failing.

**Four mutations, four caught — and each recorded against the case that fired,
not against the suite.**

| # | mutation | cases that failed |
|---|---|---|
| 1 | restore the retired copy on disk **and** repoint the route to it — the exact state the item was filed against | 3 of 4: retired specifier resolves, retired directory exists, route bypasses the canonical mock |
| 2 | leave only an **empty** `src/lib/agents` directory, route canonical | 1 of 4: the directory case alone. The resolver case stays green, because an empty directory does not resolve — which is why the two cases are not redundant |
| 3 | canonical barrel stops re-exporting `classifySentinelIntent` | 1 of 4: the export case |
| 4 | route imports the deep module (`…/sentinel-reasoning/intent-classifier`) instead of the canonical barrel — **every path string in the repo still reads `agent`** | 1 of 4: the route-wiring case |

**Mutation 3 initially survived, and fixing that is the substantive part of this
suite.** The export case was first written as `await import(…)` on the canonical
specifier. But that specifier is mocked in this file so the route case can
observe it, so the case was reading the mock's own shape and asserting it against
itself — it stayed green with the real barrel emptied. It now reads the real
module through `jest.requireActual`, and mutation 3 fails it. The comment in the
file records this, because the next person to add a case here will reach for
`import` for the same reason.

Mutation 4 is the one that matters most: it keeps every string in the repository
spelled correctly and still fails, because the assertion is that the live handler
*calls* the canonical module, observed by mocking that path and driving the real
`POST`. A rename cannot satisfy it.

**Wiring proved through the census resolver, not by grepping the workflow.**
`node scripts/quality/test-ci-coverage-census.mjs --check`:

| | covered test files | PR-covered | uncovered directories |
|---|---|---|---|
| base `be3c7dc27e` | 2166 | 2165 | 159 |
| this branch | 2168 | 2167 | 158 |

An earlier draft of this record quoted `2164 → 2166`. Those were the correct
absolute numbers against the **pre-rebase** base `36787485a0`; `main` itself added
two covered files in between. The delta is unchanged at `+2` either way, but the
pair above is the one measured against the base this branch actually sits on.

`+2` covered is the new behavioural suite plus the newly wired moved suite; `-1`
uncovered directory is `sentinel-reasoning`, which now appears nowhere in the
census because the census records only uncovered and partial directories. The
pre-existing 1-file gap between covered and PR-covered is unchanged, so this
change does not widen it. `unit-suites.yml` triggers on `pull_request` against
`main`, so the new step is PR-gated.

The workflow step's command was run verbatim — `npx jest
src/lib/agent/sentinel-reasoning/__tests__ --no-coverage --ci` → 1 suite, 5
cases, all passed.

**Five dark/wired-directory ratchets** (`product-directory-ci-coverage`,
`unit-directory-ci-coverage`, `t491-dark-directory-ratchet-diff`,
`t492-wired-directory-ci-coverage`, `t493-wired-directory-ci-coverage`) → 5
suites, 34 cases, all passed. Before the baseline line was removed, the product
ratchet failed by name with `+ src/lib/agent/sentinel-reasoning/__tests__` and
`+ src/lib/agents/sentinel-reasoning/__tests__` in its set difference, which is
how the required baseline edit was found rather than guessed.

**Typecheck:** `tsconfig.tsbuildinfo` deleted first, then
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit
0, zero diagnostics**. Judged on the exit code, not on a grep: a bare run exits
`134` on this host with no diagnostics at all, which reads as a false clean.

**Lint:** `npx eslint` over the route, the moved module, the new suite and the
three repointed suites with `--max-warnings=0` → exit 0. The ESLint
`no-restricted-imports` group prohibiting `*/lib/agents` is left in place; it now
guards a path that no longer exists, which is the belt to the deletion's braces.

### A gate this change failed, and why the gate was right

The first push failed **one** of 37 checks: `Behavior coverage floor`. It is
recorded here rather than quietly fixed, because the shape is worth knowing.

All 151 behaviour suites passed — **1,624 cases, 0 failures**. The gate failed on
a *percentage floor*: `scripts/ci/check-behavior-coverage.mjs` runs
`npx jest src/__tests__/behaviors --coverage` with **no
`collectCoverageFrom`**, so jest's denominator is every file the run *loads*.

| | lines | statements | functions | branches |
|---|---|---|---|---|
| a sibling branch near this base (run `36334168390`, passing) | 90.90 | 90.90 | 71.33 | 70.17 |
| this branch with the suite in `behaviors` (run `36334904296`) | 83.75 | 83.75 | 42.19 | 66.51 |
| floor | 90 | 90 | 60 | 50 |

One new suite moved lines by **−7.15** and functions by **−29.14**. Measured
rather than inferred: with coverage collected over that suite alone it pulls
**212 files and 137,960 lines** into the map at 77.01% lines and 14.45%
functions, because it imports the real Ask route and therefore its whole import
tree. A representative existing suite in the same directory
(`agent-trace.test.ts`) is **3 files and 550 lines at 98.9%**. So the new suite
alone carries roughly 250× the line volume of a typical member of the set whose
average it is folded into, and it dominates the aggregate.

The floor also sat only **0.90** above the observed line figure before this
change, so the directory had almost no headroom: any suite that imports a large
production module fails this gate. That is a real tension with the standing ask
for tests that execute the real handler, and it is named here rather than
resolved — resolving it means a `collectCoverageFrom` scope or a per-file floor,
which is a change to a required gate and not this item's to make.

**What was done instead.** The gate was not weakened, no threshold was touched,
and no case was dropped. The suite moved to
`src/app/api/intelligence/ask/__tests__/`, the directory that owns the route it
drives, where the two sibling route suites already live and already replace the
same model, data, auth, session and telemetry boundaries. That step runs
`--no-coverage`, so the drag disappears with the suite intact. Its four cases and
all four mutations were re-verified from the new location, including the
`requireActual` vacuity mutation.

That directory is wired **file by file on purpose** — its own comment says exact
files are named so a future writer or sender is not adopted without the same
boundary review — so the new file is named explicitly rather than globbed, and
the boundary review is written into the step's comment.

**The recovery is proved, not assumed.** `node
scripts/ci/check-behavior-coverage.mjs` was run locally on this branch after the
move — the gate's own script, all 150 suites, 1,620 cases — and exits **0** at
**90.90 / 90.90 / 71.33 / 70.17**. Those four figures are *identical* to the
passing sibling run above, which is the strongest available evidence that the new
suite was the whole of the drag and that nothing else in the directory moved.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from
the merge SHA as usual. No migration, no flag, no env var, no worker job, no
manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No branch, local or ad-hoc Azure command touches shared runtime here.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow at merge; recorded
  in the pulse entry once the run keyed at or after the merge SHA completes.
- ACA runtime invariant: to be proved after deploy — Container App template image
  digest must equal the 100%-traffic revision digest, revision Healthy.
- Worker image invariant: unchanged; no worker job image is affected.
- Feature/env flag update path: not applicable.
- **Live signed-in proof required: YES, and it is OWED, not done.** The item's
  own acceptance says so: `src/app/api/intelligence/ask/route.ts` is a live
  signed-in Intelligence surface, and a green suite is not proof that Ask still
  answers for a signed-in user. This record does not claim it. What *is* proved
  here is that the module is byte-identical at its new path and that the live
  handler reaches it when driven for real — which is the strongest statement
  available without a signed-in session.

## Rollback Plan

Revert the squash commit. The change is a file move plus import specifiers, so a
revert restores the previous resolution exactly; there is no data, schema or
state to unwind. If only the CI wiring proves troublesome, the workflow step and
the baseline line can be reverted together without touching the move — they are
separable in the diff.

## Audit Evidence

- PR: recorded in the pulse entry for item `T-496`.
- Base commit for every measurement above: `be3c7dc27e`.
- Clean-baseline worktree: a second detached worktree at that same commit, so the
  before numbers come from a checkout with none of this change in it.
- Census before/after: `git show <merge-base>:docs/architecture/test-ci-coverage-census.json`
  against the committed file on this branch.
- Mutation evidence: the four mutations above are reproducible from the diff —
  each is a one-line or one-directory change, and the table names which case
  fired for each.
- CI run on the pull request, including the `Unit suites` job log showing the new
  step's case count. A suite that is green and unwired is indistinguishable from
  absent, so the job log is the evidence, not the YAML.

## Known Gaps

- **Signed-in acceptance for Intelligence Ask is owed.** Named above, not
  implied. No signed-in session was available to this run.
- **`src/lib/agent/sentinel-reasoning` is wired; its siblings under the item
  family are not.** The five directories that backlog item `T-494` covers are
  untouched here — that item states its own dependency on `T-495` and `T-497`,
  and this change deliberately does not pre-empt it.
- **The `Behavior coverage floor` gate structurally penalises a suite that
  imports a large production module.** Named and measured in the QA section
  above; not fixed here, because the fix is a `collectCoverageFrom` scope or a
  per-file floor on a required gate, which is a wider decision than this item.
  This change routes around it honestly by placing the suite in the directory
  that owns its subject, rather than by touching a threshold.
- **A follow-up could not be filed under the id-band rule.** The generated queue
  reports both the Claude Code `T-500`–`T-599` band and the shared
  `T-400`–`T-499` band as **exhausted, 0 of 100 free**. There is therefore no
  lane-correct id available for a new `T` item, so the one observation this
  change surfaced but does not fix — that the hygiene guard's
  `includes("import")` condition makes it blind to `jest.mock` and dynamic-import
  references to a retired path — is recorded here and in the backlog against
  `T-496` rather than as its own row. Widening the `T` range is a decision for
  the backlog owner, and the queue already flags it as needing one.
