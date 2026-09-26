# 2026-09-26-c406-contract-question-surface-reachability — record which surface a whole-contract question reaches

## Release ID

`2026-09-26-c406-contract-question-surface-reachability`

## Status

`candidate`

## Plain-English Summary

A committed measurement said that 48 of 48 whole-contract questions "fell through" the aVa Source
answer-mode classifier. The number is correct. What was never recorded beside it is the number's
**scope** — which mounted route those questions actually travel through — and without that, the
number reads as a statement about the contract-advisory surface. It is not one.

Measured here from repository bytes: the two paths are disjoint in both directions.

- The Ask aVa contract entry point, `/api/intelligence/ask`, does **not** import
  `src/lib/source/ava/answer-mode.ts` at any depth. It answers through
  `src/lib/source/ava/source-workspace-visual-answer.ts`, which it imports directly.
- `/api/chat/agent` **does** import the classifier, directly, and does **not** reach the contract
  answer builder at any depth.

Surface binding, measured rather than assumed: `/source/360` re-exports the `/source/workspace`
page, which mounts a loader and then the client that posts to `/api/intelligence/ask`.
`/source/optimize` is the one Source contract surface that posts to `/api/chat/agent`.

So the consequence that was drawn from the fallback count — that every contract question falls
through this router — describes the event-chat surface, not the contract-advisory surface. The
practical cost of the missing scope: a change built where the spec puts the general
contract-question path **cannot** move that count, and the only edit that would move it is adding
rules to a classifier the contract surface never enters.

This change records the scope and asserts it. It adds **no** routing rule, changes **no** retrieval,
and edits no product behaviour: the only non-test, non-doc edit is a comment block in the classifier
pointing a future reader at the measurement.

## Layer Impact

- `global-control-lane` — agent/answer runtime control surface, read-only. No behaviour changes: the
  single product-file edit is a comment, and the diff over that file contains additions that are all
  `//` lines and no removals.
- No data-plane, schema, RLS, migration, tenant-data or auth change.

## Client Applicability

