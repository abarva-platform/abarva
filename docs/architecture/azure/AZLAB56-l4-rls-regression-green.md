# AZLAB56 · L4 RLS Regression Green

Date: 2026-05-16
Scope: Azure lab Postgres, tenant-scoped RLS, cutover gate L4
Runtime: `ca-abarva-web-lab-eastus` revision `ca-abarva-web-lab-eastus--0000021`

## What Changed

The Azure lab now has a green SQL-level RLS regression run for tenant-scoped
tables. This closes the database-side half of the L4 isolation gate; the
route-level SEC-P0 curl suite remains the separate API-surface proof.

Three database changes were applied inside the private Container Apps lane:

| Migration | Purpose |
|---|---|
| `20260516090000_rls_coverage_gaps.sql` | Added `auth_read` policies for the 23 `data_segment_*` tables plus `session_messages`. |
| `20260516093000_clients_service_role_policy.sql` | Made `public.clients` explicitly available to `service_role` while keeping browser roles locked out. |
| `20260516094000_tenant_scoped_auth_read_coverage.sql` | Standardized tenant-scoped authenticated SELECT policies across public tables with `tenant_key`, `client_key`, or `client_id`, and removed public ALL policies from tenant-scoped data. |

The migrations were transferred through Key Vault as temporary base64 SQL
payloads and executed from inside the Container App so Postgres stayed private.

## Safety Check Before Applying

Before applying the RLS gap migration, the live database was checked from inside
the private lane:

| Check | Result |
|---|---|
| `current_tenant_key()` exists and canonicalizes aliases | Pass |
| `apexretail` -> `apex-retail` | Pass |
| `meridian` -> `meridian-health` | Pass |
| `arcturus` -> `first-capital` | Pass |
| `clients.tenant_key` values are canonical | Pass: `apex-retail`, `meridian-health`, `first-capital` |
| Data-segment row keys are canonical | Pass |

This matters because the tenant data rows use the hyphenated keys while some
Clerk metadata/JWT emitters may still send historical aliases. The database
helper now normalizes both forms before RLS comparison.

## Regression Result

The L4 SQL regression was run inside the Azure Container App against Azure
Postgres using the same `DATABASE_URL` projected to the app runtime.

Result:

| Metric | Value |
|---|---:|
| Status | Green |
| Tenant-scoped tables discovered | 129 |
| Tables without RLS enabled | 0 |
| Tenant/table findings | 387 |
| Rows visible through tenant-scoped RLS | 13,332 |
| Pass | 123 |
| Empty | 264 |
| Leak | 0 |
| Error | 0 |

Verifier tail:

```text
rls-regression: pass=123 leak=0 error=0 empty=264
rls-regression: ALL GREEN — tenant isolation holding across 13332 rows in 387 findings
```

## Issue Found And Fixed

The first live regression attempts found two important gaps:

1. The regression harness itself needed scratch-table grants because it switches
   to `SET LOCAL ROLE authenticated` during probes.
2. `source_events` had a legacy `service_role_full_access` policy whose role set
   was `{public}`. That let authenticated users see cross-tenant Source rows.

The final migration removes public ALL policies on tenant-scoped tables and
reinstalls service-role bypass as `TO service_role`.

## Cutover Impact

This moves the Azure cutover from "browser/data parity proven" to
"browser/data parity plus database isolation proven." The remaining L4 item is
the API-level SEC-P0 curl suite against the Azure hostname with an Azure-hosted
Clerk session.

Updated cutover meter: approximately 93%.

Remaining cutover gates:

| Gate | Status |
|---|---|
| L4 SQL RLS regression | Complete |
| L4 SEC-P0 API probe suite | Pending Azure-host session/token |
| L7 live 50-prompt agent-quality baseline | Pending |
| L8 authenticated load harness | Pending Clerk-aware load runner |
| L3 strict private-lane hardening | Advisory items still open |
