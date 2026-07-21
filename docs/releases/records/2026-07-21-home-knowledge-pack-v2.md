# 2026-07-21-home-knowledge-pack-v2 — Home Knowledge Pack v2

## Release ID

`2026-07-21-home-knowledge-pack-v2`

## Status

`candidate`

## Plain-English Summary

Adds a governed Azure/Postgres read-model design for the Home / Knowledge CXO cockpit. The new layer stores versioned Home packs, dimension summaries, tab rows, scored use cases, evidence-source inventory, relationship-map nodes and edges, and approved narratives. It also adds a builder that converts the existing approved Home design-contract JSON packs into Postgres-ready Home Knowledge Pack v2 artifacts for all available tenants.

## Layer Impact

- `client-data-lane`: Adds additive Home Knowledge Pack v2 tables under `public.home_knowledge_*` for tenant-scoped approved/candidate pack data.
- `global-control-lane`: Adds a builder/report script and a Postgres-first read path foundation; the existing JSON pack remains the migration fallback.

## Client Applicability

- All clients: Home can use the versioned read model once populated and approved.
- Specific clients: Initial generated artifacts cover Retail Demo, FS Demo, Lakeshore Holdings, Meridian Health System, and Airline Demo.
- Internal only: The builder and reports are operator tools.
- Public/demo only: None.
- Feature flag: None in this PR; DB read path remains defensive and falls back to approved JSON packs.

## Changes Included

- `supabase/migrations/20260721183000_home_knowledge_pack_v2.sql`
- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- Home Knowledge Pack v2 reports under `reports/home-knowledge-pack-v2/`

## QA / Validation

- `pass` — `node scripts/knowledge/build-home-knowledge-pack-v2.mjs --tenant=all --dry-run`
  - Generated Postgres-ready Home Knowledge Pack v2 artifacts for Retail Demo, FS Demo, Lakeshore Holdings, Meridian Health System, and Airline Demo.
- `pass` — `npx eslint src/app/'(maestro)'/home/page.tsx src/components/home/HomeKnowledgeDesignContractSurface.tsx src/lib/home/home-knowledge-design-contract.ts scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- `blocked` — `npm run db:migrate:dry`
  - The migration runner requires `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or `DATABASE_URL`; this shell has none exported.
- `blocked` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  - Local typecheck reaches diagnostics but the local `node_modules` install is stale and cannot resolve already-declared graph packages `@xyflow/react` and `@dagrejs/dagre`.
- `pass` — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR. The additive migration is applied by the normal migration lane. The builder can be run first in dry-run mode to generate proof artifacts, then with `--write-db --approve` against Azure/Postgres after operator confirmation. Home continues to render from approved JSON if the database pack is absent.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow after merge.
- Shared runtime mutators: None in this PR outside normal deploy/migration lane.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before live-proven status.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home tab proof for each tenant after deploy/population.

## Rollback Plan

Runtime rollback: revert to the previous ACA revision. Data rollback: do not approve the new pack, or retire the affected `home_knowledge_packs` row by setting `effective_to` and status `retired`; JSON fallback remains available. The migration is additive and does not remove existing data.

## Audit Evidence

- Builder report: `reports/home-knowledge-pack-v2/summary.html`
- Builder JSON: `reports/home-knowledge-pack-v2/summary.json`
- Per-tenant prompt packets: `reports/home-knowledge-pack-v2/<tenant>/claude-strategy-prompt.json`
- Per-tenant normalized pack dumps: `reports/home-knowledge-pack-v2/<tenant>/home-knowledge-pack-v2.json`

## Known Gaps

The current shell does not expose `ANTHROPIC_API_KEY` or a database URL. The first proof run generates Postgres-ready artifacts and Claude prompt packets locally. Azure write/apply must run in an environment with the approved database connection string.
