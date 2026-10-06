# 2026-10-01-d506-second-tenant-identity-mint — The second registered tenant gets its identity ledger, and a tenant with none now fails the gate

## Release ID

`2026-10-01-d506-second-tenant-identity-mint`

## Status

`candidate`

## Plain-English Summary

The tenant registry declares two synthetic tenants. D-501 gave the first one stable object ids
and an identity ledger. The second one had neither: none of its 14 home-dimension intake files
had an id column, its relationship file had no `from_object_id`/`to_object_id`, and there was no
ledger. `npm run check:identity-ledger` printed it `NOT MEASURED` and still exited 0.

This change runs the owning minter, `scripts/data/assign-stable-identity.mjs`, once for that
tenant. It adds one id column to each of the 14 home files, stamps both endpoint
id columns on the relationship file, and writes the tenant's ledger with 1,460 entries. No other
cell changes.

It also closes the route by which this could quietly go back. The gate used to print
`NOT MEASURED` for a registered tenant with no ledger and pass. Now that both registered tenants
are minted, a missing ledger means one was deleted or never written. The gate now prints the same
line and exits 1.

## Layer Impact

Release lane: `client-data-lane` (synthetic tenant intake and its identity ledger; no runtime code
change).

- **Layer 1, client intake:** 15 committed CSVs gain id columns. Every existing column and cell is
  unchanged.
- **Layer 3, canonical model:** the tenant's objects now carry ledger-declared ids, so edges can
  join on an id instead of a display name.
- **Gate:** `scripts/data/identity-ledger-check.mjs` now fails on a registered tenant with no
  ledger. No adapter, loader, read model or product surface changes.

## Client Applicability

- All clients: no
- Specific clients: the second registered tenant only, registry classification `synthetic-demo`
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- The tenant's `identity-ledger.json` (new, beside the other tenant's): 1,460 entries, each minted
  once.
- 14 home-dimension CSVs under that tenant's `canonicalInputRoot`, one id
  column each. Rows = distinct ids = ledger entries for every type:

  | type | file | rows / ids / ledger |
  |---|---|---|
  | system | `04_applications_systems.csv` | 306 |
  | infrastructure | `06_infrastructure_platforms.csv` | 61 |
  | function | `01_business_functions.csv` | 24 |
  | org_unit | `02_org_ownership.csv` | 225 |
  | workforce_role | `03_workforce_roles.csv` | 45 |
  | vendor | `07_vendors_contracts.csv` | 72 |
  | data_asset | `05_data_assets_integrations.csv` | 540 |
  | program | `09_programs_initiatives.csv` | 38 |
  | risk | `11_risks_controls.csv` | 40 |
  | metric | `14_metrics_outcomes.csv` | 50 |
  | use_case | `10_ai_automation_use_cases.csv` | 18 |
  | process | `18_operational_process_evidence.csv` | 25 |
  | managed_service | `17_service_scope_managed_services.csv` | 15 |
  | portfolio_company | `00_enterprise_profile.csv` | 1 |

- `12_relationships.csv`: `from_object_id` and `to_object_id` stamped. 4,425 of 4,604 endpoints
  (96%) carry an id. The 179 left blank are endpoint types that have no home dimension in this
  intake: `risk_or_control` 130, `ai_use_case` 43, `interview` 6. These are the same endpoints the
  minter's name resolution reported as unresolved before the run, so endpoint resolution is not
  lower.
- `scripts/data/identity-ledger-check.mjs`: a registered tenant with no ledger counts as a
  failure. The `NOT MEASURED` line is unchanged.
- `scripts/data/identity-ledger-check.test.mjs`: two CLI cases. Each runs the check against a
  throwaway repository root that holds two registered tenants with clean intake. In one case both
  tenants have a ledger and the check must exit 0. In the other the second tenant has none and the
  check must exit 1.

## QA / Validation

Base: `origin/main` `b05705ce9d`.

| What | Result |
|---|---|
| Minter dry run on base | mints 1,460, reuses 0; edges 4,425 / 4,604 resolvable by name |
| `check:identity-ledger`, base | exit 0, tenant `NOT MEASURED` |
| `check:identity-ledger`, branch | exit 0, tenant `PASS`, no finding of any kind |
| Semantic re-parse of all 15 CSVs, base vs branch | same row count in each file; 0 existing cells changed; 0 columns removed; every new home-file id cell filled; line terminators unchanged (two files are CRLF, 13 are LF) |
| Minter run a second time | mints 0, reuses 1,460; working tree and ledger byte-identical |
| Gate suite on base code | **1 of 12 failed** (the no-ledger case exited 0) |
| Gate suite after fix | **12 of 12 passed** |
| Fixed gate against base intake (tenant not yet minted) | exit 1 |
| Mutation: the new failure count removed | gate suite 1 failed |
| Mutation: this tenant's ledger file removed from the branch | `check:identity-ledger` exit 1 |
| Mutation: one infrastructure row given its neighbour's id | `check:identity-ledger` exit 1, `shared_id: 1` |
| 12 jest suites that read active intake (Home, Tower, Intelligence, adapters, data-build segmentation) | 158 pass / 2 fail on **both** sides, the same two `local-cxo-runtime` tests by name. That failure is on `main` already. |
| 5 `.mjs` runners (golden-snapshot promotion, placeholder repair, evidence consolidation, fixture deepening, minter suite) | exit 0 on both sides |
| `node scripts/tower/fact-lineage-report.mjs` | output identical on both sides |
| `audit:tenant-input-quality`, `check:fixture-row-identity`, `db:verify:canonical-tenants`, `db:verify:retired-tenants` | exit 0 |
| `npm run test:behaviors` | 174 suites / 1,830 tests, 0 failing |

Each mutation's diff was confirmed non-empty before its run, and the file was restored afterwards.

## Rollout Plan

Merge to `main`. The repo-owned ACA workflow rebuilds the image. Readers that parse these files by
column name see extra id columns and nothing else. No database load or ACA job runs as part of this
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none
- Approved image digest: whatever the merge's deploy run produces
- ACA runtime invariant: to be read after merge
- Worker image invariant: to be read after merge
- Feature/env flag update path: none
- Live signed-in proof required: yes. Open this tenant's Home technology estate and programme views
  signed in on the deployed SHA and confirm they render as before.

## Rollback Plan

Revert the squash commit. That removes the id columns and the ledger, and the gate again prints
`NOT MEASURED`, but the reverted gate exits 0 on it. The ledger is append-only by design; if this
tenant is later re-minted, its ids will differ from the reverted ones.

## Audit Evidence

- The PR and its `tenant-identity-ledger` CI run.
- The validation table above.

## Known Gaps

- The 179 unresolved edge endpoints remain. `risk_or_control`, `ai_use_case` and `interview` have
  no home dimension in this intake whose names match the edge text. Resolving them is an ontology
  or data question, not a minting one.
- Two `local-cxo-runtime` tests fail on `main` and on this branch. Not addressed here.
- Downstream copies of this tenant's data, such as golden snapshots and any loaded database rows,
  do not carry these ids until they are regenerated or reloaded.
