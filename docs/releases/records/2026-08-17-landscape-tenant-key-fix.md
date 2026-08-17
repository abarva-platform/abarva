# 2026-08-17-landscape-tenant-key-fix — Resolve the landscape by canonical tenant key

## Release ID

`2026-08-17-landscape-tenant-key-fix`

## Status

`candidate`

## Plain-English Summary

The landscape projection is keyed by canonical tenant key — `skyharbor-air`, `meridian-health`. Home
and Intelligence looked it up with the app client key — `skyharbor` — so the query matched nothing
and both surfaces rendered "not available" over data that was present and readable.

The failure is silent by design. A missing pack is a legitimate state, so an empty panel looks like
an un-run projector rather than a wrong key. That is the cost of a graceful degradation path: it
degrades just as gracefully when the reason is a bug.

Two separate causes, both fixed here:

- **Home** passed `clientKey` straight through with no mapping at all.
- **Intelligence** used `enterpriseContextTenantKey`, which maps some app keys to canonical ones and
  passes the rest through unchanged. `meridian` became `meridian-health`; `skyharbor` stayed
  `skyharbor`. A partial map is worse than no map, because the cases it does handle make it look
  correct.

Both now resolve through `canonicalTenantKey`.

Also: Home's SkyHarbor branch renders a separate hardcoded model and never included the landscape
panel, so even with the right key that tenant would have seen nothing. The panel now renders above
it on both branches.

## Layer Impact

**Release lane: `client-data-lane`.** Read-path only. No schema change, no write.

- **Layer 1–3:** unchanged.
- **Layer 4:** unchanged — the data was always correct.
- **Runtime:** Home and Intelligence now look up the landscape under the key it was written with.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `src/app/(maestro)/home/page.tsx` — resolve via `canonicalTenantKey`; render the landscape panel
  on the SkyHarbor branch as well.
- `src/app/(maestro)/intelligence/page.tsx` — resolve via `canonicalTenantKey`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` on both files — 0 errors.
- Pass: `npm run release:check`.
- The data being looked up is already proven present: ACA execution
  `job-abarva-private-operator-eus-2iamimr` ran the product's own query and returned 26 dimensions
  per tenant, 5,553 records, 50 of 52 dimensions carrying named samples, zero failures.

## Rollout Plan

Merge, deploy, then confirm on the signed-in surface for both tenants.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow. No job, no data write, no traffic mutation
from this branch.

## Rollback Plan

Revert. The panel returns to rendering "not available", which is where it was.

## Audit Evidence

- The commit and its PR.
- The readback job report showing the data was present throughout.

## Known Gaps

- **The readback verifier did not catch this**, and could not have: it queries by canonical key
  directly, which is the key the projector writes. It proves the data is readable; it does not prove
  the page asks for it correctly. A surface-level check — render the page, assert the panel is
  populated — is a different test and is owed.
- **`enterpriseContextTenantKey` still exists** in the Intelligence page and still maps two sunset
  tenant keys. It is no longer on the landscape path. Removing it is tranche-3 sunset work.
- Signed-in surface proof for both tenants is still owed after this deploys.
