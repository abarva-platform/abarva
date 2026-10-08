# u606 — The phase-gate-approval route's suites run where a merge can fail on them

## Release ID

`2026-10-08-gate-approval-route-suites-required-ci`

## Status

`candidate`

## Plain-English Summary

Every phase gate in the Moves product is crossed through one API route. That
route is 974 lines, one product surface calls it, and it is what evaluates the
gate rule, records the phase snapshot, advances the engagement to the next phase
and runs the terminal handoff. Forty-three tests guard it.

None of those forty-three could fail a merge. The only workflow that reached the
directory was `unit-suites.yml`, and that job is not one of the required status
checks on `main`. The coverage census read the directory as covered, which was
true and beside the point: the census asks whether *some* workflow reaches a
directory, never whether a *required* one does. All forty-three cases could have
been deleted and every merge-blocking check would have stayed green.

This wires the directory into the required AI surface control catalog, and the
wiring turned out to need two reading fixes first.

A Jest path argument is a regular expression, not a directory prefix. The route
lives under a dynamic segment — `[programId]` — which Jest reads as a character
class, so the pattern has to escape the brackets or it selects nothing at all.
Two repository controls could not read that escaped spelling:

- the named-suite requiredness control stripped quotes but not escapes, then
  asked the filesystem whether the argument was a directory. It is not, so no
  sweep was recorded. A required job could sweep a dynamic-route directory, a
  non-required job could keep naming a suite inside it, and the control would
  report OK — the exact failure it exists to refuse, inverted.
- the coverage census rewrites `\` to `/` so a Windows-style path matches a
  repo-relative one, which turned the escape into `/[programId/]`, a spelling no
  path has, and credited the sweep with nothing.

Both now resolve a backslash before a regex metacharacter to the character it
escapes, which is the on-disk spelling. A Windows separator is never followed by
a metacharacter, so no path reading changes, and the census counts are unmoved.

The suite's exact-path entry is dropped from the eighteen-entry governed
approval route list in `unit-suites.yml`, because a suite a required job runs
must be *named* inside a required job. That loses no run and no coverage: the
same job's broad `src/app/api/v1/programs` argument still selects the directory.
Only the quotable line moved to the job that can block a merge.

The suites were measured green before being wired, so this buys the future
rather than repairing a past failure.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are untouched: no schema,
adapter, intake, route, read-model or component change. No product code is
modified. The change is a CI workflow step, two corrected comments and one
dropped exact-path entry in a second workflow, two reading fixes in quality
control scripts, three test guards, a wiring doc section, and the regenerated
coverage census. The gate-approval route itself is unchanged.

## Client Applicability

- All clients: yes, in the sense that the control-plane protection applies
  repository-wide. No runtime behaviour changes for any client.
- Specific clients: none.
- Internal only: effectively yes — this is CI and quality-control tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — new step, slice 17,
  sweeping `src/app/api/v1/programs/\[programId\]/phase-gate-approval/__tests__`
  as a directory under the required `AI surface control catalog` job.
- `.github/workflows/unit-suites.yml` — the exact-path entry for that suite is
  dropped from the governed approval route list (nineteen entries to eighteen);
  the list's comment and the v1-parent step's bracket comment are corrected to
  record both legal spellings for a bracketed path.
- `scripts/quality/check-named-suite-requiredness.mjs` — resolves Jest regex
  escapes before classifying an argument as a swept directory.
- `scripts/quality/test-ci-coverage-census.mjs` — `normalize` resolves a
  backslash before a regex metacharacter instead of reading it as a path
  separator.
- `src/__tests__/behaviors/phase-gate-approval-route-required-ci-coverage.test.ts`
  — new guard, 5 cases.
- `src/__tests__/behaviors/named-suite-requiredness.test.ts` — one case for the
  dynamic-route sweep.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — two cases, both
  directions, with Jest itself as the oracle.
- `src/__tests__/behaviors/approval-route-ci-coverage.test.ts` — the list it
  pins goes to eighteen, and a new case ties the removal to the required sweep
  that replaced it, so the name cannot simply be put back.
- `docs/ci/README-suite-wiring.md` — a section on naming a directory under a
  dynamic route, the two spellings, the two controls, and the open residual.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest 'src/app/api/v1/programs/\[programId\]/phase-gate-approval/__tests__' --runInBand`
  — the wired command, measured three consecutive times before wiring: 1 suite,
  43 tests, green in 0.11–0.12s each run.
