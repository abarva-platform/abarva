# 2026-09-20-census-subtracts-ignore-patterns — Coverage census subtracts a command's own ignore patterns

## Release ID

`2026-09-20-census-subtracts-ignore-patterns`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census that answers one question: how many of its automated
test suites does CI actually run? The number it prints is the input to deciding
which untested area gets wired next, so a wrong number sends people to the wrong
place.

It was reading a workflow command's *selection* — "run every suite in this
folder" — and stopping there. Several commands select a folder and then exclude
named suites inside it, because those suites are red and are quarantined by name
with an owner and a reason each. The census counted those excluded suites as
run. Thirty-two of them, across four folders.

The direction matters. The census **over**-stated coverage, which is the
dangerous direction: a suite that runs nowhere read as covered, so nobody was
ever sent to it, and the quarantine that was supposed to be temporary became
invisible instead. The census now subtracts each command's own exclusions from
what that command selects, and the four folders' declared exclusions are held to
an independent count so the subtraction cannot quietly grow.

## Layer Impact

Release lane: `internal-admin`. A measurement script and its behavioural suite;
no client-facing surface and no client data.

- **Layer 4 — products:** none. No product code, route, component, prompt, or
  read model is touched.
- **Test/CI tooling:** `scripts/quality/test-ci-coverage-census.mjs` resolves and
  applies `--testPathIgnorePatterns`; `scripts/quality/check-integration-ci-visibility.mjs`
  gains an opt-in `{ preserveEscapes }` argument that no existing caller passes,
  so its gate behaviour is byte-for-byte unchanged.
- **Data plane:** none. No migration, no loader, no adapter, no tenant row.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a measurement script, its behavioural suite, and the
  committed census file it writes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — reads `--testPathIgnorePatterns`
  from each reachable command, resolving a `$(node scripts/…)` substitution by
  running that script; subtracts the resulting patterns from that command's own
  selection; publishes `unresolvedIgnoreArguments` for a substitution it cannot
  follow.
- `scripts/quality/check-integration-ci-visibility.mjs` — `extractWorkflowRunCommands`
  and `expandWorkflowCommands` accept `{ preserveEscapes }`. Default unchanged.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — five cases.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — adds the
  `qa` directory to the quarantine-wired list it iterates, and one case holding
  every quarantine-wired directory's unrun count to its own exclusion list.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**The defect, measured on clean `main` `06bb57eda` before any edit.** Deriving the
exclusion list from the four generator scripts the workflows themselves run, and
the coverage decision from the census's own resolver: **33 test files are excluded
by name, and 32 of them were counted as covered.** By directory: 8 of 8 excluded
Source suites, 16 of 16 Intelligence, 6 of 6 QA, 2 of 2 Admin.

**The item's named example was wrong, and checking it was worth the minute.** The
backlog entry said `src/__tests__/integration/source-chat-shape.test.ts` was
reported covered. On `06bb57eda` it resolves to **0 hits** and was already
reported uncovered: the Source command names `…/integration/source`, and that is
not a registration candidate of a sibling file sitting at the integration root.
Implementing only the example would have changed nothing. The defect class is
real and four times larger than the entry described, and it sits on files
*inside* the named directories rather than beside them.

**Identical suite, before and after.**

| suite | before | after |
|---|---|---|
| `test-ci-coverage-census.test.ts` | **4 failed / 17 passed of 21** | **0 failed / 21 passed of 21** |

The fifth new case — an ignore pattern must not be subtracted from a *different*
command's selection — passes on unfixed code by design. It is the guardrail an
over-broad fix breaks, and mutation M4 below is what proves it is not inert.

**Repository effect.** Covered `928 → 896`; unrun `1376 → 1408`; fully covered
directories `89 → 85`; partial `21 → 25`; directories with unrun files `387 →
391`; critical governed-risk directories `59 → 61`, high `109 → 110`. Every one
of those 32 files was already running nowhere; none stopped running because of
this change.

**Committed census drift, reported separately from this change.** `main` carried
a census that was already stale by `testFiles 2292 → 2304`. The refresh in this
release therefore folds in two independent movements, and they are stated
separately rather than summed: **+12 test files** from ordinary drift since the
last refresh, and **−32 covered** from the correction. The committed file after
the refresh is the second answer to the drift question T-012 asks, and it is the
corrected one.

