# 2026-06-23-brain-contract-visual-graph-contract — Typed Visual And Graph Contract

## Release ID

`2026-06-23-brain-contract-visual-graph-contract`

## Status

`candidate`

## Plain-English Summary

This release makes Ava's visual-answer path stricter and more real. When a user asks for a chart or graph, the rich answer prompt now requires Ava to emit a valid compact data table when evidence supports the visual. The shared exhibit builder can turn validated relationship tables into typed graphs, the Intelligence API returns those graphs instead of dropping them, and the canonical renderer displays them for every surface that uses `AgentAnswerRenderer`. The deep reality-crawl harness now uses the same signed-in browser session contract as the tenant matrix gate so it does not produce false empty-answer failures.

## Layer Impact

- `global-control-lane`: updates the shared Intelligence ask answer contract, the canonical renderer, and QA harnesses used across tenants.
- `client-data-lane`: no data schema, data migration, or tenant data mutation.

## Client Applicability

- All clients: applies to all tenant answers rendered through the shared Ava / AgentAnswer path.
- Specific clients: none.
- Internal only: QA harness improvement applies to internal release validation.
- Public/demo only: none.
- Feature flag: follows the existing shared-engine and surface flags; no new flag is introduced.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts` requires rich visual questions to emit valid Markdown data tables when evidence supports charts or graphs.
- `src/lib/intelligence/answer/structured-exhibits.ts` preserves typed graphs and builds relationship graphs from validated From/Relationship/To tables.
- `src/app/api/intelligence/ask/route.ts` emits `AgentAnswer.graphs` instead of forcing graphs to `[]`.
- `src/components/agent-answer/AgentAnswerRenderer.tsx` renders typed graphs in the canonical renderer.
- `scripts/qa/reality-crawl.mjs` now uses Playwright storage-state sessions, `tabId`, and per-answer timeouts like `tenant-matrix-gate.mjs`.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — passed.
- `npx eslint scripts/qa/reality-crawl.mjs src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/ask/synthesizer.ts src/app/api/intelligence/ask/route.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — passed.
- Pre-candidate Apex-only deployed smoke using the repaired harness captured real answers and showed the current deployed runtime still has chart/graph quality gaps: `31/58` overall, table `10/10`, chart `0/10`, graph `0/8`.

## Rollout Plan

Merge to `main`; repo-owned Azure Container Apps deploy builds the new web image and shifts traffic to the new revision. After deploy, rerun `tenant-matrix-gate.mjs`, `reality-crawl.mjs`, and `reality-crawl-report.mjs` against `https://app.abarva.ai` with all five signed-in agent storage states.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: template image, active traffic revision image, and active revision image must agree.
- Worker image invariant: not affected.
- Feature/env flag update path: no new flag or environment update.
- Live signed-in proof required: yes; all five tenants require matrix plus reality-crawl/report proof before progress cells become green.

## Rollback Plan

Rollback the ACA web app to the previous approved revision/image digest if the visual path regresses. No database rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI: focused Jest, eslint, and `npm run release:check`.
- Live proof after deploy: `tenant-matrix-gate.mjs`, `reality-crawl.mjs`, generated `out/reality-crawl/report.html`, and screenshots.

## Known Gaps

This candidate makes typed charts/graphs possible and testable; it does not claim the deployed app is all-green until the post-deploy all-tenant crawl proves it. The pre-candidate Apex smoke still showed raw-ID, grounding, chart, and graph failures on the existing runtime.
