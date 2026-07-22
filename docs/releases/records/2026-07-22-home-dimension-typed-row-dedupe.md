# 2026-07-22-home-dimension-typed-row-dedupe — Home dimension data row dedupe and relationship graph-first view

## Release ID

`2026-07-22-home-dimension-typed-row-dedupe`

## Status

`candidate`

## Plain-English Summary

Fixes two Home dimension defects found by the live Meridian and FS Demo dimension catalog crawl. First, the Home loader was overlaying typed Postgres dimension rows on top of the existing JSON render-pack rows, so Data tabs could show impossible counts such as "Showing 240 of 120". Typed dimension rows are now treated as the authoritative row list for each dimension while preserving the render-pack column and filter definitions. Second, the Relationships dimension is now explicitly graph-first: its Overview and Relationships tabs render the enterprise topology when validated edges exist, and show a CXO-readable "what this graph unlocks / what to add next" panel for relationship gaps and art-of-possible expansion.

## Layer Impact

- `global-control-lane`: Home loader behavior for dimension Data tabs and Home Relationships dimension UI rendering.
- `client-data-lane`: read-model interpretation only; no data mutation or schema change.

## Client Applicability

- All clients: every Home dimension Data tab uses the corrected typed-row merge behavior.
- Specific clients: first proof targets are Meridian and FS Demo.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-knowledge-design-contract.ts`: typed `home_knowledge_dimension_rows` replace the dimension row list instead of appending to render-pack rows.
- `src/lib/home/home-dimension-visualization-contract.ts`: Relationships is contracted as a topology graph visual instead of a generic risk/control heatmap.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: Relationships Overview and Relationships tabs render graph-first, followed by the relationship expansion/gap panel.

## QA / Validation

- `pass` — focused ESLint for the Home loader, visualization contract, and Home surface.
- `pass` — `npx tsc --noEmit --pretty false` with Node heap raised for repo scale.
- `pass` — release check passed.
- `not-run` — signed-in browser catalog rerun pending after deploy.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main lane. Rerun the Meridian and FS Demo dimension catalog and confirm Data tabs no longer show more visible rows than the dimension record count, and confirm the Relationships dimension shows a graph-first visual with relationship gap/art-of-possible guidance.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy.
- Shared runtime mutators: none.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior image. No migration rollback is required.

## Audit Evidence

- PR URL: pending.
- Live proof: pending.

## Known Gaps

- This does not generate new relationship edges or source data. Tenants with sparse relationship rows will show the graph expansion plan until governed edge projection is loaded.
- This does not add rich visuals to every non-relationship dimension; the catalog proof remains the source of truth for which dimensions have visuals today.
