# 2026-09-20-retired-brand-path-register — A retired brand path now names the commit that retired it

## Release ID

`2026-09-20-retired-brand-path-register`

## Status

`candidate`

## Plain-English Summary

A QA report checks that ten old brand files — eight root-level logo assets and
two experimental top-bar components — are gone, because a later brand adoption
replaced them and a stale path resolving at runtime would put the old mark back
on screen. For each one the report said either "correctly absent" or "still
exists". Both verdicts were right and neither carried any evidence: nothing in
the file recorded which commit removed these paths, so a reader could not tell
a deliberate retirement from a list somebody had guessed at.

This change moves both lists onto the shared path register that two sibling QA
verifiers already use, so each absence is resolved against a declared
disposition naming the commit that removed the file rather than against a
sentence written at the call site.

Measuring the ten paths to write those entries turned up something the report
had been quiet about. All ten were added by one commit and deleted by one
commit, and **three of them are back on the tree today** — each restored by a
later commit that did not record a brand decision. Those three are the report's
three existing enforcement failures. They are not cleared here, and clearing
them is deliberately out of scope: which brand assets are canonical is a
product decision owned by a separate backlog item. What changes is that each
failure now names both the commit that retired the file and the commit that
brought it back, which is the evidence that decision needs.

The shared register gained one optional field for that, with two rules that are
tested rather than assumed: a restoration is reported only on the branch where
the file is actually present, because presence is the only part of the claim a
filesystem verifier can observe; and an entry that omits the field while the
file is present is told so out loud, so the evidence-free verdict this change
removes cannot return for free in the next entry somebody writes.

## Layer Impact

Release lane: `global-control-lane`. QA verification modules only.

- Layer 1 (client intake): unchanged.
- Layer 2 (source adapters): unchanged.
- Layer 3 (canonical model): unchanged. No tenant object, metric or fact is
  read or written.
- Layer 4 (products): unchanged. No route, surface, query or rendered value
  moves. `src/lib/qa/logo-usage-enforcement.ts` is imported only by test
  suites; nothing on a product path calls it.

## Client Applicability

