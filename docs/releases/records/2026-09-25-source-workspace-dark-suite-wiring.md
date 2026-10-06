# 2026-09-25-source-workspace-dark-suite-wiring — Wire three unreached Source workspace suites into the merge-blocking set

## Release ID

`2026-09-25-source-workspace-dark-suite-wiring`

## Status

`candidate`

## Plain-English Summary

One directory of Source workspace tests held seven files that could not stop a bad
change from merging, in two different ways. Five were reached by no command at all.
Two more ran green, but only from a gate that runs *after* the deployment — so a
tenant-routing check was proving its point after the change it might have blocked
had already shipped.

Each of the seven was looked at on its own. Three are now run by a job that gates
every pull request. Four deliberately are not, and the reason for each is written
down: those four do not execute the product. They read the text of source files and
check that certain strings appear in them, so a renamed variable breaks them and a
comment satisfies them. Running those in a required check would buy a green tick and
no protection, so they stay out until somebody rewrites them to exercise the
behaviour they describe.

One of the three now wired had been ruled out by an earlier triage for exactly that
reason. That ruling was correct when it was made, and the rewrite it asked for was
delivered a few days later under a different change — nobody went back to amend the
record. It was re-measured against the file as it stands today rather than taken on
trust, and it is now a real test of the component.

No product behaviour changes. No client-facing surface, schema, or tenant data is
touched.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behaviour (which test
commands gate a pull request) for all clients, with no feature gate. It is the
shared lane because the gating set is shared; it carries no client-scoped data
change, which is what would have made it `client-data-lane`.

- **Layer 4 — Products (Source):** no product code changed. The change is to which
  test commands run on a pull request, plus one new test that holds that wiring in
  place.
- **Layers 1–3 (client intake, source adapters, canonical model):** untouched. No
  loader, adapter, migration, projection, or tenant input is modified.

## Client Applicability

