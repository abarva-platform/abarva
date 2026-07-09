# 2026-07-08-ava-moves-intent-classifier — aVa Moves Intent Classifier Hardening

## Release ID

`2026-07-08-ava-moves-intent-classifier`

## Status

`candidate`

## Plain-English Summary

The post-4611 live 100-question regression proved the product-safety guard was working, but the deterministic P0-P5 Moves table still did not appear for several execution and handoff questions. The root cause was intent classification: prompts such as "correct Moves model", "canonical phases", "P0-P5", "phase-gate", and "connect Source to Moves and Tower" were not always classified into the Moves execution answer mode, so the deterministic fallback did not run.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence answer-mode classification for all tenants.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Expands `strategy_to_moves_execution` detection for Moves model, canonical phase, P0-P5, phase-gate, execution handoff, and Source-to-Moves/Tower handoff language.
- Adds regression coverage using exact prompt shapes from the post-4611 live 100-question regression.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts`

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the same 100-question product-truth regression against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the same 100-question regression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data or migration rollback is required.

## Audit Evidence

- Post-4611 regression report: `reports/ava-product-truth-100q-regression-post-4611-2026-07-08.md`
- Post-4611 regression bundle: `/Users/anand/Downloads/ava-product-truth-100q-regression-post-4611-2026-07-08.zip`
- PR URL: To be added after PR creation.
- Live deployment evidence: To be added after merge and ACA deploy.

## Known Gaps

Live acceptance is pending deploy and rerun. The post-4611 live regression had zero critical safety failures but still showed Moves phase-table misses due to classifier coverage.
