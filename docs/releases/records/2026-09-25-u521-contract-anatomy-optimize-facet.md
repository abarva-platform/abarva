# 2026-09-25-u521-contract-anatomy-optimize-facet — Contract anatomy card reads opportunity evidence, not its own recommendation

## Release ID

`2026-09-25-u521-contract-anatomy-optimize-facet`

## Status

`candidate`

## Plain-English Summary

The contract anatomy card on the Source workspace shows two things about a contract: what
data feeds it, and which of seven decision questions its evidence can answer. One of the
seven — "Optimize: recoverable, avoidable, or negotiable" — was being answered from the
product's own computed opportunity set rather than from anything loaded onto the contract.

That produced two wrong statements on the same card. A contract with no loaded rows and
three computed levers reported a data feed it did not have, and reported the Optimize
question as answered, which rolled into the headline "This contract answers N of 7 decision
questions." The card was answering a question using the recommendation that the question is
about.

Both sites now read the evidence coverage row the component is already given, which is what
the other six facets do. The feeds row is named "Opportunity evidence rows", matching the
wording an earlier item established on the sibling Contract 360 surface, and it now renders
"not loaded" when the lane is absent instead of asserting "0 governed levers".

**What this does not settle, stated here because the first draft of this record got it
wrong.** The obvious justification for the change is that the coverage lane and the computed
set are different populations. Measurement says that is not reliably true, so it is not the
justification being claimed. `opportunity_rows` has two definitions by read path:

- the migration-owned projection defines it as `count(*)` over
  `source.contract_action_candidate_v1`
  (`20260910203000_source_contract_tab_intelligence.sql:73`, self-labelled at `:126`);
- the live portfolio adapter defines it as `count(*)` over deduped
  `source.optimization_opportunity` (`live/portfolioAdapter.ts:986`, from the
  `opportunity_source` CTE, self-labelled at `:1081`) — the same table behind
  `vm.opportunityView`;
- and `contractCoverageWithDetailLanes` (`WorkspaceExecutiveShell.tsx:6240`) overwrites the
  lane with the computed count outright.

So on the live path the Optimize facet may still be answered from the computed set, arriving
through the lane rather than directly. **This release does not close that.** What it closes is
narrower and real: the component no longer conflates the two itself, all seven facets read one
source, and the feeds block enumerates only coverage lanes. The remaining half is a
data-contract question, filed as item D-500 with the call sites named.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behavior for all clients, not
feature-gated. It is not `client-data-lane`: no schema, RLS, seed, ingestion, retrieval or
private data-plane object is touched.

- **Layer 4 — Products (Source).** Presentation only. One component decides two rendered
  claims from a different field of the coverage row it already receives.
- **Layer 3 — Canonical model.** Unchanged. No schema, migration, loader, adapter or
  projection is touched, and no new field is introduced.

## Client Applicability

- All clients: yes — the component is route-mounted for every tenant that reaches the
  contract Evidence tab. There is no tenant-specific branch in the change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unflagged because it removes an incorrect claim rather
  than adding a capability; leaving the old reading behind a flag would keep shipping it.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/ContractAnatomy.tsx` — the `Optimize` facet
  signal and the "What feeds it" row both read `coverage.opportunity_rows`; the derived
  `opportunityCount` local is removed, so the component no longer reads `vm.opportunityView`
  at all. The decision and the two populations are recorded in the component's own doc
  comment.
- `src/app/(maestro)/source/preview/workspace/__tests__/contractAnatomy.test.tsx` — five new
  cases, one amended count, and a shared facet-lookup helper.

No migration, no data-plane change, no route change, no dependency change.

## QA / Validation

Baseline and result measured over the same scope, on the same worktree.

| scope | before | after |
|---|---|---|
| `contractAnatomy.test.tsx` | 5 tests, 0 failing | 10 tests, 0 failing |
| `src/app/(maestro)/source/preview/workspace/__tests__` (36 suites) | — | 316 tests, 0 failing |

**Red first.** With the new cases in place and the component untouched, 6 of 10 failed:
`does not answer Optimize from the product's own opportunity set`, `answers Optimize when
opportunity evidence rows are loaded`, `claims nothing for a contract with no loaded rows and
a computed lever set`, `does not present computed levers as something that feeds the
contract`, `reports loaded opportunity evidence in the feeds block`, and the amended
`counts answered questions from the contract's own lanes`.

