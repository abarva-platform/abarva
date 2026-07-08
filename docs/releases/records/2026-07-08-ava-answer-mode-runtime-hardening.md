# 2026-07-08-ava-answer-mode-runtime-hardening — aVa Answer Mode Runtime Hardening

## Release ID

`2026-07-08-ava-answer-mode-runtime-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens aVa's client-visible answer contract after the 100-question product-truth regression found that runtime safety was working but some Moves and Tower answers still missed required executive structure. The fix aligns the Moves phase vocabulary everywhere and reapplies the CXO answer-mode fallback after runtime product-truth repairs, so repaired answers cannot lose the mandatory P0-P5 plus Tower table.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence answer assembly and Product Truth runtime guard behavior for all tenants.
- `public-demo`: Improves demo-facing answer quality because the same deployed app and tenant packs use this path.

## Client Applicability

- All clients: Yes. This is shared answer assembly and product-truth runtime behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Aligns Product Truth runtime guard Moves repair language to the canonical `P0 Originate` through `P5 Prepare to Execute` plus `Tower Track Outcomes` labels.
- Stops re-emitting the retired `Charter / Diagnose / Decide / Commit` phrase in client-visible repairs.
- Reapplies CXO answer-mode fallbacks after runtime Product Truth repairs in the main ask path and structured aVa packet path.
- Strips internal evidence-style codes from repaired client-visible answers.
- Adds regression tests for the phase repair and route-level fallback contract.

## QA / Validation

- Pass: `npx jest src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/agent/product-truth/runtime-guard.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/intelligence/ask/index.ts src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then rerun the 100-question aVa product-truth regression against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the same 100-question regression and inspect remaining failures.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database or data-plane rollback is required.

## Audit Evidence

- Baseline deployed regression report: `reports/ava-product-truth-100q-regression-2026-07-08.md`
- Regression bundle: `/Users/anand/Downloads/ava-product-truth-100q-regression-2026-07-08.zip`
- PR URL: To be added after PR creation.
- Live deployment evidence: To be added after merge and ACA deploy.

## Known Gaps

Live acceptance is pending deploy and rerun. The previous deployed regression was improved but not accepted: 77 pass, 7 watch, 15 fail, 1 critical, average score 8.19/10.
