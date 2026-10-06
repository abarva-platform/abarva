# 2026-09-11-source-count-reconciliation — Counts that name what they count

## Release ID

`2026-09-11-source-count-reconciliation`

## Status

`draft`

## Plain-English Summary

Several figures on the Source portfolio surfaces did not add up, and a reader
checking them with arithmetic would have caught it. A coverage panel showed 82
declared contracts next to 230 unmapped ones on a book of 230. A contracts
footer said 124 contracts had detail rows and the remaining 229 did not, on the
same book. An evidence matrix reported zero documents and zero change orders
directly above a panel reporting 87 and 25 of them.

None of these were bad arithmetic. Each was one label standing over two
different collections.

Source reads two things that both describe "contracts": the **contract book**
(header rows with vendor, value and dates) and the **evidence layer** (one row
per contract that has evidence loaded, carrying the archetype and lane counts).
They join on contract identifier. Panels derived their own counts from whichever
collection was nearest, then rendered the results side by side as though they
described one set. Where the identifiers do not match, they do not.

This release makes every one of those counts come from a single derivation that
names its population, and — where the two collections genuinely do not describe
the same contracts — says so on screen instead of hiding it behind a percentage.

It also fixes a utilization figure that was computed two different ways on one
tab, and stops a stored caveat describing a contract facet as missing when the
contract's own type does not require it.

## Layer Impact

- `global-control-lane`: shared Source product behaviour for all clients, not
  feature-gated.
- **Layer 4 (Products · Source).** Presentation and derivation only. What the
  panels count changes; what is stored does not.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched. The identifier mismatch this surfaces is a load-path
  condition and is reported, not repaired, here.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `contractPopulations.ts` — new. Derives register / evidence / joined /
  declared counts once, with the join rate and a disjoint-populations flag.
  `countOrDash` renders an unloaded lane as a dash and a loaded empty one as
  zero.
- `WorkspaceExecutiveShell.tsx`
  - Archetype coverage panel now partitions the book (`declared` +
    `not yet declared` = book) and states how many contracts with loaded
    evidence are absent from the book. No percentage spans the two.
  - Coverage page header rewritten through `coverageScopeLine`.
  - Contracts footer takes its remainder from the same population as its depth
    count.
  - Evidence archetype matrix walks the evidence rows rather than the book, so
    its lane totals agree with the lane panel beneath it by construction.
    Register headers with no evidence row are reported as their own group.
  - `utilizationAgainstCommitment` — one definition of utilization, against the
    committed amount rather than the whole annual cost, with the denominator
    named in the tile label.
  - `withoutNotRequiredFacets` — drops clauses from a stored missing-evidence
    summary that name a facet the archetype does not require.
  - Removes the superseded cross-population percentage and its input.
- Tests: new `contractPopulations.test.ts`, including the live shape (a
  generated book plus evidence rows in a different identifier space).

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint` on changed files — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence` — 17
  suites, 162 tests, passing.
- The disjoint-population case is tested against the shape actually observed in
  the live tenant, not an idealised one: a 230-row book, three evidence rows,
  one join.
- Not validated locally: the rendered portfolio pages against live data. These
  surfaces read the data plane through the client VNet, which a local dev
  server cannot reach. Signed-in proof is named below.

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
- Live signed-in proof required: **yes.** On the Coverage tab, confirm the
  declared and not-yet-declared counts sum to the book and that the
  contracts-with-evidence-not-in-this-book line appears. On the Evidence tab,
  confirm the matrix lane totals match the lane panel beneath it. On a contract
  Economics tab, confirm one utilization figure with its denominator named.

## Rollback Plan

Revert and redeploy. No migration and no data change, so rollback is an image
roll-back to the previous approved digest.

## Known Gaps

- **The underlying identifier mismatch is not fixed here, and cannot be fixed
  in the product layer.** In the current tenant data the contract book and the
  evidence layer are effectively disjoint: only one evidence row's identifier
  matches a book header. This release stops the surfaces from asserting a
  relationship that the data does not support, and states the gap in plain
  English where a reader will see it. Reconciling the two identifier sets is a
  load-path change and is owed separately.
- **A consequence of the above:** with the two sets disjoint, the archetype
  coverage panel will correctly read close to zero declared. That is the honest
  figure for the book as loaded. It will move when the load path is fixed, not
  when the display is.
- **Scope.** Portfolio surfaces only. The remaining Contract 360 design surfaces
  (register-only tier, Story, Scope, Relationship, Evidence families) are not in
  this release.
- **The stored caveat is filtered, not corrected.** The missing-evidence summary
  is still assembled in SQL that has no view of the archetype model; this drops
  the inapplicable clauses at render time. Making the stored text
  archetype-aware is the better fix and is not done here.
- Mapping of facet clauses currently covers the Performance lane only, because
  that is the only facet the archetype model marks as not required today.

## Audit Evidence

- Commit on branch `claude/source-reconcile-counts-and-denominators`.
- CI run for the PR, including `npm run release:check`.
- Local validation recorded under QA / Validation.
- Post-deploy: the workflow's ACA runtime invariant check and the signed-in
  route proof named under Deployment Authority.
