# 2026-07-10-skyharbor-v7-upgrade-proof — SkyHarbor V7 Existing-Tenant Upgrade Proof

## Release ID

`2026-07-10-skyharbor-v7-upgrade-proof`

## Status

`candidate`

## Plain-English Summary

This release prepares the SkyHarbor Air existing-tenant upgrade proof. It adds a rich synthetic V6/V7 candidate pack for SkyHarbor, generalizes the tenant pack builder so generated packs are not Meridian-specific, and adds proof tooling to snapshot the current SkyHarbor state, load the candidate without promoting it, promote only after proof, and run signed-in Home/Intelligence validation.

## Layer Impact

- `global-control-lane`: The shared V7 loader gains a candidate-only mode that records contract, readiness, quality, and validation events without changing the active tenant contract pointer.
- `client-data-lane`: Adds the SkyHarbor Air V6/V7 upgrade candidate dataset, governance manifest, and generated Azure load payload.
- `internal-admin`: Adds ACA operator proof scripts and live signed-in proof scripts used by AbarVa operators.

## Client Applicability

- All clients: V7 loader candidate-only behavior is available generically.
- Specific clients: SkyHarbor Air receives the candidate dataset and proof path.
- Internal only: ACA job proof scripts and live proof harness.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/lib/v6-v7/tenant-pack-builder.mjs`: generalized tenant prefixes, evidence refs, sponsors, audiences, industry patterns, metrics, and tenant-specific file stems.
- `scripts/lib/v6-v7/tenant-pack-validator.mjs`: relaxed duplicate scoring for high-overlap real tenant vocabulary and made synthetic-boundary validation tenant-general.
- `scripts/tenant-v6/configs/skyharbor-air.mjs`: added SkyHarbor Air V6/V7 upgrade candidate config.
- `datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/`: generated V6, V7, derived findings, golden questions, manifest, README, and Azure load payload.
- `scripts/v7/derive-tenant-v7-insights.mjs`: registered SkyHarbor tenant config.
- `scripts/v7/load-tenant-v7-azure.mjs`: added candidate-only load mode and active promotion cleanup.
- `scripts/qa/skyharbor-v7-upgrade-proof-job.mjs`: added private ACA DB snapshot, candidate load, and promotion proof job.
- `scripts/qa/skyharbor-v7-upgrade-live-proof.mjs`: added signed-in SkyHarbor Home/Intelligence proof harness.
- `docs/governance/dataset-manifests/skyharbor-air-v6-v7-upgrade-candidate-20260710.json`: added governance manifest.
- `package.json`: added SkyHarbor generation, load, proof, and live proof scripts.

## QA / Validation

- Pass: `node --check scripts/qa/skyharbor-v7-upgrade-proof-job.mjs && node --check scripts/qa/skyharbor-v7-upgrade-live-proof.mjs && node --check scripts/v7/load-tenant-v7-azure.mjs`
- Pass: `./node_modules/.bin/eslint scripts/lib/v6-v7/tenant-pack-builder.mjs scripts/lib/v6-v7/tenant-pack-validator.mjs scripts/v7/derive-tenant-v7-insights.mjs scripts/v7/load-tenant-v7-azure.mjs scripts/tenant-v6/configs/skyharbor-air.mjs scripts/qa/skyharbor-v7-upgrade-proof-job.mjs scripts/qa/skyharbor-v7-upgrade-live-proof.mjs`
- Pass: `npm run v7:skyharbor:derive`
- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules ./node_modules/.bin/tsx src/scripts/governance/validate-context-corpus.ts manifests`
- Pass: Generated-data scan found no Meridian, Lakeshore, Healthcare, clinical, PHI, HEDIS, STAR, Epic, medallion, or CDAO residue in `datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710`.
- Not run yet: ACA private snapshot, candidate load, promotion, and live signed-in proof; those run after merge/deploy from the deployed digest-pinned image.

## Rollout Plan

Merge to `main` by PR, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned web image, then run the SkyHarbor private ACA proof jobs from that image. First run snapshot, then candidate-load, then inspect proof. Promote only if the candidate proof passes. After promotion, run the signed-in SkyHarbor live proof and the existing Meridian/Lakeshore V7 tenant foundation regression proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Do not mutate shared runtime locally; use the repo-owned ACA main deploy workflow for web image deployment and the approved private operator ACA job for data proof/load jobs.
- Approved image digest: Filled after the main deploy workflow publishes the digest.
- ACA runtime invariant: Required after deploy and before claiming live proof.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for SkyHarbor Home/Intelligence after any promotion, plus Meridian/Lakeshore V7 foundation regression.

## Rollback Plan

If candidate load fails, leave `active_contract_version` unchanged and report the proof defect. If promotion fails live proof, rerun the loader with the previous `rollback_contract_version` or restore the active pointer using the V7 active contract table through an approved ACA operator job, then re-run signed-in proof.

## Audit Evidence

- PR URL after open.
- `npm run v7:skyharbor:derive` output and generated summary at `out/skyharbor-air-v6-v7-upgrade-candidate-20260710-v7-derivation-summary.json`.
- ACA snapshot/candidate-load/promotion proof bundles emitted by `scripts/qa/skyharbor-v7-upgrade-proof-job.mjs`.
- Signed-in proof bundle emitted by `scripts/qa/skyharbor-v7-upgrade-live-proof.mjs`.
- V7 tenant foundation regression proof emitted by `scripts/qa/v7-tenant-foundation-live-proof.mjs`.

## Known Gaps

This release does not itself promote SkyHarbor. It does not prove Moves, Source, Tower write-back, or a full multi-tenant migration. The SkyHarbor candidate pack is synthetic planning-grade data and must not be described as real airline production data, audited savings, realized ROI, or production-ready IROPS automation.
