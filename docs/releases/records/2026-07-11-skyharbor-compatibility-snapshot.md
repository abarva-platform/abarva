# 2026-07-11-skyharbor-compatibility-snapshot - SkyHarbor Compatibility Snapshot

## Release ID

`2026-07-11-skyharbor-compatibility-snapshot`

## Status

`candidate`

## Plain-English Summary

Adds a dry-run compatibility snapshot for the SkyHarbor existing-tenant upgrade candidate. The snapshot inventories the candidate source package, captures candidate evidence signals, preserves explicit non-claim guardrails, and marks every module as not ready until persistence, promotion, and module-consumption proof are completed.

## Layer Impact

- Release lane: `client-data-lane` for SkyHarbor dry-run compatibility reporting, plus `global-control-lane` for the reusable audit script shape.
- Tenant Packet: reads an existing candidate package as a compatibility input, without changing the Tenant Packet contract.
- Evidence Registry: captures evidence references and guardrails in a report-only artifact.
- Canonical Fact Store: no writes. The release only records which candidate signals would need later canonical handling.
- Active Tenant Access Layer: no update and no promotion.
- Module Context APIs: no runtime behavior change.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: SkyHarbor dry-run compatibility reporting only.
- Internal only: audit/report generation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/compatibility/skyharbor-compatibility-snapshot.ts`
- `scripts/audit/build-skyharbor-compatibility-snapshot.ts`
- `docs/architecture/skyharbor-compatibility-adapter.md`
- `reports/skyharbor-compatibility-snapshot/`
- `package.json` script `audit:skyharbor-compatibility-snapshot`

## QA / Validation

Validation status before PR merge:

- Pass: `npm run audit:tenant-packet-contract`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:skyharbor-compatibility-snapshot`
- Pass: isolated TypeScript compile for the compatibility snapshot files
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The ACA main deploy workflow may build and deploy the changed repository, but this release has no runtime behavior switch, no DB migration, no data write path, and no module route change.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared runtime deployment.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced only by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: required only if the merged SHA is deployed.
- Worker image invariant: required only if the merged SHA is deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is a report-only dry-run. Browser proof would not demonstrate new product behavior.

## Rollback Plan

Revert the PR. No production data cleanup is required because the snapshot does not write to the production DB or mutate tenant state.

## Audit Evidence

- PR URL after creation.
- Local validation command output.
- Generated report: `reports/skyharbor-compatibility-snapshot/skyharbor-compatibility-snapshot.json`
- Generated report: `reports/skyharbor-compatibility-snapshot/skyharbor-compatibility-snapshot.md`

## Known Gaps

- No production DB writes.
- No active tenant promotion.
- No module-consumption proof.
- No live answer-quality proof.
- No client-approved SkyHarbor production fact proof.
