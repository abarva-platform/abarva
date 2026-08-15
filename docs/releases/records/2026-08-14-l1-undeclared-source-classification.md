# 2026-08-14-l1-undeclared-source-classification — Layer 1 undeclared source classification

## Release ID

`2026-08-14-l1-undeclared-source-classification`

## Status

`candidate`

## Plain-English Summary

Adds a sanitized Layer 1 report that classifies active-input CSV files not declared by the universal
template manifest. The report proposes dispositions without amending `template-manifest.json` or
moving tenant data.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only classification of active-input CSVs; no source files or template
  contracts are changed.
- Layer 2 Source Adapters: unchanged; source-adapter extract candidates are identified for future
  contract decisions.
- Layer 3 Canonical Enterprise Model: unchanged; no canonical store, registry, graph dictionary,
  object registry, or data-plane write is activated.
- Layer 4 Products: unchanged; no projection or product read model is refreshed.

## Client Applicability

- All clients: the report scans registry-declared active-input packets.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-input-quality-depth.ts` recognizes the declared operational process evidence
  template filename during domain detection.
- `scripts/audit/build-l1-undeclared-source-classification.mjs` emits sanitized JSON and Markdown
  classification reports.
- `scripts/audit/__tests__/run-l1-undeclared-source-classification-tests.mjs` validates file
  classification and summary helpers.
- `package.json` adds `audit:l1-undeclared-source-classification`.
- `reports/l1-undeclared-source-classification/current-main/l1-undeclared-source-classification.json`
  records the current main classification.
- `reports/l1-undeclared-source-classification/current-main/l1-undeclared-source-classification.md`
  provides the compact human-readable status.

## QA / Validation

- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-l1-quality-fixed.b57XSe`
  - Output included: 7 tenants audited, 0 failures, 37 warnings, and 32 unmapped warnings after the
    declared-template detector fix.
- Pass: `npm run audit:l1-undeclared-source-classification -- --out-dir reports/l1-undeclared-source-classification/current-main --source-sha 8ef1e70ef69fd85e5e9e095831167fba1306de04`
  - Output included: 167 active-input CSVs and 36 undeclared active-input CSVs.

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

Revert the pull request to remove the report builder, package script, test, detector fix, and
sanitized current main artifact.

## Audit Evidence

- Source SHA: `8ef1e70ef69fd85e5e9e095831167fba1306de04`
- Generated report:
  `reports/l1-undeclared-source-classification/current-main/l1-undeclared-source-classification.json`
- Generated report:
  `reports/l1-undeclared-source-classification/current-main/l1-undeclared-source-classification.md`
- Quality-gate evidence: `/tmp/nexus-l1-quality-fixed.b57XSe`

## Known Gaps

This release does not amend `template-manifest.json`. It does not move, delete, or rewrite tenant
data. Contract amendments, source-data moves, data-plane loads, projection refreshes, registry
activation, graph materialization, and live-client truth claims remain closed.
