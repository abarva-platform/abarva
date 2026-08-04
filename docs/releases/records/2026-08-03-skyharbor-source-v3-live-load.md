# 2026-08-03-skyharbor-source-v3-live-load - Load Source v3 Current-State Read Models

## Release ID

`2026-08-03-skyharbor-source-v3-live-load`

## Status

`candidate`

## Plain-English Summary

Adds a replayable operator loader for the approved synthetic SkyHarbor v3 current-state package so the live Source Vendor & Contract Portfolio, Contract 360, and Sourcing Opportunities pages can read the same `source.*`, `tower.*`, `doc.*`, `meta.*`, and `sem.*` layers that were previously validated only in an offline export.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 - Client Intake: packages the approved synthetic v3 source zip under `scripts/source/fixtures` for controlled operator replay.

Layer 2 - Source Adapters: loads the 28 CSVs one-for-one into raw schemas as text with lineage columns and `_column_map` metadata.

Layer 3 - Canonical Model: creates the flexible six-table document/extraction schema, Tower measurement tables, and Source read-model views derived from raw rows.

Layer 4 - Products: Source pages continue to read through the existing adapter. The adapter now binds the tenant session key before RLS-protected reads.

## Client Applicability

- All clients: no.
- Specific clients: synthetic SkyHarbor current-state demo only.
- Internal only: yes, operator load/repair lane.
- Public/demo only: synthetic demo data, not real client facts.
- Feature flag: none.

## Changes Included

- `scripts/source/load-skyharbor-v3-current-state.ts`
- `scripts/source/fixtures/skyharbor-global-v3/SkyHarbor_Global_Synthetic_Current_State_v3.zip`
- `scripts/source/skyharbor-v3/*.sql`
- `src/lib/source/data-model/read-adapter.ts`
- `package.json` script `source:skyharbor-v3:load-current-state`

## QA / Validation

- Pass - loader dry run verified package SHA `7a8a992b91ee5b436679d9590adae015c642b6c26db9b89792a825819b345ff6`, dataset `skyharbor_global_synthetic_current_state_v3`, 28 raw tables, and 9,656 raw rows without DB writes.
- Pass - local disposable PostgreSQL apply inserted 28/28 raw tables and 9,656/9,656 rows, then reconciled FY2027 budget `$2.35B`, FY2026 actual `$2.18B`, contract value `$1.4805B`, 119 `source.contract_vendor_360` rows, 119 `source.contract_360` rows, and 0 AI seat violations.
- Pass - direct read adapter smoke against local PostgreSQL returned 119 rows for a `skyharbor-air` caller through the RLS-bound `skyharbor_global` session.
- Pass - focused ESLint for the loader, Source read adapter, and read-adapter unit test.
- Pass - focused Jest for Source read adapter, Contract 360 view, sourcing opportunities, and vendor-contract portfolio.
- Pass - repo-wide `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pass - ACA operator job plan-only check with a digest-pinned image, `source:skyharbor-v3:load-current-state`, `DATABASE_URL` secret reference, and `TENANT_KEY=skyharbor_global`.
- Pass - release control check against `origin/main`.
- Not-run - production ACA operator job apply; this must run after the PR is merged and the repo-owned ACA workflow deploys an image containing this loader.
- Blocked - signed-in browser proof until the live database apply completes and an authenticated Source-access session is available.

## Rollout Plan

Merge through PR to `main`, let the repo-owned ACA deploy workflow build and deploy the image, then run the private ACA operator job using the digest-pinned deployed image:

`npm run ops:aca-job -- --image <digest-pinned-aca-image> --script source:skyharbor-v3:load-current-state:apply --secret-env DATABASE_URL=azure-postgres-control-database-url --env TENANT_KEY=skyharbor_global`

The page is not considered fixed until the operator job reconciliation proves the live database has the expected Source read-model rows.

## Deployment Authority

- Repo-owned deploy workflow: required for the web/runtime image.
- Shared runtime mutators: no ad hoc web traffic mutation in this release.
- Approved image digest: captured after ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: use the private operator job with a digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for the Source routes when an authenticated browser session is available.

## Rollback Plan

Revert the PR to remove the operator loader and read-adapter change from future images. If the data job applies and must be backed out, run a scoped repair script deleting only rows where `_tenant_key = 'skyharbor_global'` and `_dataset_id = 'skyharbor_global_synthetic_current_state_v3'`, then drop or replace only the Source/Tower/doc objects created by this repair if no other tenant depends on them.

## Audit Evidence

Expected evidence:

- PR URL and commit SHA.
- Loader dry-run output.
- Focused test output.
- ACA deploy run and runtime invariant output.
- ACA operator job output with reconciliation JSON.
- Source route/browser proof or explicit Clerk/auth blocker.

## Known Gaps

Signed-in browser proof depends on an authenticated session with Source access. If the Codex in-app browser is not signed in, the data-plane proof will be captured separately and UI proof remains explicitly blocked.
