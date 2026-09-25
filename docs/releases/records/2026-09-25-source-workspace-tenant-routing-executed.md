# 2026-09-25-source-workspace-tenant-routing-executed — Execute the Source workspace tenant-routing contract instead of scanning its text

## Release ID

`2026-09-25-source-workspace-tenant-routing-executed`

## Status

`candidate`

## Plain-English Summary

The Source workspace route decides which client's contracts a signed-in session
is allowed to open. That decision was protected by a test that read the route's
**source code as text** and checked that certain lines had been written — 6 file
reads and 100 substring assertions. A test like that passes whenever the words
are present, so it could not tell a working membership check from a disabled one,
and it broke whenever a variable was renamed without any change in behaviour.

This change replaces it with a test that **runs the route**. It calls the page
with real query parameters, mounts what the page returns together with the real
loader and the real workspace client beneath it, and then reads the client
identifier off the request those components actually sent. The unauthorised case
asserts that **no request was made at all**, rather than that a warning appeared
on screen — a page that showed a warning and still read another tenant's
contracts would satisfy the weaker assertion.

The test is also now wired into the pull-request test job, so it can block a
merge. Previously its only caller ran **after** the deployment it might have
stopped.

The measurement that shows why this matters is in QA below: with the membership
check left in place and still being called, and only its answer ignored, the old
test passed all 13 of its cases and the new one fails 4 of 14.

No product behaviour changes. No route, API, schema, loader, or adapter is
modified.

## Layer Impact

**Release lane: `global-control-lane`.** The change ships shared control-plane
behaviour — a merge-blocking CI step in `.github/workflows/unit-suites.yml` that
applies to every pull request regardless of client — and is not feature-gated.
No client-scoped schema, RLS, seed, ingestion, retrieval, or private data-plane
file is touched, so this is not `client-data-lane`.

- **Layer 4 — Products (Source):** test and CI coverage only. The Source
  workspace route and its portfolio/contract-detail APIs are unchanged; this
  release adds an executable guard over the tenant-routing behaviour they
  already had.
- **Layers 1–3 (client intake, source adapters, canonical model):** untouched.
  No loader, adapter, migration, projection, or tenant dataset is modified.

## Client Applicability

- All clients: no behaviour change. The guard is tenant-agnostic and exercises
  the routing contract with two distinct canonical tenant keys plus a session
  tenant.
