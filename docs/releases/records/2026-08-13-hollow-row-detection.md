# 2026-08-13-hollow-row-detection — Catch files that pass every gate while being empty

## Release ID

`2026-08-13-hollow-row-detection`

## Status

`candidate`

## Plain-English Summary

Depth counts rows. Conformance counts columns. Neither catches a file with the right columns and the
right number of rows where the payload is missing.

One tenant's spend file conforms to the contract, has 71 rows, and 54 of them carry no value in any
declared payload column. Its relationships file has 519 rows, 510 of them empty. Both pass row-count
depth and column conformance today.

This adds a row-level payload check: a conformant file where half or more rows are empty in every
declared payload column now fails.

## Layer Impact

Release lane: `client-data-lane`. A Layer 1 validation check. No tenant data modified.

## Client Applicability

All clients: no. Internal CI validation. Feature flag: none.

## Changes Included

- `scripts/audit/tenant-input-quality-depth.ts` — `hollowRows`, a per-file failure at 50% or more, and
  waiver handling with expiry
- `quality-depth-rules.json` — one dated waiver

## Scope was narrowed twice, and both narrowings matter

A first version of this sweep reported **zero** hollow rows, which contradicted a defect already proven
to exist. The cause was that `source_file`, `source_date`, `confidence` and `known_gaps` are contract
columns but describe the row rather than carry its payload; they are populated everywhere, so no row
ever looked empty. Excluding them found 1,695 rows.

A second version reported those 1,695 across two tenants. Most of that was wrong too. One tenant's files
are off-contract, so very few contract columns exist in them at all — measuring payload there
re-reports the known conformance gap under a second name. Restricting the check to files that are
already conformant, and requiring at least three payload columns to judge against, isolates the genuine
cases: **564 rows in one tenant**.

The headline number fell from 1,695 to 564 because two thirds of it was the same defect counted twice.

## QA / Validation

| Check | Result |
| --- | --- |
| With waiver | passes, 7 tenants |
| Waiver removed | **fails**, naming both files with row counts and percentages |
| Expired waiver | fails, quoting the remediation |
| Tenants flagged | 1 — the other 6 are clean |
| `npx tsc --noEmit` | clean for the changed file |
| `npm run release:check` | passed |

## Rollout Plan

Merge to `main`. Runs inside the existing `Verify canonical tenant allowlist` context.

## Deployment Authority

Repo-owned deploy workflow unchanged. No runtime, image, flag or env change. Live signed-in proof
required: no.

## Rollback Plan

Revert the squash commit.

## Audit Evidence

- `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.json` — `hollowRowFiles` per tenant.

## Known Gaps

- **The waiver defers a problem that has no source.** That tenant's relationships file is a schema
  illustration whose `original_source_file` points at itself; there is no upstream copy to restore. The
  waiver buys time for a decision, not for a recovery.
- The 50% threshold is a judgement. A file that is 49% empty passes, and nothing tested whether 30% or
  70% is the better line.
- Off-contract files are excluded by design, so a tenant could hide hollow rows by being off-contract.
  That is already caught by the conformance check, but the two gaps do not compose into a single
  guarantee.
- The check requires at least three payload columns to judge a file. Dimensions with fewer are not
  assessed.
- It measures whether a row has *any* payload, not whether it has *enough*. A row with one field of
  twelve populated counts as full.

## Follow-ups

1. Decide what that tenant's spend and relationship data should be, or mark it explicitly as having
   none so coverage reporting stops counting phantom rows.
2. Revisit the 50% threshold once there is evidence about what a realistic sparse file looks like.
