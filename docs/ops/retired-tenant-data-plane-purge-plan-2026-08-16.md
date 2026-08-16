# Retired Tenant Data-Plane Purge Plan - 2026-08-16

Status: plan-only, no data-plane mutation authorized.

## Scope

The active canonical tenant set is:

- `meridian-health`
- `skyharbor-air`

The retired/sunset tenant key set for any read-only inventory or future purge
dry-run is:

- `apex-retail`
- `apex`
- `apexretail`
- `first-capital`
- `firstcapital`
- `first-capital-financial`
- `lakeshore-holdings`
- `lakeshore-industries`
- `northstar-clinical`
- `northstar`
- `northstar-clinical-tech`
- `northstar-medtech`

The protected keep-key set is:

- `meridian-health`
- `meridian`
- `skyharbor-air`
- `skyharbor`
- `skyharbor_global`

No script in this lane may treat `meridian-health`, `meridian`,
`skyharbor-air`, `skyharbor`, or `skyharbor_global` as a retired key.

## Current Repo State

The branch removes sunset tenants from `CANONICAL_TENANTS` rather than marking
them retired. `CanonicalTenantKey` derives from that array, so new references to
sunset tenants fail the compiler instead of relying on grep-only cleanup.

The file-system sunset is already complete for tenant dataset directories. This
plan covers only future Azure/Postgres data-plane verification and possible
purge execution.

## Required Read-Only Dry Run

Before any deletion is considered, run the read-only inventory from a governed
environment with the approved Azure/Postgres URL:

```bash
npm run audit:retired-tenant-inventory -- \
  --out-dir /tmp/retired-tenant-inventory-20260816 \
  --sample-limit 5
```

If payload/text mentions need review, rerun with:

```bash
npm run audit:retired-tenant-inventory -- \
  --out-dir /tmp/retired-tenant-inventory-json-20260816 \
  --sample-limit 5 \
  --include-json-scan
```

The required review artifacts are:

- `inventory.json`
- `row-counts.csv`
- `summary.md`
- `export-plan.sql`
- `delete-plan.sql`

The dry-run is acceptable only if the emitted scope lists the retired keys and
keep keys exactly as shown above.

## Approval Gate

Human approval is required before any `--apply` command. Approval must name:

- database target and environment
- retired key list
- protected keep key list
- reviewed inventory output directory
- export location for rows to be removed
- rollback owner and backup/restore basis
- exact command to be run

No approval is implied by this plan.

## Future Apply Sequence

After approval, the safe order is:

1. Export rows using the reviewed `export-plan.sql`.
2. Run the generic row purge in dry-run mode:

   ```bash
   npm run ops:purge-retired-tenant-rows
   ```

3. Review the proof. Confirm no keep-key/client overlap and no protected tenant
   rows are targeted.
4. Only after approval, run the generic apply:

   ```bash
   npm run ops:purge-retired-tenant-rows:apply
   ```

5. Run the read-only residue audit:

   ```bash
   npm run ops:audit-retired-tenant-residue
   ```

6. If residue remains in the known context/semantic tables, prepare a separate
   approval for the focused residue purge. Do not combine this with the generic
   purge approval.

The focused residue purge is fail-closed for `--truncate-empty-keep`: every
resolved truncate table must have a `tenant_key` column, and every table must
show zero protected keep-key rows before truncation. If the script cannot count
keep-key rows for a table, the truncate strategy is not allowed.

The chunked residue delete strategy also treats keep-key row counts as a guard,
not just telemetry. Each table delete is committed only after the after-count
matches the before-count for protected keep keys.

## Hard Stops

Stop and do not apply if any proof shows:

- a protected keep key in the retired-key match set
- a keep client ID overlapping a retired client ID
- a focused residue truncate table without a `tenant_key` column
- a focused residue delete that changes protected keep-key row counts
- a table without a tenant/client predicate being targeted for deletion
- a delete plan requiring `CASCADE`
- an unreviewed JSON/text payload scan finding
- any row count that differs materially from the reviewed inventory

## Non-Claims

This plan does not:

- run `audit:retired-tenant-inventory`
- prove live row counts
- delete Azure/Postgres rows
- purge Azure AI Search indexes
- alter migrations
- alter signed-in product runtime behavior
- authorize client data deletion
