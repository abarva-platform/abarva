# 2026-08-17-source-lineage-active-tenant-scope — Source Lineage Tenant Scope

## Release ID

`2026-08-17-source-lineage-active-tenant-scope`

## Status

`candidate`

## Plain-English Summary

Updates the Source substrate lineage report scope so the default quote-mode proof follows the active tenant key declared by the tenant input registry and reads current build-scoped Source/L4 views. This keeps Source metric lineage aligned with the governed layer refresh identity contract instead of mixing current read models with legacy canaries.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1: No tenant source files change.
- Layer 2: No adapter behavior changes.
- Layer 3: No canonical objects or relationships change.
- Layer 4: Source metric proof scope changes; product read models and cube rows are not rewritten by this record.

## Client Applicability

- All clients: No.
- Specific clients: Active Source lineage proof for the current scoped demo tenants.
- Internal only: Yes, this is an operator proof/reporting scope correction.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `datasets/source/source-substrate-lineage-scope.json` now defaults to the active registry tenant key while preserving existing aliases for historical readback compatibility.
- `scripts/source/source-substrate-lineage-report.mjs` now includes current Source consumption cube views and lets quote mode select the current Source/L4 sources explicitly.

## QA / Validation

- `node - <<'NODE' ... NODE` active-registry alignment check: passed. The Source lineage default tenant keys match `tenant-input-registry.json` active tenants, and the historical runtime key is not a default tenant.
- `node scripts/source/source-substrate-lineage-report.mjs --help`: passed.
- `npm run release:check`: passed.
- `git diff --check`: passed.

## Rollout Plan

Merge to `main`. The repo-owned deploy workflow may rebuild the web image because main deploy has no path filters, but this change does not alter runtime application code, database schema, tenant source files, or cube rows.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for this session.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned main deploy workflow if triggered.
- ACA runtime invariant: Required only if a deploy is triggered.
- Worker image invariant: Required only if a deploy is triggered.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal proof/reporting scope correction.

## Rollback Plan

Revert this release record and the lineage scope JSON change.

## Audit Evidence

- PR: pending.
- Validation: local commands listed above.

## Known Gaps

This does not rebuild Source L4 cubes, canonical graph tables, retrieval indexes, or product runtime surfaces. Legacy canary comparison remains available in code, but it is no longer part of default quote mode.
