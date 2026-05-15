# AZLAB34 - L10 Sensitive Upload Audit Assertions

Date: 2026-05-15  
Status: wired, unit-tested  
Layer: L10 compliance / audit trail

## Why This Exists

The private data lane needs to prove more than "we can detect sensitive data." It needs to prove the evidence trail survives enterprise infosec review:

1. Quarantine decisions are tenant-scoped.
2. Release and hard-delete actions do not mutate the original decision row.
3. Lifecycle rows can reconstruct what happened through `parent_id`.
4. Public application roles cannot insert, update, or delete sensitive-upload audit rows.

This is the L10 control that turns B5c quarantine from a useful admin page into an audit-ready evidence path.

## Artifacts

| Artifact | Purpose |
|---|---|
| `src/lib/security/__tests__/quarantine-audit-supabase.test.ts` | Unit and migration-contract tests for the Supabase quarantine audit data source. |
| `src/lib/security/quarantine-audit-supabase.ts` | Data source under test. Lists parent rows and appends lifecycle rows. |
| `supabase/migrations/20260515200000_sensitive_upload_audit.sql` | Migration contract checked by the test. |

## Assertions Now Covered

| Assertion | Test coverage | Why it matters |
|---|---|---|
| Tenant-scoped listing | The list query applies `tenant_client_key = <active tenant>`. | Prevents one tenant's quarantine evidence from appearing in another tenant's admin view. |
| Parent-only listing | The list query applies `parent_id is null`. | Keeps lifecycle child rows from being shown as independent upload decisions. |
| Release is append-only | `release()` inserts a lifecycle row with `parent_id`, `final_decision = released`, `released_by`, and `release_note`. | Preserves the original quarantine row and creates a review trail. |
| Hard delete is append-only | `hardDelete()` inserts a lifecycle row with `parent_id`, `final_decision = hard_deleted`, reviewer, note, and `hard_deleted_by_reviewer`. | Proves deletion decisions are reviewable instead of silent mutations. |
| Public role write lock | Migration text must grant `SELECT` to `authenticated` and must not grant `INSERT`, `UPDATE`, or `DELETE`. | Supports the audit posture that app users can read scoped evidence but cannot alter the append-only audit log directly. |
| RLS enabled | Migration text must enable row-level security on `sensitive_upload_audit`. | Keeps the table inside the tenant-isolation model. |

## How To Run

```bash
npx jest src/lib/security/__tests__/quarantine-audit-supabase.test.ts --runInBand
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/security/__tests__/quarantine-audit-supabase.test.ts
git diff --check
```

## Current Limit

This slice checks the application data source behavior and migration contract. It does not yet run a live SQL attempt to `UPDATE` or `DELETE` an audit row under an authenticated tenant role. That remains the next L10 hardening step before a customer private-data-lane pilot.

## Next L10 Controls

| Next control | Artifact to add |
|---|---|
| Live append-only SQL assertion | `tests/security/sensitive-upload-audit-append-only.sql` or a Node runner that connects with an authenticated-role token and proves `UPDATE`/`DELETE` fail. |
| Lifecycle reconstruction fixture | SQL or Jest fixture that inserts quarantine -> release -> hard-delete and reconstructs the chain through `parent_id`. |
| Purview label persistence | Test that simulated Purview labels persist in `purview_labels` and survive release lifecycle rows. |
| Evidence pack export | `src/scripts/export-soc2-evidence-pack.ts` exporting sensitive-upload decisions, gate approvals, and admin actions. |
