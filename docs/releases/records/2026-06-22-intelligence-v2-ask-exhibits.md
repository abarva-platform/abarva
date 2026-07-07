# 2026-06-22-intelligence-v2-ask-exhibits — Intelligence v2 Ask Exhibits

## Release ID

`2026-06-22-intelligence-v2-ask-exhibits`

## Status

`candidate`

## Plain-English Summary

Intelligence v2 already had tenant-specific Apex context and the server already streamed structured Ava answer exhibits, but the v2 page only rendered prose. This release wires the v2 Ask Ava box to send its tenant binding facts to the answer engine and render the streamed tables/charts through the shared AgentAnswer renderer.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence v2 client surface used by all tenants with a binding payload.
- `client-data-lane`: No data writes or migrations. The change reads the existing binding payload and passes a bounded summary as request context.

## Client Applicability

- All clients: All tenants with Intelligence v2 binding payloads receive structured Ask rendering.
- Specific clients: Apex Retail is the motivating proof case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag; this follows the existing v2 binding route behavior.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`

## QA / Validation

- PASS expected: Focused Jest test added for Apex; it proves the v2 surface POSTs tenant binding facts to `/api/intelligence/ask` and renders a streamed `AgentAnswer` table.
- PASS expected: Existing `AgentAnswerRenderer` focused test remains the renderer guard for tables/charts.
- PASS expected: `npm run release:check`.

## Rollout Plan

Merge to `main`, let the repo-owned ACA deploy workflow build and deploy the image, then run the post-deploy crawl. Signed-in Apex `/intelligence` proof should ask an Apex spend/AI-portfolio question and verify prose plus a rendered table/chart when the server emits one.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Captured by ACA deploy evidence after merge.
- ACA runtime invariant: Standard main deploy invariant.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Apex `/intelligence` Ask Ava table/chart rendering.

## Rollback Plan

Revert this PR. The page will return to rendering prose-only Ask responses while keeping the static v2 Intelligence binding surface.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Post-deploy crawl: pending.
- Signed-in Apex Ask proof: pending.

## Known Gaps

This does not change server-side answer quality beyond passing the v2 binding facts as context. If the model answer itself is weak after this, the next fix belongs in the `/api/intelligence/ask` synthesis prompt/eval layer.
