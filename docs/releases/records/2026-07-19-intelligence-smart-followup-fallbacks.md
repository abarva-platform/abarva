# 2026-07-19-intelligence-smart-followup-fallbacks — Intelligence Smart Follow-up Fallbacks

## Release ID

`2026-07-19-intelligence-smart-followup-fallbacks`

## Status

`candidate`

## Plain-English Summary

The live FS Demo follow-up quality audit showed that aVa answers were generally client-grounded, but the suggested-question rail often fell back to generic safe questions such as "What can AbarVa confirm from loaded evidence?" The source was the product-truth safety fallback, not Claude. This release keeps the safety fallback but makes the Intelligence fallback tenant/question-aware so safe replacements ask about specific systems, data readiness, fraud/dispute evidence, credit/model-risk gates, capital-markets value, vendor evidence, board/CFO proof, Moves/Tower execution, or risk/compliance controls when those themes appear in the question or grounding text.

## Layer Impact

- `global-control-lane`: Shared product-truth guard for suggested questions.
- `experience`: Intelligence follow-up rail becomes more client-specific when generated questions are dropped or padded by the safety guard.
- `safety`: No weakening of unsafe suggested-question filtering. The fallback remains governed and avoids unsupported product/capability claims.

## Client Applicability

- All clients using Intelligence/aVa suggested questions.
- Primary live audit tenant: FS Demo (`arcturus`).
- Feature flag: none.

## Changes Included

- `src/lib/agent/product-truth/runtime-guard.ts`
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/intelligence/ask/__tests__/followups.test.ts --runInBand`
- Pass: `npx eslint src/lib/agent/product-truth/runtime-guard.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pending: `npm run release:check`
- Pending after deploy: rerun 20-question FS Demo follow-up audit against `https://app.abarva.ai`.

## Rollout Plan

1. Open PR from `codex/intelligence-smart-followup-fallbacks`.
2. Squash merge to `main` after checks.
3. Deploy through the repo-owned ACA main workflow.
4. Verify ACA runtime invariant and health.
5. Rerun the 20-question FS Demo follow-up audit and compare follow-up score against the baseline.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the approved ACA main workflow. No data migration rollback is required.

## Audit Evidence

- Baseline audit: `/tmp/intelligence-fs-followup-quality-audit-20260719/report.md`
- Baseline result: 20/20 API pass, average answer score 8.47/10, average follow-up score 6.97/10, follow-up pass count 2/20.
- PR: pending.
- ACA deploy proof: pending.
- Post-deploy audit: pending.

## Known Gaps

- This release improves safety fallback specificity. It does not guarantee Claude's first generated follow-ups are always ideal.
- The post-deploy 20Q audit is required before calling this live-proven.
