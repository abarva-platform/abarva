# 2026-06-23-brain-contract-typed-exhibit-synthesis — Audited Typed Exhibit Synthesis

## Release ID

`2026-06-23-brain-contract-typed-exhibit-synthesis`

## Status

`candidate`

## Plain-English Summary

This release adds an audited second-pass exhibit synthesis step for Ava. If a chart-shaped or graph-shaped question finishes without the requested typed chart or graph, the route asks a small governed model pass to produce only a valid Markdown data table from the already retrieved sources and final answer. The existing exhibit validator then decides whether that table becomes a typed chart or graph. This replaces prompt-only compliance with a stricter, validated fallback path.

## Layer Impact

- `global-control-lane`: updates the shared Intelligence ask route and answer pipeline used by all tenants on Ava surfaces.
- `client-data-lane`: no schema change, no migration, no data mutation.

## Client Applicability

- All clients: applies to visual questions on the shared Ava / AgentAnswer path.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: follows existing shared-engine and surface exposure flags; no new flag.

## Changes Included

- `src/lib/intelligence/answer/visual-exhibit-synthesis.ts` adds the audited second-pass visual table synthesizer.
- `src/app/api/intelligence/ask/route.ts` invokes the synthesizer only when the requested chart/graph is missing after the primary answer.
- `src/lib/intelligence/answer/__tests__/visual-exhibit-synthesis.test.ts` validates missing-visual detection and Markdown table extraction.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/visual-exhibit-synthesis.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — passed.
- `npx eslint src/lib/intelligence/answer/visual-exhibit-synthesis.ts src/lib/intelligence/answer/__tests__/visual-exhibit-synthesis.test.ts src/app/api/intelligence/ask/route.ts` — passed.

## Rollout Plan

Merge to `main`; repo-owned Azure Container Apps deploy builds the new web image and shifts 100% traffic to the new revision. After deploy, rerun the tenant matrix and full reality crawl/report against all five signed-in tenants.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside repo-owned deploy.
- Approved image digest: assigned by deploy workflow after merge.
- ACA runtime invariant: template image, active traffic revision image, and active revision image must agree.
- Worker image invariant: not affected.
- Feature/env flag update path: no new flag or environment update.
- Live signed-in proof required: yes; all five tenants require matrix plus reality-crawl/report proof.

## Rollback Plan

Rollback the ACA web app to the prior approved revision/image digest. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3895
- CI: focused Jest, eslint, and `npm run release:check`.
- Live proof after deploy: tenant matrix, reality crawl, and generated HTML report.

## Known Gaps

This candidate is specifically aimed at the #3894 post-deploy deep-crawl failures: charts `6/50`, graphs `2/40`, overall `155/290`. It is not complete until the post-deploy crawl proves a material lift across all five tenants.
