# 2026-07-19-intelligence-followup-topic-lock-v2 — Intelligence Follow-up Topic Lock v2

## Release ID

`2026-07-19-intelligence-followup-topic-lock-v2`

## Status

`candidate`

## Plain-English Summary

The post-deploy FS Demo 20-question follow-up audit after PR #5069 proved that generic boilerplate fallbacks were gone, but the rail still missed the CXO-quality bar. The root cause was topic drift: Intelligence fallback questions scanned the broad grounding packet and could pad a data-foundation, governance, or systems answer with contact-center or fraud questions because those terms appeared elsewhere in the tenant packet. This release topic-locks Intelligence fallback questions to the user's prompt first, uses grounding only when the prompt has no clear topic, and drops overly long generated follow-ups so concise governed questions can replace them.

## Layer Impact

- `global-control-lane`: Shared product-truth guard for suggested questions.
- `experience`: Intelligence suggested questions become shorter, more relevant, and less likely to drift across tenant topics.
- `safety`: Unsafe suggested-question filtering remains in place. The change removes "certify" wording from fallback questions and keeps professional decision authority out of the follow-up rail.

## Client Applicability

- All clients using Intelligence/aVa suggested questions.
- Primary audit tenant: FS Demo (`arcturus`).
- Feature flag: none.

## Changes Included

- `src/lib/agent/product-truth/runtime-guard.ts`
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/intelligence/ask/__tests__/followups.test.ts --runInBand`
- Pass: `npx eslint src/lib/agent/product-truth/runtime-guard.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Not-run after deploy: rerun the 20-question FS Demo follow-up audit against `https://app.abarva.ai`.

## Rollout Plan

1. Open PR from `codex/intelligence-followup-topic-lock-v2`.
2. Squash merge to `main` after checks.
3. Deploy through the repo-owned ACA main workflow.
4. Verify ACA runtime invariant and health.
5. Rerun the 20-question FS Demo follow-up audit and compare against both the original baseline and the post-#5069 audit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the approved ACA main workflow. No data migration rollback is required.

## Audit Evidence

- Original baseline audit: `/tmp/intelligence-fs-followup-quality-audit-20260719/report.md`
- Original baseline result: 20/20 API pass, average answer score 8.47/10, average follow-up score 6.97/10, follow-up pass count 2/20.
- Post-#5069 audit: `/tmp/intelligence-fs-followup-quality-audit-20260719-post-followupfix/report.md`
- Post-#5069 result: 20/20 API pass, average answer score 8.72/10, average follow-up score 6.89/10, follow-up pass count 0/20.
- Finding: #5069 removed generic fallback wording, but topic drift and long generated questions still kept follow-ups below the CXO-quality bar.
- PR: pending.
- ACA deploy proof: pending.
- Post-deploy audit: pending.

## Known Gaps

- This release hardens deterministic fallback and padding quality. It does not redesign Claude follow-up generation itself.
- The post-deploy 20Q audit is required before calling this live-proven.
