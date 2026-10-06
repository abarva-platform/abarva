# 2026-09-22-t554-optimize-governed-context-restored — Restore the Optimize tab's value ledger and evidence gate

## Release ID

`2026-09-22-t554-optimize-governed-context-restored`

## Status

`candidate`

## Plain-English Summary

The contract Optimize tab stopped showing two statements it is supposed to show, and
nothing reported it.

Optimize used to be a two-column tab: the levers on the left, and a narrow context
column on the right. That right-hand column carried two claims that appear nowhere
else on the tab — a ledger keeping candidate, claimed and finance-confirmed value in
separate columns that never sum, and a one-sentence evidence gate naming what a
signal row still needs before it can carry value at all.

A later change made Optimize full-width and stopped building the right-hand column on
that tab. The two Optimize-specific branches were left behind *inside* the column that
is no longer built: each sat under a `tab === "Optimize"` test nested inside a
`tab !== "Optimize"` one, so neither could ever run. The result is that a reader
opening Optimize saw the levers and their sequence, but was no longer told what still
gates the value or which of those dollars are merely candidates. The full-width layout
itself was deliberate and is kept; only the two lost statements are restored, now at
the end of the tab body where the tab can actually render them.

This is the failure mode the surrounding programme exists to catch: no error, no
failing gate, and a comment left in the code still describing the behaviour as
surviving. What did report it was a suite that runs in no workflow, which is why it
went unseen.

## Layer Impact

Release lane: **`global-control-lane`** — shared product behaviour for all clients, not
feature-gated. The Optimize tab renders the same way for every tenant, so restoring
these two statements restores them everywhere at once.

- **Layer 4 — Products (Source).** Presentation only. Two already-governed statements
  are rendered on a tab that had stopped rendering them.
- **Layer 3 — Canonical model:** unchanged. No read path, adapter, projection, query or
  view-model field is touched; both statements read values the view model already
  supplied and the tab already discarded.
- No schema, migration, tenant data, auth, RLS or retrieval change.

## Client Applicability

- All clients: yes — the contract Optimize tab behaves the same way for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a render path, not a new capability.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
  - Renders the value-type ledger (`What can be claimed`) and the evidence gate
    (`What still gates value`) at the end of the Optimize body, guarded by the same
    governed-opportunity condition the unreachable branches used.
  - Removes the dead `tab === "Optimize" ? gate : statement` choice from the context
    panel, whose Optimize arm could not be taken, and replaces the comment that
    described it as surviving there.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
  - Two blocks asserted the right-hand column's contents on Optimize. They were written
    for the two-column tab and outlived it. They now assert those surfaces **absent**,
    with the reason recorded inline, rather than being deleted — an assertion that
    cannot fail is not one.
  - Adds an assertion on the ledger's own content, not only its heading (see QA below).

## QA / Validation

Measured on `origin/main` `a796a558b`, in an isolated worktree.

**The defect, before any change.** One `jest --runTestsByPath` invocation on
`WorkspaceClient.ecl-browser.test.tsx` — `--runTestsByPath` is required, not preferred:
the path contains the route-group segment `(maestro)` and a bare Jest pattern reads
those parentheses as a capture group.

| | suite result |
|---|---|
| before | **3 failed, 7 passed, 10 total** |
| after | **10 passed, 10 total** |

**Clean baseline over the same scope**, all 33 suites under
`src/app/(maestro)/source/preview/workspace/__tests__/`, same invocation both times:

| | suites | tests |
|---|---|---|
| before (`origin/main`, unmodified) | 2 failed, 31 passed | **5 failed**, 277 passed, 282 total |
| after (this branch) | 1 failed, 32 passed | **2 failed**, 280 passed, 282 total |

The 2 that remain are in `WorkspaceExecutiveShell.performance.test.ts` and fail
identically on unmodified `origin/main`. They are **not** caused by this change and are
**not** repaired here; they are filed as their own item (see Known Gaps).

**Mutation testing — the fix proved able to fail, and one escape found and closed.**

| # | mutation | result |
|---|---|---|
| 1 | delete the evidence gate from the Optimize body | 1 failed — caught |
| 2 | delete the value ledger from the Optimize body | **10 passed — ESCAPED** |
| 2b | same mutation, after strengthening the assertion | 1 failed — caught |
| 3 | build the context panel on Optimize again | 2 failed — caught |
| 4 | drop the governed-opportunity guard so both render unconditionally | 3 failed — caught |
| 5 | revert the whole product change to `origin/main` | 1 failed — caught |

Mutation 2 is the one worth recording. The suite asserted the ledger's heading,
`What can be claimed`, and the heading is rendered by a separate element from the
ledger itself — so deleting the ledger left the label standing and the suite green. A
label with no data under it is precisely what these controls exist to prevent, so the
suite now asserts a line from the ledger's body as well. Found by running the mutation,
not by reading the test.

Other checks, each judged on its exit code:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  0 `error TS` lines. The exit code is judged because a bare `tsc --noEmit` exits 134 on
  this machine (a V8 out-of-memory crash emitting no diagnostics), which greps clean.
- `npx eslint` on both changed files — **exit 0**, no output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the PR.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from the
merge SHA; no manual Azure command is run from this branch and no shared runtime is
mutated by hand. No migration, no flag, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by that workflow; recorded on the claim line after merge.
- ACA runtime invariant: to be proven after deploy — Container App template image, the
  100%-traffic revision image and required worker job images must match the approved digest.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is owed, not claimed.** This change alters
  what a reader sees on a product tab, and only a signed-in check on the deployed SHA can
  show it rendering. This record does not assert that check has happened.

## Rollback Plan

Revert the single commit. The change is two files and confined to a render path, so a
revert restores the previous behaviour exactly, with no data or schema consequence. The
suite returns to 3 failed / 7 passed, which is the state this record measured on
`origin/main`.

## Audit Evidence

- The PR for this branch, and its CI run.
- The before/after and mutation tables above, each reproducible with the single
  `--runTestsByPath` invocation named in QA.
- The commit that introduced the unreachable branches is identified in the PR body by
  SHA, so the ten-week gap between the regression and its detection is checkable.

## Known Gaps

- **The suite that caught this runs in no workflow.** It is one of the seventeen filed
  for CI wiring under its own item; wiring is deliberately not done here, because a
  bounded change reviewed properly is the point. Until it is wired, nothing in CI
  protects this fix.
- **Two failures remain in the same directory** (`WorkspaceExecutiveShell.performance.test.ts`),
  pre-existing and unmodified by this change. The contract-purpose summary returns its
  fail-closed text where the suite expects reviewed extraction prose. Whether that is a
  stale fixture or a real read-path regression is undetermined and is filed as its own
  item rather than guessed at here.
- **A third surface orphaned by the same commit is not restored.** The refusal chips
  component is exported and has no caller anywhere in the tree. It was removed from the
  Optimize body by the same change, and unlike the ledger and the gate no test asserts
  it, so whether it should return is a product judgement rather than a defect to repair
  silently. Filed, not decided.
- Signed-in acceptance on the deployed SHA is owed.
