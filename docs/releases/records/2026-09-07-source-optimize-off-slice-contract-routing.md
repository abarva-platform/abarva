# 2026-09-07-source-optimize-off-slice-contract-routing — Fix Contract 360 opening the wrong contract from Optimize rows

## Release ID

`2026-09-07-source-optimize-off-slice-contract-routing`

## Status

`candidate`

## Plain-English Summary

The Source workspace preloads only a small slice of a client's contract book for the Verdict/Vendors/Contracts landing views. Optimize's action queue is not limited to that slice — it lists action rows for any contract that has evidence-backed findings, most of which sit outside the preloaded set.

Clicking one of those rows correctly fetched the full detail for the right contract in the background, but the page that opened kept showing a different, already-preloaded contract instead — silently, with no error. The fetch succeeded; the render never looked at the result.

Root cause: the component that decides which contract to display looked the clicked contract up only in the small preloaded slice. When it wasn't there, it fell back to a default contract instead of checking the record that had just been fetched. A second, related gap sat one layer deeper: the view-model's contract-detail lookup was itself keyed off "the contract found in the preloaded slice," so it never even attempted to read the fetched detail for a contract that wasn't in that slice, independently of the outer bug.

Both are now fixed by keying the lookup off the raw selected contract id (which is always correct, whether or not the contract is in the preloaded slice) rather than off a derived object that is only populated for preloaded contracts.

## Layer Impact

Release lane: `global-control-lane` — shared Source workspace UI behavior, not tenant-scoped.

- Layer 4 (Products — Source): contract-selection/render logic fixed in the Source workspace shell (`WorkspaceExecutiveShell.tsx`). No canonical data changed.
- Layer 3 (Canonical model): unaffected. The contract-detail API this depends on was already returning correct data; only the client-side selection of which fetched record to display was wrong.
- Layers 1-2 (Client intake, source adapters): unaffected.

## Client Applicability

- All clients: yes — this is a shared UI defect, not tenant-specific. Any client whose Optimize queue references a contract outside the preloaded top-N portfolio slice was affected.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — `selectedContract` now keys off the raw selected contract id (`logic.state.sel.id`) instead of the view-model's derived `vm.c`, and falls back to the already-fetched `logic.state.contractDetail[id]` record before defaulting to a preferred or portfolio-order-0 contract.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` — new regression test: renders the workspace with an Optimize action row for a contract deliberately excluded from the preloaded portfolio slice, clicks it from Optimize's "By contract" view, and asserts Contract 360 opens showing that contract's own fetched identity, not a preloaded default. The test was verified to fail against the pre-fix code (asserted a heading that never appeared, showing the wrong contract instead) before it was made to pass by the fix, confirming it actually exercises the bug rather than passing vacuously.

## QA / Validation

- Live-reproduced before fixing: found live in the running product by inspecting the Optimize tab's row-click behavior and cross-checking the network tab, which showed the correct contract-detail API call succeeding while the rendered page showed a different contract's data.
- `NODE_OPTIONS=--max-old-space-size=12288 node_modules/typescript/lib/tsc.js --noEmit -p .` (Node 24, per this repo's required version) — 0 errors repo-wide, before and after the test-file addition.
- `npx jest --testPathPatterns "WorkspaceClient.ecl-browser"` — 5 passed, including the new regression test.
- `npx jest --testPathPatterns "app/\(maestro\)/source/preview/workspace"` — full module suite, 10 suites / 92 tests passed.
- `npx eslint` on both changed files — clean.
- Regression test confirmed to fail before the fix (wrong contract's heading rendered) and pass after — not a vacuous assertion.

## Rollout Plan

Merge to main via PR (squash). Standard ACA main-deploy build/rollout on merge; no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none used directly; deploy goes through the repo-owned workflow only.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100% traffic revision image, worker images all match the approved digest).
- Worker image invariant: unaffected — this is a web UI change only.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — after deploy, open Optimize's "By contract" (or Queue) view for any tenant with action rows outside the preloaded portfolio slice, click a row, and confirm Contract 360 opens showing that row's own contract, not a different one.

## Rollback Plan

Revert the PR. The change is additive fallback logic (existing behavior for contracts already in the preloaded slice is untouched); reverting restores the prior silent-fallback behavior with no data or migration risk.

## Known Gaps

- This fix repairs the top-level page identity (which contract's Contract 360 opens) by reading the fetched detail directly in the workspace shell. It does not repair the deeper, related gap in `buildViewModel.ts`, where the view-model's own `contract`/`c`/`cVm` derivation (used for aVa-facing narrative text such as scope-summary strings, separate from the visible page) is keyed off the same preloaded-slice-only lookup and still returns null for an off-slice contract. That narrower gap did not reproduce as a visible defect in this pass (the fields it feeds were not shown to be wrong on the affected page) but should be reviewed together with this fix rather than assumed fixed by it.
- Only the Optimize "By contract" click path was exercised end-to-end (network tab + regression test). The Optimize "Queue" view and other contract-opening entry points share the same `onOpenContract` handler and the same underlying fix, but were not each individually live-reproduced before the fix.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
