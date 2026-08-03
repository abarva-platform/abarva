# 2026-08-02-source-skyharbor-reconciliation-inspect-script — Read-only diagnostic: does the old event data reconcile with the v3 register?

## Release ID

`2026-08-02-source-skyharbor-reconciliation-inspect-script`

## Status

`candidate`

## Plain-English Summary

Adds a read-only, ops-only diagnostic script that answers a direct question:
does the older `public.source_contract_optimization_profiles` event data (the
Door-1 AMS event) reconcile with the newer `source.contract_vendor_360`
cross-domain register — same tenant_key spellings, and does the register
contain a matching AMS/managed-services contract? This is diagnostic-only:
it performs zero writes, and adds no new product code path. It exists solely
to be run once via the standard ACA operator job to answer a pre-demo
question honestly instead of by inference.

## Layer Impact

- `global-control-lane`: adds one ops script and one `npm run` entry; no
  product code changed.

## Client Applicability

- Internal only: diagnostic tooling, not customer-facing.

## Changes Included

- `scripts/source/inspect-skyharbor-reconciliation.ts` (new): read-only
  queries against `public.source_contract_optimization_profiles`,
  `public.source_events`, and `source.contract_vendor_360`.
- `package.json`: new `source:inspect-skyharbor-reconciliation` script entry.

## QA / Validation

- PASS: `npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint scripts/source/inspect-skyharbor-reconciliation.ts`
- Not applicable: no runtime/DB test — this is itself the diagnostic query,
  run once via the ACA operator job per `docs/ops/aca-data-build-job-rule.md`
  and its documented read-only-inspection allowance.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys
automatically (required so the script exists inside a digest-pinned image
the operator job wrapper can run). Run once via
`npm run ops:aca-job -- --script source:inspect-skyharbor-reconciliation --secret-env DATABASE_URL=azure-postgres-control-database-url`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none — the shipped code path is inert until
  explicitly invoked as a one-off ops job, and even then performs no writes.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not applicable — this ships no UI-visible
  change.

## Rollback Plan

Code rollback by reverting the PR. No data mutation.

## Audit Evidence

- This PR's diff and CI run.
- The ops job's console output, captured and reported in a follow-up note.

## Known Gaps

None known. This is a self-contained, read-only diagnostic script with no
downstream consumers and no product code path depends on it; there is
nothing left partially done or deferred by this change.
