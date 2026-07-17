# 2026-07-17-intelligence-cxo-response-render-polish — Intelligence CXO Response And Artifact Polish

## Release ID

`2026-07-17-intelligence-cxo-response-render-polish`

## Status

`candidate`

## Plain-English Summary

This release improves the Intelligence aVa answer experience so executive answers read less like long generated notes and more like concise CXO advisory briefs. It also polishes rendered answer artifacts — tables, charts, and relationship views — so visual exhibits look more like board-pack components and preserve structure for HTML/PDF export.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: updates the shared aVa answer artifact renderer for generated tables, charts, and relationship views.
- Intelligence answer policy: tightens prompt/runtime answer-shape guidance toward 2-3 short executive paragraphs by default, with tables/charts used when the user asks for visual, ranking, comparison, or multi-attribute analysis.
- Export surface: preserves the existing deterministic SVG/table artifact model so generated exhibits continue to export through the existing answer packet path without a second model call.

## Client Applicability

- All clients: yes, any tenant using the shared Intelligence aVa answer renderer receives the polish.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/synthesizer.ts`

## QA / Validation

- `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/ava-answer/__tests__/cxo-quality-gate.test.ts --runInBand`
  - Result: passed, 3 suites / 57 tests.
  - Note: Jest still reports pre-existing duplicate manual mock warnings for markdown/GFM packages.
- `npx eslint src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/synthesizer.ts`
  - Result: passed.
- Live signed-in proof on `https://app.abarva.ai` is required after ACA deployment before marking this release `released`.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After deploy, verify the ACA runtime invariant and run a signed-in Intelligence browser proof that asks for a CXO visual/ranking answer, confirms polished tables/charts/relationship artifacts render correctly, and checks HTML/PDF export.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No schema, data, environment, or worker changes are included.

## Audit Evidence

- PR URL: pending.
- CI/run evidence: pending.
- ACA deploy evidence: pending.
- Signed-in browser proof: pending.
- Focused local validation commands are listed in QA / Validation.

## Known Gaps

This release does not change response latency or implement token streaming behavior. A separate focused PR should address streaming/perceived-speed improvements.
