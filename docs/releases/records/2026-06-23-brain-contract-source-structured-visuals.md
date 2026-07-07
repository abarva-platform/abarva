# 2026-06-23-brain-contract-source-structured-visuals — Source-Owned Typed Visuals

## Release ID

`2026-06-23-brain-contract-source-structured-visuals`

## Status

`candidate`

## Plain-English Summary

This release moves Ava's table/chart/graph data contract down into retrieved source facts. Postgres-backed retrievers that already read applications, vendor contracts, renewals, and initiatives now attach typed rows, columns, and chart/graph hints to `AskSource`. The renderer can then draw visuals from cited source rows while the model narrates and interprets.

## Layer Impact

- `global-control-lane`: changes the shared Intelligence answer/exhibit assembly path for all tenants.
- `client-data-lane`: reads existing tenant data only; no schema change, migration, data mutation, or new data load.

## Client Applicability

- All clients: yes, wherever the shared Intelligence ask route retrieves structured tenant rows.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no flag change.

## Changes Included

- Adds an optional structured source payload to `AskSource`.
- Populates structured payloads from tenant application, vendor contract, renewal, and initiative retrievers.
- Makes `buildStructuredExhibits` prefer source-owned typed rows for visual answers before falling back to Markdown tables or evidence-required tables.
- Adds focused tests proving charts and graphs render from structured retrieved source rows and not from prose numbers.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` passed.
- `npx eslint src/lib/intelligence/ask/types.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/knowledge/tenant-enterprise-context.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check` pending before PR.
- Deployed tenant matrix and reality crawl pending after merge/deploy.

## Rollout Plan

Merge to `main`; repo-owned Azure Container Apps deploy builds a new image and shifts 100% traffic. After deploy, run the signed-in tenant matrix for all five tenants and then the reality crawl/report.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside repo-owned deploy.
- Approved image digest: assigned by deploy workflow after merge.
- ACA runtime invariant: template image, active traffic revision image, and active revision image must agree.
- Worker image invariant: not affected.
- Feature/env flag update path: no change.
- Live signed-in proof required: yes; tenant matrix plus reality crawl/report after deploy.

## Rollback Plan

Revert this PR. No data rollback is required because the release only attaches structured read output to existing source objects.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3897
- Local proof: focused Jest, focused ESLint, and diff whitespace checks above.
- Runtime proof: pending deploy.

## Known Gaps

This is the source-owned visual foundation, not the full final Brain Contract. The product still needs deeper typed fact families for dependency graphs, richer chart recipes beyond cost-stack, and deployed reality-crawl proof that chart/graph pass rates materially improve.
