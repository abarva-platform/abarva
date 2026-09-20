# 2026-09-20-qa-shared-path-disposition — One answer for what an absent path means

## Release ID

`2026-09-20-qa-shared-path-disposition`

## Status

`candidate`

## Plain-English Summary

Two QA reports read the same file path and gave two different answers about why it was missing.

One report said the file had been **deleted on purpose**, naming the commit that removed the directory it lived in. The other said the same file was **not built yet, pending an upcoming slice of work**. Both statements were in the same codebase, on the same commit, generated from the same tree. Only the first was true; the second was a sentence written at the call site years earlier that nothing ever re-checked.

This change moves the decision "what does an absent path mean?" out of hand-written sentences and into a small shared module with three declared answers: a named commit removed it, a named slice has not built it yet, or nobody has ruled on it and an item owns that call. An absence matching none of the three is now a **failure that asks for the declaration** rather than a quiet "deferred" that reads as normal.

Two false claims in the route-shell report are replaced with measured ones:

- A component reported as "a Wave-20 SHELL7 component, not yet integrated" was in fact never on this history at all, and the directory that would have held it was deleted by `0c6a86c51`. It now reports as removed, with that commit — the same answer its sibling report already gave.
- An admin route reported as "deferred pending Wave-20 admin shell integration" has never been added or removed by any commit on `main`. No wave was measurably building it, so the pending claim was unearned. It now says exactly that, and names the backlog item that owns whether the route should exist.

The deliberately narrow part: this fixes what the reports **claim**, not what the product **contains**. Whether that admin route should exist, and which brand assets are canonical, are product decisions this change does not make and does not pretend to make.

## Layer Impact

Release lane: `global-control-lane` — a shared CI/quality control, identical for every client and behind no feature gate. No client-scoped schema, seed, ingestion or retrieval is touched, so this is not `client-data-lane`.

