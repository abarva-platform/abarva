# 2026-09-12-source-tab-chrome-to-design — Each tab goes straight to its content

## Release ID

`2026-09-12-source-tab-chrome-to-design`

## Status

`draft`

## Plain-English Summary

Every Contract 360 tab carried three things the design does not have, above the
fold, before any content:

1. A panel head repeating the contract name the header already showed.
2. A governed-narrative block under a `SYSTEM_GENERATED_FROM_REVIEWED_SOURCES`
   label, which on the Optimize tab rendered the whole lever list as a run-on
   paragraph and then repeated the next actions as a second one.
3. Three stat tiles with most of their height empty.

The Optimize tab additionally carried the four value ledgers, which the design
places on Economics only.

The design gives each surface two or three content cards and a right-hand
context column, and nothing else. That is now what renders. Each briefing
component owns its tab, carries its own provenance line, and states its figures
once.

The governed narrative is not discarded — it moves to the right-hand column,
under a reader-facing heading, which is where the design puts interpretation.
The Story purpose card moves into the Story briefing, since it previously lived
inside the removed block.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation and composition only.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `WorkspaceExecutiveShell.tsx` — removes the panel head, the tab-body
  narrative block and its stat tiles from every contract tab; removes the value
  ledgers from Optimize; adds `ContractGovernedStatement` in the right-hand
  column, reusing the existing purpose-overlap guard so the Story purpose is not
  stated twice across the two columns; deletes the now-orphaned
  `ContractTabStory`.
- `Contract360Surfaces.tsx` — the Story briefing renders the purpose card.
- `Contract360Economics.tsx` — reads the shared `utilizationAgainstCommitment`
  rather than recomputing the ratio.
- `workspace.css` — three classes for the governed statement.
- Tests: the stale chrome assertions are replaced with assertions on the
  surfaces that now render.

## QA / Validation

- Compared against the design file surface by surface. The design's Optimize
  block contains exactly two cards, no ledger list, no stat definition list and
  no provenance label; Economics contains the lede, the chart, the
  reconciliation panel and the ledgers.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/data-model
  src/lib/source/contract-intelligence` — 42 suites, 336 tests, passing.
- **The design tracker caught a regression mid-change.** Removing the narrative
  block orphaned `utilizationAgainstCommitment`, which left the Economics
  briefing recomputing the same ratio locally — undoing the single-definition
  guarantee an earlier release established precisely to stop this tab showing
  two different utilization figures. Restored to the shared helper.

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
- Live signed-in proof required: **yes.** On every contract tab, confirm the
  surface opens with its own content card rather than a panel head and a
  narrative paragraph, that Optimize shows the rail and the lever table only,
  that Economics still shows the four ledgers, and that the governed statement
  appears once in the right-hand column.

## Rollback Plan

Revert and redeploy. Presentation only; no migration and no data change.

## Known Gaps

- **The lever table is still five columns, not the design's eight.** The design
  specifies Lever, Buyer ask, Why the vendor can agree, Evidence basis, Value
  state, Amount, Owner, Next step. The rendered table carries Lever, The ask,
  Why they can agree, Worth, Owner and timing. An eight-column component built
  earlier in this series was removed as a duplicate of this one; rebuilding it
  as the single table is the next change, not a second table beside it.
- **The Performance tab is missing the design's three-card row** — the
  consumption-against-pace sparkline, the tag-quality meters and the
  not-required card as a trio. The not-required statement and the consumption
  mix render; the trio layout does not.
- **Tag-quality meters remain unbuilt.** No field carries tag quality, so the
  meters would be an invented percentage on a governed surface.
- The design's short editorial contract title ("Unified Analytics Platform")
  has no field behind it, so the header shows the full legal name.

## Audit Evidence

- Commit on branch `claude/source-optimize-to-design`.
- CI run for the PR, including `npm run release:check`.
- Design-versus-live comparison and local validation recorded under QA /
  Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
