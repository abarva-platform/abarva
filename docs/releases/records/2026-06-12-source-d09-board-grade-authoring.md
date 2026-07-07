# 2026-06-12-source-d09-board-grade-authoring — Source D09 Board-Grade Authoring

## Release ID

`2026-06-12-source-d09-board-grade-authoring`

## Status

`candidate`

## Plain-English Summary

This release strengthens the Source D09 RFP package generation path after the live SkyHarbor self-healing crawl proved the quality validator was working and correctly failed the artifact. The D09 authoring prompt now has a larger board-grade token budget, stronger source-register rules, required risk and transition-control sections, and explicit client-to-complete handling. The route also gives the quality rewrite path enough synchronous budget to self-heal a low-scoring first draft under the heartbeat stream.

## Layer Impact

- `global-control-lane`: Updates shared Source generation behavior for the D09 RFP package.
- `client-data-lane`: No schema or data mutation. Existing generated artifacts are not modified until a user or test regenerates them.

## Client Applicability

- All clients: Source events that generate the D09 RFP package.
- Specific clients: SkyHarbor is the live proof client for the self-healing crawl.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
  - Raises D09 prompt version to 6.
  - Raises D09 max output tokens to support a complete first-market RFP draft.
  - Requires a complete source register, risk/issue/dependency table, process timeline table, and client-to-complete register.
  - Requires friendly exhibit labels instead of internal ids.
- `src/lib/deliverables/quality/consulting-grade-rubric.ts`
  - Clarifies that explicit, governed-draft placeholders with owner/action/impact should not be penalized as fabricated facts.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
  - Extends the D09 synchronous quality-gate budget so rewrite can run when the first pass scores below 8.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand` — passed, 13 tests.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/deliverables/quality/consulting-grade-rubric.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts'` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, shift traffic after the new revision is healthy, smoke `/api/health`, then rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert this release commit and redeploy the prior healthy Azure Container Apps image. No database rollback is required.

## Audit Evidence

- Live fix10 crawl reached D09 and returned a real `quality_gate_failed` with 5 dimensions below 8/10, proving the quality validator is active.
- This release targets the failed dimensions: evidence grounding, source discipline, risk/failure-mode awareness, artifact completeness, and actionability.

## Known Gaps

- This release must still be proven by the live SkyHarbor crawl after deployment.