- Specific clients: none.
- Internal only: the CI wiring and the triage/census records.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`
  — rewritten from a source-text scanner into an executed-route test. Was 208
  lines, 13 cases, six synchronous source-file reads and a hundred substring
  assertions over their text. Now 14 cases, **no file reads at all** and
  **nothing asserted against the bytes of a source file**. One substring
  assertion remains, against rendered DOM text, and is annotated as such where
  it sits. The path is unchanged, so the pre-deploy gate that already named it
  keeps its invocation.
- `.github/workflows/unit-suites.yml` — the suite is added by exact path to the
  existing pre-deploy-only step, making it merge-blocking. The step's comment,
  which previously recorded why this file was deliberately *not* wired, is
  rewritten to record that the reason has been discharged and how that was
  measured.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — the
  `held_unwired` verdict on this file is amended to `wired`. The prior verdict
  and its rationale are preserved in `priorVerdict` and
  `priorVerdictRationale` rather than overwritten, an `amendments` entry records
  the change, and a `reverificationCondition` states what would invalidate the
  new verdict. A verdict that outlives its reason is the failure this amendment
  is written to avoid.
- `docs/architecture/test-ci-coverage-census.json` — refreshed in the same
  change.
- `src/__tests__/behaviors/t478-source-workspace-dark-suite-ci-coverage.test.ts`
  — the guard over that triage record. Its non-vacuity case pinned the
  disposition at three wired and four held, so moving a verdict made it fail, as
  designed. Updated to the new draw and strengthened from a pair of counts to a
  per-file verdict map, plus a new case requiring the discharge fields on any
  verdict that moved off the held list. See QA below for the deliberate breakage
  that proves it still bites.

No source, route, API, migration, loader, adapter, or dataset file is modified.

## QA / Validation

All commands run from a dedicated worktree. The suite and mutation results
were first measured at `origin/main` `7700791ae`; the branch was then rebased
onto `3e5d9f6d8` after an unrelated PR merged, and the census figures below
are re-measured against that base. The deltas are unchanged by the rebase;
the absolute counts moved because the intervening PR added one covered test
file, which is that PR's effect and not this one's.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— exit code `0`, zero diagnostics. (The exit code is judged, not grepped: a bare
`npx tsc --noEmit` exits 134 on this machine with no output, which a grep reads
as clean.)

**Lint.** `npx eslint` on the rewritten file — 0 errors, 0 warnings. An earlier
draft left an unused interaction handle; it was deleted rather than suppressed.

**Two corrections made before merge, recorded rather than quietly fixed.**

*The counts.* An earlier draft of this record, of the workflow comment and of the
triage entry all claimed "0 `readFileSync`, 0 `toContain`". That was wrong as a
literal token count: the header prose describing the old scanner named both
tokens, so the line describing the defect was an instance of it, and two
assertions used `toContain`. The prose was reworded to stop naming the tokens;
the assertion on the contract-detail pathname was tightened from a substring to
an exact match, which is the stronger assertion anyway; and the one remaining
substring assertion — against rendered DOM text, not source bytes — is recorded
as `toContainCount: 1` with `toContainAgainstSourceTextCount: 0` rather than
rounded to zero. The re-verification condition keys on the second field, so it
does not fire on the legitimate one.

*A guard this change had to update.* `src/__tests__/behaviors/t478-source-workspace-dark-suite-ci-coverage.test.ts`
holds the T-478 disposition in place, and its non-vacuity case hard-coded
`wired: 3, held: 4`. Moving one verdict made it fail, correctly — it was doing
its job. It was updated, not weakened, and made stronger in the process: the
pair of counts is replaced by a per-file verdict map, because a count cannot say
*which* verdict moved and one update is otherwise indistinguishable from two
moving in opposite directions. A new case was added requiring that any suite now
wired which the record shows was previously held must carry the discharge fields
— prior verdict, prior rationale, owner, and a stated re-verification condition
— so a verdict cannot be reversed without leaving a trace of what it used to say.

Both halves of that guard were then broken deliberately. Flipping this file's
verdict back to `held_unwired` fails 4 of its 23 cases, including the new
disposition map and the new discharge case. Stripping just the discharge fields
fails exactly 1 of 24 — the new case and nothing else. Restored: 24 of 24 pass.

**The suite itself.** 14 passed, 14 total.

**Proof the assertions reach the route rather than passing vacuously.** The
requests observed during one case, printed from the fetch mock:

```
/api/source/workspace/portfolio?client=<tenant>&asOf=<governed-cut>&sourceProvider=ecl_projection_db&impact=deferred
/api/source/workspace/portfolio?client=<tenant>&asOf=<governed-cut>&sourceProvider=ecl_projection_db&impact=full&scope=impact
/api/source/workspace/contract/<contract-id>?client=<tenant>&sourceProvider=ecl_projection_db
```

Tenant and contract identifiers are elided here; the suite's own fixture
constants carry them. The shape is the point: the same resolved `client` value
appears on all three, and the third is the contract-detail read the assertions
inspect. The whole chain runs — page → loader → workspace client — so the
`client` assertion is reading a request that was really issued, not a default
that happened to match.

**Mutation testing, calibrated in both directions.** Each mutation was applied to
`src/app/(maestro)/source/workspace/page.tsx` and the same scope was run against
the file as it was before this change and as it is after. Every mutation was
confirmed to change behaviour before its result was recorded.

| Mutation applied to the route | Old scanner (13 cases) | This rewrite (14 cases) |
|---|---|---|
| 1. Membership fence block deleted outright | 2 failed | 5 failed |
| 2. Resolved explicit client dropped from the tenant-key chain | 1 failed | 3 failed |
| 3. Fence still called, its call text byte-identical, only its verdict ignored | **0 failed — 13 of 13 passed** | **4 failed** |
| 4. Behaviour-preserving rename of a local binding | **1 failed — false positive** | 0 failed |

Mutation 3 is the one that justifies the rewrite. The membership check runs, its
call site is unchanged to the byte, and only its answer is discarded — the state
in which any session can open any other tenant's contracts. The scanner was
blind to it. Mutation 4 is the other direction: a rename changes no behaviour,
and the scanner went red for it.

**Proof the CI wiring is what carries the coverage.** Census counts from
`node scripts/quality/test-ci-coverage-census.mjs`:

- At the original base the committed census was **byte-identical** to a fresh run
  on a clean tree, so every line of the census diff there was caused by this
  change. After the rebase the committed census was stale by exactly the
  intervening PR's one added test file, and has been refreshed.
- Measured on the rebase base `3e5d9f6d8`: baseline
  `pullRequestCoveredTestFiles` = **1998**, after wiring = **1999**.
- Per-file, which is the assertion that matters rather than the total: this
  file's record moves `pullRequestCovered: false → true` and its `via` gains
  `"command"` alongside the existing `"script-file"`.
- Removing **only this path** from the step: 1999 → **1998**, delta exactly −1.
- Replacing the **whole step** with `echo skipped`: 1999 → **1997**, delta −2,
  flipping both this file and `portfolioAdapter.ecl.test.ts`. Both numbers are
  reported because the −1 is the honest one for this path; the −2 would conflate
  this file with its sibling in the same step.
- At the pre-rebase base the same three measurements read 1997 → 1998, −1 and
  −2. Identical deltas, shifted absolutes.
- `productSourceCount` for this directory rises 31 → 33, measured on a clean
  tree at the rebase base as 31 and with this change as 33. The rewrite imports the two route
  modules it executes, so the directory resolves two more product sources. This
  is the intended effect of executing the route instead of reading it.

**Suites run, all green.**

- The exact wired CI step: 2 suites, 24 tests.
- The pre-deploy ECL gate's exact command (unchanged path): 3 suites, 28 tests.
- Sibling routing suites in the same directory (`contractDetailRetry.test.tsx`,
  `workspace-explicit-client-api-routing.browser.test.tsx`,
  `workspace-explicit-client-api-routing.test.ts`): 3 suites, 17 tests.
- Census and wiring gate suites (`t760-census-drift-ci-gate`,
  `census-drift-is-reported`, `test-ci-coverage-census`, `t557-unrun-suite-wiring`,
  `t516-green-suite-ci-wiring`, `t471-stale-suite-triage-ci-coverage`): 6 suites,
  138 tests.

## Rollout Plan

Merge to `main` by squash merge. There is no runtime rollout: no route, API,
image, migration, flag, or environment variable changes. The new CI step takes
effect on the next pull request and merge group.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision change, no worker job.
- Approved image digest: not applicable — no runtime image is built or pinned by
  this change.
- ACA runtime invariant: unaffected. This release changes test and documentation
  files only; the invariant is still to be read from the deploy run that carries
  the merge commit.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. Nothing a signed-in operator can see
  changes. The tenant-routing behaviour under test is not modified by this
  release; it is only now asserted by running it.

## Rollback Plan

Revert the single squash commit. Nothing else is required: no migration to
unwind, no image to repin, no flag to reset. Reverting restores the previous
source-text scanner and removes the suite from the pull-request job, lowering
`pullRequestCoveredTestFiles` by one from whatever it then stands at (1999 at the
time of writing).

## Audit Evidence

- The mutation table above, reproducible by applying each mutation to
  `src/app/(maestro)/source/workspace/page.tsx` and running the suite by path.
- The census deltas above, reproducible with
  `node scripts/quality/test-ci-coverage-census.mjs --json`.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — the amended
  verdict, the preserved prior verdict, and the re-verification condition.
- PR URL and its CI run, recorded on the pull request.

## Known Gaps

- The three remaining `held_unwired` entries in the T-478 triage record
  (`sourceFreshness.test.tsx`, `workspace-ava-contract.test.ts`,
  `workspace-explicit-client-api-routing.test.ts`) are still source-text
  scanners and are still owned by T-558. This release discharges one of the four
  and does not touch the others.
- The old file's assertions on prop *names* for the contract and workspace tab
  deep links are dropped rather than transcribed. A prop name is not a contract,
  and the tab deep links are not what a tenant-routing suite is for. They are
  not covered elsewhere, and that gap is stated here rather than hidden behind
  the higher case count.
- The census's `untriagedUnrunTestFiles` figure is unchanged at 395. The
  vocabulary defect behind that number is T-763's subject, not this one.
