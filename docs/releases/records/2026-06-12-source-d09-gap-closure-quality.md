# 2026-06-12-source-d09-gap-closure-quality — Source D09 Gap-Closure Quality Semantics

## Release ID

`2026-06-12-source-d09-gap-closure-quality`

## Status

`candidate`

## Plain-English Summary

The Source RFP package generator now treats uploaded evidence-room files as the authoritative D09 evidence coverage map during both authoring and partner-grade quality review. If a mapped upload satisfies an `EVID-SRC-*` requirement, the RFP package must not call that requirement `Not Requested` because of stale scaffold state. The RFP must also include a concrete gap-closure register with owner placeholders, due-date placeholders, blocked gate, and downstream impact for every unresolved item.

## Layer Impact

- `global-control-lane`: Updates shared Source document-generation prompt policy and Source quality-review context used by the RFP package path.

## Client Applicability

- All clients: applies to Source RFP package generation for any tenant using the governed Source artifact generator.
- Specific clients: validated against the SkyHarbor IT outsourcing D09 crawl lane.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: D09 prompt version 8, stronger §9/§10/§11 instructions, exported D09 evidence coverage map.
- `src/lib/source/agent-generation/quality-review.ts`: includes D09 evidence coverage semantics in the quality-review source context.
- `src/lib/deliverables/quality/consulting-grade-rubric.ts`: reviewer instructions clarify that uploaded mapped evidence overrides stale `Not Requested` scaffold rows for the same requirement.
- Focused tests for prompt registry, Source quality context, context binder, and consulting-grade rubric.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand` — passed, 24 tests.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, smoke `/api/health` and `/`, then rerun the SkyHarbor Source self-healing crawl. The crawl must prove D09 passes the partner-grade quality gate before this lane is complete.

## Rollback Plan

Revert the PR or redeploy the previous ACA image revision. No schema, data, DNS, Supabase, Vercel, or account-shutdown changes are included.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Live crawl report under `reports/source-golden-event/` after deployment.

## Known Gaps

This does not weaken the quality gate and does not mark the Source crawl complete by itself. The live crawl still has to pass after deployment.
