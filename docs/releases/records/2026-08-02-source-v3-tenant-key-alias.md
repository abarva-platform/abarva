# 2026-08-02-source-v3-tenant-key-alias — Fix tenant_key mismatch hiding the v3 vendor/contract register

## Release ID

`2026-08-02-source-v3-tenant-key-alias`

## Status

`candidate`

## Plain-English Summary

Live verification found that the Vendor & Contract Portfolio page (shipped
earlier tonight in PR #5878) renders its honest empty state on the live
SkyHarbor tenant, even though the underlying `source.contract_vendor_360`
register is real and populated. Root cause: the app resolves the active
client key as `skyharbor` or `skyharbor-air`, but the `source.*`/`tower.*`/
`doc.*` schemas were verified against a real export keyed under
`tenant_key = 'skyharbor_global'` — three different spellings of the same
real-world tenant, none of which match each other on an exact-equality
query. This is the same class of bug already fixed once tonight for the
contract-optimization read path (`2026-08-02-source-contract-optimization-canvas-wiring`),
now fixed at its source in the shared read-adapter so every function in this
module benefits, not just the one that happened to be checked.

## Layer Impact

- `global-control-lane`: shared read-adapter code, used by every Vendor &
  Contract Portfolio / Contract 360 / Sourcing Opportunities page.

## Client Applicability

- All clients: an unrelated tenant key (e.g. `apex-retail`) passes through
  unexpanded — this only fans out queries for the three known SkyHarbor
  spellings.
- Specific clients: SkyHarbor (synthetic demo tenant).

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`: added `tenantKeyAliases()` and
  changed every `tenant_key = $1` query to `tenant_key = ANY($1::text[])`
  across all 13 read functions.
- `src/lib/source/data-model/__tests__/read-adapter.test.ts` (new): 3 tests
  covering alias expansion in both directions and confirming an unrelated
  tenant key is not affected.

## QA / Validation

- PASS: `npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts`
- PASS: `npx jest src/lib/source/data-model/__tests__/` (29/29, including the 3 new tests)
- Live signed-in proof: pending post-deploy — the Vendor & Contract Portfolio
  page must show real rows instead of the empty state.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys
automatically.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked
  `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation — read-only queries only.

## Audit Evidence

- Live screenshot of `/source/vendor-portfolio` showing the empty state
  before this fix (captured during tonight's verification pass).
- This PR's diff and CI run.
- Post-deploy: live signed-in screenshot showing real contract/vendor rows.

## Known Gaps

- This fix makes the new v3 read path reachable; it does not establish
  whether the v3 register and the older `public.source_contract_optimization_profiles`
  event data (the Door-1 AMS event) agree with each other on any shared fact
  (e.g. whether the AMS contract appears in the 119-contract register with a
  consistent annual value). That cross-check is separate follow-up work.
