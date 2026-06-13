# 2026-06-12-source-d09-normalized-evidence-state — Source D09 Normalized Evidence State

## Release ID

`2026-06-12-source-d09-normalized-evidence-state`

## Status

`candidate`

## Plain-English Summary

The Source D09 RFP package generator and quality reviewer now normalize stale scaffold evidence rows when the uploaded evidence coverage map proves that the requirement is actually satisfied by a parsed upload. This prevents the partner-grade reviewer from failing an RFP because an old `Not Requested` row still exists for evidence that was supplied in the latest evidence room.

## Layer Impact

- `global-control-lane`: Updates the shared Source document-generation and quality-review context used by the D09 RFP package path.

## Client Applicability

- All clients: applies to Source D09 RFP package generation.
- Specific clients: validated against SkyHarbor Source crawl fixtures.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: raises D09 output budget, adds compact appendix requirements, and normalizes evidence-state rows satisfied by uploaded D09 coverage.
- `src/lib/source/agent-generation/quality-review.ts`: normalizes the same evidence-state rows in the partner-grade reviewer context.
- Tests for prompt registry, context binder, quality review, and consulting-grade rubric.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand` — passed, 24 tests.

## Rollout Plan

Merge to `main`, build and deploy the next Azure Container Apps image, smoke-test `/api/health` and `/`, then rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert the PR or redeploy the prior ACA image revision. No schema, data, DNS, Vercel, Supabase, or account-shutdown changes are included.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Live crawl report under `reports/source-golden-event/` after deployment.

## Known Gaps

This does not mark the crawl complete until the live D09 RFP package passes Gate B.
