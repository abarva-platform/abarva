# 2026-09-20-quarantine-covers-shared-qa-module — Declare the shared QA module two quarantined suites began importing

## Release ID

`2026-09-20-quarantine-covers-shared-qa-module`

## Status

`candidate`

## Plain-English Summary

`main` is red on a required check and this makes it green without weakening it.

The Intelligence quarantine list requires every quarantined suite to declare each module it imports
and what would happen to that module if the suite were deleted. `check-intelligence-integration-quarantine.mjs`
recomputes every declaration against the tree on each run, so a wrong or missing one fails CI.

Two quarantined suites gained an import of `src/lib/qa/path-disposition.ts` in `bac3d12e6` without
the matching declaration, so the check has failed on `main` ever since — exactly as designed. This
adds the two missing declarations with the class the tree measures: `kept-other-importer`, because
non-test source files that are not themselves going import that module, so clearing either suite
must not take it.

No entry is cleared, no suite is un-quarantined, the list-size ratchet is untouched, and the check
itself is unchanged.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane tooling, not client-scoped.

- **Tooling / CI only.** One data file: `scripts/quality/intelligence-integration-quarantine.json`.
  No product surface, no canonical model, no adapter, no route, no runtime behaviour.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — CI gate data.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/intelligence-integration-quarantine.json` — `src/lib/qa/path-disposition.ts`
  declared as `kept-other-importer` in the `covers` of `intelligence-route-shell-wiring.test.ts`
  (which had an empty `covers`) and `sentinel-active-patterns-page.test.ts`. Inserted line-wise
  rather than by a JSON round-trip, so the diff is 10 added lines and 1 changed and the file's
  existing escaping is untouched.

## QA / Validation

**Measured on clean `origin/main` before anything was changed.** A detached worktree of
`82ff93fb168cab0b9301fd5ceef84fcafcba9d6a` runs `npm run check:intelligence-integration-quarantine`
and exits **1** with the same two problems the CI job reported, so the failure is on `main` and not
introduced by the branch that surfaced it.

The cause was identified rather than guessed: `git log -1 -S "@/lib/qa/path-disposition"` over each
suite names `bac3d12e6` as the commit that added the import, and `git merge-base --is-ancestor`
confirms that commit is on `main` — not `git log --all`, which is not evidence about a branch.

`npm run check:intelligence-integration-quarantine`: **11 passed / 1 failed before, 12 passed / 0
failed after**, same 12-test harness. The gate's own summary after the change reads: 16 excluded of
24 suites, 8 run on every PR, 29 retired paths watched, 25 covered modules classified, 0 swept-in
sibling paths.

**The correct class was measured, not chosen.** The first declaration written was deliberately
`kept-live-test`; the check rejected it and named the measured class — `kept-other-importer` — which
is what was then declared. A declaration that agrees with the tree only because someone picked the
value that made CI green is the failure mode this control exists to stop, so the wrong value was
written first on purpose.

**Two mutations, two caught:**

| # | Mutation | Caught by |
|---|---|---|
| M1 | declare the shared module in the wrong class | "records ... as kept-live-test, but it measures as kept-other-importer today" |
| M2 | drop one of the two declarations | "imports ... but its covers does not list it" |

## Rollout Plan

Merge to `main`. CI data only — no migration, no flag, no image behaviour change, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: produced by the main deploy workflow for the merge SHA.
- ACA runtime invariant: verified after merge.
- Worker image invariant: verified on the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no — this file is never read at request time and no product surface
  changes.

## Rollback Plan

Revert the single squash commit. The check returns to failing as it does on `main` today; nothing
else changes.

## Audit Evidence

- PR and its check run on the merge commit.
- `npm run check:intelligence-integration-quarantine` output before and after.
- The clean-`main` reproduction on a detached worktree at `82ff93fb1`.
- `git merge-base --is-ancestor bac3d12e6 origin/main`.

## Known Gaps

- **This declares the two imports; it does not decide either suite's fate.** Both remain quarantined
  for their recorded reasons, and clearing them is separate open work.
- **The gap this exposes is a sequencing one and is not closed here.** A PR may add an import to a
  quarantined suite and merge while the gate that would object runs against a list the same PR did
  not update. Whether that check should also run on the changed-suite path is a decision, recorded
  in the backlog rather than guessed at.
