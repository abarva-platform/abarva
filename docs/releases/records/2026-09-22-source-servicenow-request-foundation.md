# 2026-09-22-source-servicenow-request-foundation — ServiceNow request intake foundation

## Release ID

`2026-09-22-source-servicenow-request-foundation`

## Status

`candidate`

## Plain-English Summary

Adds a synthetic ServiceNow-shaped sourcing-request pack and a deterministic adapter that preserves source lineage, keeps imported requests separate from active sourcing events, and proposes the existing Source category and archetype with explicit evidence gaps. The fixture covers every currently registered Source archetype, including a new deterministic ERP/SI category for the ERP implementation archetype that previously had only a coarse legacy fallback.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 1 client intake: adds a public-safe native-shaped synthetic ServiceNow export and field guide.
- Layer 2 source adapters: adds a pure, rerunnable ServiceNow sourcing-request adapter.
- Layer 3 canonical model contract: adds TypeScript contracts for a pre-event request, immutable source version, mapping proposal, human mapping decision, and later event link. No database schema is changed.
- Layer 4 Source: expands the existing category taxonomy so the authored ERP/SI archetype has a deterministic intake category, and adds an authenticated read-only request preview endpoint. No mounted UI changes are included.

## Client Applicability

- All clients: No runtime data is loaded.
- Specific clients: None.
- Internal only: Synthetic fixture and adapter foundation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Synthetic ServiceNow request CSV, field guide, and dataset manifest.
- Canonical pre-event request contract and pure adapter.
- Authenticated read-only preview route that strips the raw source row and makes all four non-authority states explicit.
- Deterministic category-to-archetype coverage for all registered Source archetypes.
- Focused adapter, dataset, taxonomy, classifier, resolver, and category-picker tests.
- Source CI ownership for the new intake suites and the regenerated coverage census.

## QA / Validation

- Red-first adapter tests failed before the adapter existed.
- Focused Jest coverage validates source lineage, pre-event state, idempotent source versions, missing-data behavior, all-domain coverage, and every registered Source archetype.
- The product-reachability audit passes because the adapter is exercised through the authenticated preview route rather than existing only behind tests.
- The Source integration workflow now runs the intake suites; the coverage census and dark-directory ratchet pass without raising their ceiling.
- TypeScript, scoped ESLint, release check, dataset-manifest validation, and diff check are required before merge.

## Rollout Plan

Squash-merge through the protected repository workflow. The repo-owned ACA main workflow may deploy the code, but this release does not load the fixture or apply a migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: The endpoint is runtime-visible but does not write data; authenticated endpoint smoke remains distinct from deploy proof.

## Rollback Plan

Revert the squash commit. No schema or tenant-data rollback is required.

## Audit Evidence

- Pull request, hosted CI, release check, focused Jest output, manifest validation, and repo-owned ACA runtime proof.

## Known Gaps

- The pre-event request is not persisted or mounted in Source New yet.
- No migration is authored or applied and no tenant data is loaded.
- Supplier suggestions and mapping acceptance remain later governed releases.
