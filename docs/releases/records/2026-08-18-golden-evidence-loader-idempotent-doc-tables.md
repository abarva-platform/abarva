# 2026-08-18-golden-evidence-loader-idempotent-doc-tables — Golden Contract Evidence Loader Retag-Safe on Rerun

## Release ID

`2026-08-18-golden-evidence-loader-idempotent-doc-tables`

## Status

`candidate`

## Plain-English Summary

`scripts/source/load-source-golden-contract-evidence.mjs` writes parsed contract-PDF evidence into
`doc.file`, `doc.page`, `doc.span`, and `doc.extraction`. Those four tables key on a content-derived
id (`file_id`, `page_id`, `span_id`, `extraction_id`) that does not include `tenant_key`, and the
loader only wrote a plain `INSERT`. The script's own delete-before-insert step only clears rows
already tagged with the tenant key of the *current* run, so an earlier load under one tenant-key
alias left rows in place that a later load under a different (equally valid) alias for the same
synthetic tenant then collided with on primary key — surfacing as `duplicate key value violates
unique constraint "file_pkey"` and aborting the whole apply before any row for that run committed.

All four inserts now carry `ON CONFLICT (<id>) DO UPDATE`, matching the upsert pattern already used
elsewhere in the same file for `meta.concept`. A rerun — including one that reassigns existing rows
from a stale tenant-key alias to the canonical one — now updates in place instead of erroring.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (contract evidence ingestion), operator tooling only. No product route or UI
  changed.
- Canonical model: No schema/migration change. `doc.file/page/span/extraction` column shapes are
  unchanged; only the write path's conflict handling changed.

## Client Applicability

- All clients: No — this loader only runs against the synthetic demo airline tenant's contract
  evidence package.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job, not reachable from any product surface.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs` — `ON CONFLICT ... DO UPDATE` added to
  the `doc.file`, `doc.page`, `doc.span`, and `doc.extraction` inserts.

## QA / Validation

- `node --check scripts/source/load-source-golden-contract-evidence.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (this record satisfies the
  release-control gate).
- Live: ACA Job plan-pass (`source:contract-evidence:golden:plan`) against the current approved
  digest confirmed the package still parses to the expected row plan. The apply-pass that motivated
  this fix failed with `23505 duplicate key value violates unique constraint "file_pkey"` on
  `doc.file` before this change; that is the reproduction this record fixes. Live apply-pass proof
  against the new digest is captured separately in the operator run summary, not in this record, per
  the public-repo disclosure rule against narrating a specific engagement's data in a public artifact.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. The fixed loader is then run as an ACA Job per `docs/ops/aca-data-build-job-rule.md` — no
change to how or where it is invoked.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before re-running the operator job.
- Worker image invariant: Not affected; no worker job image changed.
- Feature/env flag update path: None.
- Live signed-in proof required: No — this change only affects an operator-run data-load script, not
  a product route.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. The change only adds `ON CONFLICT` clauses to existing inserts; reverting restores
the prior insert-only behavior with no data loss (rows already upserted stay as they are).

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the apply-pass complete without a primary-key conflict.

## Known Gaps

- The underlying design choice — content-derived, tenant-agnostic primary keys on `doc.file/page/
  span/extraction` — is unchanged. This fix makes a rerun safe; it does not add a tenant-scoped key.
  A future change could widen the primary key to `(tenant_key, file_id)` etc. if cross-tenant reuse
  of the same synthetic package ever becomes a routine pattern instead of an edge case.
