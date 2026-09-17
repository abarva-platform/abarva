# 2026-09-17-source-opportunity-ownership-cutover-preflight

## Release ID

`2026-09-17-source-opportunity-ownership-cutover-preflight`

## Status

`candidate`

## Plain-English Summary

Adds a read-only operator preflight for opportunity ownership. It inventories an evidence-only package's opportunity identifiers and dependent records, checks installed PostgreSQL constraints and indexes, and compares canonical-writer controls. It does not change ownership or data.

## Layer Impact

`internal-admin` lane. Layer 3: read-only inspection of the existing opportunity projection and its dependent records. No schema or data changes. Layer 4: no product change.

## Client Applicability

- All clients: no product change.
- Specific clients: none specified in this public record.
- Internal only: operators with read-capable database access.
- Public/demo only: no.
- Feature flag: none.

The inspected tenant, contract, and dataset versions come from the repository ownership manifest at run time.

## Changes Included

`scripts/source/opportunity-ownership-cutover-preflight.mjs`, its focused tests, and a package script. No migration or loader change.

## QA / Validation

- Focused tests: passed, 4 tests.
- Node syntax check: passed.
- ESLint on the script and focused test: passed.
- Release control gate: passed.
- Live PostgreSQL readback: blocked by DNS resolution of the lab host (`ENOTFOUND`); no live rows or installed schema were inspected.

## Rollout Plan

No runtime rollout. An operator may run the script with a read-capable `DATABASE_URL` and retain its JSON output in a restricted proof location.

## Deployment Authority

- Repo-owned deploy workflow: not used for this operator-only script.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changes.

## Rollback Plan

Remove the script and package command. No data rollback is needed.

## Audit Evidence

The JSON proof contains the exact manifest-derived tuples, opportunity IDs, root and dependent counts, row checksums, installed constraints and indexes, and readiness checks. It contains no source rows.

## Known Gaps

The preflight is evidence for review, not authorization for a cutover. Database access and live readback are operator-specific.
