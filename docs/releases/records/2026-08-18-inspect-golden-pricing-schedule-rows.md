# 2026-08-18-inspect-golden-pricing-schedule-rows — Read-Only Diagnostic for source.golden_contract_pricing_schedule

## Release ID

`2026-08-18-inspect-golden-pricing-schedule-rows`

## Status

`candidate`

## Plain-English Summary

After correcting CTR-061's pricing-schedule line item and reloading (see
`2026-08-18-golden-evidence-pricing-schedule-reconciliation`), the live Optimize Contract workflow still
shows the old $45,800,000 total. The read query for this data
(`listContractEvidencePricing` in `read-adapter.ts`) filters by `_tenant_key = ANY($1::text[])` across
every tenant-key alias, with no `_dataset_id` filter — so if a stale, differently-tenant-key-tagged copy
of these rows exists from an earlier load, it would be included alongside the corrected rows with no
guarantee the corrected ones win.

This adds one read-only diagnostic, `inspect-golden-pricing-schedule-rows.mjs`, that prints every row in
`source.golden_contract_pricing_schedule` for one contract across all `_tenant_key` values present,
grouped with per-tenant-key row count, sum, and distinct `_dataset_id` values. It performs no writes.
The goal is to see whether a stale copy exists before deciding how to reconcile it.

## Layer Impact

- Release lane: `internal-admin`
- Products: None — operator tooling only, not reachable from any product surface.
- Canonical model: No schema/migration change; read-only.

## Client Applicability

- All clients: No.
- Specific clients: None directly; used to diagnose the synthetic demo airline tenant's Source data
  plane.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/inspect-golden-pricing-schedule-rows.mjs` (new) — read-only diagnostic.
- `package.json` — adds `source:inspect-golden-pricing-schedule-rows` npm script.

## QA / Validation

- `node --check scripts/source/inspect-golden-pricing-schedule-rows.mjs` — syntax valid.
- The script issues only one `SELECT`; it opens no transaction and performs no
  `INSERT`/`UPDATE`/`DELETE`/`CREATE`/`ALTER`.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Run via ACA Job per `docs/ops/aca-data-build-job-rule.md` as a read-only inspection.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Not required for a read-only diagnostic run, but checked anyway.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — operator-only, not a product route.

## Rollback Plan

Revert this commit. The script has no state to roll back; it never writes.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA operator job execution log showing the printed row groups.

## Known Gaps

- This record only ships the diagnostic. The fix for whatever it reveals (likely deleting a stale
  tenant-key-tagged copy, or widening the golden-evidence loader's delete-before-insert to be
  alias-scoped like the `doc.*` tables already are) is a separate, still-open item.
