# 2026-08-11-healthcare-source-vendor360-candidate - Source Vendor 360 candidate load path

## Release ID

`2026-08-11-healthcare-source-vendor360-candidate`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator load path for a five-contract healthcare demo Source package and wires the Source Vendor 360 / Contract 360 read adapter to prefer the loaded candidate rows when present. The package remains synthetic, PHI-free, and planning-grade; blocked contracts stay blocked and finance-confirmed value is not broadened beyond the supplied evidence.

## Layer Impact

`client-data-lane`: the fixture is shipped under `scripts/source/fixtures` so the ACA operator image can read the same package that local validation used.

`client-data-lane`: adds `scripts/source/load-meridian-source-vendor360-candidate.mjs`, which creates dataset-scoped `source.meridian_vendor360_*` tables, loads the source extract ledger, and inserts clause-level `doc.extraction` rows.

`client-data-lane`: follow-up loader hardening makes source-extract row IDs deterministic when a native extract ID repeats within a single source table, while preserving the native ID in JSON payload lineage.

`public-demo`: Source Vendor 360 / Contract 360 now prefer the five-contract candidate for the healthcare demo tenant only when the dataset is loaded. Other tenants continue to read the existing `source.*` views.

## Client Applicability

All clients: no.

Specific clients: healthcare demo tenant only.

Internal only: operator scripts and proof bundles.

Public/demo only: yes, synthetic demo evidence.

Feature flag: none; activation depends on dataset rows existing in the scoped candidate tables.

## Changes Included

- `scripts/source/load-meridian-source-vendor360-candidate.mjs`
- `scripts/source/fixtures/meridian-source-5-contract-layer-cube-proof-20260811`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`
- `docs/governance/dataset-manifests/meridian-source-5-contract-vendor360-20260811.json`
- `package.json` operator scripts:
  - `source:vendor360:meridian-5-contract:plan`
  - `source:vendor360:meridian-5-contract:preflight`
  - `source:vendor360:meridian-5-contract:apply`
  - `source:vendor360:meridian-5-contract:verify`

## QA / Validation

Pass - local plan validation:

- `node scripts/source/load-meridian-source-vendor360-candidate.mjs --mode plan`
- Result: package hashes matched; target counts reported as 5 contracts, 20 scope rows, 5 financial rows, 5 operational rows, 25 dependency rows, 810 source extract rows, 12 mapping rows, and 220 doc extraction rows.

Pass - manifest governance validation:

- `npm run validate:context-corpus:manifests`
- Result: passed.

Pass - focused read-adapter regression:

- `npx jest src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand`
- Result: passed, with existing duplicate manual mock warnings unrelated to this change.

Pass - loader source-extract ID hotfix validation:

- `node scripts/source/load-meridian-source-vendor360-candidate.mjs --mode self-test`
- `npm run source:vendor360:meridian-5-contract:plan`
- Result: target counts remained unchanged after deterministic duplicate-ID suffixing.

Blocked - ACA operator preflight attempt:

- Execution `job-abarva-private-operator-eus-h4hg1b7` failed closed before database access because the start override did not include the database secret env.
- Execution `job-abarva-private-operator-eus-r4rxg0n` reached the database and rolled back on duplicate native source extract IDs in the package. This follow-up fixes that loader assumption; preflight must be rerun after merge/deploy.
- Execution `job-abarva-private-operator-eus-z0pcnb9` reached the database after the duplicate-ID fix and rolled back on the existing `doc.extraction` lineage constraint. This follow-up records CSV clause rows as column-sourced lineage with `source_table`, `source_row`, and `source_column`; it does not weaken the database constraint.
- Read-only execution `job-abarva-private-operator-eus-57y0q30` confirmed the failed preflight did not leave the candidate tables loaded.

Additional validation required before release:

- Not run yet - `npm run release:check -- --base origin/main --head HEAD` after this release-record correction.
- Blocked pending PR/merge/deploy - ACA operator preflight proof bundle before any apply.
- Blocked pending explicit human approval - ACA operator apply.
- Blocked pending apply - ACA operator verify proof bundle.
- Blocked pending deployment and data load - signed-in browser proof for `/source/vendor-portfolio` and one candidate `/source/vendor-portfolio/<contractId>` route.

## Rollout Plan

1. Merge through PR to `main`.
2. Let the repo-owned ACA main deploy workflow build and deploy the digest-pinned web image.
3. Run the operator job in preflight mode for the dataset-scoped load and capture the proof bundle.
4. Obtain explicit human approval for the exact target counts before `apply`.
5. Run the operator job in apply mode, then verify mode.
6. Prove the ACA runtime invariant and signed-in Source routes before calling the dataset live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR; no ad-hoc ACA traffic or template mutation.
- Approved image digest: pending main workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required if the operator job image is updated.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to remove the read-adapter preference, or remove the dataset-scoped rows from `source.meridian_vendor360_*` and matching `doc.extraction` rows for dataset id `meridian-source-5-contract-vendor360-20260811`. The loader is dataset-scoped, so rollback does not require changing shared `source.contract_360` views.

## Audit Evidence

- PR URL: pending.
- Local plan output: pending final validation log.
- ACA deploy workflow: pending.
- ACA operator preflight/apply/verify proof bundles: pending.
- Signed-in browser screenshots and DOM/network proof: pending.

## Known Gaps

Not live-proven yet. Production data apply, ACA deployment, runtime invariant, readback, and signed-in browser proof remain gated follow-up steps.
