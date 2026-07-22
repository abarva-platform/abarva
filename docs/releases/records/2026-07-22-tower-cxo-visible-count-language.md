# 2026-07-22-tower-cxo-visible-count-language — Tower aVa Business-Language Guard

## Release ID

`2026-07-22-tower-cxo-visible-count-language`

## Status

`candidate`

## Plain-English Summary

Tower aVa answers must not use internal substrate counts such as rows, facts, edges, nodes, source signals, metric records, value records, or active signals as user-facing evidence. This release strengthens the Tower prompt, visible-answer validator, and deterministic fallback language so aVa translates internal coverage into business meaning such as proof breadth, fragmented evidence, finance-attestation gaps, usage-instrumentation gaps, or decision readiness.

## Layer Impact

- `global-control-lane` — Agent answer contract: Tower's Claude prompt now makes business-language translation mandatory and bans technical quantity counts from visible prose.
- `global-control-lane` — Runtime safety validation: Tower visible-answer validation rejects technical-count-as-evidence phrases before they can be treated as a valid answer.
- `global-control-lane` — Deterministic fallback: Tower fallback copy no longer says metric/value record counts and instead explains measurement readiness and claim discipline in executive language.

## Client Applicability

- All clients: yes, for Tower aVa visible-answer generation and fallback behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`
- `docs/releases/records/2026-07-22-tower-cxo-visible-count-language.md`

## QA / Validation

- Pass — `npm test -- src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass — `npm test -- src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- Pass — `npm test -- src/lib/ava-answer/__tests__/public-answer-scrub.test.ts --runInBand`
- Pass — `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts`
- Pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass — `npm run release:check`
- Pass — `git diff --check`
- Pending — ACA deploy invariant and signed-in Tower browser proof after merge/deploy.

## Rollout Plan

Merge the PR into `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then verify the ACA runtime invariant and run a signed-in Meridian Tower aVa proof question.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/tower` with a Meridian/Healthcare signed-in user.

## Rollback Plan

Revert the PR or deploy the previous healthy ACA image through the approved main deploy lane. No schema, data-plane, job, or tenant-data rollback is required.

## Audit Evidence

- PR URL: pending.
- Focused test output: local command logs.
- Signed-in browser proof: pending after deployment.

## Known Gaps

This release does not change Tower mart data, telemetry ingestion, or chart design. It only governs the visible language Tower aVa may return.
