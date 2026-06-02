# 2026-06-02-per-customer-vercel-option - Per-Customer Vercel Deployment Option

## Release ID

`2026-06-02-per-customer-vercel-option`

## Status

`candidate`

## Plain-English Summary

Documented the premium option for running the AbarVa control plane as a
dedicated Vercel project for one customer. The document makes clear that this
is an app-runtime isolation option, not a private data plane, and lists the
readiness gates needed before it can be offered as a production deployment
mode.

## Layer Impact

Release lane: `internal-admin`. Adds an architecture and sales/governance
contract for how AbarVa should describe, evaluate, and operate a per-customer
Vercel project.

No runtime application layer, data layer, authentication layer, migrations, or
infrastructure provisioning changed.

## Client Applicability

- All clients: No immediate runtime impact.
- Specific clients: Future premium enterprise customers that require
  per-customer Vercel project isolation.
- Internal only: AbarVa architecture, sales, operations, and release governance
  teams.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/architecture/VERCEL1_PER_CUSTOMER_VERCEL_OPTION.md`.
- Added this release record.

## QA / Validation

- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Not run: Runtime tests, because this is a documentation-only change with no
  application code, migrations, or infrastructure changes.

## Rollout Plan

Merge to `main`. No Vercel production deploy, Azure deploy, migration, feature
flag, or customer-facing runtime activation is required for this documentation
change.

## Rollback Plan

Revert the documentation PR if the per-customer Vercel option needs to be
withdrawn or materially rewritten. No migration rollback or runtime rollback is
required.

## Audit Evidence

- Architecture contract:
  `docs/architecture/VERCEL1_PER_CUSTOMER_VERCEL_OPTION.md`
- Release record:
  `docs/releases/records/2026-06-02-per-customer-vercel-option.md`
- Local validation commands listed in this record.

## Known Gaps

The document defines the option and readiness gates only. It does not provision
a per-customer Vercel project, wire tenant registry routing, configure SSO,
create environment inventories, or activate a customer deployment.
