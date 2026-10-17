# 2026-09-26-c408-version-freeze-read-fence — Execute the Source version-freeze read fence, and delete the unread invalidation list

## Release ID

`2026-09-26-c408-version-freeze-read-fence`

## Status

`candidate`

## Plain-English Summary

A sourcing event's Request and Strategy content can be frozen at a version, and people approve that
exact version. If someone then materially edits the content, a new version supersedes the old one,
and the approval that was given to the old content must stop counting. Two separate pieces of code
looked like they enforced that, and neither had been shown to run: one list of "approvals to
invalidate" was computed and never read by any caller, and the approval resolver for the Strategy
half was exported and called from nothing outside tests.

This change answers, by measurement rather than by reading, which mechanism actually enforces the
rule — and then tests that mechanism in a way that fails when it is removed.

**The rule is enforced at read time, in the query.** The approvals read asks only for approvals
recorded against the version that is currently unsuperseded, so a stale approval is never fetched at
all. Nothing has to delete or invalidate it. Two further checks exist behind that query and both are
redundant while it holds; one of them is kept deliberately, because if the query's filter were ever
widened it makes the read refuse rather than hand a stale approval to a surface.

**The unread invalidation list is deleted, not wired.** Two pieces of code writing one rule is two
pieces of code to keep honest, and the one nobody called was the one to remove.

Nothing a client sees changes. No behaviour changed at all: this is a proof that existing behaviour
is what it was believed to be, plus the removal of dead code that read like a control.

## Layer Impact

- `global-control-lane` — Source event authority-version gate. Test coverage and a dead-code
  removal in `src/lib/source/new-workspace/`. No route, no schema, no projection, no read model and
  no rendered surface changes.

There is no layer-1/2/3 impact. No tenant data is read or written by this change, and no product
surface's output moves.

## Client Applicability

- All clients: no behavioural change. The removed field had no consumer, so no client-visible output
  depended on it.
- Specific clients: none.
- Internal only: the measurement artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/__tests__/authority-version-store.test.ts` — a fixture
  (`serveTable`) that applies the recorded `.eq`/`.is` predicates to a row set instead of answering
  the same rows whichever filters were asked for, plus four cases under
  `the version-freeze fence — which mechanism holds it`.
- `src/lib/source/new-workspace/source-version-authority.ts` — `invalidatedApprovalVersionIds`
  removed from both arms of `SourceAuthorityVersionPlan` and from `planSourceAuthorityVersion`, with
  the reason recorded at the type that carried it.
- `src/lib/source/new-workspace/source-version-authority.test.ts` — the two assertions on that field
  removed, and one case retitled so it no longer claims the planner invalidates anything.
- `docs/architecture/c408-version-freeze-read-fence.json` — the per-layer measurement, including the
  mutation applied to each layer and the case titles it fails.

Item: `C-408`. Lane: `global-control-lane`.

## QA / Validation

Scope for every number below is the eight suites `.github/workflows/unit-suites.yml` runs for this
directory, so the measured scope is the scope CI will run. The baseline was measured in a separate
detached worktree at `origin/main`, not by stashing this one.

- Clean baseline at `1526110e70d95acdbfd38309b6046432b01e6549`: **8 suites, 80 passed, 0 failed.**
- After this change: **8 suites, 84 passed, 0 failed.** Four cases added, none removed, none
  weakened.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics. Judged on the exit code, because a bare `npx tsc --noEmit` exits 134 on this host and
  a grep over its empty output reports a false clean.
- `npx eslint src/lib/source/new-workspace/` — exit 0.
- `npx prettier --check` over the three changed files — clean. (Fourteen other files in that
  directory carry pre-existing Prettier warnings on `main`; untouched here.)

**Mutation checks. Every mutation was confirmed to have changed the file before its suite was run, and
one mutation attempt that silently never reached the file was discarded and re-run rather than
reported as a survivor.**

| # | mutation | result |
|---|---|---|
| M1 | delete the read-time `.eq("version_id", currentVersion.id)` from the approvals read | 3 fail — both new fence cases plus the pre-existing predicate-shape assertion |
| M2 | delete `resolveApproval`'s `row.version_id` re-check | 1 fail — the fail-closed backstop case, and only that one |
| M3 | drop the `versionId` comparison from `approvalsForCurrentVersion` | 2 fail, both in the pure-function suite; **0** fail in the suite that executes the store |
| M4 | give the invalidation list a consumer that deletes stale approval rows in the write path | 1 fail — the no-second-writer case (run twice: against the field as it stood, and after its removal via `plan.supersedesVersionId`) |

M3's asymmetry is the finding that made the new fixture necessary: a guard whose only proof asserts
on a pure function's return value can be removed without any test that drives the real read path
noticing. That is how both halves of this gate stayed green while unreached.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on merge as usual. There
is no runtime behaviour to enable, no migration to apply and no flag to set.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change. No `az` command is run by hand for this release.
- Approved image digest: assigned by that workflow; recorded below once the deploy completes.
- ACA runtime invariant: to be proven read-only after the deploy — Container App template image ==
  100%-traffic revision image.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** No rendered surface, route or read model changes, and the
  removed field had no consumer to observe. Test-and-dead-code-only.

## Rollback Plan

Revert the squash commit. Nothing outside these four files changes, no migration is involved, and no
data is written, so the revert is complete on its own. Reverting restores a dead field and two
weaker test assertions; it does not restore any behaviour, because none was changed.

## Audit Evidence

- PR: recorded on merge.
- Per-layer measurement with mutations and failing case titles:
  `docs/architecture/c408-version-freeze-read-fence.json`.
- CI: the unit-suites workflow group for `src/lib/source/new-workspace`.
- Deploy run and digest proof: appended after merge.

## Known Gaps

**One half of the item is deliberately not done, and it is a product decision rather than missing
work.** `evaluateStrategyVersionApprovals` still has zero non-test references anywhere in `src/`.
The item offered "wire it or retire it", and the measurement changes what that choice costs:

- Nothing **writes** the strategy half either. The only production caller of
  `persistSourceAuthorityVersion` persists `"request"`; `authorityKind: "strategy"` appears in no
  production path in the repository, and every occurrence is in a test.
- So "wire it" is not naming a caller for an existing resolver. It is building the Strategy version
  write path, its payload projection and its approval recording — the whole exit condition of the
  `F2` workstream, not a bounded change.

Recommendation: decide whether `F2` is in scope before deciding which resolver to keep. Do not
resolve it by deleting the resolver as tidy-up — the fence proven here already covers the strategy
kind, so the resolver is the only part that would have to be rebuilt.

The fence itself is complete for both kinds and is proven for both: one of the four new cases drives
the strategy kind end to end through the real store, precisely so that wiring the resolver later
cannot be mistaken for wiring the fence.
