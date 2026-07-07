# 2026-06-22-intelligence-tenant-alias-routing — Intelligence expert routing accepts canonical tenant aliases

## Release ID

`2026-06-22-intelligence-tenant-alias-routing`

## Status

`candidate`

## Plain-English Summary

Ava's Intelligence expert-routing bridge now resolves tenant industry from the same canonical tenant alias registry used by the rest of the app. This prevents paths that pass canonical tenant keys such as `skyharbor-air`, `first-capital`, or `meridian-health` from losing their industry fence before selecting contributing experts.

## Layer Impact

- `global-control-lane`: shared Intelligence answer attribution logic changes for all tenants.
- `client-data-lane`: no client data, schema, migration, or retrieval-store change.

## Client Applicability

- All clients: yes, any Intelligence route path that passes an app client key or canonical tenant key.
- Specific clients: Apex Retail Group, Meridian Health System, First Capital Financial, SkyHarbor Air, and Lakeshore Holdings are covered by the regression test.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; this is deterministic routing hygiene.

## Changes Included

- `src/lib/intelligence/answer/expert-grounding.ts`: resolves the app client key via `appClientKeyForTenant` before mapping to an ExpertPack industry.
- `src/lib/intelligence/answer/__tests__/router.test.ts`: covers app-key and canonical-key routing for the pilot tenant set.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/router.test.ts --runInBand` — passed.
- Deterministic all-tenant sanity run confirmed:
  - `first-capital` routes to `financial_services_banking`.
  - `skyharbor-air` routes to `airline`.
  - `meridian-health` routes to `healthcare_provider`.
  - `apex-retail` routes to `retail`.
  - `lakeshore-holdings` remains unfenced because the app config declares Lakeshore as `DIVERSIFIED` with no single ExpertPack industry mapping.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and shifts the new image. No manual data migration or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: captured by ACA deploy evidence after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: deploy workflow updates worker jobs to the same image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, post-deploy crawl plus signed-in Intelligence check for SkyHarbor/Apex before declaring browser-proven.

## Rollback Plan

Revert the PR or roll ACA traffic back to the previous known-good revision if runtime behavior regresses. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy run: pending.
- Post-deploy crawl: pending.

## Known Gaps

Lakeshore remains `DIVERSIFIED` and intentionally has no single vertical ExpertPack fence. A product decision is still needed if Lakeshore should map to manufacturing, supply chain, or another explicit vertical expert.
