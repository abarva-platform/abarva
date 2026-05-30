# 2026-05-30-phase6-concise-ask-fast-path — Concise Ask Fast Path

## Release ID

`2026-05-30-phase6-concise-ask-fast-path`

## Status

`candidate`

## Plain-English Summary

Explicitly concise Sentinel Ask questions now use a smaller model token budget and deterministic follow-up prompts. This targets the Phase 6 50-concurrent SkyHarbor load gate without changing the restored behavior for full verifier questions.

## Layer Impact

- `runtime-app-lane`: Ask/Sentinel responses that explicitly ask for a concise or short answer use a tighter synthesis budget and the faster standard synthesis model.
- `ai-egress-control-lane`: Concise requests avoid the extra follow-up model call by using deterministic follow-up prompts.
- `tenant-isolation-lane`: Non-comparison answers that mention a different canonical tenant are blocked before streaming to the user.
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

- Adds `chooseSynthesisTokenBudget()` so concise Ask requests use `260` max tokens and normal requests keep `600`.
- Routes concise Ask synthesis to `claude-sonnet-4-6`; non-concise topic/vendor/general synthesis keeps the restored `claude-opus-4-7` path.
- Adds deterministic follow-ups only for concise Ask requests.
- Adds a SkyHarbor/global-airline off-tenant mention guard for non-comparison responses.
- Passes tenant context into `retrieveKnowledge()` and filters off-tenant legacy composite seeds before source events are emitted.
- Adds regression tests for scoped token-budget, follow-up behavior, and off-tenant mention blocking.

## QA / Validation

- PASS: focused Ask guardrail tests (`npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`).
- PASS: focused ESLint (`npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/followups.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`).
- PASS: PR #2472 CI and production deployment.
- FAIL: First post-deploy Phase 6 load rerun improved but missed strict acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 13.895s, one off-tenant detector hit.
- FAIL: Second post-deploy Phase 6 load rerun still missed strict acceptance: 50/50 HTTP 200, zero 4xx/5xx, p95 13.544s, one off-tenant detector hit traced to `RESEARCH` sources from off-tenant legacy composite seeds.
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
- Single-request bleed diagnostic:
  - `/tmp/phase6-e2e/skyharbor-single-cio-current/skyharbor-load-results.json`
- Failed prior broad optimization was reverted by PR #2471; this candidate keeps full verifier questions on the restored path.

## Known Gaps

This does not by itself certify Phase 6. Certification still requires production load rerun, zero tenant bleed, zero 5xx, and verifier sanity after deployment.
