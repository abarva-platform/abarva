# 2026-07-21-home-relationship-graph-fallback — Home Relationship Graph Visibility

## Release ID

`2026-07-21-home-relationship-graph-fallback`

## Status

`candidate`

## Plain-English Summary

Home now renders the Relationships topology graph from the approved Home pack even when the separate derived graph JSON file is unavailable to the production runtime. This closes the live proof gap where the deployed Home cockpit showed relationship record counts but did not display the relationship graph in the Relationships dimension.

## Layer Impact

- `global-control-lane`: Home Knowledge UI behavior changes for all tenants with approved Home packs; the Relationships dimension now has a durable client-safe fallback for graph rendering.
- `client-data-lane`: the existing approved `DATA.rel.rows` pack data is used as the fallback graph source; no new facts are generated at runtime and no Azure/Postgres data is mutated.
- `global-control-lane`: the server read path prefers business-readable graph display names when derived graph files are present.

## Client Applicability

- All clients: yes, for Home tenants with approved Home packs.
- Specific clients: Airline Demo, FS Demo, Lakeshore Holdings, Retail Demo, Healthcare Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/derive-relationship-edges.ts`: parses explicit `from_object_name` / `relationship_type` / `to_object_name` rows from the `rel` dimension and Meridian-style `affected_systems` rows.
- `src/lib/home/read-derived-relationship-graph.ts`: uses graph display names when available instead of opaque object ids.
- `src/lib/home/__tests__/derive-relationship-edges.test.ts`: adds fallback shape regression tests.
- `src/lib/home/__tests__/read-derived-relationship-graph.test.ts`: updates graph-file expectations for all generated Home tenants.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts --runInBand` — passed, 13 tests.
- `npx eslint src/lib/home/derive-relationship-edges.ts src/lib/home/read-derived-relationship-graph.ts src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts` — passed.
- Real-pack fallback probe passed for all five tenants:
  - Airline Demo: 2,278 fallback edges.
  - FS Demo: 1,425 fallback edges.
  - Lakeshore Holdings: 364 fallback edges.
  - Retail Demo: 1,713 fallback edges.
  - Healthcare Demo: 381 fallback edges from the approved pack, with richer server graph still preferred when available.

## Rollout Plan

Merge to `main`; deploy through the repo-owned ACA main deploy workflow. After deploy, rerun signed-in Home proof for available tenant sessions and verify the Relationships dimension renders `home-knowledge-relationship-topology`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: workflow-managed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior healthy revision. No data migration or Azure data-build rollback is required.

## Audit Evidence

- PR: pending.
- Pre-fix live proof showing graph component absent: `proof/home-tenant-coverage-live-20260721-v4/results.json`.
- Post-fix local validation commands listed above.
- Post-deploy signed-in proof: pending.

## Known Gaps

Retail Demo and Lakeshore Holdings need refreshed saved signed-in browser states in this checkout for full browser proof; their artifact/data validation is present, but live proof requires a usable session.