- All clients: no runtime effect.
- Specific clients: none.
- Internal only: yes — CI coverage and test triage only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` — two new steps in the existing
  `pull_request` / `merge_group` job:
  - *Run the T-478 dark Source workspace suites* —
    `contractDetailRetry.test.tsx` and
    `workspace-explicit-client-api-routing.browser.test.tsx`, neither of which was
    reached by any command.
  - *Run the T-478 pre-deploy-only Source workspace suite* —
    `portfolioAdapter.ecl.test.ts`, which was reached only from
    `scripts/ecl/run_product_ecl_predeploy_gate.mjs`. That gate's only caller is
    `ecl-product-live-proof.yml`, triggered by `workflow_dispatch` and by
    `workflow_run` after "ACA main deploy" — neither `pull_request` nor
    `merge_group`. The pre-deploy gate keeps its own invocation; this adds the
    merge-blocking one the file never had.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — new. The
  disposition of all seven files, with the measurements each verdict rests on.
- `src/__tests__/behaviors/t478-source-workspace-dark-suite-ci-coverage.test.ts` —
  new. Reads that record at run time and asserts both halves: each wired file is
  named by its exact path in a command that gates a pull request, and each held
  file is reached by no such command, by file **or by any ancestor directory**.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Baseline measured in a separate clean worktree of `origin/main` `274967083`,** not
by stashing, so no branch edit could leak into it.

Census counts — resolved, not read off the committed artifact:

| count | clean `main` | this branch | delta |
|---|---|---|---|
| `testFiles` | 2441 | 2442 | +1 (the new guard suite) |
| `coveredTestFiles` | 1995 | 1998 | +3 |
| `pullRequestCoveredTestFiles` | 1992 | 1996 | +4 |
| `untriagedUnrunTestFiles` | 397 | 395 | −2 |

The committed census on `main` was **already stale before this change**: it recorded
`testFiles` 2439 / `coveredTestFiles` 1993, while `main` itself resolves to 2441 /
1995. Two test files were added in the two changes immediately preceding this one
without refreshing the census, and both were already covered. That `+2` is carried in
here as an incidental correction and is **not** part of this change's delta — stated
explicitly so the refreshed artifact is not read as claiming credit for it.

`+3` covered and `+4` pull-request-covered differ by one on purpose:
`portfolioAdapter.ecl.test.ts` was already `covered: true`, so it moves only the
pull-request count. That difference is the whole of what was wrong with it.

Suites executed directly before any judgement, because a file Jest cannot parse and a
file Jest never reaches are indistinguishable in the census and only the first is
breakage. All seven parse and all seven pass:

| file | cases | disposition |
|---|---|---|
| `contractDetailRetry.test.tsx` | 6 | wired |
| `workspace-explicit-client-api-routing.browser.test.tsx` | 3 | wired |
| `portfolioAdapter.ecl.test.ts` | 10 | wired |
| `sourceFreshness.test.tsx` | 7 | held — source-text scanner |
| `workspace-ava-contract.test.ts` | 8 | held — source-text scanner |
| `workspace-explicit-client-api-routing.test.ts` | 8 | held — source-text scanner |
| `page-tenant-routing.test.ts` | 13 | held — source-text scanner |

`collected: false` was therefore reach, not breakage, and none of the seven needed a
repair. The two render modes of `workspace-explicit-client-api-routing` were treated
as two files and they took **opposite** verdicts, which is the clearest case for not
collapsing them into one path.

**New guard, red first.** On unmodified `main` the guard fails 6 of 22 — both cases
for each of the three wired files — and passes 22 of 22 on this branch. The two
pre-deploy-only files are the proof that the `pullRequest` filter is load-bearing
rather than decoration: on `main` each had **1 reaching command and 0
merge-blocking** ones, so a guard that asked only "does a command name this file"
would have passed on the day the defect was filed.

**Three mutations, each confirmed to fail, and each failing only its own files:**

| mutation | result |
|---|---|
| the two-suite step replaced with `echo skipped` | 4 of 22 fail — exactly its two files |
| the pre-deploy-only step replaced with `echo skipped` | 2 of 22 fail — exactly its one file |
| both steps replaced with a `jest <directory>` sweep | 10 of 22 fail, including **all four held cases** |

The third is the one that matters. A directory sweep is the easiest wrong fix for
this item: it satisfies every positive case and quietly makes all four source-text
scanners merge-blocking. The held cases are asserted under the census's whole rule —
the file **or any ancestor directory** — so the sweep fires them. Asserting only the
file path would have left that gap open.

Other checks, all from this branch:

- `node scripts/quality/test-ci-coverage-census.mjs --check` — exit 0; drift and
  coverage shape both match the committed census.
- `npx jest src/__tests__/behaviors` — **126 suites, 1177 tests, 0 failing, exit 0.**
  This is the check that caught the first attempt at this item: wiring all five of
  the unreached files turned `t557-unrun-suite-wiring.test.ts` red on three cases,
  because that guard holds three of them unrun on T-556's verdict. The guard was
  right and the wider wiring was wrong; nothing in that suite was weakened to get
  here.
- `node scripts/ci/check-behavior-coverage.mjs` — exit 0; lines 91.05 against a floor
  of 90, branches 69.33 against 50.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
  0**, judged by exit code, 0 diagnostics.
- `npx eslint` on the new suite — exit 0.

**The stale verdict, settled by measurement rather than by argument.**
`docs/architecture/t550-stale-suite-triage.json` verdicts `contractDetailRetry.test.tsx`
`rewrite_as_behavior`, owned by T-553. At that record's declared base `05bdab64e` the
file held 1 `readFileSync` and 16 `toContain` against `WorkspaceClient.tsx`, so the
verdict was **correct when written**. `b66e4cd22` (#8201) rewrote it +248/−53 and is
**not** an ancestor of that base — the rewrite the verdict asked for was delivered on
a parallel line and the record was never amended. On this commit the file holds 0
`readFileSync` and 0 `toContain`, mocks its dependencies and mounts the component.
The T-550 record is left intact as the historical draw it is; the current measurement
lives in the new T-478 record beside it.

**Honest remainder — this directory is NOT closed.** Of its 35 files, 32 are now
reached by a merge-blocking command and 3 are not, all three by decision. The census
still reports those 3 as `untriaged`, because it credits a triage only when a scoped
entry in a `scripts/quality/*-quarantine.json` names the file, and this change records
the verdicts in `docs/architecture/` instead. So the written verdict is invisible to
the instrument and the directory will keep surfacing at rank 2. That gap is filed as
its own backlog item rather than fixed here, because making a docs verdict visible to
the census is a change to the census's triage vocabulary, not to this directory. The
28 files that were already covered were not re-executed by this change; their
`green` state remains `"unknown"` in the census, as it was before.

## Known Gaps

- **This directory is not closed, and the census will surface it again.** Three of
  its 35 files remain unreached by any merge-blocking command, by decision, and the
  census still reports all three as `untriaged` rather than as declared triage. It
  credits a triage only when a scoped entry in a `scripts/quality/*-quarantine.json`
  names the file; these verdicts live in `docs/architecture/` instead. Until that is
  reconciled the directory keeps ranking at 2 on untriaged unrun files and the next
  agent to draw it will re-derive this analysis from scratch — which is what happened
  here. Filed as its own backlog item.
- **Four source-text scanners still have no behavioural coverage.**
  `sourceFreshness.test.tsx`, `workspace-ava-contract.test.ts` and
  `workspace-explicit-client-api-routing.test.ts` are owned by T-558.
  `page-tenant-routing.test.ts` — 6 `readFileSync`, 100 `toContain`, the heaviest
  scanner of the seven — has **no owner**; it is newly measured here and filed back.
  Each describes a real contract, including tenant routing, so the absence of a
  behavioural test for it is a genuine hole, not a bookkeeping entry. Holding them
  out of CI records that hole rather than papering over it with a green tick.
- **The 28 already-covered files in the directory were not executed by this change.**
  Their `green` state is `"unknown"` in the census, before and after. Nothing here
  asserts they pass; they were already reached, which is a different question.
- **`t552-source-workspace-ci-coverage.test.ts` would not have caught the wrong fix.**
  It asserts that T-550's three `rewrite_as_behavior` paths are absent from *the one
  command that names its first wire-ready suite*. A second step naming a held path
  satisfies it, so it is silent about any wiring added outside that command. The new
  T-478 guard asserts the held half against every merge-blocking command instead.
  Noted rather than changed: widening `t552` is a change to T-550's guard and belongs
  to whoever owns that record.

## Rollout Plan

Merge to `main`. CI-only change: the two new steps begin running on the next pull
request. The repo-owned ACA main deploy workflow will build and deploy the merge
commit as usual; nothing in this change alters runtime behaviour, images, flags, or
environment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is run by this change.
- Approved image digest: not applicable — no runtime image, env var, flag, scale or
  secret is changed.
- ACA runtime invariant: to be verified after merge against the deploy run keyed to
  this change's own squash SHA, as the standing rule requires.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This change adds no route, surface, or
  rendered output. No client-visible behaviour changes.

## Rollback Plan

Revert the merge commit. There is no migration, no data change and no runtime state,
so the revert is complete on its own: the two workflow steps stop running and the
census returns to its previous committed contents. Reverting restores the defect —
three suites stop gating merges again — so prefer fixing forward if one of the three
turns flaky in CI.

## Audit Evidence

- The pull request and its check run for this branch.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — the seven verdicts
  with the measurements each rests on, including the two prior verdicts that were
  re-checked and which of them had gone stale.
- `src/__tests__/behaviors/t478-source-workspace-dark-suite-ci-coverage.test.ts` —
  the guard; re-runnable, and it fails if either half of the disposition drifts.
- `docs/architecture/test-ci-coverage-census.json` — the refreshed census;
  `--check` reproduces it from the tree.
