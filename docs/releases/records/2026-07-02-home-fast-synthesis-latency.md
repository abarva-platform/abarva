# 2026-07-02-home-fast-synthesis-latency — Home Fast Synthesis Latency

## Release ID

`2026-07-02-home-fast-synthesis-latency`

## Status

`candidate`

## Plain-English Summary

Production Home answers were correct after the CXO hardening patch, but the signed-in proof showed response times around 10 to 12 seconds for two Airline Demo questions. The root cause is that Home uses the artifact-grade Opus model by default for every executive context answer. This release moves Home V6 executive synthesis to the faster Sonnet tier by default and lowers the answer token ceiling while keeping the same V6 packet contract and visible-output validators.

## Layer Impact

- `global-control-lane`: Changes the shared Home V6 executive synthesis default model and token budget for all tenants.
- `public-demo`: Improves launch/demo responsiveness for signed-in Home context questions.

## Client Applicability

- All clients: Yes, for Home V6 executive answer synthesis.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `HOME_V6_EXECUTIVE_SYNTHESIS_MODEL` and `HOME_V6_EXECUTIVE_SYNTHESIS_MAX_TOKENS` environment overrides still win when explicitly set.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`: default model changes from `claude-opus-4-8` to `claude-sonnet-4-6`; default max tokens changes from `1800` to `1200`.
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`: asserts the default audited Home synthesis model is `claude-sonnet-4-6`.
- `docs/releases/records/2026-07-02-home-fast-synthesis-latency.md`: this release record.

## QA / Validation

Planned validation before merge:

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand`
- `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand`
- `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- `npm run release:check`

Post-deploy validation:

- Rerun the two Airline Demo production questions that previously took 12.4s and 9.7s.
- Confirm answer quality gates still pass.
- Capture updated latency timings.

## Rollout Plan

Merge to `main`, build the exact SHA through the repo-owned Azure Container Apps deployment lane, assign 100% traffic to the healthy ACA revision, then run the signed-in targeted Home latency proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps release path.
- Shared runtime mutators: None beyond the Home application image.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the merged SHA on the active `ca-abarva-web-lab-eastus` revision.
- Worker image invariant: Not affected.
- Feature/env flag update path: No new flags. Existing env overrides remain supported.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image. No schema, tenant data, ingestion, or worker migration is included.

## Audit Evidence

- Pre-change targeted production proof: `/tmp/home-cxo-hardening-targeted-prod-1783002284948/targeted-report.json`, result 2/2 pass but 12.4s and 9.7s response times.
- PR URL: To be added after PR creation.
- ACA revision and image digest: To be captured after deployment.
- Signed-in latency proof output: To be captured after deployment.

## Known Gaps

This release optimizes model tier and token budget only. It does not add streaming UI, answer caching, packet precomputation, or a deterministic no-LLM fast path.

