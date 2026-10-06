# 2026-09-20-qa-blueprint-absent-path-disposition — A QA verifier stops reporting deletions as unbuilt work

## Release ID

`2026-09-20-qa-blueprint-absent-path-disposition`

## Status

`candidate`

## Plain-English Summary

An internal quality report checks that a list of blueprint files, routes, components and view
models is present in the repository. When a path was missing it said the same thing every time:
"not yet present … Deferred pending <SLICE> merge" — that is, *this has not been built yet*.

Three of the paths it reads were not unbuilt. They were deleted on purpose, and the report has
been describing those deletions as pending work — the oldest of them for five months. A check
that cannot tell "not built yet" from "deliberately removed" reports the wrong state in whichever
direction the tree moves, and it will be wrong again the next time a module is retired.

The disposition of an absent path is now **declared rather than inferred**. A small register names
each path that may legitimately be absent, together with the commit that removed it or the slice
that will add it. The resolver refuses to guess:

| what is on disk | what the register says | status |
|---|---|---|
| absent | retired by a named commit | `removed`, naming that commit and what replaced it |
| absent | pending under a named slice | `deferred`, naming that slice |
| absent | nothing | `fail` — asks for the declaration rather than assuming |
| present | retired by a named commit | `fail` — the register went stale the other way |
| present | nothing | `pass` |

A report carrying removals is reported as `partial`, never a clean `pass`: the blueprint still
describes something the repository no longer has, and that loss stays visible on the top line. This
follows the pattern used for the journey manifest, where removed checkpoints were marked as removed
rather than deleted so the loss stayed readable.

No product behaviour changes. This is a quality report and its test suite.

## Layer Impact

Release lane: `global-control-lane` — a shared CI/quality control, identical for every client and
behind no feature gate. No client-scoped schema, seed, ingestion or retrieval is touched, so this
is not `client-data-lane`.

- **Layer 4 (Products):** none. No product surface, route, read model or answer path is touched.
- **Test/tooling:** one QA report module, its suite, and the QA integration quarantine list.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — internal quality reporting and CI
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/intelligence-tower-blueprint-verification.ts`
  - new `removed` verification status and `removedCount` on the report
  - new exported `BLUEPRINT_PATH_REGISTER` and pure `resolvePathStatus(rel, present, register)`
  - every path-existence check now resolves through that function instead of a local
    present/absent ternary
  - `overallStatus` is `partial` when removals are present
- `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts`
  - 15 new cases; two existing cases updated in place with the reason beside them
    (the status vocabulary gained a member, and the count reconciliation gained a term)
- `scripts/quality/qa-integration-quarantine.json` — the entry for this suite is removed, because
  the artifact was repaired rather than the assertion relaxed
- `scripts/quality/check-qa-integration-quarantine.mjs` — `CEILING` 6 → 5 in the same change, with
  the reason, so clearing an entry leaves no silent headroom

### Register entries, and the evidence for each

Every SHA below was checked with `git merge-base --is-ancestor <sha> origin/main` before it was
written down. See *A correction made inside this change* for why that sentence is here.

| path | scope | commit | evidence, on `main`'s own history |
|---|---|---|---|
| `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx` | `path` | `0c6a86c51` | `git log origin/main --diff-filter=AD` shows `A` at `5d795a397` and `D` at `0c6a86c51`, the legacy v1–v4 surface sunset. The surviving route is `src/app/(maestro)/intelligence/page.tsx`. |
| `src/components/intelligence/IntelligenceRouteShell.tsx` | `containing-directory` | `0c6a86c51` | **No commit on `main` ever added this file.** What existed is `src/components/intelligence/`, removed across `0c6a86c51` (twenty-odd components) and `d5e0ef495` (the last two). The check was written against a shell component that never landed here. |

### A correction made inside this change

The first commit on this branch declared the shell component "removed by `7c6d894e9` (INT-I1)",
quoting that commit's own body. That attribution was **wrong**, and wrong in the same way the
defect being fixed is wrong.

`7c6d894e9` and the commit that added the file, `b26927adc`, are **not ancestors of `origin/main`**
— they sit on unmerged refs that a `git log --all` in a shared clone happily returns. The file has
never existed on `main`. Writing "removed by `<sha>`" for a commit that never held the file would
have replaced one false claim with another, one level up, and pinned it in a register that the rest
of the repository is meant to trust.

Two things changed as a result, and both are load-bearing rather than cosmetic:

- `RetiredPath` gained `scope: 'path' | 'containing-directory'`, so the detail text cannot claim a
  commit deleted a file it never held. Mutation 7 below is the specific guard.
- Every SHA cited here and in the register was re-derived with `git log origin/main` and confirmed
  with `git merge-base --is-ancestor`. `--all` is not evidence about this branch.

## QA / Validation

**The defect, measured through the real report rather than read from the source.** Running
`runIntelTowerBlueprintVerification()` on clean `origin/main` `b9abe7074`:

```
overall=fail  pass=12  fail=1  deferred=2
FAIL      INTEL-ROUTE-01    Route file MISSING: …/tenant/[tenantSlug]/intelligence/page.tsx
DEFERRED  INTEL1-SHELL-01   INTEL1 pre-integration: … not yet present … Deferred pending INTEL1 merge.
DEFERRED  INTEL1-CAVEAT-01  INTEL1 pre-integration: file absent … Deferred pending INTEL1 merge.
```

After:

```
overall=partial  pass=12  fail=0  deferred=0  removed=3
REMOVED   INTEL-ROUTE-01    Removed by 0c6a86c51 (legacy surface sunset (v1/v2/v3/v4)) … Replacement: src/app/(maestro)/intelligence/page.tsx.
REMOVED   INTEL1-SHELL-01   Absent … The path itself never appeared on this history; the directory that would hold it was removed by 0c6a86c51 …
REMOVED   INTEL1-CAVEAT-01  Absent … The path itself never appeared on this history; the directory that would hold it was removed by 0c6a86c51 …
```

**Suite, identical file, before and after the fix: 14 failed / 26 passed → 0 failed / 40 passed
(40 total).** "Before" is the suite as it stands in this change run against `origin/main`'s copy of
the module, so the two runs differ only in the module.

**Mutation check — ten deliberate breaks, ten caught.** Each was applied to the fixed code and the
suite re-run:

| # | mutation | result |
|---|---|---|
| 1 | absent + retired returns `deferred` again (the original defect) | 5 failed |
| 2 | present + retired returns `pass`, so the register may go stale the other way | 1 failed |
| 3 | an undeclared absence returns `deferred` instead of `fail` | 1 failed |
| 4 | the register entry for the never-landed shell is deleted | 4 failed |
| 5 | removals no longer make the report `partial` — a loss reads as a clean pass | 1 failed |
| 6 | `removedCount` hard-wired to zero | 2 failed |
| 7 | the `containing-directory` case reuses the `path` wording — the false attribution corrected above | 2 failed |
| 8 | the `path` removal detail stops naming the commit and slice | 2 failed |
| 9 | `CEILING` left at 6 after clearing an entry | `check:qa-integration-quarantine` fails: "1 slot(s) of headroom were just created" |
| 10 | the quarantine entry restored while the suite is green | `check:qa-integration-quarantine` fails: "PASSES now … Its reason has expired" |

**Scope baseline, same scope, same command as CI runs it**
(`npx jest src/__tests__/integration/qa --no-coverage --ci $(node scripts/quality/qa-integration-ignore-args.mjs)`):

| | suites | assertions | failing |
|---|---|---|---|
| before (clean `main`) | 31 | 765 | 0 |
| after | 32 | 805 | 0 |

One suite and 40 assertions join the per-PR CI run. They are not new coverage of product code —
they are a QA report that was excluded because it was wrong about the tree.

**Other gates**

- `npm run check:qa-integration-quarantine` — exit 0: "5 excluded of 37 suites; 32 run on every PR"
- `node scripts/audit/qa-inventory-claims-check.mjs` — exit 0, "22 known", no new stale claims
- `npx eslint` on the three changed source files — exit 0
- `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, judged by exit status with the build-info removed first, not by grepping output

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by a route, a job or an API path.
The repo-owned ACA deploy workflow will build and deploy the merge commit as it does every merge,
carrying no behaviour change from this record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this record mutates no Container App, revision, flag or env var
- Approved image digest: not applicable; no runtime change is claimed
- ACA runtime invariant: verified after merge as routine, not as evidence for this change
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no** — nothing in this change is reachable from a signed-in
  surface. The only consumers of the module are its own suite and two architecture inventories.

