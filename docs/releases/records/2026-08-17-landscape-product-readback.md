# 2026-08-17-landscape-product-readback — Product readback for the landscape projection

## Release ID

`2026-08-17-landscape-product-readback`

## Status

`candidate`

## Plain-English Summary

The projector already asserts, inside its own transaction, that it wrote what it claims. That proves
the write. It does not prove the product can read it, and those are different claims.

The projector counts by build version and generator. Home selects the newest pack for a tenant by
`artifact_type` and orders dimensions by `sort_order`. A pack written correctly under the wrong
artifact type, or dimensions written without a usable sort order, satisfies the projector's readback
and still renders an empty surface.

This adds a read-only verifier that runs the product's query — not a variant of it — and fails when a
populated dimension carries no named samples, which is the failure a count-only check cannot see.

## Layer Impact

**Release lane: `internal-admin`.** Read-only. No schema change, no write, no runtime path.

## Client Applicability

- Specific clients: the two active tenants (default scope; `--tenant` overrides)
- Feature flag: none

## Changes Included

- `scripts/data-build/verify-home-landscape.ts`
- `package.json` — `data-build:home-landscape:verify`

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- The write run this verifies: ACA execution `job-abarva-private-operator-eus-53a8toq`, **2 packs, 52
  dimension rows written, 52 read back before commit, committed**.

## Rollout Plan

Merge, deploy, run as a read-only ACA Job against the pack already written.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow; runs as an ACA Job. Read-only — it opens a
connection and issues one `select` per tenant.

## Rollback Plan

Revert. Nothing is written by this script in any environment.

## Audit Evidence

- The commit and its PR.
- The verifier's JSON report, which names build version, per-dimension counts, and sampled entity
  names.

## Known Gaps

- **The query is duplicated, not imported.** The read adapter is `server-only` and cannot be imported
  into a script. Duplication means the two can drift, and drift makes this verification worthless —
  so any change to the adapter's query must change this one in the same commit. A shared SQL constant
  would be better and is owed.
- **This proves the data is readable, not that the page renders it.** Signed-in surface proof is a
  separate step and still owed for both tenants.
