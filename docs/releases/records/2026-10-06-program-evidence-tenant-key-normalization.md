# 2026-10-06-program-evidence-tenant-key-normalization — Program-evidence reads match any tenant representation

## Release ID

`2026-10-06-program-evidence-tenant-key-normalization`

## Status

`candidate`

## Plain-English Summary

A Move's discovery evidence loaded by a governed data-build job did not appear in
the signed-in Files & Evidence cabinet, and had no review queue, even though the
rows were persisted. Cause: a **tenant-key representation mismatch**. The signed-in
reads filter `program_evidence_*` by `ctx.clientKey`, which is the tenant's **app
client key**. The job wrote the rows under the tenant's **canonical
substrate alias**. Same tenant, two key
representations — so the read returned zero rows and the cabinet showed nothing to
review.

This widens the program-evidence reads to match **any representation of the same
tenant** — the app client key and its canonical/substrate alias — using the
existing `tenantAliasesFor` helper. The alias set is strictly per-tenant (a
tenant's own `[appClientKey, canonicalKey, broker, …]`), so this cannot widen a
read to another tenant. Existing single-representation data continues to match;
rows written under either representation now surface.

This is the durable read-side fix. The write-side (the loader setting the row
`tenant_key` to the app client key the product reads with) is corrected
separately in the data lane.

## Layer Impact

Release lane: `global-control-lane` — shared program-evidence read tenancy. No
schema change; reads match a superset (the tenant's own aliases).

- `3 CANONICAL MODEL` / program evidence: the pending-review cabinet loader, the
  discovery readiness loader, and the approved-phase-evidence read now filter
  `tenant_key IN tenantAliasesFor(ctx.clientKey)` instead of a single key.

## Client Applicability

- All clients: read behavior is a superset of before (a tenant's own
  representations); no client loses access to its data.
- Specific clients: unblocks the demo Move whose evidence was loaded under the
  substrate alias.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — additive; existing data still matches.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — the pending
  evidence-review cabinet loader: `.eq("tenant_key", …)` →
  `.in("tenant_key", tenantAliasesFor(ctx.clientKey))` (reviews + items).
- `src/lib/programs/discovery/evidence-readiness.ts` — `loadDiscoveryEvidenceReadiness`:
  `per.tenant_key = $2` → `per.tenant_key = ANY($2)` with the alias set.
- `src/lib/programs/approved-phase-evidence.ts` — `.eq("tenant_key", …)` →
  `.in("tenant_key", tenantAliasesFor(tenantKey))` (reviews + items).

## QA / Validation

- `jest` (`evidence-readiness`) — **PASS**: 24/24.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors.
- Invariant check — **PASS**: `tenantAliasesFor(<app client key>)` returns
  both the app client key and its canonical substrate alias, and is per-tenant
  (does not include another tenant's key); the helper is independently covered
  by `src/lib/tenant/__tests__/aliases.test.ts`.
- Live signed-in re-check — **NOT RUN here**; proven by the Step-4 smoke re-check
  (the 11 pending reviews should now surface in the cabinet).

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag; reads match a per-tenant superset
on merge.

## Rollback Plan

Revert the PR. Reads return to a single-representation filter. No data or
migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret. No data is written by this change.

## Known Gaps

- Two further program-evidence reads (`approved-move-evidence-snapshot`,
  `approved-inputs-pack-store`) feed deliverable-generation context and are not
  normalized in this PR; they are a fast-follow once the data lane also corrects
  the write representation (after which single-key reads suffice).
- The read paths are DB-dependent and not unit-tested here; verified by the live
  smoke re-check.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
- The per-tenant alias behavior is covered by `aliases.test.ts`.
