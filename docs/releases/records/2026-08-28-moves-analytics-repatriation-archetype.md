# 2026-08-28-moves-analytics-repatriation-archetype — Moves Analytics Repatriation Archetype

## Release ID

`2026-08-28-moves-analytics-repatriation-archetype`

## Status

`candidate`

## Plain-English Summary

Adds a distinct Moves archetype for managed analytics exit and analytics capability repatriation. The release also adds a governed vendor-platform intelligence registry scaffold so public vendor information can trigger discovery questions without becoming a client-specific fact.

## Layer Impact

Layer 3 canonical logic (`global-control-lane`): Adds archetype and vendor-intelligence contracts used by Moves to reason over evidence and gaps. No canonical data is written by this change.

Layer 4 product projection (`global-control-lane`): Updates Moves deliverable prompt resolution so generated artifacts receive the deterministic archetype and depth decision. No product read model is rebuilt by this change.

## Client Applicability

- All clients: Applies to Moves generation when a Move resolves to analytics capability repatriation.
- Specific clients: None.
- Internal only: Vendor-platform registry entries remain draft governed intelligence until steward review.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `ANALYTICS_CAPABILITY_REPATRIATION` to the Moves archetype registry.
- Adds analytics-repatriation adaptive-depth signals, applicability rules, and prompt guidance.
- Adds an archetype pack for capability inventory, parity, contract/exit, platform-readiness, operating-model, and investment-case evidence.
- Adds a vendor-platform intelligence registry scaffold, a draft public healthcare analytics vendor profile, and deterministic P2 workbook-tab planning from triggered evidence gaps.
- Passes the resolved archetype into phase deliverable generation before prompt construction.

## QA / Validation

- `npm test -- --runInBand src/lib/deliverables/__tests__/adaptive-depth.test.ts src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts src/lib/programs/vendor-platform-intelligence/__tests__/registry.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts` — passed, 71 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps deploy workflow may run because it has no path filters, but this change does not alter runtime infrastructure, data-plane state, tenant data, feature flags, or deployment configuration.

## Deployment Authority

- Repo-owned deploy workflow: Allowed if triggered by merge to `main`.
- Shared runtime mutators: None.
- Approved image digest: Determined by repo-owned deploy workflow if it runs.
- ACA runtime invariant: Required only if a deploy runs.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this internal Moves prompt/archetype slice.

## Rollback Plan

Revert the PR. No migration rollback, tenant-data change, registry activation, or projection rebuild is required.

## Audit Evidence

- Pull request URL and CI/deploy run, once created.
- Focused Jest and TypeScript validation listed above.

## Known Gaps

The vendor-platform registry is code-level governed scaffolding with a draft public profile. It is not yet FK-backed in the data plane, steward-approved, exposed in the UI, or wired to render a downloadable XLSX workbook.
