# 2026-09-24-source-workspace-shell-byte-scanner-retirement — Replace the Source workspace shell's file-byte assertions with controls that can fail

## Release ID

`2026-09-24-source-workspace-shell-byte-scanner-retirement`

## Status

`candidate`

## Plain-English Summary

One test suite over the Source preview workspace shell was checking that certain
text appeared **in the component's source file**, rather than checking what the
component actually does. Nine of its cases read the `.tsx` and `.css` files off
disk and matched substrings. Two things follow from that, and both were real
here:

1. A **comment** carrying the same text satisfied the check. The affordance
   could be deleted from the page and the test would stay green, as long as the
   words survived somewhere in the file.
2. A component that is no longer reachable from the product still has its bytes
   on disk, so a check of this shape keeps passing after the feature is gone.

This change replaces those checks with ones that can fail, and it is a test and
tooling change only — no product behaviour is altered.

The second point turned out to matter more than the first. One of the nine
cases was titled "keeps the contract graph tab as a real lineage visual with
drill-down subtabs" and asserted thirteen strings about it. **There is no
contract graph tab.** The renderer it describes has been unreachable from the
Source command information architecture since `4b3c2b569` (2026-09-10), carries
its own lint suppression saying so, and is mounted by nothing in `src/`. The
thirteen assertions had been green for the two weeks since. That case is
retired, the dead renderer is filed for deletion as backlog item `U-503`, and
the reason is written where the case used to be.

## Layer Impact

Release lane: `global-control-lane`. The change is shared repository behaviour —
test coverage and a CI step — with no client-scoped data, schema, or ingestion
component and no feature gate.

- **Products (layer 4) — Source.** One component declaration changes from
  private to exported so a test can mount it. No rendered output, no data path,
  and no user-visible behaviour changes.
- **No change** to client intake, source adapters, or the canonical model.
- Test and CI wiring only, otherwise.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — test coverage and CI wiring.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — the nine byte-scanning cases, resolved one of three ways, each recorded
  beside the control it applies to:
  - **RENDERED** — moved to a mounted tree (the evidence lane chart).
  - **RETIRED** — deleted, with the reason: either a render elsewhere already
    proves it, or its subject is unreachable (the graph tab).
  - **HYGIENE** — kept, because the control is a rule about the *code* (a
    pattern that must appear nowhere in 8421 lines, or a stylesheet declaration
    jsdom never applies) that no single rendered frame can express. These now
    read through `sourceCode()` / `styleSheet()`, which blank every comment
    before the scan while preserving offsets.
  - Seven new cases prove the comment-stripping scanner itself, in both
    directions, including two real known positives — a phrase that exists in
    each shipped file only inside a comment.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.shell-behaviour.test.tsx`
  (new) — the rendered replacement.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` —
  one word: `EvidenceLaneBarChart` is exported so it can be mounted. Nothing
  else in the file changes.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite is named
  by exact path in the step that already names its sibling, so the replacement
  control runs in the same required job the byte-scans ran in. The step's
  comment records why its existing reasoning was not sufficient.

## QA / Validation

Measured against a clean baseline over the same scope, on `origin/main`
`2d8bcd790`.

**Re-verification before any code was written.** The item also described two
failing cases. They do not reproduce: the suite is **54 passed / 54 total / 0
failed** on `2d8bcd790`. The item asked to establish whether the fallback text
it tripped on was a product regression or a stale expectation *before* touching
the assertion. It was neither left nor guessed: `T-588` had already settled it
correctly — the refusal branch is intended behaviour (a contract with no
reviewed purpose extraction must not be characterised), the **fixtures** were
updated to supply a reviewed purpose rather than the expectations being edited
to accept the refusal, and the unreviewed input kept its own named case so the
deleted branch cannot return unnoticed.

**Suite counts.**

| scope | before | after |
|---|---|---|
| the repaired suite | 54 passed / 54 total | 60 passed / 60 total |
| the new rendered suite | — | 1 passed / 1 total |
| the whole required workflow step (11 suites) | — | 116 passed / 116 total, 0 failed |

**Mutation proof — every control that was kept.** 44 mutations over the
component and the stylesheet, each verified to have actually changed the file
before the run (a no-op mutation reads exactly like a coverage gap). Positives
were proved by removing the real token; negatives by injecting the forbidden
pattern as **real code**, never as a comment. **44 applied, 44 killed, 0
survived.**

**Mutation proof — that the repair closes the defect.** Three mutations run
against both the old and the new suite:

| mutation | old suite | new suite |
|---|---|---|
| A — affordance deleted from the JSX, its text left behind in a comment | **0 failed / 54** (green: the control was satisfiable by a comment) | **1 failed / 60** |
| B — a forbidden string written only into a comment, nothing renders it | **1 failed / 54** (a false alarm) | **0 failed / 60** |
| C — the guard genuinely removed, not commented | 1 failed / 54 | 1 failed / 60 |

A and B are the defect, in both directions. C is the control that had to survive
the repair, and did.

**Mutation proof — the rendered replacement.** The evidence lane chart's
`aria-label` was removed from the component and the new case went red;
restoring it returned it to green.

**Wiring proved by the census, not by grep.** `buildCensus()` reports the new
suite is **not** in the unrun set. `t557-unrun-suite-wiring.test.ts` and
`t743-agent-tests-directory-ci.test.ts` — the two guards that hold this
workflow's shape — are **63 passed / 63 total**.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — **exit code 0**, 0 `error TS` lines. Judged on the exit code:
a bare run exits 134 on this machine and emits no diagnostics, which greps as a
false clean.

**Lint.** `npx eslint` over all three changed source files — exit 0, no
findings.

## Rollout Plan

Merge to `main`. No runtime rollout: this change adds and rewrites tests, adds
one `export` keyword, and names one more file in a CI step. The repo-owned ACA
main deploy workflow will build and deploy on merge as it does for any commit;
nothing in this change alters an image, a flag, an environment variable, a
worker job, or traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image is selected here.
- ACA runtime invariant: unaffected; to be confirmed from the post-merge deploy
  run as for any merge.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**. No product surface changes.

## Rollback Plan

Revert the merge commit. There is no migration, no data write, and no runtime
state, so the revert is complete on its own. The one non-test change is an
`export` keyword; reverting it restores the private declaration.

## Audit Evidence

- The PR and its CI run.
- The mutation tables above are reproducible from the commit: the sweep applies
  each mutation to a pristine copy, asserts the file changed, runs the suite,
  and reads the failing titles out of jest's own JSON rather than from a
  transcript.
- `docs/architecture/t556-stale-suite-triage.json` — the record that verdicted
  the repaired suite `wire_into_ci`.

## Known Gaps

- **`ContractGraphPage` and its stylesheet classes are dead code and are still
  in the tree.** Filed as `U-503`. This change retires the controls that were
  describing it; deleting the renderer itself is a product-surface change and
  is not folded into a test repair.
- The three suites `T-556` verdicted `rewrite_as_behavior` are untouched and
  still deliberately unrun. `T-558` owns them.
- The `.sw-v2-*` stylesheet assertions that remain are still substring matches
  against a comment-stripped file. jsdom parses no stylesheet, so no mounted
  tree can distinguish a present rule from a missing one; this is stated on
  each such control rather than dressed up as behaviour.
