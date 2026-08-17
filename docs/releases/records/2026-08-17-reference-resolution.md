# 2026-08-17-reference-resolution — Reference resolution from 41% to 77%

## Release ID

`2026-08-17-reference-resolution`

## Status

`candidate`

## Plain-English Summary

Reconciliation of the loaded data back to source showed every level tying exactly except one:
of 18,171 reference mentions the clients supplied, only 7,433 resolved — **40.9%**. The estate's
inventory was complete; most of the connections between its parts were being dropped.

The cause was not data quality. Two mechanical gaps:

1. **The intake vocabulary was not mapped to canonical type names.** Clients name types in business
   language — `system`, `function`, `org_unit`, `program`, `tower_initiative` — while the model names
   them `application_system`, `business_function`, `org_owner`, `program_initiative`. An edge pointing
   at a type name the model does not have can never resolve however well its target is catalogued.
   **5,620 of the 10,738 failures were exactly this: the entity existed, under a different type name.**

2. **Declared source-system ids were not indexed.** Intake carries `system_id` values like `APP-0003`,
   and the integrations tab references applications by that id rather than by name. Resolution rule 4
   allows this and the lookup did not implement it.

Result: **40.9% → 77.0%**, 6,567 additional references resolved.

## Layer Impact

**Release lane: `client-data-lane`.** Layer 3 resolution only.

- **Layer 1–2:** unchanged.
- **Layer 3:** more relationship candidates resolve to canonical ids. **Canonical record count is
  unchanged at 5,553** — this adds edges, it does not add or merge entities.
- **Layer 4:** unchanged. The landscape projection carries counts and names, not edges, so no
  re-projection is required for this change to be correct.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts`
  - `lookupObjectTypes` — intake vocabulary mapped onto canonical types.
  - `buildEntityLookup` — declared source-system id attributes indexed alongside display names.

## QA / Validation

- Pass: resolution **40.9% → 77.0%** (7,433 → 14,000 of 18,171). Per tenant: 49.8% → 76.7%, and
  33.7% → 77.3%.
- Pass: canonical records **5,553 before and after** — no entity was created, merged, or lost.
- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run validate:fact-basis`.
- Pass: `npm run release:check`.

**Why the alias map cannot cause a wrong resolution.** `resolveEntityReference` walks the alias list
and returns on the first match, and the declared type is always first in that list. An alias can only
resolve a reference that would otherwise have failed; it cannot redirect one that already resolved.

**Why only declared id attributes are indexed.** Indexing any value that merely looks like an id
would let a name resembling a key silently become one. Only attributes whose key ends in `Id` are
indexed.

## Rollout Plan

Merge and deploy. Re-run the canonical build to materialise the additional edges.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow. The rebuild runs as an ACA Job.

## Rollback Plan

Revert. Resolution returns to 40.9%; no data is destroyed, because unresolved candidates are recorded
as gaps rather than dropped.

## Audit Evidence

- The commit and its PR.
- Before and after resolution rates, per tenant, from the canonical build report.
- The classification of all 10,738 original failures by cause.

## Known Gaps

**4,171 references still unresolved (23%), in two classes, both understood:**

- **1,096 — owner references.** `person_or_role:CMO`, `person_or_role:SVP Flight Operations`. These
  match values in owner attributes (`executiveOwner`, `businessOwner`, `technologyOwner`) but owners
  are never promoted to entities, so there is nothing to point at.
- **3,024 — attribute values referenced as entities.** `data_domain:clinical`,
  `infrastructure_platform:Epic Caboodle`, `infrastructure_platform:SQL Server (on-prem)`. Same
  shape: the client names these in attribute columns, and the model never catalogues them.

Both are the same fix — **promote declared attribute values to first-class entities**, which is
"catalogue from evidence" in the architecture's own language. It changes the canonical record count
and therefore every downstream number, so it is deliberately a separate release from this one.

A portion of the residual will not resolve by any means and should not: values like
`infrastructure_platform:Direct point-to-point` and `infrastructure_platform:Vendor SaaS` are
deployment descriptors, not entities. Those should be reclassified as attributes rather than raised
as reference mentions at all — which removes them from the denominator honestly, instead of
inventing entities to satisfy them.

**Reference resolution rate is not yet a build gate.** It should be: this defect survived because
nothing failed when the rate was 41%. Until a gate exists, the number has to be read by a human on
every build.
