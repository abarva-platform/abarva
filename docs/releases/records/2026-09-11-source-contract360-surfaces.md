# 2026-09-11-source-contract360-surfaces — Contract 360 tab surfaces

## Release ID

`2026-09-11-source-contract360-surfaces`

## Status

`draft`

## Plain-English Summary

Brings the remaining Contract 360 tabs onto the agreed design: each opens with a
sentence someone can repeat rather than a grid of labels, and states what it
cannot say as plainly as what it can.

The change most people will notice is the register-only tier. A contract with no
evidence loaded used to render eight tabs that were all empty, which reads as a
product that does not work. It now withholds the tabs and says what loading
would unlock and who owns it. That is the majority state of the current book, so
it is the state most worth getting right.

Also adds the contract header the design specifies (the contract named once, in
full, with the notice window as the only chip), the declared-relationships and
scope briefings, the evidence families list where a family the contract type
does not require reads "Not required" instead of a zero, and the eight-column
lever table with its footer stating that the amounts are not additive and that
nothing is realised until Finance confirms.

## Layer Impact

- `global-control-lane`: shared Source product behaviour for all clients, not
  feature-gated.
- **Layer 4 (Products · Source).** Presentation only. Every figure reads an
  existing governed field; no new field is introduced.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `Contract360Surfaces.tsx` — new. Briefing header, register-only tier, Story,
  Scope, Relationship, evidence families, and the lever table.
- `WorkspaceExecutiveShell.tsx` — mounts them; adds `contractNoticeDays`, which
  returns null unless the contract records both an end date and a notice period;
  removes the duplicated contract title from the panel head now the header
  carries it; removes `ContractScopeTable`, superseded by the scope briefing
  which carries all five of its columns.
- Tab row moved to the design's flat underline treatment, and the tabs given
  `role="tab"` / `aria-selected` inside their existing `role="tablist"`.
- `workspace.css` — the design's remaining visuals as named classes.
- Tests updated for the corrected tab roles and for scope rendering as labelled
  rows rather than a column-headed table.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence` — 17
  suites, 162 tests, passing.
- The existing browser-surface suite caught two real defects during this work:
  the register-only gate was too narrow and blanked the Optimize tab for a
  contract that had levers but no coverage row, and mounting the scope briefing
  beside the old table rendered every scope row twice. Both fixed.
- A `logic.select("contracts", …)` call typechecked but named a key that does
  not exist; the working key is `"contractList"`. Corrected before it shipped as
  a dead control.
- Not validated locally: the assembled pages against live tenant data. These
  surfaces read the data plane through the client VNet, which a local dev server
  cannot reach.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** Open a contract with evidence and
  confirm the header renders the name once with the notice chip, that Story,
  Scope, Relationship and Evidence render their briefings, and that Optimize
  shows the lever table with its footer. Open a register-only contract and
  confirm the tabs are withheld and the unlock path renders.

## Rollback Plan

Revert and redeploy. No migration and no data change, so rollback is an image
roll-back to the previous approved digest.

## Known Gaps

- **This is presentation, and the data behind it is still thin.** The contract
  used for the demo carries no document page rows, no invoice rows and no
  change-order rows, so its evidence families correctly read as not loaded and
  its education basis correctly reads as partial. The surfaces now say so
  plainly; they do not make the evidence exist.
- **The register/evidence identifier split is unchanged** and remains the
  controlling problem: 82 of 83 contracts with loaded evidence do not match a
  register header. See `SPEC_contract_identity_reconciliation.md`. No further
  display work should be spent compensating for it.
- **Three Economics surfaces and three Performance surfaces are not built** —
  the commitment-versus-usage lede, the commitment pace chart with its legend,
  the AP reconciliation panel, the delivery/attribution lede, the tag-quality
  meters and the usage-mix bars. The Education thresholds table is also not
  built; its content is archetype playbook material that has to be authored per
  archetype rather than derived.
- **The register-only tier's unlock path is authored, not derived.** The four
  steps and their owners are the same for every contract. Deriving them from the
  archetype's own required-evidence list would be better and is not done here.

## Audit Evidence

- Commit on branch `claude/source-contract360-surfaces`, based on `23d941cc9`.
- CI run for the PR, including `npm run release:check`.
- Local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
