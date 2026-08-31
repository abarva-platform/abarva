# 2026-08-31-home-deterministic-page-depth — Give every Home chapter the record it already has

## Release ID

`2026-08-31-home-deterministic-page-depth`

## Status

`candidate`

## Plain-English Summary

Every chapter of the Home executive story currently reads "This chapter is not drafted yet" when the
narrative has not been written. That was true about the prose and false about everything else: the
estate rows — 306 applications, 72 contracts, 66 platforms, 540 data assets, with every column the
intake declared — already ship inside the same bundle the page renders from.

This computes each chapter's tables and findings from those rows and renders them whether or not the
narrative exists. A chapter that has not been written now shows six tables of real data and five
findings with named owners instead of an apology.

Nothing here calls a model. Every figure is a filter over rows a reader can open.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged. No schema, migration or projection change.
- **Layer 4 / products:** Home chapters gain a deterministic table set and findings block.
- **Build tooling:** unchanged.

## Client Applicability

- All clients: yes, wherever the bundle carries estate rows
- Internal only: no
- Feature flag: none

## Changes Included

- `src/components/home/v4/page-tables.ts` (new) — table sets and finding rules computed from estate
  rows; `usd`, `label`, `constantColumns` helpers.
- `src/components/home/v4/TableSet.tsx` (new) — renders a table set, a findings block and a lead
  number in the locked v4 system.
- `src/components/home/v4/chapter-page-content.ts` (new) — which estate families each chapter draws
  on, and de-duplication when two families produce the same finding.
- `src/components/home/v4/ChapterPage.tsx` — renders the depth after the readout.
- `src/components/home/v4/NotDraftedPage.tsx` — renders the same depth, and says the narrative is
  missing rather than implying the record is.
- `src/components/home/v4/HomeV4App.tsx` — passes estate rows to both.
- Two new test files, 22 cases.

### Findings are rules, not sentences

Each finding computes its own number and fills a stable template, so it cannot go stale: it either
fires with a new number or stops firing and the block gets shorter. That is why the block's header
states a count rather than the design assuming one, and why there is no empty state anywhere in the
component — a chapter whose rows produce nothing renders no block at all.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 39/39, six suites, no regression
- PASS `npx eslint` on all eight changed or added files
- PASS `tsc --noEmit -p tsconfig.json` (full project)

### Gates observed failing

- Remove the condition a finding reports and it must stop firing rather than fire with zero. Planted
  and asserted.
- A table showing fewer rows than its source states its own bound; asserted against the live
  snapshot, where the crosstab shows 8 of 22 business functions.
- A chapter whose rows produce nothing renders neither a table set nor a findings block; asserted.

### What a chapter renders now

Against the current snapshot, the technology chapter renders six tables — business function ×
hosting, cloud readiness, lifecycle state, authentication × data classification, integration
pattern, governance state — and five findings. The authentication crossing produces a population no
single column holds: 108 applications carrying PHI authenticate on local accounts.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change. The component reads rows
already present in the published bundle.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. The three new files are unreferenced on revert and the three edited components
return to their prior render.

## Audit Evidence

- Test output for both new suites, including the three planted failures.
- The rendered table and finding text captured from the jsdom render of the current snapshot.

## Known Gaps

- **Verified by render, not by browser.** The jsdom harness the repo already uses for Home proof
  confirms the content; a signed-in browser check is still owed before this is called live-proven.
- **Five chapters are mapped to estate families; three are not.** Chapters answering questions the
  estate files do not carry render no table set, deliberately.
- **The interpretive layer is untouched.** This adds what can be counted. What a pattern means still
  comes from the narrative path, which remains the open problem.