- **PASS** `npx jest src/__tests__/behaviors` — 206 suites, 2129 tests, green in
  63s. The first run of this was **FAIL** (2 cases in
  `approval-route-ci-coverage.test.ts`), which is the point: that suite pinned
  the nineteen-entry list this change edits, and the red was honest.
- **PASS** `npm run audit:named-suite-requiredness` — 42 directories swept by a
  required job, up from 41, and OK.
- **PASS** `npm run audit:test-ci-coverage:write` — `census drift: committed
  census matches this run`. `coveredTestFiles` 2694 → 2695 (the one new test
  file), `uncoveredTestFiles` 164 unchanged.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — no change to the
  committed fence census.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` on all five changed TypeScript and script files — exit 0.
- **PASS** both edited workflows parse as YAML, and the parsed `run` string
  carries the single backslashes intact.
- **Mutation testing: 7 designed, 7 killed.**
  1. requiredness control: escape resolution removed → 1 of 8 fails (the new
     case), and the control reports OK where it should FAIL.
  2. census: escape resolution removed → 1 of 62 fails (the new escaped-form
     case).
  3. catalog step removed → 2 of 5 fail.
  4. catalog step switched to `--runTestsByPath` → 1 of 5 fails.
  5. catalog step's brackets unescaped → 2 of 5 fail.
  6. exact-path name restored in the non-required job → 1 of 5 fails, and
     `audit:named-suite-requiredness` exits 1 naming the file, both jobs and the
     remedy.
  7. the guarded suite deleted from disk → 1 of 5 fails (the vacuity case).
- **NOT RUN** — live signed-in walk. Nothing in this change is reachable from a
  product surface, so there is nothing for a walk to observe. No runtime deploy.
- **NOT RUN** — the full integration suite set; no integration-covered code is
  touched.

## Rollout Plan

Merge to `main`. No Azure Container Apps image build, no deploy, no migration,
no feature flag, no environment variable change. The new step takes effect on
the next pull request's catalog run; the two control fixes take effect on the
next run of the required floor job.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker jobs,
traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: untouched.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the pull request. The catalog step, the two script readings, the workflow
comments and the test guards are independent of runtime behaviour, so a revert
restores the prior state with no data or deployment consequence. Reverting
restores the exact-path entry in `unit-suites.yml` at the same time as the
catalog sweep, so the requiredness control stays green either way — the two
halves must not be reverted separately.

## Audit Evidence

- The pull request and its CI run, specifically the `AI surface control catalog`
  job's `Exercise the phase-gate-approval route suites` step, which is the line
  a closure note should quote from now on.
- `Behavior coverage floor`, which runs the three new and two edited guards and
  the requiredness control.
- `docs/architecture/test-ci-coverage-census.json` in the diff: covered 2695,
  uncovered 164.
- `docs/ci/README-suite-wiring.md`, which records the rule, the two spellings
  and the residual.

## Known Gaps

- **The over-crediting direction is open.** A plain workflow command is read as
  a literal token list, so the *unescaped* spelling of a bracketed path is still
  credited by the census while Jest selects nothing from it. Closing it means
  routing every plain workflow command through Jest's own matcher, as a ratchet
  baseline path already is, which re-reads all of them under new semantics and
  can move counts across the corpus — not a change to make beside a
  one-directory wiring fix. The reading is pinned by a case in
  `test-ci-coverage-census.test.ts` that fails the day it is fixed, which is
  when to delete it. Nothing relies on the gap today: every bracketed path in
  `.github/workflows` is either passed with `--runTestsByPath` or escaped, and
  that was measured, not assumed.
- **This is the first dynamic-route directory sweep in the catalog.** Forty-one
  sweeps existed and none was under a bracketed segment, which is why neither
  control had ever been exercised on one. Other dynamic-route `__tests__`
  directories remain owned one exact path at a time; each still needs its own
  green measurement before being swept.
- **Requiredness is not derivable from this repository.** It lives in GitHub
  repository settings, mirrored in `docs/ci/required-status-checks.json`. The
  claim that `AI surface control catalog` is required rests on that mirror, and
  a context added to the ruleset and never written down is invisible to every
  control here.
