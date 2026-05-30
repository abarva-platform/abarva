# 2026-05-30-revert-phase6-ask-latency-optimization — Roll Back Ask Latency Optimization

## Release ID

`2026-05-30-revert-phase6-ask-latency-optimization`

## Status

`candidate`

## Plain-English Summary

The Ask latency optimization shipped in PR #2470 did not close the Phase 6 load gate and introduced a SkyHarbor verifier regression. This reverts that change so production returns to the previously validated Ask/Sentinel behavior.

## Layer Impact

- `runtime-app-lane`: Restores the prior Ask follow-up generation and synthesis token budget.
- `qa-validation-lane`: Rolls back a failed Phase 6 performance experiment after production validation.
- `ai-egress-control-lane`: Restores the prior follow-up generation model call.
- `data-plane-lane`: No database, RLS, corpus, migration, or tenant-data change.

## Client Applicability

- All clients: Yes, authenticated Ask/Sentinel behavior returns to the pre-#2470 path.
- Specific clients: SkyHarbor verifier correctness is the rollback trigger.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reverts PR #2470 / commit `c32943b7df79a08b1562feb80561e212a6e056bf`.
- Removes the failed latency-optimization release record.

## QA / Validation

- PASS: Revert commit applied cleanly.
- Pending: PR CI.
- Pending: production redeploy.
- Pending: post-redeploy SkyHarbor verifier sanity run.

## Rollout Plan

Merge after CI passes, deploy production, then rerun a SkyHarbor verifier sanity pass to confirm the previous answer behavior is restored.

## Rollback Plan

Revert this rollback only if a safer latency fix is ready and passes the SkyHarbor verifier before production promotion.

## Audit Evidence

- Failed optimized deployment: `dpl_E84b5BNBP6nrZD4oYRbAZUJnCHJp`.
- Post-optimization load result: 50/50 HTTP 200, zero tenant bleed, but p95 remained above the 12s target.
- Post-optimization verifier regression: `/tmp/phase6-e2e/skyharbor-post-opt-verifier` showed a SkyHarbor verifier miss at `CTO-Q06`.

## Known Gaps

The Phase 6 load p95 target remains open. The next performance fix should be designed and validated without reducing answer quality.
