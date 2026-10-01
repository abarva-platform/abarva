# 2026-10-01-d501-tenant-identity-ledger-mint — Every object in one tenant's intake gets the id its ledger declares

## Release ID

`2026-10-01-d501-tenant-identity-ledger-mint`

## Status

`candidate`

## Plain-English Summary

Every object in a tenant's intake (each system, platform, programme, data asset and so on) is
supposed to carry an id that never changes. Relationships join on that id instead of on a display
name, so renaming an object breaks nothing. One script mints those ids,
`scripts/data/assign-stable-identity.mjs`, and it writes each one into a per-tenant identity ledger.

In one governed tenant the files had drifted away from the ledger, and nothing checked them.
Measured on `main` before this change, there were 200 problems in that tenant:

- **9 ids were carried by more than one row.** Rows added later by copying an earlier row inherited
  its id. Fourteen platforms answered to one id and eleven programmes to another, so every
  relationship naming any of them resolved to whichever row a reader reached first. Seven data-asset
  ids were shared the same way, two of them by 85 rows each.
- **133 data assets carried ids that no ledger declares** (`GEN-ANL-0001`...). Another generator
  stamped them from a sequence counter.
- **58 named rows carried no id at all.** Three of the files had no id column.

This change runs the owning minter. Four things result:

1. **Every row now carries its own id, and the ledger declares it.** For each of the 14 object
   types, the number of distinct ids in the file now equals the number of ledger entries of that
   type. No two rows share an id.
2. **Every id the ledger already declared stays on a row.** For a shared id, the row the ledger
   names keeps it and the other rows get new ids. For the seven shared data-asset ids, every carrier
   had been renamed with a site suffix, so no row matched the ledger's name any more. The first
   carrier of each is now declared as an **alias** of the existing entry, which is the ledger's own
   documented rename procedure, so the declared id stays on that row and is not orphaned. All 1,224
   entries the ledger held before this change are still there. Seven gained one alias each; none
   was otherwise altered.
3. **The minter no longer re-targets relationships when a name becomes ambiguous.** Three later stub
   org rows take as their name the leader title of three full org rows. On a straight run, those
   stubs would have pulled 25 relationship endpoints away from the full rows. Now an endpoint keeps
   the id it already carries, as long as its name still reaches that id. When the name no longer
   reaches it (a shared id this run separated), the endpoint follows the row it names. With the fix,
   the relationships file is unchanged: 6,299 of 6,636 endpoints resolve before and after.
4. **A new CI gate, `npm run check:identity-ledger`, reads the committed files.** It fails on a
   shared id, an undeclared id, a named row with no id, a relationship carrying an undeclared id, or
   a relationship whose id belongs to a row other than the one it names.

No value, name or description in any row changes; only id columns do. Most of the line churn in
the CSVs comes from re-serialization (line endings and quoting), not content. Re-parsing every file
before and after shows zero changed cells outside the id columns.

## Layer Impact

Release lane: `client-data-lane`. This change is a client-scoped seed/intake data change plus the tooling that guards it.

- **Layer 1, client intake:** the 15 intake CSVs of one synthetic tenant gain or correct id columns.
  Three files gain an id column they did not have. No other cell changes.
- **Layer 3, canonical model:** the tenant's identity ledger grows from 1,224 to 1,627 entries
  (403 minted, 7 aliases added). This is additive only. No entry is removed or renumbered.
- **Tooling:** the minter's relationship-resolution rule changes as described above. A new
  committed-file gate is wired into CI.
- **Layer 4, products:** no code changes. Home reads these files at runtime. Its record browser
  already keys rows on a guaranteed-distinct index rather than on these ids (an earlier change), so
  nothing should re-key. The only possible visible difference is a different id string on the rows
  that previously shared one or had none.

## Client Applicability

- All clients: the CI gate runs for any registered tenant that has an identity ledger.
- Specific clients: data change for one synthetic governed tenant only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

The second registered tenant has no identity ledger, and its intake carries no id columns. The gate
prints it as `NOT MEASURED` rather than passing it. Giving it a ledger means minting ids for its
whole intake, which is a separate layer-1/layer-3 change, so it is filed as its own item and not
done here.

## Changes Included

