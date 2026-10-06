# 2026-09-22-contract-purpose-review-gate — Restore the contract-purpose suite to the gate it is meant to prove

## Release ID

`2026-09-22-contract-purpose-review-gate`

## Status

`candidate`

## Plain-English Summary

A contract detail surface answers the question "what is this contract?". It answers it only when a
reviewed purpose extraction exists for that contract; when none exists it says so, in as many words,
rather than assembling a plausible-sounding description out of the contract's title, its vendor and
its category. That refusal was introduced deliberately in an earlier release, because a description
assembled from a header reads to an executive exactly like one a human reviewed, and the surface has
no way to mark the difference once it is written.

Two cases in a test suite were still written against the older, assembling behaviour. They had been
failing since that release. This change updates those two cases to supply the reviewed purpose they
were always about, and adds three cases that pin the refusal itself — so the assembling behaviour
cannot come back unnoticed, which is the only reason the failing cases mattered.

No product code changed. What a user sees is exactly what they saw before this change.

## Layer Impact

**Release lane: `global-control-lane`** — shared app behavior coverage, not client-scoped and not
feature-gated. Nothing here is client-data-lane: no schema, seed, ingestion, retrieval or private
data-plane path is touched.

- **Layer 4 (Products — Source).** Test-only. The behaviour under test is the contract-purpose panel
  on the Source contract detail surface; its implementation is untouched, byte-for-byte, and was
  confirmed so after every mutation run below.
- Layers 1–3 (client intake, source adapters, canonical model): no impact.

## Client Applicability

- All clients: no behavioural change. This is test coverage over existing shipped behaviour.
- Specific clients: none.
- Internal only: yes, in effect — the change is only visible to engineers and auditors.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — two stale cases updated, three refusal cases added, reasons recorded inline.
- This release record.

No migration, route, script, adapter or component changed.

## QA / Validation

**The diagnosis, because the item's whole risk was getting this backwards.** The two cases could
have been stale expectations *or* a read path that had stopped returning reviewed purpose rows —
both produce the identical fail-closed text. Four independent checks say stale:

1. **The fixtures never supplied the field.** Both cases construct a contract with `scope_summary`
   and no `purpose_summary` at all, so the gate is not rejecting a reviewed row — there is no row to
   reject.
2. **The expected strings are the output of a branch that was deleted on purpose.** `git show`
   on the commit that introduced the explicit review state shows the removed branch composed
   `This is ${kind.article} ${kind.label} with ${vendor} covering ${scopePhrase}`, which produces
   every substring the two cases assert, including `cloud consumption commitment` and
   `managed-services contract`. The commit's own record explains the removal.
3. **That commit updated three sibling suites in the same directory and missed this one** — and this
   is the only suite in the directory that no workflow runs, which is why nothing said so for a day.
4. **The positive path is green today, independently.** `contractPurposeProse.test.ts` case
   `names the reviewed extraction as the basis when one exists` passes on `487b9991c`, returning
   heading `What this contract is`. Reviewed rows are accepted. The field is also produced by a live
   pipeline — six migrations, the Source read adapter and three loader scripts reference
   `purpose_summary` — so the gate is wired to real data, not orphaned.

**Red first, measured, same 33-file scope, same invocation both times:**

| | Test Suites | Tests |
|---|---|---|
| Before, unmodified `origin/main` `487b9991c` | 1 failed, 32 passed | **2 failed**, 280 passed, 282 total |
| After | 33 passed | **0 failed**, 285 passed, 285 total |

The suite alone: 2 failed / 49 passed / 51 total before; 54 passed / 54 total after. The +3 are the
refusal cases added here; no case was deleted, quarantined or relaxed to match the fail-closed text.

**Mutation proof — 6 mutations, 6 caught, after 2 escapes that are the part worth keeping.**
Each mutation was applied to the untouched implementation, the suite re-run, and the implementation
restored; its SHA-256 was confirmed identical before and after every run.

| Mutation | Result |
|---|---|
| Restore the deleted assembling branch in place of the refusal | **caught** — 3 failed |
| Drop the bare-word rejection from `usableScopeSummary` | **caught** — 1 failed |
| Render the classification `label` instead of `readAs` in the body | **caught** — 2 failed |
| Drop `Reviewed purpose extraction` from the evidence line | **caught** — 1 failed |
| Force every contract to classify as cloud consumption | **caught** — 1 failed |
| Drop the separator rejection from `usableScopeSummary` | **caught by a sibling suite, deliberately not duplicated here** — see below |

The two escapes, both found by running a mutation rather than by reading the test:

- **Dropping the bare-word rejection left the suite green** on the first pass. The refusal fixture
  read `Cloud data platform subscription - absent - for_cause_only`, which the *separator* rejection
  catches before the word list is ever consulted — so the case proved one of two independent
  mechanisms while appearing to prove both. A second fixture carrying the bare word in prose, with
  no separator shape, now isolates the word list. The mutation is caught.
- **Dropping the separator rejection still leaves this suite green**, and that one is left alone on
  purpose: the same mutation turns `contractPurposeGuard.test.tsx` red at
  `does not describe concatenated clause states as reviewed scope`, verified by running it under the
  mutation rather than assumed from reading it. Duplicating it here would add a second assertion over
  a mechanism already covered.

**Also found while proving this, and filed rather than repaired:** the word list's `for_cause_only`
alternative is unreachable, because `withoutIdentifierTokens` strips snake_case runs before the list
is applied. It is a dead alternative in a live control, not a behaviour change. Repairing it changes
what the surface renders for an input that currently has its identifier stripped and its surrounding
prose kept, which is a product judgement and not this item's.

**Static checks:** `tsc --noEmit --pretty false` exit **0**, judged on the exit code — a bare
`tsc --noEmit` exits 134 on this machine with no diagnostics, which greps as clean. `eslint` on the
changed file exit **0**. `release-check` exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys on merge as it does for any
commit. No runtime behaviour depends on this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged, sole authority.
- Shared runtime mutators: none. No Azure command was run or is required by this change.
- Approved image digest: whatever the repo-owned workflow resolves for the merge commit.
- ACA runtime invariant: to be read from the carrying run's own invariant proof after merge.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: **no.** No product code changed and no rendered output moves.

## Rollback Plan

Revert the single commit. Nothing else depends on it, there is no migration, and the reverted state
is the current `main` — a suite with two failing cases, which no workflow runs.

## Audit Evidence

- The PR, its diff, and its CI run.
- The before/after table above, reproducible with
  `npx jest --runTestsByPath <the 33 files under that __tests__ directory>` on `487b9991c` and on the
  merge commit. Note that a bare Jest pattern will not work: every path contains the route-group
  segment `(maestro)`, which a pattern reads as a regex capture group and silently matches nothing.
- The mutation table above, reproducible by applying each mutation to
  `WorkspaceExecutiveShell.tsx` and re-running the suite.
- The commit that introduced the refusal, and its own release record, for the intent behind it.

## Known Gaps

- **No workflow runs this suite, and merging this does not change that.** Verified: `grep` over
  `.github/workflows/` returns nothing for `WorkspaceExecutiveShell.performance`,
  `contractPurposeGuard`, `contractPurposeProse` or `preview/workspace`. All four contract-purpose
  suites are unwired. CI wiring is a separate open backlog item whose acceptance names the shared
  workflow file, and that file is deliberately not touched here — one owner per file. Until it is
  wired, this suite going red again would be as silent as it was this time. That is the honest
  status, and it is the reason the item existed.
- The dead `for_cause_only` alternative described above is filed, not fixed.
- No signed-in acceptance was performed and none is owed: no product code changed.
