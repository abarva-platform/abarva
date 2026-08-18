# 2026-08-18-golden-evidence-loader-tower-claim-alias-reclaim — Golden Contract Evidence Loader Reclaims Tower Rows Across Tenant Aliases

## Release ID

`2026-08-18-golden-evidence-loader-tower-claim-alias-reclaim`

## Status

`candidate`

## Plain-English Summary

This is a follow-on to the same-day fix `2026-08-18-golden-evidence-loader-alias-scoped-retag`, which
made the `doc.file/page/span/extraction` inserts safe to rerun under a different tenant-key alias for
the same synthetic tenant. Running the corrected loader live surfaced the identical problem one step
further down the script, in `tower.tracked_subject` and `tower.value_claim`: both tables key on a
bare, tenant-agnostic primary key (`subject_ref`, `claim_id`) built from the contract id, while the
script's own `ON CONFLICT (tenant_key, subject_ref)` / `ON CONFLICT (tenant_key, claim_id)` targets a
*different*, composite unique constraint — so a row already present under a different tenant-key alias
(left by an earlier load of the same package) is invisible to that ON CONFLICT and collides on the
bare primary key instead: `duplicate key value violates unique constraint "tracked_subject_pkey"`.

The fix reclaims across the declared tenant-key alias set before the existing inserts run, deleting
`value_claim` (the child, referencing `tracked_subject` by subject) before `tracked_subject` (the
parent), matching the same child-before-parent ordering already used for the `doc.*` tables.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (contract evidence ingestion) and Tower value tracking, operator tooling only. No
  product route or UI changed.
- Canonical model: No schema/migration change. Tower doctrine (read models own values) is unaffected —
  this only changes which tenant-key tag a synthetic-demo row is reclaimed under before insert.

## Client Applicability

- All clients: No — this loader only runs against the synthetic demo airline tenant's contract
  evidence package.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job, not reachable from any product surface.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs` — `upsertTowerClaim` now deletes any
  existing `tower.value_claim` / `tower.tracked_subject` row for this contract across
  `tenantAliases(args)` before the existing `ON CONFLICT` inserts run.

## QA / Validation

- `node --check scripts/source/load-source-golden-contract-evidence.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live reproduction: the apply-pass failed with `23505 duplicate key value violates unique constraint
  "tracked_subject_pkey"`, detail `Key (subject_ref)=(<contract id>) already exists`, immediately after
  the `doc.*` fix from the prior record resolved cleanly. That is the failure this record fixes. Live
  apply-pass proof against the corrected loader is captured in the operator run summary, not in this
  record, per the public-repo disclosure rule against narrating a specific engagement's data in a
  public artifact.

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
deployment lane. The delete is scoped to the declared tenant-key alias set for this run only; reverting
restores the prior (failing-closed) behavior with no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the apply-pass complete end to end with row counts per table.

## Known Gaps

- Same underlying pattern as the prior record: `tracked_subject.subject_ref` and `value_claim.claim_id`
  remain bare, tenant-agnostic primary keys. This fix makes cross-alias reruns of this specific
  synthetic package safe; it does not change the key shape.