- All clients: no behavior change.
- Specific clients: none.
- Internal only: yes — QA verification artifacts.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/qa/path-disposition.ts`
  - Adds optional `restoredAt: { commit, note }` to `RetiredPath`, for a
    retirement that was later undone.
  - `resolvePathStatus` renders it on the **present** branch only, where the
    verdict is already `fail`. An absent path never repeats the claim, because
    there the tree contradicts it.
  - A `retired` entry that is present with no `restoredAt` now says the return
    is unaccounted for and names the register to record it on, instead of
    reporting the disagreement with no account of it.
- `src/lib/qa/logo-usage-enforcement.ts`
  - Adds `RETIRED_BRAND_PATHS` and `BRAND_PATH_REGISTER` — one disposition per
    path, each naming the retiring commit, and `restoredAt` on the three that
    came back.
  - The `BRAND2-C9` and `BRAND2-C10` loops resolve through
    `resolvePathStatus(..., BRAND_PATH_REGISTER, 'BRAND_PATH_REGISTER')`
    instead of a `exists ? 'fail' : 'pass'` literal with a sentence beside it.
  - `LogoCheckStatus` gains `'removed'` and the report gains `removedCount`,
    matching the vocabulary the two repaired sibling verifiers already use.
- `src/__tests__/integration/qa/retired-brand-path-register.test.ts` — new,
  six cases.
- `src/__tests__/integration/qa/logo-usage-enforcement.test.ts` — two existing
  assertions updated, each with the reason inline. The status-vocabulary case
  admits `'removed'`. The case guarding against retired assets returning now
  expects `'removed'` where it expected `'pass'`; it stays **red on purpose**,
  because three assets have returned. It was not relaxed to "removed or fail",
  which would let the returning assets satisfy the case that exists to catch
  them.

## QA / Validation

Measured on `origin/main` at `9aed1c932955377785cbb4b7bf8aace7e36bb089`.

The ten dispositions were derived with `git log origin/main --diff-filter=AD
--name-status` and every commit confirmed with `git merge-base --is-ancestor`
against `origin/main`. `--all` was not used: it is not evidence about a branch,
and it produced a wrong attribution under an earlier item in this family.

| paths | added | deleted | state today |
| --- | --- | --- | --- |
| all ten | `5d795a397` | `f1d8bc95c` | — |
| seven of them | — | — | absent → `removed` |
| `abarva-logo-inverse.svg` | — | — | present, restored at `8b556c126` → `fail` |
| `abarva-logo.svg`, `abarva-logo-lockup-v2.svg` | — | — | present, restored at `6ebe6d4a9` → `fail` |

**The defect, then the repair, over the two affected suites** (`npx jest
--runTestsByPath src/__tests__/integration/qa/logo-usage-enforcement.test.ts
src/__tests__/integration/qa/shell8-legacy-retirement.test.ts`):

- Clean baseline before any edit: **4 failed, 23 passed, 27 total.**
- After this change: **the same 4 failed**, by name — `failCount === 0`,
  `guards against ghost top-bar variants and retired root logo assets
  returning`, `listLogoEnforcementTargetFiles() does NOT include TopBar.tsx`,
  and `logo-usage-enforcement report has no failures`. Not one was cleared.

New suite, written before the fix:

- With the new cases and no fix: **5 failed, 1 passed, 6 total.**
- After the fix: **6 passed, 0 failed.**

Over the CI command for this directory (`npx jest src/__tests__/integration/qa
--no-coverage --ci $(node scripts/quality/qa-integration-ignore-args.mjs)`):

- Before: **33 suites, 825 tests, 0 failing.**
- After: **34 suites, 831 tests, 0 failing.**

- `npm run check:qa-integration-quarantine` — clean. It re-runs each excluded
  suite and fails if one **passes**; both suites owned by the brand-asset
  decision still fail for the reasons recorded against them.
- `npx jest src/__tests__/integration/design` — 7 suites, 490 tests, 0 failing
  (the other importers of this module take only its two canonical-path
  constants).
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit code **0**, no diagnostics. The exit code was read, not grepped for.
- `npx eslint` on all four changed files — exit code 0.

Mutation pass — the fix was broken six ways and the new suite caught all six;
no survivors, and it returned to 6/6 after each restore:

| # | mutation | result |
| --- | --- | --- |
| M1 | corrupt the restoring commit on one restored asset | 1 failed |
| M2 | wrong retiring commit in the register | 3 failed |
| M3 | resolver stops saying an unexplained return is unaccounted for | 1 failed |
| M4 | absent branch leaks the restoration claim | 1 failed |
| M5 | pass an empty register to the `C9` loop | 3 failed |
| M6 | `removedCount` counts every check | 1 failed |

M3 and M4 are the pair that keeps the new field honest rather than decorative.
M3 shows the no-evidence branch is reachable and asserted; M4 shows the
restoration claim cannot be printed over a path the tree says never came back.
Files were restored from copies after each mutation, never with `git checkout
--`, which would have reverted the fix instead of the mutation.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys as
usual. Nothing here is reachable from a product route, so there is nothing to
observe on the deployed surface beyond the deploy succeeding.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No deploy is initiated by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic,
  revision, env var, flag, scale or secret change.
- Approved image digest: whatever the main deploy workflow builds from the
  merge SHA; this change does not pin or override an image.
- ACA runtime invariant: to be verified after merge — Container App template
  image, 100%-traffic revision image and worker job images equal.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**, and none is claimed. Both changed
  modules are imported only by test suites.

## Rollback Plan

Revert the single squash commit. No migration, no data write, no runtime state,
no deployed behavior depends on it, so the revert is complete on merge.

## Audit Evidence

- The PR, its CI run, and the merge SHA.
- The before/after and mutation numbers in QA / Validation above.
- `src/__tests__/integration/qa/retired-brand-path-register.test.ts` — the case
  `a restoration with no commit named is reported as unexplained rather than
  passing over it` is the guard that fails if the evidence-free verdict
  returns.
- `BRAND_PATH_REGISTER` in `src/lib/qa/logo-usage-enforcement.ts` — every
  disposition and its commit, in one place.

## Known Gaps

- **The three restored assets still fail, and are meant to.** Which brand
  assets are canonical is a product decision owned by a separate backlog item,
  together with the two suites excluded on account of it. This change gives
  that decision its evidence and does not pre-empt it. The allowed set was not
  widened.
- **One check in the same file was measured and deliberately left alone.**
  `BRAND2-C4` reports `src/components/chrome/TopBar.tsx` as "correctly absent —
  retired in Wave 29 SHELL8". No commit on `origin/main` has ever added or
  removed that path, so the claim is unearned in exactly the way this change
  repairs elsewhere. It is not in either retired list, so folding it in would
  have widened a bounded change; filed as a separate item instead.
- **A second finding, also filed rather than absorbed.** The excluded case
  `listLogoEnforcementTargetFiles() does NOT include TopBar.tsx` fails on a
  substring match: the target list contains `AppTopBarEditorial.tsx` and
  `AppTopBarTwoBar.tsx`, both of which contain `TopBar`, and the legacy path
  the case is named for is not in the list at all. The exclusion reason records
  the cause as a stale target list; the measured cause is the loose matcher.
  Correcting it would clear a case belonging to the brand-asset decision, so it
  is reported, not fixed here.
- `restoredAt` is a claim about history. The resolver observes presence, which
  is the part of the claim the filesystem can answer; it cannot check that the
  named commit is the one that did it. That derivation is recorded above and in
  the register's own comment.
