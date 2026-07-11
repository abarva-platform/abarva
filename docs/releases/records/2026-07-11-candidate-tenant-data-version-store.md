# 2026-07-11-candidate-tenant-data-version-store - Candidate Tenant Data Version Store

## Release ID

`2026-07-11-candidate-tenant-data-version-store`

## Status

`candidate`

## Plain-English Summary

Adds the first non-destructive candidate tenant data version store. The new audit path persists candidate proof metadata from the existing dry-run runway, including packet lineage, adapter and mapping versions, proof bundle links, planned write footprint, promotion blockers, and rollback policy. It does not write production DB rows, does not mutate tenant data, does not promote a candidate, and does not change module runtime behavior.

## Layer Impact

- Release lane: `global-control-lane` for the reusable candidate-version audit contract, with report-only `client-data-lane` evidence from the minimal fixture.
- Tenant Packet: consumed as lineage input only.
- Evidence Registry: planned write footprint only; no physical writes.
- Canonical Fact Store: planned write footprint only; no physical writes.
- Enterprise Relationship Graph: planned graph stage only; no materialization.
- Derived Intelligence Store: planned derived stage only; no materialization.
- Active Tenant Access Layer: explicitly unchanged.
- Module Context APIs: explicitly unchanged; modules do not read candidate data by default.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none; the committed proof uses the minimal fixture.
- Internal only: audit/report generation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/candidate-version-store/candidate-tenant-data-version-store.ts`
- `scripts/audit/build-candidate-tenant-data-version.ts`
- `scripts/audit/validate-tenant-packet-contract.mjs`
- `docs/architecture/candidate-tenant-data-version-store.md`
- `reports/candidate-tenant-data-versions/minimal/`
- `package.json` script `audit:candidate-tenant-version`

## QA / Validation

Validation status before PR merge:

- Pass: `npm run audit:tenant-packet-contract`
- Pass: `npm run audit:tenant-packet-dry-run`
- Pass: `npm run audit:target-writer-dry-run`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:candidate-tenant-version`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for the candidate-version store files
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The ACA main deploy workflow may build and deploy the changed repository, but this release has no runtime behavior switch, no DB migration, no data write path, no active tenant promotion, and no module route change.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared runtime deployment.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced only by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: required only if the merged SHA is deployed.
- Worker image invariant: required only if the merged SHA is deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: no for product behavior, because this is a report-only candidate proof path. A post-deploy crawl may still be run to prove no runtime regression.

## Rollback Plan

Revert the PR. No production data cleanup is required because the candidate-version store writes only repository proof artifacts and does not write to the production DB or active tenant access layer.

## Audit Evidence

- PR URL after creation.
- Local validation command output.
- Generated candidate proof record: `reports/candidate-tenant-data-versions/minimal/`

## Known Gaps

- No production DB writes.
- No active tenant promotion.
- No candidate preview mode.
- No module runtime consumption of candidate data.
- No live answer-quality proof from candidate data.
