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
- `scripts/data-build/enterprise-signal-packet.ts` — analytical lenses now carry their recorded
  content, not only a title: a pattern's business context, its applicability to this enterprise and
  its caveats; a lens's expert role, the questions it puts, and what an answer would decide.
- `src/components/home/v4/fact-lineage.ts` + `FactLineage.tsx` (new) — a figure that shows its own
  working: the grain, the files, the rule, and any other count of the same subject with the reason
  it differs. The hero figure and every finding carry it.
- `src/components/home/v4/business-briefing.ts` + `BusinessBriefing.tsx` (new) — the
  day-one briefing for the two chapters that answer "what is this company": how the money
  is made, the declared priorities verbatim, the leadership position as consensus/dissent/
  contradiction counts, quotes attributed by role, the industry patterns recorded as applying here,
  and the questions this record cannot answer.
- `src/components/home/v4/ChapterPage.tsx` — renders the depth after the readout.
- `src/components/home/v4/RecordBrowser.tsx` — reports columns whose value never varies. The same
  detector the digest reduction uses: one observation, two uses.
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

- PASS `npx jest src/components/home/v4/__tests__` — 65/65, ten suites, no regression
- PASS `npx jest scripts/data-build/__tests__/enterprise-signal-packet.test.ts` — no regression
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

### The interaction is Tower's, deliberately

`src/components/tower/MetricProvenance.tsx` locked a contract for this job in the 2026-05-07
wireframe addendum: a small trailing mark on the value, a floating panel on click, outside-click and
Escape to close. Home follows it rather than inventing a second affordance for the same question — a
reader who learns it on one surface should not have to learn it again on another.

What differs is the content, because the question differs. Tower explains how a metric was
calculated and where it will come from at day N. Home explains what one row means, which file the
figure came from, and — where another surface reports a different number for the same subject — that
number and the reason.

### Why grain, and not just source

The live product reports 750 applications while the estate file carries 306 rows. Neither is
labelled, so a reader cannot tell whether that is a contradiction, a different population, or a
different grain — three different problems with three different fixes. It is the third: one is a
count of application records, the other a count of deployed instances, where a single application in
production, test and disaster recovery counts three times.

How a thing is grouped decides the answer before any arithmetic happens, so every rendered figure
now carries what one row means alongside the number. A count without a grain is not a fact, and
presenting either of those two figures as "the number of applications" states something false out of
two true ones.

An unexplained disagreement is treated as a defect rather than a nuance: the figure is marked not
quotable and both numbers render, rather than one quietly winning.

### What the constant-column check found in the live record

Run against the current snapshot it names four columns on the application estate and one on the data
estate. Two of them change how every cost figure on Home should be read:

```
annualCostBasis      reads "synthetic_modeled" on all 306 rows
annualCostGenerator  reads "system-cost-model/v1" on all 306 rows
```

Every annual cost the product renders is modelled rather than actual, and no surface said so. That is
the class of defect this check exists for: a column filled on every row reads as a clean result and
is a form nobody completed. The same shape as a succession risk of "low" across 225 org units, and
the same shape as a cost column that is constant per tier.

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

### What the briefing renders

Against the current snapshot: the business model and revenue split as declared, five corporate
priorities verbatim, four consensus themes each raised by 44 of 44 interviewed leaders, two minority
views, the 127-of-996 contradiction between testimony and system record, five attributed quotes, and
twelve industry patterns the record states apply here.

Two questions are named as unanswerable from this intake: competitors and market share, and external
benchmarks. Neither has a source anywhere in the nineteen families, so the page states them rather
than letting silence read as "no issue here".

An expert lens now renders as the question a named operating role would put — "Is the RAF capture
program closing suspect conditions at a defensible rate?", from a former payer VP of risk adjustment
-- together with what an answer would decide and the stated limits on using it. That is the outside
view the intake already held and no surface could reach.

## Known Gaps

- **Verified by render, not by browser.** The jsdom harness the repo already uses for Home proof
  confirms the content; a signed-in browser check is still owed before this is called live-proven.
- **Five chapters are mapped to estate families; three are not.** Chapters answering questions the
  estate files do not carry render no table set, deliberately.
- **The interpretive layer is untouched.** This adds what can be counted and what was declared. What
  a pattern *means* still comes from the narrative path, which remains the open problem.
- **The widened lens content needs a packet rebuild to appear.** The builder now carries it and the
  page renders it, with a fallback to the title for any record written before this change — so the
  current snapshot still shows titles until it is regenerated. That is a data-refresh step, not a
  code gap.
- **No competitor or benchmark data exists anywhere in the intake.** Named on the page rather than
  left silent.
- **Lineage covers the hero figure and every finding.** Table cells still render bare; the model is
  general and those are mechanical to convert.
