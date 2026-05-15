# AZLAB39 - L10 Sensitive-Upload Audit Immutability

Date: 2026-05-15  
Status: wired, dry-run validated  
Layer: L10 compliance / audit trail

## Why This Exists

AZLAB34 proved the migration contract: `sensitive_upload_audit` has RLS enabled, public authenticated access is SELECT-only, and release / hard-delete actions are modeled as child rows through `parent_id`.

AZLAB38 made the audit evidence exportable.

This slice adds the live assertion command that closes the next control: prove the original audit row cannot be mutated or deleted under the non-service authenticated path, while still allowing service-side append-only lifecycle evidence.

## Artifact

| Artifact | Purpose |
|---|---|
| `src/scripts/assert-sensitive-upload-audit-immutability.ts` | Live Postgres assertion for sensitive-upload audit immutability. |
| `npm run assert:sensitive-upload-audit-immutability` | Operator command for Azure/Supabase Postgres. |

## What The Assertion Does

By default, the command is non-destructive:

1. Opens a transaction.
2. Inserts a synthetic quarantine row for one tenant.
3. Sets `request.jwt.claims` and `SET LOCAL ROLE authenticated`.
4. Attempts `UPDATE` and `DELETE` as `observer`.
5. Attempts `UPDATE` and `DELETE` as `tenant_admin`.
6. Confirms those mutations are blocked.
7. Resets to the privileged connection and appends two lifecycle rows: `released` and `hard_deleted`.
8. Confirms the original row still has `final_decision = 'quarantine'` and has two child lifecycle rows.
9. Rolls the transaction back unless `--commit-fixture` is explicitly supplied.

This tests the posture we want for SOC2: no direct mutation path for the original decision row; reviewer actions are represented as new evidence rows.

## How To Run

Dry run:

```bash
npm run assert:sensitive-upload-audit-immutability -- --dry-run
```

Live Azure/Supabase run:

```bash
DATABASE_URL="$DATABASE_URL" npm run assert:sensitive-upload-audit-immutability
```

Run for a specific tenant:

```bash
DATABASE_URL="$DATABASE_URL" npm run assert:sensitive-upload-audit-immutability -- \
  --tenant-key meridian-health
```

Keep the synthetic fixture rows as audit evidence:

```bash
DATABASE_URL="$DATABASE_URL" npm run assert:sensitive-upload-audit-immutability -- \
  --tenant-key apex-retail \
  --commit-fixture
```

## Pass Criteria

The command must return JSON with:

- `status: "pass"`
- four blocked attempts: observer/update, observer/delete, tenant_admin/update, tenant_admin/delete
- `lifecycleRows: 2`
- `fixtureCommitted: false` unless `--commit-fixture` is set

## Current Limit

This validates table-level immutability and append-only lifecycle behavior. It does not yet validate Purview label persistence or scheduled monthly export cadence.

## Next L10 Controls

| Next control | Why |
|---|---|
| Purview label persistence fixture | Proves classification labels survive release/hard-delete lifecycle rows. |
| Monthly GitHub Action / operator runbook | Produces recurring evidence packs for customer/security reviews. |
| Admin-action evidence export | Adds non-upload admin actions to the same SOC2 evidence cadence. |
