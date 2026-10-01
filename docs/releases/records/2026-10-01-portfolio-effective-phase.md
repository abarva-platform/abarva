# 2026-10-01 — Portfolio Shows the Effective Phase

## Release ID

`2026-10-01-portfolio-effective-phase`

## Status

`candidate`

## Plain-English Summary

The Moves portfolio list now shows each Move at the phase its own workspace would show. Previously the list read the stored phase — the furthest a Move was ever advanced — while the phase workspace re-checked earlier gates and sent the reader back to the phase that was really open. A Move whose earlier gate had stopped holding could appear one phase further on in the list than anyone could work it, and its row linked to a phase that immediately redirected away as blocked.

The rule that decides the effective phase is unchanged. It moved out of the phase page into one shared function, and the portfolio list now calls the same function.

## Layer Impact

**Release lane: `global-control-lane`.** This changes the shared Moves portfolio surface for every client; it is not behind a feature flag.

- **Product layer — Moves portfolio:** Phase, phase label, and the row link reflect the effective phase for live Moves. Archived Moves are shown as stored.
- **Product layer — Moves phase workspace:** No behavior change; it now calls the shared resolver instead of an inline copy of the same steps.
- **Canonical model:** No schema or data changes. The stored phase is not rewritten — the effective phase is derived on read, as before.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/effective-move-phase.ts` (new): `resolveEffectiveMovePhase` and `applyEffectivePhasesToPortfolio`.
- Phase workspace page: inline derivation replaced by the shared resolver.
- Portfolio page: effective phases applied after the portfolio read.
- `buildUnverifiedGateCriteria` exported so a re-phased row carries criteria for the phase shown.
- Tests for the resolver and the portfolio applier.

## QA / Validation

- Targeted Jest: pass — `116 suites, 1083 tests` across Moves library and component suites and the route-shell enforcement suite; 12 new tests for the resolver.
- Mutation check: pass — treating an unevaluable gate as holding fails the fail-closed test.
- Targeted ESLint and Prettier on changed files: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Signed-in runtime verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, open the portfolio for a synthetic workflow whose earlier gate is open and confirm the row shows the same phase as the Move's workspace and links to it without a redirect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The portfolio page now evaluates the earlier gates of each live Move past its first phase, four Moves at a time. For a large portfolio of late-phase Moves this adds read load to the list page; it has not been measured at that size.
- Portfolio counts and status text are still computed from stored state. A re-phased Move's status line is not rewritten to say it was reopened.
- Other surfaces that read the stored phase directly (for example exports or summaries outside the portfolio page) are not changed here.
