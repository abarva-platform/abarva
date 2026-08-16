# 2026-08-16-integrated-layer-refresh-inventory — Integrated layer refresh inventory

## Release ID

`2026-08-16-integrated-layer-refresh-inventory`

## Status

`candidate`

## Plain-English Summary

Adds a report-only audit that composes registry-declared intake, adapter dry-run evidence,
canonical/graph dry-run evidence, and Source Cube projection evidence into one integrated layer
refresh inventory. The report makes clear which datasets are refreshed, which are only audited, and
which product datasets still need a shared build manifest and readback proof.

## Layer Impact

- `internal-admin` lane: adds an operator-only audit/reporting tool. It does not change tenant
  data, runtime behavior, schema, routing, feature flags, or product presentation.
- Layer 1 Client Intake: reads the tenant input registry and template manifest to inventory active
  files, row counts, and undeclared source-family candidates.
- Layer 2 Source Adapters: reads the existing adapter dry-run summary when supplied and reports
  whether mapping failures remain.
- Layer 3 Canonical Model: reads canonical and graph dry-run artifacts when supplied; it does not
  write canonical records or graph tables.
- Layer 4 Products: inventories product dataset coverage beyond Source and highlights which cube,
  metric, hierarchy, and drill paths still need integrated readback.

## Client Applicability

- All clients: No.
- Specific clients: No.
- Internal only: Yes. This is an operator audit/reporting tool.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/audit/build-integrated-layer-refresh-inventory.mjs`
- `package.json` script alias `audit:integrated-layer-refresh-inventory`
- This release record.

## QA / Validation

- Pass: `npm run audit:integrated-layer-refresh-inventory -- --out-dir /tmp/nexus-integrated-layer-refresh-current.rG6HnB/integrated-inventory --layer-dir /tmp/nexus-integrated-layer-refresh-current.rG6HnB/layer --quality-dir /tmp/nexus-integrated-layer-refresh-current.rG6HnB/canonical-inputs --runtime-dir /tmp/nexus-integrated-layer-refresh-current.rG6HnB/runtime-dry-run --source-cube-dir /tmp/nexus-integrated-layer-refresh-current.rG6HnB/source-cube-dry-run --include-tenant-names true`
- Pass: `npx eslint scripts/audit/build-integrated-layer-refresh-inventory.mjs`
- Blocked before this record update: `npm run release:check` required explicit lane wording and
  pass/fail validation statuses.
- Pass after record update: `npm run release:check`

## Rollout Plan

Merge to main. No runtime rollout is required for the audit tool itself. If the repository-owned
main deploy workflow runs because of the merge, it is a rebuild of application code with no data
mutation from this release.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session-level approval for repo-owned merges/deploys.
- Shared runtime mutators: none.
- Approved image digest: not applicable until any automatic deploy completes.
- ACA runtime invariant: required only if an automatic deploy runs.
- Worker image invariant: required only if an automatic deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is an operator audit tool and does not change a
  product surface.

## Rollback Plan

Revert the PR to remove the report-only audit script and package alias. No database, registry,
tenant data, graph, projection, runtime, or retrieval rollback is required.

## Audit Evidence

- Command output from `npm run audit:integrated-layer-refresh-inventory -- --out-dir <tmp> ...`
- Command output from `npx eslint scripts/audit/build-integrated-layer-refresh-inventory.mjs`
- Command output from `npm run release:check`

## Known Gaps

This release does not implement the integrated data refresh runner. It only makes the current
fragmentation visible in one operator artifact so the next implementation slice can be gated by the
same layer-by-layer contract.