- **Layer 4 (Products):** none. No product surface, route, read model or answer path is touched.
- **Test/tooling:** two QA report modules, one new shared module, and their suites. Nothing here runs at request time — these are deterministic filesystem reports.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — QA verification reports and their suites
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/path-disposition.ts` (new) — the shared vocabulary (`retired` / `pending` / `undecided`), `resolvePathStatus`, and `SHARED_PATH_DISPOSITIONS` for dispositions more than one verifier reads.
- `src/lib/qa/intelligence-tower-blueprint-verification.ts` — consumes the shared resolver; keeps its own public exports so existing importers are unaffected; takes the shared entry instead of restating it.
- `src/lib/qa/active-route-shell-verification.ts` — gains `ROUTE_SHELL_PATH_REGISTER`; the two `*OrDeferred` helpers that accepted a free-text deferral sentence are replaced by `checkRouteDeclared` / `checkComponentDeclared`, which consult the register. Adds the `removed` status and `removedCount`; a removal holds `overallStatus` at `partial`, matching the blueprint report.
- `src/__tests__/integration/qa/path-disposition.test.ts` (new) — 11 cases.
- `src/__tests__/integration/qa/active-route-shell-verification.test.ts` — stale assertions updated with the reason; adds a structural guard that every absent path is register-backed.

## QA / Validation

**Measured before/after over the same scope, against a clean `origin/main` worktree at `cfc1fcab6`.**

The CI command for this directory — `npx jest src/__tests__/integration/qa --no-coverage --ci $(node scripts/quality/qa-integration-ignore-args.mjs)`:

| | suites | tests |
|---|---|---|
| before (clean `origin/main`) | 32 passed / 32 | 805 passed / 805 |
| after | 33 passed / 33 | 817 passed / 817 |

Over the wider set of every suite importing the changed modules (8 suites before, 9 after):

| | result |
|---|---|
| before | 4 failed / 548 passed / 552 |
| after | 4 failed / 560 passed / 564 |

The same 4 failures stand before and after. They are `logo-usage-enforcement.test.ts` and `shell8-legacy-retirement.test.ts`, both already quarantined against a different item that owns the canonical-logo decision. `logo-usage-enforcement.ts` is not modified by this change. **They were not caused here and are not cleared here.**

**The defect, demonstrated before the fix.** A test asserting the two reports agree about the shared path failed on the pre-fix tree for the right reason — the blueprint assertion (`removed`) passed and the route-shell assertion failed with `Expected: "removed" / Received: "deferred"`.

**Mutation check — the guard can fail.** Harness first asserted to actually run (89 tests, not zero); an earlier attempt reported results having run nothing, because the shell did not split the path list.

| mutation | result |
|---|---|
| baseline | 89 passed / 89 |
| present + declared retired returns `pass` instead of `fail` | **2 failed** / 87 passed |
| absent + undeclared returns `deferred` instead of `fail` (restores the original defect) | **2 failed** / 87 passed |
| route-shell keeps its own drifted copy instead of the shared entry | **2 failed** / 87 passed |
| `undecided` resolves as a pending claim again | **1 failed** / 88 passed |
| restored | 89 passed / 89 |

**Other checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0 errors (exit code judged, not grep output). `npx eslint` over the five changed files — exit 0. `node scripts/quality/check-qa-integration-quarantine.mjs` — exit 0, clean; it now re-runs 5 excluded of 38 suites, the new suite being included by default.

**Every commit named in a disposition was derived with `git log origin/main` and confirmed with `git merge-base --is-ancestor`:** `0c6a86c51` and `d5e0ef495` (both ancestors), and `f1d8bc95c` / `5d795a397` checked while measuring. A `--all` reading is not evidence about a branch and none was used.

**One thing worth recording, because it is the failure mode this repository keeps paying for.** The first version of the new guard matched the report's detail text for the wording being removed. It failed — on the register note that *quotes* that wording to explain why it went. A text matcher cannot tell a quotation from a claim, which is the same shape as a CI gate that proves a control exists because its name appears in the file. The guard was rewritten to be structural: it asserts every absent path resolves through a register entry, which is a fact about the data and not about the prose.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys on merge as usual. Nothing here executes at runtime, so no behavior reaches a signed-in user; the deploy only needs to carry the code forward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge to `main`)
- Shared runtime mutators: none — no ad-hoc Azure command, no image build, no flag or env change
- Approved image digest: produced by the main deploy workflow for the merge SHA
- ACA runtime invariant: verified after merge — Container App template image, 100%-traffic revision image, and worker job images all equal to the approved digest
- Worker image invariant: unchanged by this release
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — test-and-tooling only, with no product surface, no route and no request-time behavior in the diff. Recorded explicitly so the absence of a signed-in check is a stated finding and not an omission.

## Rollback Plan

Revert the merge commit. No migration, no data change, no flag, so the revert is complete on its own. The two repaired checks would return to their previous wording, which is the pre-existing defect rather than a new one.

## Audit Evidence

- The pull request and its CI run
- The before/after and mutation tables above, each reproducible with the commands quoted
- `scripts/quality/check-qa-integration-quarantine.mjs` output
- `git merge-base --is-ancestor` for every commit named in a disposition

## Known Gaps

- **Not decided here, deliberately.** Whether `src/app/(maestro)/platform/admin/architecture/page.tsx` should exist is an open product call owned by another backlog item; this change records the question honestly instead of answering it. The route's disposition is `undecided`, which keeps the report green while stating that nothing is pending.
- **Not cleared here.** The canonical-logo decision and its three real brand-asset enforcement failures are owned by a separate item. `logo-usage-enforcement.ts` is untouched, and its two suites remain quarantined for that reason.
- The seven paths deleted by `f1d8bc95c` (five brand assets, two top-bar components) were **re-measured and found already correct**: they sit in retired lists where absence is the expected state and each reports as correctly absent. They do not name the commit that removed them, which is a smaller gap than the one fixed here and is left open rather than bundled in.
- A third verifier, `apex-source-program-storyline-verification.ts`, carries four "Deferred pending <SLICE>" strings of the same shape. It was not re-measured in this change and is left for a separate, bounded pass.