**The guard fails in both directions, and per site.** Three mutations were applied to the
fixed component and each was confirmed by `sha256` to have changed the file before the suite
ran (clean `804f7717…`):

| # | mutation | sha256 | result |
|---|---|---|---|
| M1 | `Optimize` reverted to the computed opportunity set | `5a697346…` | **killed** — 4 failed: both Optimize directions, the nothing-loaded case, and the headline count |
| M2 | feeds row reverted to `N governed levers` | `45fb3b58…` | **killed** — 2 failed, both feeds cases |
| M3 | feeds row keeps the honest label but restores the computed source | `65f1a831…` | **killed** — 2 failed, both feeds cases |

M3 exists because a relabel without a source change is the cheapest way to appear to satisfy
this item; the feeds assertions read rendered text rather than the array, so it does not pass.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics. Exit code judged rather than grepped, because a bare run exits 134 on this
  machine and emits nothing.
- `npx eslint` on both changed files — exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the digest-pinned image and
shifts traffic; no manual Azure command is involved and no migration is applied. The change
is a client-component render path, active as soon as the new revision serves traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy workflow for the merge commit; recorded with
  the merge evidence rather than asserted here.
- ACA runtime invariant: to be proven from the deploy run keyed at or after the merge SHA —
  Container App template image, 100%-traffic revision image and worker job images equal to
  the approved digest.
- Worker image invariant: unaffected; no worker code or job template changes.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Both claims are decided inside one client component from
  props, and the acceptance for this item is satisfied in jest against the mounted component.
  A later confirmation by a reader on the deployed surface is a separate follow-on.

## Rollback Plan

Revert the single commit and redeploy through the same workflow. There is no migration, no
persisted state and no flag, so the revert is complete and immediate. The previous digest
remains available for a traffic shift if a faster path is wanted.

## Audit Evidence

- PR URL and CI run for this branch.
- The red/green/mutation numbers above, reproducible with
  `npx jest --runTestsByPath "src/app/(maestro)/source/preview/workspace/__tests__/contractAnatomy.test.tsx"`.
- The deploy run keyed at or after the merge SHA, and its `runtime-invariant-proof.json`.

## Known Gaps

**The item U-521 describes is NOT fully closed by this release, and that is the most important
line in this record.** Two findings, both measured while making the change:

1. `opportunity_rows` does not name one population. Migration projection: `count(*)` over
   `source.contract_action_candidate_v1`. Live adapter: `count(*)` over deduped
   `source.optimization_opportunity`, the same table behind `vm.opportunityView`. An earlier
   item's shipped comment on the sibling surface asserts the first and is therefore accurate
   on only one of the two read paths.
2. `contractCoverageWithDetailLanes` (`WorkspaceExecutiveShell.tsx:6240`) overwrites the lane
   with the computed count through `{ ...base, ...detailCounts }`, a third injection point.

Together these mean the semantic defect — a facet answered from the product's own output —
can persist through the lane on the live path. This release fixes the component's own
conflation and locality; it does not fix the lane's meaning.

No other column was substituted on a guess. `opportunities_with_evidence` is the obvious
candidate and was rejected for now: it filters on `evidence_state`, and item C-402 has the
related `evidence_status` column open as effectively constant, so adopting it would trade one
unproven signal for another. Filed as item D-500.

That override was left alone deliberately rather than folded in here. It feeds roughly ten
other consumers of `opportunity_rows` — readiness scoring, KPI strips, the evidence-lane
count an earlier item deliberately labelled as evidence — so changing it moves numbers on
surfaces outside this card, and whether a persisted evidence lane may be synthesized from
computed output at all is a data-contract question rather than a rendering one. It is filed
as its own backlog item with the call sites named.

Also out of scope, and checked rather than assumed: no other surface reads
`vm.opportunityView.opportunities` as evidence. The four other readers
(`ContractOptimizeMethod`, `ContractLeverTable`, `Contract360Briefing`,
`WorkspaceExecutiveShell`'s optimize summary) each present it as the opportunity set it is.
