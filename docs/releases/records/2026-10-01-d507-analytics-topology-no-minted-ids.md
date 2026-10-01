# 2026-10-01-d507-analytics-topology-no-minted-ids — The analytics-topology generator stops minting its own object ids

## Release ID

`2026-10-01-d507-analytics-topology-no-minted-ids`

## Status

`candidate`

## Plain-English Summary

`scripts/data-refresh/generate-analytics-topology.mjs` adds modelled analytics-feed rows to a
synthetic tenant's data-asset intake file. For every row it generated, it also wrote an object id
of its own, `GEN-ANL-<sequence>`, taken from a counter.

That made it a second id minter. The repository's rule is that
`scripts/data/assign-stable-identity.mjs` is the only one. That script records every id it mints
in the tenant's identity ledger, so an id stays the same when a row's position or name changes. The
generator's ids were declared by no ledger, and a counter id renumbers whenever row order changes.
This is how 133 undeclared ids got into one tenant's intake before D-501 re-minted them. Re-running
the generator with `--apply` would have put them back.

The generator now leaves `data_asset_id` blank on the rows it generates. Its `--apply` output names
the minter as the next step. The minter assigns each generated row a ledger-declared id from its
name, as it does for every other row.

## Layer Impact

Release lane: `internal-admin` (data-refresh tooling for synthetic tenants; no runtime change).

- **Layer 1 tooling only.** It changes what an operator-run generator writes into intake. No
  intake file, ledger, adapter, canonical-model table or product surface changes in this PR.
- The identity rule (layer 3: every object has an id the ledger declares) is now kept by this
  generator as well as checked by the gate.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/data-refresh/generate-analytics-topology.mjs`:
  - no longer stamps `data_asset_id`;
  - the unused sequence counter is removed;
  - `--apply` prints the minter command to run next.
- `scripts/data-refresh/generate-analytics-topology.test.mjs` (new, `node:test`). Each case builds
  a fixture repository with one registered tenant, a one-type ontology, a systems file, three
  operational flows whose ids the ledger already declares, and that ledger. Then:
  1. after `--apply`, no generated row carries an id;
  2. after `--apply`, every id in the file is ledger-declared, and the three operational rows keep
     the ids they arrived with;
  3. `--apply`, then the minter, then `identity-ledger-check.mjs --check` exits 0 and prints
     `PASS`, and every generated row now carries a ledger-declared `DAT-` id.

  Each case also asserts that the generator produced rows, so an empty run cannot pass.
- `package.json`: `check:identity-ledger` also runs the new suite.
- `.github/workflows/tenant-identity-ledger.yml`: the generator and its suite are added to the
  workflow's path filter, so a change to either runs the job.

## QA / Validation

Base: `origin/main` `ba33648c15`.

| What | Result |
|---|---|
| New suite on base code | **2 of 3 failed** (cases 1 and 2; six `GEN-ANL-000n` ids). Case 3 passes on both sides: the minter re-stamps by name, which is why D-501's repair held. |
| New suite after fix | **3 of 3 passed** |
| Mutation: stamp a name-derived non-ledger id | cases 1 and 2 failed |
| Mutation: stamp an id the ledger already declares | case 1 failed |
| Mutation: give every generated row the same name | case 3 failed (gate reports `shared_id`) |
| `npm run check:identity-ledger` | exit 0. The airline tenant prints `PASS`; the second tenant prints `NOT MEASURED`, as on base (D-506). |
| test-CI coverage census `--check` | exit 0. The drift it reports (+6/+6) is identical on base; the census does not scan `scripts/**/*.test.mjs`. |

Each mutation's diff was confirmed non-empty before its run, and the file was restored afterwards.

## Rollout Plan

Merge to `main`. The repo-owned ACA workflow rebuilds the image. Nothing in this change runs in the
web or worker runtime. The new suite runs in the `tenant-identity-ledger` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none
- Approved image digest: whatever the merge's deploy run produces
- ACA runtime invariant: to be read after merge
- Worker image invariant: to be read after merge
- Feature/env flag update path: none
- Live signed-in proof required: no (CI and tooling only)

## Rollback Plan

Revert the squash commit. The generator would then stamp `GEN-ANL-*` ids again, and the identity
ledger gate would refuse any intake it wrote. No data needs restoring.

## Audit Evidence

- The PR and its `tenant-identity-ledger` CI run.
- The mutation results in the table above.

## Known Gaps

- **A second `--apply` appends a duplicate of every generated row.** Measured on the fixture: 9
  rows became 15, with 9 distinct names. The generator does not check whether the feed it would add
  is already in the file. After the minter runs, the gate refuses the result with 6 `shared_id`
  findings, so it cannot pass CI unnoticed. But the generator's header claim that running it twice
  is safe holds only for its own output, not for the file it writes. Filed as D-515.
- The generator rewrites the file with LF line endings whatever the input used. The minter
  preserves line endings since D-501; this generator does not. Not changed here.
