# 2026-09-22 Source ServiceNow Archetype Depth

## Release ID

`2026-09-22-source-servicenow-archetype-depth`

## Status

`candidate`

## Plain-English Summary

Deepens the public-safe synthetic ServiceNow sourcing-request fixture so each of the ten category-routed Source archetypes carries a coherent commercial range, time basis, incumbent or net-new context, quantified service volumes, source-system references, and typed evidence references. The dry-run now proves each request's exact domain, organization, function, category, buying motion, and archetype rather than accepting set-level coverage alone.

## Layer Impact

- Release lane: `public-demo`.
- Layer 1 client intake: expands only the synthetic native-shaped ServiceNow catalog export and field guidance.
- Layer 2 source adapter: preserves the new planning and lineage fields without validating them as client facts.
- Layer 3 canonical contract: carries the requester-stated range, time basis, incumbent context, service volumes, source-system references, and evidence references as pre-event request context.
- Layer 4 products: no route, UI, inbox, active event, supplier action, approval, award, or product data changes.

## Client Applicability

- All clients: none; no data is loaded.
- Specific clients: none.
- Internal only: synthetic fixture validation and engineering audit.
- Public/demo only: public-safe synthetic request pack.
- Feature flag: none.

## Changes Included

- Ten deeper synthetic ServiceNow request records across IT, enterprise, plan, and delivery.
- Explicit point/range/time-basis semantics and quantified service volumes.
- Typed source-system and evidence references with attachment lineage.
- Exact per-request domain/function/category/motion/archetype assertions.
- A dry-run mutation proving that loss of service-volume depth fails acceptance.

## QA / Validation

- Red-first: the exact-route test exposed the AMS request's incorrect renewal motion, and the depth test failed because the new fields were absent.
- Focused adapter and dataset tests validate value bounds, evidence-reference shape, source lineage, service-volume depth, and all ten expected routes.
- The read-only acceptance harness emits a deterministic matrix and fails when a request loses its service-volume depth.
- TypeScript, scoped ESLint, dataset-manifest validation, release check, and diff check are required before PR review.

## Rollout Plan

Open a review PR after all local checks pass. Do not merge or deploy in this audit lane. Do not load the fixture or run a data-build job.

## Deployment Authority

- Repo-owned deploy workflow: not requested.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this change affects repository-only synthetic fixtures and pure validation.

## Rollback Plan

Revert the PR. No database, migration, tenant-data, supplier, approval, or traffic rollback is required.

## Audit Evidence

- PR diff, focused Jest output, mutation result, TypeScript, scoped ESLint, manifest validation, release check, and generated dry-run matrix.

## Known Gaps

- The values and volumes remain synthetic requester statements; no load, parse, review, approval, canonical fact promotion, or Source event creation is implied.
- No request-inbox route or UI behavior is changed.