**Mutation proof — six mutations, six caught.**

| # | mutation | caught by |
|---|---|---|
| M1 | `coverageFor` stops subtracting ignore patterns | census **3 failed**, gate **1 failed** |
| M2 | `readWorkflows` drops `preserveEscapes` (a literal in-command pattern is mangled to `foo/.test/.ts$`) | census **1 failed** |
| M3 | an unresolvable `$(node …)` substitution is swallowed instead of recorded | census **1 failed** |
| M4 | ignore patterns applied across all commands instead of per command | census **1 failed** |
| M5 | the reader drops one pattern (off-by-one) | gate **1 failed**, census **3 failed** |
| M6 | the sibling's `preserveEscapes` silently keeps normalising | census **1 failed** |

M2 is caught by one case rather than by the repository-level one, and that is the
honest result rather than a weak test: every real pattern today arrives through a
`$( )` substitution, whose text carries no escapes to destroy, so the repository
is unaffected by that mutation. The case that catches it is the one holding a
literal in-command pattern, which is the form that would break silently the first
time somebody inlined one.

**Scope baseline, same scope both times, measured by stashing rather than by
reasoning.** `npx jest src/__tests__/behaviors`: **0 failing of 52 suites / 543
tests before → 0 failing of 52 suites / 550 tests after** (+7 cases).

`node --test scripts/quality/check-integration-ci-visibility.test.mjs`: 6/6 pass,
unchanged.

Typecheck `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
with `tsconfig.tsbuildinfo` removed first: **exit 0**, judged by exit status.
ESLint over the four changed files: exit 0.

**A second defect the correction made visible, fixed in the same change.** The
dark-directory gate defines "reached by nothing" as the census reporting a
directory zero-covered or partially covered. While an excluded suite counted as
covered, the four quarantine-wired directories read as *fully* covered and the
gate could not see them at all. Corrected, they read as partial — which is their
true and intended state, not darkness. Adding their names to
`KNOWN_DARK_DIRECTORIES` would have been the exact failure the two-directional
ratchet was built last night to refuse, in reverse: a wired directory sitting in
the dark list meaning nothing. Instead the exemption is earned. A new case
computes, per quarantine-wired directory, the suites its own generator excludes,
and requires that number to equal the census's unrun count — the two sides
derived independently, so a suite that stops running for any *other* reason is a
disagreement rather than a silence. M5 is that case's mutation proof.

That work also surfaced that `qa` was wired with a six-suite quarantine and never
added to the list of quarantine-wired directories this file iterates, so every
case in it skipped that directory. It is added, with its root-file collision set
checked by listing the integration root rather than assumed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is served, imported by
the application, or read at request time. The repo-owned ACA deploy workflow runs
on merge as it does for any commit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: unchanged by this release
- ACA runtime invariant: to be verified on the merge SHA's deploy run
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no route, surface, flag, or migration.
  Stated rather than deferred.

## Rollback Plan

Revert the PR. No migration, no data, no runtime state. The committed census file
returns to its previous content on revert; re-running the script would reproduce
whichever reading the script then holds.

## Audit Evidence

- The PR and its CI run
- Before/after census counts, reproducible with
  `node scripts/quality/test-ci-coverage-census.mjs`
- The exclusion lists, reproducible by running each
  `scripts/quality/*-integration-ignore-args.mjs`
- The six mutations, each reversible by the single edit named in the table

## Known Gaps

- **Ignore patterns inside a script file are not read.** A script's Jest lines
  reach the census already path-normalised, so a regex escape inside one has been
  rewritten before it can be read. No script in this repository passes the flag
  today; if one starts to, the census records it in `unresolvedIgnoreArguments`
  rather than reading a mangled pattern and reporting a subtraction that did not
  happen. The visible over-statement was preferred to a silent one.
- **The census now executes repository scripts.** Fenced to a `$(node <path>)`
  substitution naming a path under `scripts/`, with no arguments of its own,
  reached from a command a workflow already runs — the same set a CI runner
  executes anyway — never through a shell, with a timeout. Re-deriving the lists
  from their JSON instead would have put a second copy of that derivation in a
  second file, which is how one contract acquires two readings that drift.
- **The four quarantine lists themselves are unchanged.** Whether each entry's
  reason is still true is the quarantine checkers' question, not this one's.
