# 2026-07-21-home-relationship-label-safety — Home Relationship Graph Label Safety

## Release ID

`2026-07-21-home-relationship-label-safety`

## Status

`candidate`

## Plain-English Summary

Home now filters non-business-readable relationship graph labels before they become visible CXO topology nodes. Live proof after the Summary graph fix showed the graph rendering correctly, but some labels came from placeholders or package identifiers such as `not_loaded`, `_to_confirm`, tenant upgrade pack ids, and raw `APP-####` style ids. Those are useful data-quality signals, but they should not be drawn as executive graph nodes.

## Layer Impact

- `global-control-lane`: Home Knowledge relationship graph rendering is safer and more client-readable.
- `client-data-lane`: no tenant data is mutated. Edges with incomplete labels remain in source data; the CXO graph only renders edges with business-readable names on both sides.

## Client Applicability

- All clients: yes, where Home derives relationship graphs from approved packs.
- Specific clients: Airline Demo, FS Demo, Lakeshore Holdings, Retail Demo, Healthcare Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/derive-relationship-edges.ts`: adds a business-readable label gate for derived relationship edges.
- `src/lib/home/__tests__/derive-relationship-edges.test.ts`: adds regression coverage for placeholder/package/id labels.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts --runInBand` — passed, 14 tests.
- `npx eslint src/lib/home/derive-relationship-edges.ts src/lib/home/__tests__/derive-relationship-edges.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- Post-deploy signed-in proof for Airline Demo, FS Demo, and Healthcare Demo — not-run before merge/deploy.

## Rollout Plan

Merge to `main`; deploy through the repo-owned ACA main deploy workflow. After deployment, rerun signed-in Home proof and verify the Relationships graph renders without placeholder/id-like topology node labels.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: workflow-managed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll ACA traffic back to the previous healthy revision. No data rollback is required.

## Audit Evidence

- Pre-fix screenshot: `proof/home-relationship-summary-topology-live-20260721/skyharbor-air/relationships.png` showed the graph visible but with placeholder/package/id labels.
- Post-fix PR: pending.
- Post-deploy proof: pending.

## Known Gaps

This does not rewrite incomplete source rows; it only prevents non-business labels from being drawn as CXO graph nodes. The underlying incomplete rows should still be handled by evidence-gap/source-inventory views.
