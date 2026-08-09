# 2026-08-09-source-evidence-package-contract-anchor — Portable Contract Evidence Anchor

## Release ID

`2026-08-09-source-evidence-package-contract-anchor`

## Status

`candidate`

## Plain-English Summary

The Source golden-contract evidence loader now supports tenants whose Contract 360
read model is supplied by a projection that is not yet materialized in
`source.contract_360`. The loader still prefers `source.contract_360` when that
row exists. If it does not, it uses the reviewed `contract_overview.csv` row from
the governed evidence package as the contract anchor for vendor metadata, annual
value, and Tower claim subject setup.

## Layer Impact

- Release lane: `client-data-lane`
- `CLIENT INTAKE`: no change.
- `SOURCE ADAPTERS`: no change to template shape; the existing contract overview
  extract becomes a valid loader anchor when the canonical Source projection has
  not been populated yet.
- `CANONICAL MODEL`: evidence still lands in the shared `source.golden_contract_*`,
  `doc.*`, and `tower.*` tables. No tenant-specific tables or logic are added.
- `PRODUCTS`: Source and Tower can read the same evidence rows through the
  existing shared adapters after the operator job succeeds.

## Client Applicability

- All clients: the loader behavior is generic and package-driven.
- Specific clients: this unblocks the Meridian canary evidence load while
  preserving the existing SkyHarbor `source.contract_360` path.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs`

## QA / Validation

- Pass: `node scripts/source/load-source-golden-contract-evidence.mjs` returned
  the unchanged SkyHarbor default plan: `skyharbor_global`, contracts `CTR-090`
  and `CTR-061`, and 1,752 source rows.
- Pass: Meridian dry plan returned `meridian_health_global`, contracts `CF-001`
  and `CF-003`, and 608 source rows.
- Pass: `npm run source:contract-evidence:meridian:validate`.
- Pass: `npx eslint scripts/source/load-source-golden-contract-evidence.mjs`.
- Pass: `npx jest src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts --runInBand`.
- Pass: `npm run release:check`.
- Pending: Meridian ACA operator apply should pass and emit reconciliation.
- Pending: signed-in Source browser proof for the two Meridian contracts.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main workflow, then rerun the
Meridian Source evidence apply through `scripts/ops/submit-aca-operator-job.mjs`
with the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: `scripts/ops/submit-aca-operator-job.mjs` for the data
  apply only
- Approved image digest: assigned by the main ACA workflow after merge
- ACA runtime invariant: required before data apply
- Worker image invariant: required by main deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes, Source/Contract 360 for Meridian

## Rollback Plan

Revert the loader change and redeploy. If evidence has already been loaded, rerun
the loader with the prior dataset or delete only the scoped Meridian
`_dataset_id` rows through an approved operator cleanup job.

## Audit Evidence

- PR URL after creation
- ACA main deploy run after merge
- ACA operator job proof folder for the Meridian evidence apply
- Signed-in browser proof for the two Meridian contract details

## Known Gaps

This change does not itself load Meridian evidence. The operator apply and
browser proof remain required before calling Meridian live.
