# 2026-09-12-source-deck-lever-table — The lever table, to the deck's treatment

## Release ID

`2026-09-12-source-deck-lever-table`

## Status

`draft`

## Plain-English Summary

The lever table is the money surface, and it read as a data dump. Five columns
of inline-styled 12px text, the lever's full sentence as its name, no visual
difference between an ask with a traced amount and one that has none, and a
total that did not say what kind of number it was.

It is now built to the deck's treatment. Five columns with the argument in
prose — the lever, the ask, and why the vendor can say yes — and the governance
in two narrow ones. Two things do the governing without a caption:

- A signal-stage lever sits on a dashed rule, greyed, with its amount replaced
  by the reason it has none. It cannot be skim-read as a sized ask.
- The total counts only the sized levers, names itself a candidate, and states
  that it is neither a saving nor a forecast and is awaiting a Finance
  confirmation that has not happened.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation only.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `ContractLeverTable.tsx` — new. The deck's five columns, the dashed
  signal-stage treatment, and the candidate total.
- `WorkspaceExecutiveShell.tsx` — renders it; removes the superseded
  `ProductShellLeverTable` and its 132 lines of inline styles.
- `workspace.css` — the signal-row rule, the unsized-amount cell and the total
  block.
- Tests: the table is now addressed by its column heading rather than an
  aria-label.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/data-model
  src/lib/source/contract-intelligence` — 42 suites, 336 tests, passing.
- The existing browser-surface test caught the lever column rendering the
  full sentence rather than the short label. The deck names each lever in two
  or three words, so the short label is the correct field and the column stays
  a column.
- A duplicated stylesheet block was caught and removed before commit: the CSS
  was appended once before a branch switch and again after.

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
- Live signed-in proof required: **yes.** On a contract with both sized and
  signal-stage levers, confirm the sized rows carry an amount, the signal rows
  carry a dashed rule and a reason instead of a figure, and the total names
  itself a candidate across the sized levers only.

## Rollback Plan

Revert and redeploy. Presentation only; no migration and no data change.

## Known Gaps

- **The candidate range is not reproduced, and cannot be.** The deck shows each
  lever as a band — $150K–$400K — and argues a band is more credible than a
  false point estimate. The opportunity model declares an `amountState` of
  "range" but carries a single `amountUsd`, so no low and high bound exist to
  render. The column is therefore headed "Candidate" rather than "Candidate
  range", so it does not promise a bound the data cannot supply. Adding the
  bounds is a model and loader change.
- **Lever identifiers are not shown.** The deck labels each lever `L-01`…`L-05`
  with a category. No such identifier or category exists on the opportunity, so
  the sub-line carries the value type and timing dependency instead.
- The Performance three-card row and the tag-quality meters remain unbuilt, as
  recorded in the previous release.

## Audit Evidence

- Commit on branch `claude/source-deck-lever-table`.
- CI run for the PR, including `npm run release:check`.
- Local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
