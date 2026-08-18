# 2026-08-18-golden-evidence-loader-alias-scoped-retag — Golden Contract Evidence Loader Reclaim Fixed to Avoid FK Violation

## Release ID

`2026-08-18-golden-evidence-loader-alias-scoped-retag`

## Status

`candidate`

## Plain-English Summary

This corrects the previous same-day fix
(`2026-08-18-golden-evidence-loader-idempotent-doc-tables`), which turned out to be wrong when run
live. That record added `ON CONFLICT (<id>) DO UPDATE` to the `doc.file`, `doc.page`, `doc.span`, and
`doc.extraction` inserts so a rerun under a different tenant-key alias could reclaim rows left behind
by an earlier run. In practice, retagging `doc.file.tenant_key` via `UPDATE` broke a foreign key from
`doc.page` (`doc_page_file_tenant_fk`, on `(tenant_key, file_id)`): the moment the parent row's key
changed, any child row still pointing at the old `(tenant_key, file_id)` pair became an orphaned
reference, and Postgres rejects that immediately — `update or delete on table "file" violates foreign
key constraint "doc_page_file_tenant_fk"`. Non-deferred foreign keys are checked per statement, so no
ordering of parent/child upserts within the same transaction avoids this.

The correct fix reverts the four inserts to plain `INSERT` (no `ON CONFLICT`) and instead widens the
script's own pre-existing delete-before-insert step (`deleteDocumentRows`) to delete by content id
across the run's declared tenant-key aliases, not just the current run's tenant key. Deletes already
run in FK-safe child-to-parent order (extraction → span → page → file); reclaiming across the alias
set before re-inserting avoids ever mutating a still-referenced key in place.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (contract evidence ingestion), operator tooling only. No product route or UI
  changed.
- Canonical model: No schema/migration change.

## Client Applicability

- All clients: No — this loader only runs against the synthetic demo airline tenant's contract
  evidence package.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job, not reachable from any product surface.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs` — revert the `ON CONFLICT ... DO UPDATE`
  on `doc.file`/`doc.page`/`doc.span`/`doc.extraction` back to plain `INSERT`; widen
  `deleteDocumentRows` to delete by content id across `tenantAliases(args)` instead of only
  `args.tenantKey`.

## QA / Validation

- `node --check scripts/source/load-source-golden-contract-evidence.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live reproduction: the prior fix's apply-pass failed with `23503 update or delete on table "file"
  violates foreign key constraint "doc_page_file_tenant_fk"`, detail `Key (tenant_key,
  file_id)=(<alias>, <file id>) is still referenced from table "page"`. That is the failure this
  record fixes. Live apply-pass proof against the corrected loader is captured in the operator run
  summary, not in this record, per the public-repo disclosure rule against narrating a specific
  engagement's data in a public artifact.

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
deployment lane. Reverting restores the (broken) `ON CONFLICT` behavior from the prior record, which
is worse but not destructive — it fails closed on the same FK check rather than corrupting data.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the apply-pass complete without a primary-key or
  foreign-key conflict.

## Known Gaps

- The underlying design choice — content-derived, tenant-agnostic primary keys on `doc.file/page/
  span/extraction`, with a foreign key that assumes a stable tenant per file — is unchanged. This fix
  makes cross-alias reruns safe by reclaiming rows before insert; it does not add a tenant-scoped key.