- All clients: no behaviour change reaches any client.
- Specific clients: none.
- Internal only: yes — a committed measurement artifact and a behavioral suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/c406-contract-question-surface-reachability.test.ts` — new behavioral
  suite. Reads module specifiers through the TypeScript AST rather than by a text scan, because the
  subject is syntax: specifiers span lines, sit in type-only positions, and appear inside `import()`
  expressions.
- `docs/architecture/c406-contract-question-surface-reachability.json` — the committed measurement.
  Split into `core` (equality-asserted: the reachability booleans, the surface bindings and the scope
  statement) and `observed` (recorded for a reader, deliberately not equality-asserted: closure
  sizes, chains and dynamic-import counts). A closure size changes whenever an unrelated module is
  added, and a gate that fails for an unrelated reason gets weakened rather than read.
- `src/lib/source/ava/answer-mode.ts` — comment block only, naming the surface this classifier serves
  and pointing at the artifact.

## QA / Validation

Baseline measured on a **byte-identical clean tree** (the change removed, `git status --porcelain`
empty), over the same scope, rather than quoting an absolute count:

- Scope: the 23 pre-existing suites that reference the classifier or its neighbours
  (`answer-mode`, `answer-quality-gate`, `module-expert`, `mode-grounding`, `export-answer-packet`).
- **Before:** 1 failing / 421 tests. **After** (same 23 plus the new suite, 24 total): 1 failing /
  442 tests. The single failure is the same one in both runs —
  `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts › injects the
  strategy-to-AbarVa solution contract into the active synthesis path` — and it was confirmed failing
  on the clean tree before this change existed. It is **not** caused by this change and is **not**
  claimed as fixed by it; it is filed as a separate finding.
- New suite in its **final** form, against the pre-change tree: **4 failing before / 0 after**,
  measured by holding the artifact out of the tree rather than by quoting an earlier draft.

**Seven** deliberate mutations, each confirmed to have changed the tree before its count was
recorded. Correcting my own overstatement by amending rather than restating: the commit message on this
branch says "eight". Seven were run, the table below is the whole set, and the miscount was in the
prose and never in the evidence:

| # | Mutation | Result |
|---|---|---|
| 1 | Import the classifier into `/api/intelligence/ask` | 4 failed — decisive case is the ask-route negative |
| 2 | Blind the specifier resolver (always unresolved) | 8 failed, including the non-vacuity guard |
| 3 | Flip the artifact's `describesRoute` / `doesNotDescribeRoute` | 2 failed **in isolation of that block**, so the scope guard is live and not absorbed by the equality assertion |
| 4 | Change the cited §12.11 `fallbackCount` from 48 to 47 | 1 failed — the citation guard |
| 5 | Repoint `/source/optimize`'s fetch at the ask route | 1 failed — exactly the surface case |
| 6 | Repoint the Contract 360 client's fetch at the chat route | 1 failed — exactly the surface case |
| 7 | Make the closure reader **over**-report | 4 failed — so the negative readings are not vacuous in the other direction either |

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostic lines, judged by exit code rather than by grep.
- `npx eslint` over both changed source files — clean, exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

Two findings recorded because they change what a later reader should do:

1. **A coarse needle reported the negative reading refuted when it was not.** The first draft looked
   for the literal `answer-mode` anywhere in the ask closure and found three hits — all belonging to
   `src/lib/intelligence/ask/answer-mode-registry.ts`, a *different* module on the Ask path that
   holds CXO response-shape contracts rather than question routing. Two modules sharing a name
   fragment is exactly how a later reader would talk themselves out of this measurement, so the near
   miss is now **asserted** (the ask closure must contain that registry, must not contain the
   classifier, and they must be different files) rather than filtered away.
2. **The negative reading is stronger than a closure usually supports.** Both entry points carry
   **zero** `import()` calls with a computed specifier, so the one hole in the method is empty here
   rather than merely small. The count is committed so a later reader can check that it still is.

One correction, appended rather than restated: an earlier note in this work named the paths as
*indirect* (`via server-contract-answer-context.ts`, `via answer-quality-gate.ts`). Both imports are
**direct** — `route.ts:78-81` and `route.ts:179-186` respectively. The reachability facts are
unchanged; the chains named were one of several.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as usual. There is no
runtime behaviour to activate: a comment block and a test-only artifact cannot change what a request
returns.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy workflow; recorded in Audit Evidence after the run.
- ACA runtime invariant: to be proven after merge — Container App template image, 100%-traffic
  revision image and both required deliverable worker job images on one digest.
- Worker image invariant: unchanged by this release; asserted after deploy, not assumed.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing user-visible changes. Stated as `no` deliberately
  rather than left blank, so this record does not silently join the set that owes a signed-in run.

## Rollback Plan

Revert the squash commit. There is no migration, no data write and no flag, so the revert is
complete on its own. Reverting removes a test and an artifact; it restores no prior behaviour,
because none was changed.

## Audit Evidence

- PR URL: recorded on the PR that carries this record.
- CI run: the PR's required checks, including `release:check` and the behavior coverage floor.
- Local validation: the before/after table and the eight mutation rows above.
- The measurement itself: `docs/architecture/c406-contract-question-surface-reachability.json`,
  regenerable with `ABARVA_UPDATE_C406_SURFACES=1 npx jest --runTestsByPath
  src/__tests__/behaviors/c406-contract-question-surface-reachability.test.ts`.
- Post-merge: ACA deploy run keyed to the **exact** merge SHA (concurrency cancels that run and a
  newer one is not yours), plus the digest equality read independently from Azure.

## Known Gaps

- **The item this came from needs retargeting, and that is a decision, not a code change.** The
  acceptance that asked for the §12.11 fallback count to fall cannot be satisfied by building the
  general contract-question path where the spec puts it, and can only be satisfied by doing what the
  same acceptance forbids. The recommendation and the proof are filed in the backlog; no taxonomy or
  scope call is made here.
- **This suite is a tripwire, not a prohibition.** If a later change deliberately routes contract
  questions through the classifier, it fails, and the correct response is to regenerate the artifact
  and say in that release record why the scope changed — a reviewed diff instead of silent drift. The
  failing assertion's own message says so.
- **A pre-existing failure was found and is not repaired here.**
  `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts` fails on clean `origin/main`
  and appears in no backlog row. Repairing it needs a judgement about whether the assertion or the
  synthesizer is stale, which is out of scope for a measurement item.
- No signed-in run was performed and none is claimed.
