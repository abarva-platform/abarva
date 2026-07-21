# 2026-07-21-home-relationship-summary-topology — Home Relationships Default Graph

## Release ID

`2026-07-21-home-relationship-summary-topology`

## Status

`candidate`

## Plain-English Summary

Home now shows the relationship topology graph in the default Summary view of the Relationships dimension. The previous release made the graph data available, but live browser proof showed the graph was only reachable from the nested Relationships subtab, so CXOs landing on the Relationships dimension still saw counts and heatmaps without the actual topology.

## Layer Impact

- `global-control-lane`: Home Knowledge UI behavior changes for every tenant with an approved Home pack.
- `client-data-lane`: no tenant facts, source files, Azure tables, or derived graph files are mutated. The UI renders already-approved relationship edges.

## Client Applicability

- All clients: yes, when the Home Relationships dimension has approved relationship rows or a derived graph.
- Specific clients: Airline Demo, FS Demo, Lakeshore Holdings, Retail Demo, Healthcare Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: renders `RelationshipTopologyGraph` in the Summary tab when the active dimension is `rel`.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts --runInBand` — passed, 13 tests.
- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- Post-deploy signed-in proof for Airline Demo, FS Demo, and Healthcare Demo — pending.

## Rollout Plan

Merge to `main`; deploy through the repo-owned ACA main deploy workflow. After deployment, rerun signed-in Home proof and assert that `[data-testid="home-knowledge-relationship-topology"]` is visible on `/home?dimension=rel`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: workflow-managed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll ACA traffic back to the previous healthy revision. No data rollback is required.

## Audit Evidence

- Pre-fix deployed proof: `proof/home-relationship-graph-fallback-live-20260721/results.json` showed signed-in pages loaded but graph count stayed `0`.
- Post-fix PR: pending.
- Post-deploy proof: pending.

## Known Gaps

Retail Demo and Lakeshore Holdings still need refreshed saved signed-in browser states in this checkout for live browser proof.
