# 2026-06-22-ask-markdown-table-exhibits — Ask Markdown Table Exhibits

## Release ID

`2026-06-22-ask-markdown-table-exhibits`

## Status

`candidate`

## Plain-English Summary

Completes the Ask Ava visual/table rendering path by turning complete Markdown tables that Ava already wrote into typed AgentAnswer tables. This fixes the live case where Ava answered with a Markdown table in prose but emitted `tables: []`, so the UI had no structured exhibit to render.

## Layer Impact

- `global-control-lane`: Shared Intelligence/Home Ask answer assembly and rendering behavior changes for all tenants.
- `experimental`: Does not fabricate charts or infer values from prose; it only renders table rows already explicitly emitted by Ava.

## Client Applicability

- All clients: Yes, all tenants using the shared `/api/intelligence/ask` engine and AgentAnswer renderer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing surface flags; no new flag.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/components/agent-answer/AvaAsk.tsx`
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- Focused tests for Markdown table extraction and final prose/render selection.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — passed, 17/17 tests.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/app/api/intelligence/ask/route.ts src/components/agent-answer/AvaAsk.tsx src/components/intelligence-v2/IntelligenceV2Surface.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.
- Live proof required after deploy: signed-in Apex and SkyHarbor `/intelligence` Ask smoke must prove textarea clear + table element render.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, and verify ACA template/traffic remain on the approved main digest. Then run the signed-in tenant matrix and browser Ask smoke.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo workflow.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Template image, traffic revision image, and active revision image must agree after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior approved main image. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Runtime proof: pending.

## Known Gaps

True charts still require validated `AgentAnswer.charts` data. This release intentionally does not create chart data from prose.
