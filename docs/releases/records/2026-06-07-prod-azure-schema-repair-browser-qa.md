# 2026-06-07-prod-azure-schema-repair-browser-qa - Production Azure Schema Repair and Browser QA

## Release ID

`2026-06-07-prod-azure-schema-repair-browser-qa`

## Status

`released`

## Plain-English Summary

After `app.abarva.ai` was routed to Azure Container Apps, signed-in browser QA
found that the app was live but the Azure database schema was missing several
already-versioned columns and ledgers expected by the deployed application. The
production Azure schema was brought forward by applying the existing migrations
through the running Azure Container Apps runtime. Browser QA then confirmed that
Home, Intelligence, Moves, Source, Tower, and Admin render for Lakeshore without
the Responsible AI wall or HTTP 500 pages.

## Layer Impact

- `client-data-lane`: Existing migrations were applied to Azure Postgres for
  Responsible AI ledgers, engagement function-pack fields, and Lakeshore
  holding-group metadata.
- `global-control-lane`: Production route/browser behavior was validated on the
  Azure Container Apps custom domain.
- `internal-admin`: Admin Control Center route rendering was validated, and its
  current data-readiness state was recorded.

## Client Applicability

- All clients: Responsible AI ledger tables and engagement function-pack columns
  are schema-level additions in the shared control database.
- Specific clients: Lakeshore receives holding-group metadata from the existing
  holding-group migration and was the browser QA tenant.
- Internal only: The release record and cutover proof docs are internal
  operations evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

Live Azure migrations applied:

- `supabase/migrations/20260522170000_engagement_function_pack_key.sql`
- `supabase/migrations/20260602170000_responsible_ai_acknowledgments.sql`
- `supabase/migrations/20260602173000_responsible_ai_training_completions.sql`
- `supabase/migrations/20260602180000_responsible_ai_acknowledgment_cycles.sql`
- `supabase/migrations/20260602183000_system_role_acknowledgments.sql`
- `supabase/migrations/20260605080000_responsible_ai_client_key_canonicalization.sql`
- `supabase/migrations/20260605130000_lakeshore_holding_group_clients.sql`

Evidence docs added:

- `docs/build/azure-container-apps-cutover-2026-06-07/07-prod-schema-repair-and-browser-qa.md`

No runtime source-code changes are included in this PR; the source migrations
already existed on `main`.

## QA / Validation

- PASS: Azure `/api/health` returned HTTP 200 with `ok=true`,
  `postgres=true`, `direct_postgres=true`, and `azure_graph=postgres`.
- PASS: Schema proof confirmed `engagements.function_pack_key` and
  `engagements.function_pack_confidence`.
- PASS: Schema proof confirmed Responsible AI acknowledgment and training
  completion tables.
- PASS: Browser completed Responsible AI acknowledgment and training, then
  reached `/home`.
- PASS: Database proof showed one Lakeshore acknowledgment row and one Lakeshore
  training completion row.
- PASS: Schema proof confirmed holding-group client columns and helper
  functions.
- PASS: Browser QA rendered `/home`, `/intelligence`, `/strategic-moves`,
  `/source/queue`, `/tower`, and `/admin` as signed-in Lakeshore routes.
- PASS: Post-repair active-revision log filter after
  `2026-06-07T06:42:00Z` inspected 3 log lines and found 0 matches for Supabase
  hosts/env names, HTTP 500, or missing-column patterns.

## Rollout Plan

Already active. The existing migrations were applied directly to the Azure
Postgres control database through the active Azure Container Apps runtime. The
custom domain `https://app.abarva.ai` continues to serve the Azure runtime.

This PR records the live proof so the production state remains auditable from
`main`.

## Rollback Plan

No destructive rollback is planned. The database changes are additive and match
the already-deployed application expectations. If an incident requires runtime
rollback, route traffic to a prior known-good Azure revision or disable the
affected route at the application layer. Dropping the additive tables/columns
would risk breaking the current app and should only be done in a separate,
reviewed rollback migration.

## Audit Evidence

- Production proof doc:
  `docs/build/azure-container-apps-cutover-2026-06-07/07-prod-schema-repair-and-browser-qa.md`
- Azure runtime: `ca-abarva-web-lab-eastus--0000051`.
- Production domain: `https://app.abarva.ai`.
- Browser QA route list: `/home`, `/intelligence`, `/strategic-moves`,
  `/source/queue`, `/tower`, `/admin`.

## Known Gaps

- Lakeshore renders safely, but the browser-visible product state is not rich:
  Intelligence says the corpus is not yet seeded, Moves has no moves, Tower has
  no substrate, and Admin shows `0/0 dimensions loaded` with `0 records`.
- Supabase was not paused, frozen, or deleted in this step.
- The Vercel project was not deleted in this step.
- This release does not prove Sentinel/Source Anthropic provider migration or
  golden-question answer quality.