- `scripts/data/assign-stable-identity.mjs`: an ambiguous relationship endpoint keeps its prior id.
- `scripts/data/assign-stable-identity.test.mjs`: new, 3 cases. Before this, the minter had no tests.
- `scripts/data/identity-ledger-check.mjs` and `.test.mjs`: new committed-file gate, 10 cases.
- `.github/workflows/tenant-identity-ledger.yml`: new workflow. Its paths filter includes the intake
  CSV and ledger globs, not just the scripts.
- `package.json`: adds the `check:identity-ledger` script.
- `docs/architecture/ci-gate-registry.json`: classifies the new script as a `pr-gate`.
- One tenant's 15 intake CSVs and its `identity-ledger.json`: minter output.

## QA / Validation

- Minter suite: red first, 1 of 3 failing on the unfixed minter (the ambiguous-endpoint case), then
  3 of 3. Mutations: 3 of 3 caught. A fourth guard, a "prior id is declared" check, survived
  mutation; on inspection it was redundant (every candidate id was assigned to a named row this
  run), so it was removed rather than kept as an unfailable condition.
- Gate suite: 10 of 10. Mutations: 9 of 9 caught. The first pass caught 8 of 9; the survivor was a
  wrong-type id on a relationship being reported under the wrong kind, and a case now pins it.
- Gate over committed files, both directions, from clean worktrees: exit 1 on `main` (200
  findings), exit 0 on this branch.
- Minter idempotence: a second run mints 0 and reuses all 1,627 entries, and leaves the files
  byte-identical.
- Semantic diff over all 15 CSVs: 0 non-id cell changes. Ledger: 0 of 1,224 prior entries lost or
  renumbered.
- Same-scope baselines, clean `main` vs branch:
  - three Home/Intelligence suites that read this intake: 2 failing / 30 passing on both sides, the
    same two tests by name. That failure exists on `main` and is not caused by this change.
  - 8 data-build/Tower/adapter suites that read active intake: 119 of 119 on both sides.
  - 3 `.mjs` runners (evidence consolidation, placeholder repair, golden-snapshot promotion): exit
    0 on both sides.
  - `npm run test:behaviors`: 173 suites / 1,826 tests green on both sides, once the gate registry
    entry was added. Before that it was 1 red, the registry correctly refusing an unclassified
    script.
- `check:fixture-row-identity`, the CI gate registry check and the registry order check: pass.
- `node scripts/tower/fact-lineage-report.mjs`: byte-identical output before and after.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the image, which
carries the updated intake files. No migration, no ACA data-build job and no database write. A
later governed data build will pick up the new ids when one is run through the normal job lane.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: recorded in the pulse for the merge SHA.
- ACA runtime invariant: the template digest must equal the 100%-traffic revision digest after
  deploy. Recorded in the pulse.
- Worker image invariant: the same digest on the deliverable workers. Recorded in the pulse.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes, owed**. Home reads these intake files at runtime, so the
  tenant's technology-estate and programme views should be opened signed-in on the deployed SHA to
  confirm rows still open their own detail. That check has not been run.

## Rollback Plan

Revert the squash commit. All changes are file-level and additive, and none touches a database.
After a revert, the ledger loses the 403 entries this change minted. Nothing outside these files
references them yet, because no data build has consumed them, so a revert orphans nothing.

## Audit Evidence

- The PR, its CI checks (including the new workflow), and the merge SHA.
- The gate output on `main` (exit 1, 200 findings) and on the branch (exit 0), in the PR body.
- The deploy run for the merge SHA and the ACA digest readback, in the execution pulse.

## Known Gaps

- The second registered tenant has no identity ledger. That is filed separately.
- The analytics-topology generator still stamps its own sequence ids. If it is re-run, it would
  reintroduce undeclared ids, which the new gate would now refuse. That is filed separately.
- Three stub org rows name themselves with the leader title of a full org row. Edges are now
  stable, but whether each stub is a duplicate to merge or a distinct object is a data decision.
  That is filed separately.
- The Home golden snapshot for this tenant still carries the old ids. It is a promoted artifact,
  self-contained and not joined to intake at runtime, so it refreshes on its next promotion. That
  is filed separately.
- Signed-in proof is owed, as described above.