## Rollback Plan

Revert the PR. There is no migration, no data write, and no runtime state, so the revert is
complete on its own. Reverting restores the quarantine entry and `CEILING = 6` together, which the
quarantine checker requires to agree.

## Audit Evidence

- The PR and its checks
- The before/after report output and the nine mutation results recorded above, reproducible by
  running `runIntelTowerBlueprintVerification()` and re-running the suite
- `git log --all --oneline --name-status --diff-filter=AD -- <path>` for each register entry, which
  is the evidence that each absent path was deleted rather than never written

## Known Gaps

- **The `pending` half of the register has no entries today.** Every slice path this report reads
  is present except the two declared retirements, so `deferred` is currently unreachable on this
  tree. It is kept because a future pre-integration path is a real case, and because removing it
  would leave `fail` as the only outcome for a path somebody is still building.
- **Two of the remaining quarantined QA suites are still owned by T-502**, which asks a question
  this change does not answer: whether the Intelligence page should score 84 in the wireframe audit.
  That number is a lock and moving it to wherever the code landed is the wrong repair. Untouched
  here.
- **The same defect is live in at least two sibling QA verifiers, and is not fixed here.**
  Measured over the absent path literals in `src/lib/qa/active-route-shell-verification.ts` and
  `src/lib/qa/logo-usage-enforcement.ts`, against `main`'s own history: **seven absent paths are
  reported as "not yet integrated … deferred pending Wave-20 integration" when a single commit on
  `main`, `f1d8bc95c`, deleted them** — five brand assets and two top-bar components. Eleven more
  absent paths across those files and
  `src/lib/qa/apex-source-program-storyline-verification.ts` never existed on `main` either.
  Deliberately out of scope: it is a second change with its own measurement, and one of the two
  files is already owned by another open backlog item. Filed rather than folded in.
- **The item that prompted this was narrower than what was found.** It described the defect as
  prospective — that a later deletion of two `src/lib/intelligence/` modules *would* read as
  pre-integration. Those two modules are present today; three other paths were already being
  reported wrongly. The register now makes the prospective case a `fail` rather than a silent
  `deferred`, so the deletion it anticipated cannot land quietly.
