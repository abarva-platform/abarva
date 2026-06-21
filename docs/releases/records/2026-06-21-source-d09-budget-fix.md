# 2026-06-21-source-d09-budget-fix — d09 sync rewrite budget: 110s → 20 min

## Release ID

`2026-06-21-source-d09-budget-fix`

## Status

`candidate`

## Plain-English Summary

`SOURCE_SYNC_GENERATION_BUDGET_MS` was 110 seconds, which was chosen to stay under an observed ~150s ACA gateway timeout. Board-grade artifacts (d09 RFP pack) take 450–550 seconds to generate a first draft — far beyond the 110s budget — so the quality-gate rewrite never fired and d09 was stuck at 7/10.

The 150s gateway timeout no longer applies: the `X-Abarva-Json-Heartbeat` wrapper added in PR #3756 sends a whitespace pulse every 12s that keeps the ACA ingress alive for the full duration of the route. The effective limit is now the ACA replica session timeout, not a gateway cut.

This PR increases the budget to 1,200,000ms (20 minutes). After the first draft is generated and the quality gate reviews it, the rewrite now always attempts instead of being skipped.

## Layer Impact

- **global-control-lane**: one constant changed in the generate route. No schema, no migration, no new dependency.

## Client Applicability

- All clients: applies to every artifact that fails the quality gate. Only affects the rewrite-attempt decision — draft generation itself is unchanged.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: `SOURCE_SYNC_GENERATION_BUDGET_MS` 110_000 → 1_200_000

## QA / Validation

- TypeScript: PASS — no type changes, constant value only
- Logic review: PASS — `remainingBudgetMs = 1_200_000 - (Date.now() - startedAt)`. For a 550s draft: remaining ≈ 650s > `SOURCE_QUALITY_REWRITE_MIN_REMAINING_MS` (45s) → rewrite attempts
- Integration: PENDING — d09 re-fired on event `17e32d94-1e22-49c9-ac5d-9ffd76d98e01` after deploy; `rewriteAttempted: true` to be confirmed in quality gate metadata

## Rollout Plan

1. Merge PR to main (squash)
2. ACA auto-deploys updated web image
3. Re-fire d09 generate on the test event; observe rewrite in streaming output

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy auto-deploys on push to main
- Shared runtime mutators: none
- ACA runtime invariant: heartbeat stream keeps connection alive — no ingress timeout risk
- Live signed-in proof required: yes — d09 generation with `rewriteAttempted: true` and score ≥ 8/10

## Rollback Plan

Revert the constant to 110_000. The 422 quality_gate_failed path is unchanged — reverting simply skips the rewrite again.

## Known Gaps

- Routes with `maxDuration = 600` export: this Vercel config is ignored by ACA, so the 600s Next.js limit does not apply. If Vercel is re-introduced as a runtime, the budget must be revisited.
- The async durable worker path (PR #3769) is still available for retry jobs but requires the `requireTenancy()` auth gap to be fixed before it can run headless.

## Audit Evidence

- PR URL: (assigned on merge)
- CI: tsc + existing test suite
- Post-deploy: quality gate metadata logged on d09 generation run showing `rewriteAttempted: true`
