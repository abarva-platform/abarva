# 2026-10-10-source-color-literal-ratchet - Prevent new literal color debt

## Release ID

`2026-10-10-source-color-literal-ratchet`

## Status

`candidate`

## Plain-English Summary

Source's existing light theme is unchanged. A PR check rejects new hard-coded
color literals outside its existing shared token modules. This keeps the future
token migration from growing without migrating colors before a demonstration.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 presentation governance only. The change adds a development/CI audit;
there is no runtime component, style, data, adapter or canonical-model change.

## Client Applicability

- All clients: no visible change.
- Specific clients: none.
- Internal only: developers changing Source presentation files.
- Public/demo only: none.
- Feature flag: not applicable.

## Changes Included

- `scripts/audit/source-color-literals.mjs` and its Node test suite.
- Architecture Boundary PR workflow: test plus committed-tree audit.
- Explicit development dependencies for already-locked CSS parsing packages.
- Npm scripts, CI gate registry classification and the design-control note.

## QA / Validation

- 24 passing focused detection and temporary-Git CLI tests cover preservation, removals,
  duplicates, new colors despite decreasing totals, new files, selectors,
  URLs, comments, template interpolation and invalid source/ref refusal.
- Independent scanner review identified eight detection/normalization gaps;
  each was reproduced with a failing test and corrected before the PR.
- Mutation proof: disabling violations causes four failures; allowing unlimited
  copies causes one; removing the workflow invocation causes one.
- Unchanged production trees pass without recording a debt budget.
- No product component or stylesheet changes are included.
- ESLint, gate-registry classification/order, architecture boundaries, route
  reachability and library-orphan audits pass. Release check: all 11 gates pass.
- Test coverage census was regenerated and is unchanged: this Node suite lives
  outside the census's Jest-only `src/` scope and is invoked explicitly in CI.
- Remote CI remains a separate proof state; this record claims no browser or
  deployed theme acceptance.

## Rollout Plan

Merge by PR and squash. The architecture workflow runs the guard on subsequent
PRs; local developers can run it against their working tree. No manual runtime
deploy, database apply, flag or traffic change is required for this CI-only slice.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` remains unchanged.
- Shared runtime mutators: none added or invoked by this release.
- Approved image digest: not applicable to this CI-only change.
- ACA runtime invariant: no runtime mutation; not claimed as newly verified.
- Worker image invariant: no worker mutation.
- Feature/env flag update path: none.
- Live signed-in proof required: none for the audit itself; later visual changes
  still require their own browser proof.

## Rollback Plan

Revert this release by a reviewed PR. It removes the new CI guard; no persisted
data or product styles need rollback.

## Audit Evidence

Inspect the release PR, its Architecture Boundary check, the focused Node test
output and the scanner's before/after literal counts. The policy note defines
the exact scope and exception files rather than implying a whole-app audit.

## Known Gaps

Existing raw colors remain. Token migration, dark-mode mapping/implementation,
contrast testing and phone layout changes are explicitly deferred. Shared
styles outside the Source roots and semantic Tailwind palette utilities are
not checked by this literal-color gate. This is not visual acceptance proof.
