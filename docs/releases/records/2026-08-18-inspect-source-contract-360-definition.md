# 2026-08-18-inspect-source-contract-360-definition — Read-Only Diagnostic for source.contract_360

## Release ID

`2026-08-18-inspect-source-contract-360-definition`

## Status

`candidate`

## Plain-English Summary

`source.contract_360` (the view the live Optimize Contract picker reads) currently returns exactly 65
rows for the synthetic demo airline tenant, matching only its legacy tenant-intake contracts — not the
2 canonical rows separately confirmed present in `source.contract`. Force-reapplying the migration that
is supposed to make this view union legacy and canonical contracts failed with `cannot drop columns
from view`, meaning some other, undocumented process replaced the view with a wider, incompatible shape
after that migration last ran.

This adds one read-only diagnostic script, `inspect-source-contract-360-definition.mjs`, that prints
`pg_get_viewdef` for `source.contract_360` and `source.contract_vendor_360`, the `relkind` of each
underlying object, and row counts for `source.contract`/`source.vendor`/both views, scoped to one
tenant key. It performs no writes. The goal is to see the view's actual live definition before deciding
how to reconcile it with the canonical `source.contract` rows, rather than guessing from migration
files that may no longer describe what is actually deployed.

**Update:** the first live run of this diagnostic returned 0 rows for every view — a false signal. The
script never set the `app.tenant_key` session variable that `source.can_read_sourcing_tenant()` (an RLS
gate this view's live definition depends on, not present in the migration files this investigation
started from) fails closed without. Fixed to set it, matching the pattern already used elsewhere
(`inspect-skyharbor-v3-live-proof.ts`). Also added a check against `source.l4_cube_active_load_run` and
a per-`load_run_id` row count on `source.contract`: the view's live definition joins `source.contract`
to that active-load-run pointer table per tenant, so rows inserted under a `load_run_id` that isn't
marked active for the tenant exist in the base table but never surface through the view — a much
simpler and less risky explanation than the schema-drift theory this record started with, and one that
does not require dropping or recreating anything.

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

- `scripts/source/inspect-source-contract-360-definition.mjs` (new) — read-only diagnostic.
- `package.json` — adds `source:inspect-contract-360-definition` npm script.

## QA / Validation

- `node --check scripts/source/inspect-source-contract-360-definition.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (this record satisfies the
  release-control gate).
- The script issues only `SELECT` statements (`pg_get_viewdef`, `pg_class`/`pg_namespace` introspection,
  `count(*)`); it opens no transaction and performs no `INSERT`/`UPDATE`/`DELETE`/`CREATE`/`ALTER`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Run via ACA Job per `docs/ops/aca-data-build-job-rule.md` as a read-only inspection — no data-plane
mutation, so the job-contract fields in that rule (idempotency key, rollback plan, etc.) do not apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Not required for a read-only diagnostic run, but checked anyway before
  running as a matter of course.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — operator-only, not a product route.

## Rollback Plan

Revert this commit. The script has no state to roll back; it never writes.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA operator job execution log showing the printed view definitions and counts.

## Known Gaps

- This record only ships the diagnostic. The actual fix for `source.contract_360` not reflecting
  canonical `source.contract` rows is a separate, still-open item pending what this diagnostic reveals.
