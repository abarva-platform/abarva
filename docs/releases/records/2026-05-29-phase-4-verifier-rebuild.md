# 2026-05-29-phase-4-verifier-rebuild

## Release ID

`2026-05-29-phase-4-verifier-rebuild`

## Status

`candidate`

## Plain-English Summary

This release rebuilds the SkyHarbor 25-question Sentinel verifier into an audit-grade test harness. Browser automation is now used only to obtain a valid Clerk session; every question is then sent through Node `fetch` with a fresh tab ID, explicit latency budget, and clear separation between product failures and harness failures.

## Layer Impact

Quality/audit lane: the Tier-1 verifier now produces deterministic per-question artifacts, a markdown report, an HTML report, and JSON evidence.

Runtime product lane: no product runtime code changes.

Data/schema lane: no schema changes and no production data mutation.

Control lane: verifier tests cover cookie handling, NDJSON parsing, harness taxonomy, scoring caps, wrong-tenant leakage, and canned API responses.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: SkyHarbor Air receives the immediate verifier coverage because this script runs the Packet 30 Tier-1 SkyHarbor quality gate.
- Specific clients later: Apex Retail, Meridian Health, Northstar Clinical Technologies, and First Capital will receive equivalent verifier coverage when Phase 6 expands the validation matrix across all five canonical tenants.
- Internal only: quality/audit operators running the verifier.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/skyharbor/07_verify/ground_truth_runner.mjs`
- `scripts/skyharbor/07_verify/lib/cookieJar.mjs`
- `scripts/skyharbor/07_verify/lib/clerkSession.mjs`
- `scripts/skyharbor/07_verify/lib/scorer.mjs`
- `scripts/skyharbor/07_verify/__tests__/runner.test.mjs`
- `scripts/skyharbor/07_verify/__tests__/integration.test.mjs`
- `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs`

## QA / Validation

- PASS: `node --test scripts/skyharbor/07_verify/__tests__/runner.test.mjs scripts/skyharbor/07_verify/__tests__/integration.test.mjs`.
- PASS: `npx eslint scripts/skyharbor/07_verify/ground_truth_runner.mjs scripts/skyharbor/07_verify/lib/cookieJar.mjs scripts/skyharbor/07_verify/lib/clerkSession.mjs scripts/skyharbor/07_verify/lib/scorer.mjs scripts/skyharbor/07_verify/__tests__/runner.test.mjs scripts/skyharbor/07_verify/__tests__/integration.test.mjs scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs`.
- PASS: `git diff --check`.
- PENDING: `npm run release:check -- --base origin/main --head HEAD`.
- PARTIAL: live SkyHarbor verifier run 1 completed in `/tmp/phase4-verifier-run-1` with 21/25 product passes and no timeouts. The run surfaced streamed `EMAXCONNSESSION` infrastructure errors on Q24/Q25, so the verifier now classifies streamed error events as `fail-harness`; runtime root-cause fix is being handled separately before Phase 4 can close.

## Rollout Plan

Merge after verifier tests, release gate, and PR CI are green. This is script-only and does not require production traffic rollout, but the live verifier should be run against `https://app.abarva.ai` after merge to capture the new baseline.

## Rollback Plan

Revert this PR to restore the prior monolithic verifier wrapper. No database rollback is required.

## Audit Evidence

- Packet 30 Phase 4 requires Node-fetch execution after Clerk bootstrap, fresh tab IDs per question, latency budgets, and `pass` / `fail-product` / `fail-harness` / `timeout` / `refused` status taxonomy.
- Wrong-tenant leakage is automatic product failure with a zero score.
- Pattern-overlay-only answers and unavailable-data admissions are capped at 3/5.

## Known Gaps

Phase 5 partial-evidence prompting is still queued. Verifier score improvements are expected after Phase 5; this PR makes the gate trustworthy before changing Sentinel prompting behavior.

The first live run exposed an `EMAXCONNSESSION` runtime blocker after roughly 20 sequential Ask requests. Phase 4 does not close until that blocker is fixed and three consecutive verifier runs complete with zero `fail-harness` rows.
