# 2026-08-14-semantic-quality-tenant-count — Semantic Quality Test Tenant Count

## Release ID

`2026-08-14-semantic-quality-tenant-count`

## Status

`candidate`

## Plain-English Summary

The tenant input semantic quality regression harness now derives the expected active-tenant count
from the registry it audits instead of hard-coding an older count. This keeps the test aligned with
the current registry shape while preserving the same semantic quality assertions.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: audit test only; no intake files are changed.
- Layer 2 Source Adapters: unchanged.
- Layer 3 Canonical Enterprise Model: unchanged.
- Layer 4 Products: unchanged.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/__tests__/run-tenant-input-semantic-quality-tests.mjs` now expects
  `registry.activeTenants.length` for the full-audit regression count.
- This release record documents that no registry, tenant-data, product, runtime, or deployment
  behavior is changed by the test repair.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-tenant-input-semantic-quality-tests.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a pull request. This is test-only and has no data-plane, registry, or product runtime
effect.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session merge/deploy approval for merged code.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned ACA main deploy if merged.
- ACA runtime invariant: required after repo-owned deploy if merged.
- Worker image invariant: required after repo-owned deploy if merged.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the pull request to restore the prior hard-coded assertion.

## Audit Evidence

- Focused semantic quality regression harness output.
- `npm run release:check` output.

## Known Gaps

This does not change semantic quality rules or tenant registry membership.
