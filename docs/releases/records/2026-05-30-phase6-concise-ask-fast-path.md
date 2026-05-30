# 2026-05-30-phase6-concise-ask-fast-path — Concise Ask Fast Path

## Release ID

`2026-05-30-phase6-concise-ask-fast-path`

## Status

`candidate`

## Plain-English Summary

Explicitly concise Sentinel Ask questions now use a compact advisor prompt, trimmed source payload, smaller model token budget, and deterministic follow-up prompts. This targets the Phase 6 50-concurrent SkyHarbor load gate without changing the restored behavior for full verifier questions.

## Layer Impact

- `runtime-app-lane`: Ask/Sentinel responses that explicitly ask for a concise or short answer use a compact synthesis prompt, tighter synthesis budget, and the faster audited Haiku synthesis model.
- `ai-egress-control-lane`: Concise requests avoid the extra follow-up model call by using deterministic follow-up prompts.
- `tenant-isolation-lane`: Non-comparison answers that mention a different canonical tenant are blocked before streaming to the user.
- `tenant-resolution-lane`: Ask now uses strict tenant resolution so an authenticated no-tenant user cannot fall back to a default client.
- `retrieval-lane`: Knowledge-source retrieval now filters legacy composite research rows against the active tenant.
- `qa-validation-lane`: Adds guardrail tests proving the fast path is scoped to concise requests only.
- `data-plane-lane`: No database, RLS, corpus, migration, or tenant-data change.

## Client Applicability

- All clients: Yes, because Sentinel Ask is shared across tenants.
- Specific clients: SkyHarbor Phase 6 load test is the proving case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `chooseSynthesisTokenBudget()` so concise Ask requests use `160` max tokens and normal requests keep `600`.
- Uses a compact Sentinel system prompt, 8-source cap, and trimmed source details only for explicit concise requests.
- Routes concise Ask synthesis to `claude-haiku-4-5-20251001`; non-concise topic/vendor/general synthesis keeps the restored `claude-opus-4-7` path.
- Adds deterministic follow-ups only for concise Ask requests.
- Adds a SkyHarbor/global-airline off-tenant mention guard for non-comparison responses.
- Passes tenant context into `retrieveKnowledge()` and filters off-tenant legacy composite seeds before source events are emitted.
- Sets Ask tenant resolution to `allowFallback: false`, preventing no-tenant sessions from receiving default-client tenant sources.
- Adds regression tests for scoped token-budget, follow-up behavior, and off-tenant mention blocking.

## QA / Validation

- PASS: focused Ask guardrail tests (`npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`).
- PASS: focused ESLint (`npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/followups.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`).
- PASS: PR #2472 CI and production deployment.
- FAIL: First post-deploy Phase 6 load rerun improved but missed strict acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 13.895s, one off-tenant detector hit.
- FAIL: Second post-deploy Phase 6 load rerun still missed strict acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 13.544s, one off-tenant detector hit traced to `RESEARCH` sources from off-tenant legacy composite seeds.
- FAIL: Post-knowledge-scope production rerun cleared the tenant isolation defect but still missed strict latency acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 13.140s, zero tenant bleeds.
- PASS: Post-compact-concise production load rerun met strict acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 10.866s, zero tenant bleeds.
- PASS: Post-compact-concise SkyHarbor verifier sanity: 25/25, fail-harness 0, timeout 0, average 4.92/5.
- FAIL: No-tenant regression exposed default-client fallback before this strict-resolution patch: HTTP 200 but Apex Retail tenant source appeared.
- PASS: Post-strict no-tenant regression: HTTP 200, graceful, zero canonical tenant bleeds, no TENANT sources.
- FAIL: Post-strict SkyHarbor load rerun stayed correctness-clean but missed strict latency acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 12.324s, zero tenant bleeds.
- FAIL: Post-source-trim SkyHarbor load rerun stayed correctness-clean but missed strict latency acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 12.694s, zero tenant bleeds.
- NOT-RUN: revised PR CI for the second optimization pass, pending after branch push.
- NOT-RUN: revised production deployment, pending after merge.
- NOT-RUN: revised Phase 6 SkyHarbor load rerun and SkyHarbor verifier sanity, pending after production deployment.

## Rollout Plan

Merge after CI passes, deploy production, rerun the 50-concurrent SkyHarbor load probe, then rerun a SkyHarbor verifier sanity pass.

## Rollback Plan

Revert this PR. The change is limited to concise Ask request generation and deterministic follow-up creation.

## Audit Evidence

- Phase 6 pre-fix load results remained correctness-clean but above the p95 target:
  - `/tmp/phase6-e2e/skyharbor-load/skyharbor-load-results.json`
  - `/tmp/phase6-e2e/skyharbor-load-rerun/skyharbor-load-results.json`
  - `/tmp/phase6-e2e/skyharbor-load-post-opt/skyharbor-load-results.json`
- First scoped fast-path rerun:
  - `/tmp/phase6-e2e/skyharbor-load-concise-fast/skyharbor-load-results.json`
- Second scoped fast-path rerun:
  - `/tmp/phase6-e2e/skyharbor-load-sonnet-guard/skyharbor-load-results.json`
- Knowledge-scope production rerun:
  - `/tmp/phase6-e2e/skyharbor-load-knowledge-scope/skyharbor-load-results.json`
- Compact-concise production rerun:
  - `/tmp/phase6-e2e/skyharbor-load-compact-concise/skyharbor-load-results.json`
- Compact-concise verifier sanity:
  - `/tmp/phase6-e2e/skyharbor-post-compact-verifier/GROUND_TRUTH_RESULTS.md`
- No-tenant regression failure:
  - `/tmp/phase6-e2e/no-tenant-regression/no-tenant-regression.json`
- No-tenant regression pass:
  - `/tmp/phase6-e2e/no-tenant-regression-post-strict/no-tenant-regression.json`
- Post-strict load rerun:
  - `/tmp/phase6-e2e/skyharbor-load-post-no-tenant-strict/skyharbor-load-results.json`
- Post-source-trim load rerun:
  - `/tmp/phase6-e2e/skyharbor-load-post-source-trim/skyharbor-load-results.json`
- Single-request bleed diagnostic:
  - `/tmp/phase6-e2e/skyharbor-single-cio-current/skyharbor-load-results.json`
- Failed prior broad optimization was reverted by PR #2471; this candidate keeps full verifier questions on the restored path.

## Known Gaps

This does not by itself certify Phase 6. Certification still requires production load rerun, zero tenant bleed, zero 5xx, and verifier sanity after deployment.
