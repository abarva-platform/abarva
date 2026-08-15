# 2026-08-14-layer3-canonical-write-plan — Layer 3 canonical write plan

## Release ID

`2026-08-14-layer3-canonical-write-plan`

## Status

`candidate`

## Plain-English Summary

Adds a report-only Layer 3 canonical write plan so the current Layer 2 dry-run can be translated
into explicit canonical object and fact write readiness without activating the canonical store. The
report uses tenant aliases, omits source paths and source values, and records the hard gates that
remain closed.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no source files or template contracts are changed.
- Layer 2 Source Adapters: reads dry-run output only; no adapter transform output is written.
- Layer 3 Canonical Enterprise Model: adds a deterministic would-write plan for object and fact
  records; no canonical store, registry, graph dictionary, object registry, or data-plane write is
  activated.
- Layer 4 Products: unchanged; no projection or product read model is refreshed.

## Client Applicability

- All clients: the report can be generated from the all-tenant dry-run output.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/build-layer3-canonical-write-plan.mjs` creates sanitized JSON and Markdown reports
  from Layer 2 dry-run output and the Layer 3 registries.
- `scripts/audit/__tests__/run-layer3-canonical-write-plan-tests.mjs` validates the report-only
  contract, zero-write state, and tenant aliasing.
- `package.json` adds `audit:layer3-canonical-write-plan`.
- `reports/layer3-canonical-write-plan/current-main/layer3-canonical-write-plan.json` records the
  current main plan.
- `reports/layer3-canonical-write-plan/current-main/layer3-canonical-write-plan.md` provides the
  compact human-readable status.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-layer3-canonical-write-plan-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-layer3-plan.CwOJxC/layer-reconciliation --no-package`
  - Output included: 7 tenants, 56 layer rows, 109 claims, 56 closed gates.
- Pass: `npm run audit:layer3-canonical-write-plan -- --layer-dir /tmp/nexus-layer3-plan.CwOJxC/layer-reconciliation --out-dir reports/layer3-canonical-write-plan/current-main --source-sha 274489ef8608a153a672263894b20649f2e67b71`
  - Output included: 20,173 would-write object records, 4,173 would-evaluate fact values, and 0
    written.

## Rollout Plan

Merge through a pull request. The repo-owned ACA deploy may run, but this is report-only and does
not activate canonical writes, registries, graph materialization, data-plane loading, or product use.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session if the PR merges.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned ACA main deploy if it runs.
- ACA runtime invariant: required only for deploy proof.
- Worker image invariant: required only for deploy proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface behavior changes.

## Rollback Plan

Revert the pull request to remove the report builder, package script, test, and sanitized current
main artifact.

## Audit Evidence

- Source SHA: `274489ef8608a153a672263894b20649f2e67b71`
- Generated report: `reports/layer3-canonical-write-plan/current-main/layer3-canonical-write-plan.json`
- Generated report: `reports/layer3-canonical-write-plan/current-main/layer3-canonical-write-plan.md`
- Dry-run evidence: `/tmp/nexus-layer3-plan.CwOJxC/layer-reconciliation`

## Known Gaps

This release does not write canonical objects, activate registries, activate semantic aliases,
activate graph dictionary/object registry, load the data plane, materialize graph tables, refresh
Layer 4 projections, or make live-client truth claims.
