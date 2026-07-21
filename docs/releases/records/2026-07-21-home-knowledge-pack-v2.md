# 2026-07-21-home-knowledge-pack-v2 — Home Knowledge Pack v2

## Release ID

`2026-07-21-home-knowledge-pack-v2`

## Status

`deployed-schema-applied-data-write-pending`

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
- `pass` — PR #5250 merged as `b65d35d9be27cbc3200bc1369e29e34faf3a0052`.
- `pass` — ACA main deploy workflow `29877796657` deployed digest `sha256:0df6c8d2db959fbb263f558291d775b84ac2b37fa9252b33e584dde4e1917ac6` to revision `ca-abarva-web-lab-eastus--mb65d35d9` at 100% traffic; runtime invariant passed.
- `pass` — Lab database migration workflow `29878286172` applied the new migration through the private operator job; preflight, apply, schema readback, ledger, repository readback, and health all passed.
- `pass` — signed-in Home smoke on deployed app rendered `/home` for Meridian Health System, Airline Demo, and FS Demo.
- `pending` — signed-in Lakeshore Home smoke needs a refreshed local Clerk storage state; the existing storage state redirects to sign-in.
- `pending` — Azure data population requires the follow-up deployed operator script `home:knowledge-pack-v2:write`.

## Rollout Plan

Merged through PR #5250, deployed through the repo-owned ACA main lane, and applied through the governed lab database migration workflow. Home continues to render from approved JSON if the database pack is absent. The remaining rollout step is to run the deployed operator script `home:knowledge-pack-v2:write` through the private ACA operator job with the approved `DATABASE_URL` secret.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow after merge.
- Shared runtime mutators: None in this PR outside normal deploy/migration lane.
- Approved image digest: `sha256:0df6c8d2db959fbb263f558291d775b84ac2b37fa9252b33e584dde4e1917ac6`.
- ACA runtime invariant: Passed in workflow `29877796657`.
- Worker image invariant: Migration operator job restored idle after workflow `29878286172`; pack-write operator job pending.
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

The current shell does not expose `ANTHROPIC_API_KEY` or a database URL. The first proof run generated Postgres-ready artifacts and Claude prompt packets locally. Azure schema apply is complete; Azure pack data write is pending the follow-up operator-script deploy and private operator job run.
