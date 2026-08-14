# 2026-08-13-phantom-graph-detection — Report edges that have no endpoints

## Release ID

`2026-08-13-phantom-graph-detection`

## Status

`candidate`

## Plain-English Summary

One tenant appears to have a 519-edge relationship graph. It has none.

Every row in its relationships file carries full provenance — source file, original row id,
fingerprint, consolidation rule, conflict status — and no relationship. `from_object_name` and
`to_object_name` are empty in all 519 rows. Nine rows carry object *types* but no names, and those nine
are schema illustrations rather than instances: `holding_company owns portfolio_company`,
`application_system supports business_function`. Patterns, not data.

Tracing it goes nowhere: `original_source_file` points at the file itself and every row is marked
`retained_from_active_source`. There is no upstream copy to recover, because the file has always been
what it is — a schema illustration that was provenance-stamped and thereafter counted as a graph.

Any inventory, coverage report or row count reads this tenant as having 519 edges. This makes the
distinction visible: the validator now reports how many edges have no endpoints, and fails a tenant
whose graph is entirely phantom.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 validation only. **No tenant data was modified** — there is
nothing to repair, only something to stop miscounting.

## Client Applicability

All clients: no. Internal audit tooling. Feature flag: none.

## Changes Included

- `scripts/audit/validate-tenant-ontology.mjs` — counts edges with no endpoints, reports usable edges
  separately, and marks a wholly-phantom graph as a failure.

## QA / Validation

| Tenant | Edges | Usable |
| --- | ---: | ---: |
| skyharbor-air | 3,318 | 3,318 |
| healthcare-demo-new | 2,302 | 2,302 |
| apex-retail | 1,713 | 1,713 |
| meridian-health | 1,037 | 1,037 |
| first-capital-financial | 380 | 380 |
| lakeshore-holdings | 364 | 364 |
| **lakeshore-industries** | **519** | **0** |

Only one tenant is affected, and it is affected completely. `npm run release:check` passed.

## Rollout Plan

Merge to `main`. No runtime rollout. The validator is still outside CI.

## Deployment Authority

Repo-owned deploy workflow unchanged. No runtime, image, flag or env change. Live signed-in proof
required: no.

## Rollback Plan

Revert the squash commit. The validator returns to reporting `0 endpoints / n/a integrity`, which reads
like a tooling gap rather than a missing graph.

## Audit Evidence

- `reports/tenant-ontology/ontology-validation.json` — `emptyEndpointEdges` and `usableEdges` per
  tenant.

## Known Gaps

- **This detects the problem; it does not fix it.** That tenant still has no graph, and no amount of
  tooling creates one. Building it requires source evidence that is not in the repository.
- The check fails only when a graph is *entirely* phantom. A file that is half real and half empty
  passes, which is arguably the more dangerous case because it looks partially healthy. A proportional
  threshold was considered and rejected as arbitrary; reporting the count without failing is the
  honest interim.
- I spent effort on two hypotheses before finding this: that the tenant used a different identifier
  convention, and that its endpoints needed resolving through the identity ledger. Both were wrong.
  The endpoints are not encoded differently, they are absent.
- Nothing prevents a schema illustration being consolidated as data again. The consolidation step that
  produced this file preserved the audit trail and dropped the payload, and that step is not covered by
  any check added here.

## Follow-ups

1. Decide what that tenant's graph should be, or mark it explicitly as having none so downstream
   coverage reporting stops counting phantom edges.
2. Review the consolidation step that produced a provenance-only file — the same rule
   (`retained_from_active_source`) is used across other tenants.
