# 2026-06-22-ask-input-renderer-polish — Ask Input and Renderer Polish

## Release ID

`2026-06-22-ask-input-renderer-polish`

## Status

`candidate`

## Plain-English Summary

Fixes Ask Ava usability and answer rendering defects on the shared Home and Intelligence Ask surfaces. Long prompts now use a multiline ask box, submitted text clears after asking, Intelligence v2 renders through the canonical AgentAnswer renderer once, and server-side answer cleanup preserves Markdown table layout instead of flattening tables into pipe-text prose.

## Layer Impact

- `global-control-lane`: Shared Ask UI and response formatting behavior changes for all client tenants that use Home or Intelligence v2.
- `experimental`: Structured visual-output behavior remains evidence-safe; chart-shaped questions get a cited evidence table when typed chart data is not available, but no chart data is fabricated from prose.

## Client Applicability

- All clients: Yes, all tenants using shared Home / Intelligence v2 Ask Ava surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing surface availability; no new flag.

## Changes Included

- `src/components/agent-answer/AvaAsk.tsx`
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/answer/structured-exhibits.ts`
- Focused component and policy tests for multiline input, clear-on-submit, canonical rendering, Markdown table preservation, and evidence-safe visual exhibits.

## QA / Validation

- `npx jest src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` — passed, 17/17 tests.
- `npx eslint src/components/agent-answer/AvaAsk.tsx src/components/intelligence-v2/IntelligenceV2Surface.tsx src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/answer/structured-exhibits.ts src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.
- `npx tsc --noEmit --pretty false` — blocked by existing repo dependency/type gaps outside this release (`js-yaml`, Azure document intelligence, `@axe-core/playwright` declarations).

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo workflow.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Template image, traffic revision image, and active revision image must agree after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, run the tenant matrix and a browser Ask Ava smoke on Apex plus at least one non-retail tenant.

## Rollback Plan

Revert the PR and redeploy the prior approved main image. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live signed-in proof: pending.

## Known Gaps

Typed chart generation remains intentionally conservative: this release does not fabricate charts from prose. True charts still require the engine to emit validated `AgentAnswer.charts` data.
