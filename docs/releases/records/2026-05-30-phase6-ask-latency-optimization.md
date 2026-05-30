# 2026-05-30-phase6-ask-latency-optimization — Ask Latency Optimization

## Release ID

`2026-05-30-phase6-ask-latency-optimization`

## Status

`candidate`

## Plain-English Summary

The Phase 6 50-concurrent SkyHarbor load probe returned 50/50 successful answers with zero tenant bleed, but full-stream p95 latency was 16.1 seconds against a 12 second target. The slow path included a second model call for suggested follow-up questions and a synthesis token budget larger than the visible response policy permits. This change removes that extra model call and tightens the synthesis budget while preserving the same answer-shape cap.

## Layer Impact

- `runtime-app-lane`: Improves `/api/intelligence/ask` response completion latency.
- `ai-egress-control-lane`: Removes the per-answer follow-up-generation model call from Ask.
- `qa-validation-lane`: Targets the Packet 30 Phase 6 load-test gate.
- `data-plane-lane`: No database, RLS, corpus, migration, or tenant-data change.

## Client Applicability

- All clients: Yes, authenticated Ask/Sentinel responses.
- Specific clients: SkyHarbor load-test gate benefits directly.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaces model-generated follow-up questions with deterministic contextual follow-ups.
- Reduces Ask synthesis `max_tokens` from 600 to 450 while keeping the visible response cap intact.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/followups.ts src/lib/intelligence/ask/synthesizer.ts`.
- PASS: `git diff --check`.
- Pending: `npm run release:check -- --base origin/main --head HEAD`.
- Pending: PR CI.
- Pending: post-deploy 50-concurrent SkyHarbor load rerun.

## Rollout Plan

Merge after CI passes, deploy to production, then rerun the Phase 6 SkyHarbor load probe and one SkyHarbor ground-truth verifier pass.

## Rollback Plan

Revert this PR to restore model-generated follow-ups and the previous synthesis token budget. No data rollback, environment rollback, RLS rollback, or migration rollback is required.

## Audit Evidence

- Pre-fix load probe: `/tmp/phase6-e2e/skyharbor-load/skyharbor-load-results.json`.
- Pre-fix load result: 50/50 HTTP 200, zero 5xx, zero 4xx, zero tenant bleed, p95 16.1s.

## Known Gaps

This optimizes full-stream completion latency. It does not change retrieval, scoring, tenant isolation, or corpus depth.
