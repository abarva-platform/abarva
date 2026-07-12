# 2026-07-12-skyharbor-candidate-version — PR10 SkyHarbor Candidate Version

## Release ID

`2026-07-12-skyharbor-candidate-version`

## Status

`candidate`

## Plain-English Summary

This release adds the first tenant-parameterized candidate-version generator.
SkyHarbor is the first tenant to run end to end through the existing enterprise
data runway: compatibility snapshot, Tenant Packet projection, source adapter
dry-run, canonical ingestion records, target-writer plan, graph/derived/module
readiness proof, inactive candidate metadata, and promotion-gate evaluation.

The release also inventories other tenants and reports their readiness blockers
in an all-tenant eligibility matrix. It does not promote any candidate or change
the runtime truth modules currently read.

## Layer Impact

- Release lanes: `global-control-lane`, `client-data-lane`.
- Tenant Packet: adds a generated SkyHarbor packet projection using existing
  mapping profiles.
- Source Adapter runtime: reuses the dry-run CSV adapter and writes proof
  metadata only.
- Canonical Fact Store: plans candidate writes only; no physical tables are
  written.
- Enterprise Relationship Graph: reports the graph plan stage from the proof
  harness; no graph is materialized.
- Derived Intelligence Store: reports derived plan readiness only; no active
  derived store is updated.
- Active Tenant Access Layer: unchanged.
- Module Context APIs: unchanged; modules do not read candidate data by default.

## Client Applicability

- All clients: receive the tenant-parameterized generator contract and
  all-tenant eligibility matrix shape.
- Specific clients: SkyHarbor receives an inactive candidate-version proof.
- Internal only: audit/report commands and proof outputs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/candidate-generation/tenant-candidate-version-generator.ts`
- `scripts/audit/build-tenant-candidate-version.ts`
- `npm run audit:tenant-candidate-version`
- `npm run audit:skyharbor-candidate-version`
- `docs/architecture/tenant-candidate-version-generator.md`
- SkyHarbor candidate proof reports under `reports/tenant-candidate-generation/`,
  `reports/candidate-tenant-data-versions/skyharbor/`, and
  `reports/candidate-promotion-gates/skyharbor/`

## QA / Validation

- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:tenant-candidate-version -- --tenant all`
- Pass: `npm run audit:tenant-packet-contract`
- Pass: `npm run audit:candidate-promotion-gate`
- Pass: `npm run audit:candidate-tenant-version`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:stranded-intelligence-report`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `npx tsc --noEmit --pretty false --skipLibCheck --ignoreConfig --moduleResolution bundler --module esnext --target es2022 --types node src/lib/enterprise-data/candidate-generation/tenant-candidate-version-generator.ts scripts/audit/build-tenant-candidate-version.ts`
- Pass: `git diff --check`

## Rollout Plan

Merge through a pull request to `main`. The change is audit/report tooling and
architecture documentation. If the PR is deployed through Azure Container Apps,
the repo-owned ACA main deploy workflow remains the only approved deployment
path.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared runtime deployment after
  merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: required only if deployed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: required after deploy because the user requested
  post-deploy proof, but no module runtime behavior is intentionally changed.

## Rollback Plan

Revert the PR. Because no production tenant data is written, no active pointer is
updated, and no module runtime consumption changes, rollback is a code/report
rollback only.

## Audit Evidence

- `reports/tenant-candidate-generation/skyharbor/skyharbor-candidate-summary.json`
- `reports/tenant-candidate-generation/all-tenant-eligibility-matrix.json`
- `reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json`
- `reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json`
- PR validation logs
- Post-merge ACA deploy and crawl evidence, if deployed

## Known Gaps

- Other tenants are inventoried only; they do not get full candidate generation
  in PR10.
- Promotion remains disabled and requires a future operator-approved path.
- Candidate preview consumption by Home, Intelligence, Moves, Source, and Tower
  remains future work.
