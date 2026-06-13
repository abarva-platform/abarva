# 2026-06-12-source-quality-review-tool-schema — Source Quality Review Tool Schema

## Release ID

`2026-06-12-source-quality-review-tool-schema`

## Status

`candidate`

## Plain-English Summary

Changed the Source D09 consulting-grade quality review to request a structured Anthropic tool payload instead of a long free-form JSON response. The quality standard is unchanged: the reviewer still scores all ten partner-grade dimensions and the artifact still fails closed when any dimension is below the required threshold. This only makes the evaluator output reliable enough for the self-healing production crawl.

## Layer Impact

- `global-control-lane`: Improves the shared Source artifact generation route used by governed Source events.
- `client-data-lane`: No client data, schemas, migrations, or Source evidence records are changed.

## Client Applicability

- All clients: Source D09 RFP quality-gated generation uses the safer review payload.
- Specific clients: SkyHarbor is the live proof tenant for this crawl.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`.
- The review call now forces Anthropic to call `record_source_quality_review` with a compact schema for all ten consulting-grade dimensions.
- The retry path uses the same tool schema instead of asking for another raw JSON blob.

## QA / Validation

- PASS — `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts'`
- PASS WITH KNOWN ENVIRONMENT GAPS — `npx tsc --noEmit --pretty false`; no errors remain in the touched route, but this local worktree lacks optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.
- PENDING — Source production self-healing crawl rerun after merge/deploy.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, shift traffic, and rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert this route change to return the quality review call to raw JSON output. Rollback is code-only and does not require data migration.

## Audit Evidence

- PR diff and CI checks.
- Source self-healing crawl report under `reports/source-golden-event/` after live rerun.

## Known Gaps

- This does not change the D09 quality rubric or lower the pass threshold.
- This does not yet move Source generation to the broader document-generation policy/orchestrator from the separate document-generation remediation lane.
