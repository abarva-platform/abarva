# Onboarding a new pilot tenant

Canonical runbook for adding a brand-new pilot tenant to AbarVa. Closes
the P0-1 gap surfaced by `docs/pilot/SYNTHETIC-PILOT-REHEARSAL-LOG.md`.

## TL;DR

```bash
npx tsx src/scripts/tenants/add-tenant.ts \
  --key northwind \
  --name "Northwind Retail" \
  --industry RETAIL \
  --admin-email cdo@northwind-retail
```

That writes/upserts entries in all four registry files in one pass. The
script is idempotent — safe to re-run.

## What the script does

The script edits these four files (and only these four):

| Registry                     | File                                        | What gets added                                                                                                                   |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1 · `client-config`          | `src/lib/client-config.ts`                  | `ClientOption` in `ALL_CLIENTS` + entries in `CLIENT_KEY_TO_DB_NAME`, `CLIENT_KEY_TO_INDUSTRY_CODE`, `EMAIL_DOMAIN_TO_CLIENT_KEY` |
| 2 · `active-client`          | `src/lib/active-client.ts`                  | Entry in `CLIENT_KEY_TO_DB_SLUGS` (canonical + dashed forms)                                                                      |
| 3 · `demo-tenant-data-tiers` | `src/lib/tenants/demo-tenant-data-tiers.ts` | Shell-only `DemoTenantDataTier` (all surfaces `unavailable`, `routeHint: null`)                                                   |
| 4 · `canonical-auth-roster`  | `src/lib/auth/canonical-auth-roster.ts`     | Admin email in `CANONICAL_AUTH_EMAILS` and `CANONICAL_CLIENT_ADMIN_EMAILS`                                                        |

After the script runs, the new tenant exists as a recognised key with
honest empty states everywhere. No data leakage into another tenant's
surface, because P0-2 makes the routing fallback return `null` for any
unseeded surface.

## Flags

| Flag            | Required | Example                | Notes                                                                                                         |
| --------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--key`         | yes      | `northwind`            | Canonical lowercase key. No dashes, no uppercase. Must not collide with `apexretail`, `meridian`, `arcturus`. |
| `--name`        | yes      | `"Northwind Retail"`   | Display name.                                                                                                 |
| `--industry`    | yes      | `RETAIL`               | One of `RETAIL`, `HEALTHCARE_IDN`, `FINSERV`, `DIVERSIFIED`.                                                  |
| `--admin-email` | yes      | `cdo@northwind-retail` | Either full email or short form. Short form auto-completes to `*.example.com`.                                |
| `--short-name`  | no       | `"Northwind"`          | Defaults to `--name`.                                                                                         |
| `--color`       | no       | `"#94A3B8"`            | Hex color for nav chrome. Defaults to neutral slate.                                                          |
| `--dry-run`     | no       | —                      | Print summary without writing.                                                                                |

## Manual steps (still required)

The script handles only the four TypeScript registries. You still need
to do these by hand (or via the seed scripts) before the tenant can
sign in:

1. **Database row.** Insert into the `clients` table with `tenant_key='<key>'`
   and `industry_code='<INDUSTRY>'`. The slug should match one of the
   slugs the script wrote into `CLIENT_KEY_TO_DB_SLUGS`.
2. **Clerk user.** Create the admin user with
   `publicMetadata.clientId='<key>'`, `role='client'`,
   `primaryEmailAddress=<admin-email>`. Use the existing
   `scripts/provision-cxo-personas.ts` pattern or the Clerk dashboard.
3. **Seed data.** Optional. Programs / Source / Intelligence / Tower are
   all empty until you seed them. When you do, promote the tenant from
   `shell_only` to `thin` or `rich` in `demo-tenant-data-tiers.ts` and
   populate `routeHint` for the surfaces that now have data.
4. **Typecheck + tests.**
   ```bash
   npx tsc --noEmit
   npm run test:behaviors
   ```

## Idempotency

Re-running the script for the same `--key` is safe:

- If a registry already contains the tenant, that registry is reported
  as `skipped`.
- If a previous run only partially completed (e.g. wrote three of four
  registries before erroring), re-running fills in the missing pieces
  without duplicating anything.

## What this script does NOT do

- It does **not** seed any program / source / intelligence / tower data.
- It does **not** touch the `clients` table in Postgres.
- It does **not** provision Clerk users.
- It does **not** change the `getTenantRouteFallback` behavior — that
  was tightened separately as the P0-2 fix in the same PR.

## Reference

- Rehearsal log that surfaced both P0s: `docs/pilot/SYNTHETIC-PILOT-REHEARSAL-LOG.md`
- Script: `src/scripts/tenants/add-tenant.ts`
- Tests: `src/__tests__/behaviors/tenant-onboarding.test.ts`
