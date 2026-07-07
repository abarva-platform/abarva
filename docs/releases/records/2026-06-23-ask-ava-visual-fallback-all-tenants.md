# 2026-06-23-ask-ava-visual-fallback-all-tenants — Ask Ava Visual Fallback for All Tenants

## Release ID

`2026-06-23-ask-ava-visual-fallback-all-tenants`

## Status

`candidate`

## Plain-English Summary

Ask Ava now has a better shared fallback when a user asks for a table, chart, or visual and the model does not emit a valid row/column table. Instead of showing only a weak source-register table, Ava emits a cited decision-evidence table with source, evidence signal, confidence, and next move. The model prompt also now requires valid Markdown table structure for visual/table asks, reducing broken inline table fragments.

## Layer Impact

- `global-control-lane`: changes the shared Intelligence answer/exhibit shaping path used by Home and Intelligence through the canonical AgentAnswer renderer.
- No client data-plane changes: no tenant records, facts, chunks, embeddings, migrations, or flags are changed.

## Client Applicability

- All clients: applies to every tenant using shared Ask Ava / AgentAnswer rendering.
- Specific clients: verified against the failure pattern seen on Apex Retail, First Capital, Meridian, SkyHarbor, and Lakeshore.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; follows the existing shared engine/surface rollout.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
  - Replaces weak source-register fallback with a cited `Decision Evidence` table for explicit table/chart/visual asks.
  - Preserves the no-fabrication guard: chart values are still rendered only from valid extracted table rows.
- `src/lib/intelligence/ask/synthesizer.ts`
  - Tightens rich-text instructions so visual/table asks use valid GitHub-flavored Markdown tables, not inline pipe fragments.
- Tests updated for the new fallback contract.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` passed.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main workflow. After deployment, run the signed-in tenant matrix gate using the existing Clerk automation users and confirm visual/readability columns improve across all tenants.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none outside the repo workflow.
- Approved image digest: captured by the main deploy workflow after merge.
- ACA runtime invariant: normal template/traffic/image invariant applies.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag update.
- Live signed-in proof required: `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` after deploy.

## Rollback Plan

Revert the PR. This restores the previous source-register fallback and older prompt instruction. No data rollback is required.

## Audit Evidence

- Focused Jest and ESLint command output in the PR/session transcript.
- Post-deploy tenant matrix output after merge.

## Known Gaps

This improves deterministic fallback and prompt compliance. It does not guarantee every chart request becomes a chart; charts still require valid, cited numeric series. When chart data is not safely available, Ava should render the decision-evidence table instead of inventing a chart.
