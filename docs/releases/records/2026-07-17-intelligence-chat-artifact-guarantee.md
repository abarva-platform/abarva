# 2026-07-17-intelligence-chat-artifact-guarantee — Intelligence Chat Artifact Guarantee

## Release ID

`2026-07-17-intelligence-chat-artifact-guarantee`

## Status

`candidate`

## Plain-English Summary

This release hardens the Intelligence aVa chat so explicit table, chart, graph, trend, ranking, and executive-summary requests do not collapse into prose-only answers. When Claude returns a board-style narrative without typed artifacts, AbarVa now assembles a visible, conservative artifact: either a CXO summary table grounded in the answer text, or a clear visual-boundary table explaining which validated rows are still needed before rendering a chart or graph. This prevents the visible chat artifact from appearing during generation and then disappearing at completion.

## Layer Impact

- `global-control-lane`: Changes the shared Intelligence answer-packet assembly path for all tenants.
- `presentation`: Improves how the existing `AgentAnswerRenderer` receives table-ready artifacts; renderer behavior is unchanged.
- `governance`: Preserves the existing rule that charts and exact metric visuals are not invented from loose prose.

## Client Applicability

- All clients: yes, for Intelligence chat answers that request structured artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`
  - Result: passed, 43 tests.
  - Note: Jest still reports pre-existing duplicate manual mock warnings unrelated to this change.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`
  - Result: passed.

## Rollout Plan

Merge by PR into `main`, then deploy through the repo-owned Azure Container Apps main deployment workflow. After deploy, run signed-in production proof on `https://app.abarva.ai/intelligence` with a healthcare AI trend prompt that requests a concise table and chart if useful.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release commit and redeploy through the ACA main workflow. Runtime data and migrations are not changed.

## Audit Evidence

- PR: pending.
- Local test evidence: targeted Jest and ESLint commands listed above.
- Production proof bundle: pending deploy.

## Known Gaps

The right-side Intelligence canvas is a separate deterministic tenant/vertical briefing surface. This release does not change its copy or make it dynamically update from each chat turn. A separate canvas-quality audit should verify that each panel clearly distinguishes loaded tenant facts from peer/corpus benchmark context.
