# 2026-08-18-golden-evidence-alias-scoped-csv-tables — Golden Evidence CSV Staging Tables Retag-Safe on Rerun

## Release ID

`2026-08-18-golden-evidence-alias-scoped-csv-tables`

## Status

`candidate`

## Plain-English Summary

The same class of bug fixed twice already today for other tables in this loader
(`2026-08-18-golden-evidence-loader-alias-scoped-retag` for `doc.file/page/span/extraction`, and
`2026-08-18-golden-evidence-loader-tower-claim-alias-reclaim` — merged earlier — for
`tower.tracked_subject`/`value_claim`) also applied to `loadPackageCsvTable`, the function backing all
15 other `source.golden_contract_*` staging tables (pricing schedule, invoice lines, SLA/service
credits, usage, and more). Its delete-before-insert step only cleared rows already tagged with the
*current* run's tenant key, so a load under one tenant-key alias for this synthetic tenant left rows
behind under that alias.

This one had a directly observable, live consequence: correcting CTR-061's pricing-schedule line item
and reloading under `skyharbor-air` (see `2026-08-18-golden-evidence-pricing-schedule-reconciliation`)
did not clear the live baseline-conflict gate, because a stale copy from an earlier load under
`skyharbor_global` was never removed — confirmed via a read-only diagnostic
(`2026-08-18-inspect-golden-pricing-schedule-rows`): `source.golden_contract_pricing_schedule` had 5
rows under `skyharbor-air` summing to the corrected $35,800,000 *and* 5 rows under `skyharbor_global`
still summing to the old $45,800,000, both under the same `_dataset_id`. The live read path
(`listContractEvidencePricing`) queries `_tenant_key = ANY(aliases)` with no `_dataset_id` filter, so
both copies were included with no guarantee the corrected one won.

`loadPackageCsvTable`'s delete now scopes to the run's declared tenant-key aliases (`tenantAliases(args)`,
already used elsewhere in this same file), not just the current tenant key — reclaiming stale
alias-tagged rows across all 15 tables it backs, the same fix already applied to the other two write
paths in this loader.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (contract evidence ingestion), operator tooling only. No product route or UI
  changed.
- Canonical model: No schema/migration change.

## Client Applicability

- All clients: No — this loader only runs against the synthetic demo airline tenant's contract
  evidence package.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs` — `loadPackageCsvTable`'s delete-before-insert
  scoped to `tenantAliases(args)` instead of `args.tenantKey` alone.

## QA / Validation

- `node --check scripts/source/load-source-golden-contract-evidence.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live reproduction: `source:inspect-golden-pricing-schedule-rows` confirmed two tenant-key-tagged
  copies of CTR-061's pricing schedule under the same `_dataset_id` before this fix. Live re-verification
  after this deploys and the loader reruns is captured in the operator run summary, not in this record,
  per the public-repo disclosure rule against narrating a specific engagement's data in a public
  artifact.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Re-run `source:contract-evidence:golden:apply` as an ACA Job — no change to how or where it is
invoked. This single rerun now cleans up stale alias-tagged rows across all 15 `source.golden_contract_*`
tables this function backs, not just pricing schedule.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before re-running the operator job.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — confirm the baseline-conflict gate clears for CTR-061 in the
  live Optimize Contract workflow, and that the pricing-schedule diagnostic shows only one tenant-key
  group going forward.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest. The change only widens
an existing delete's scope; reverting restores the narrower (buggy) scope with no data loss to rows
already correctly tagged.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the rerun.
- `source:inspect-golden-pricing-schedule-rows` rerun showing a single tenant-key group.
- Live read of the Optimize Contract workflow showing the baseline-conflict gate cleared.

## Known Gaps

- The underlying design choice — `source.golden_contract_*` rows keyed by `(_tenant_key, _dataset_id,
  ...)` with no cross-alias uniqueness constraint — is unchanged. This fix makes a rerun reclaim stale
  alias-tagged rows; it does not prevent a future load under yet another alias from repeating the same
  pattern if the declared alias list passed to that run omits it.
