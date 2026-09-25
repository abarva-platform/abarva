# 2026-09-25-c511-split-table-row-prose-leak — the artifact cleanup runs per line and leaves a markdown table row alone

## Release ID

`2026-09-25-c511-split-table-row-prose-leak`

## Status

`candidate`

## Plain-English Summary

When an assistant answer contains a markdown table, the shared response shaper
runs a cleanup pass over it that unpicks assembly artifacts in prose. One of that
pass's rules rewrites the pattern `" - Breakdown:"` into a line break.

The pass ran over the whole answer at once, so when that pattern arrived **inside**
a table row — it can, because caller-supplied label text is substituted into the
answer before this point — the rewrite cut the row in half. The first half then had
no trailing pipe and the second no leading pipe, so neither looked like table
markup to the filter that removes rows, both survived it, and the two halves were
rejoined into a sentence. The reader was handed raw markup in a support bullet:

```
- | Northwind | $1.2M Breakdown: modules idle | renewal March | | Crestline | ...
```

Measured on `main` at `7dd4aee76` through the public entry point: eight `|`
characters in the delivered answer, identically for a hyphen, an en dash and an em
dash, and with the label in any of the three cells.

The cleanup now runs **per line and skips a line that is a markdown table row**.
A row is left exactly as it arrived, so it cannot be split, and the filter that
removes rows still recognises it.

**Why not simply reorder the two passes.** That was the first fix, and it was not
enough. Ordering the filter before the cleanup inside `compactForChat` closes the
bullet above and leaves the same rewrite splitting rows in the other place it runs:
the entry point cleans artifacts once more *after* compaction, and an answer short
enough to take the early return still has its rows intact there — on the path that
exists precisely to leave a short answer's structure alone. Searched over 18,900
constructed inputs with the pass-order fix in place: **3,324 still delivered a
half-row**, reading `| $1.2M` on a line of its own. One rule in one place closes
both. The fix shipped here is the second one; the reorder is not in this change,
because two guards for one defect means neither can be shown to fire.

## Layer Impact

Release lane: `global-control-lane` — shared answer-shaping behavior for every
tenant, not client-scoped and not feature-flagged.

- **Layer 3 — Canonical model:** none. No schema, loader, projection or read model
  changes, and no number changes; the shaper does not compute values.
- **Layer 4 — Products:** the visible text of an assistant answer that contains a
  markdown table. Two behaviors change, both in the reader's favour: a compacted
  answer no longer carries half-rows as prose, and a short answer keeps its table
  whole with the cell text its caller supplied.

## Client Applicability

- All clients: yes — `shapeSharedAdvisorResponse` is the shared settled-answer
  shaper, so any tenant whose answer carries a table is covered.
- Specific clients: none singled out.
- Internal only: no
- Public/demo only: no
- Feature flag: none. Markup is removed and prose is kept; there is nothing to
  stage behind a flag.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts`
  - `TABLE_ROW_RE` — one named grammar for "this line is table markup, not a
    sentence", now read by both the filter that removes rows and the cleanup that
    must leave them alone. Previously the filter had the rule inline and the
    cleanup had no reading of it at all, which is why it rewrote row text as prose.
  - `rewriteAssemblyArtifacts(line)` — the existing chain of rewrites, unchanged,
    extracted so it can be applied per line.
  - `normalizeAssemblyArtifacts(text)` — splits into lines, applies the rewrites to
    every line that is not a table row, and still runs `dedupeVisibleLines` across
    all lines, rows included, so duplicate-row behavior is unchanged.
- `src/__tests__/behaviors/shared-shaper-table-prose-leak.test.ts` — new. Nine
  sweep cases (three dash characters × the label planted in each of three cells), a
  case for the early-return path that the pass-order fix did not close, an
  18,900-input invariant, a positive control and a false-positive case.
- `src/__tests__/behaviors/shared-shaper-table-dash-class.test.ts` — two updates,
  both in place and both with the reason written above them. Nothing deleted; see
  the next section, because one of them relaxes an assertion and that needs stating
  plainly rather than listing.

## QA / Validation

Measured in a dedicated worktree at `origin/main` `7dd4aee76`, with a clean
baseline over the same scope before the change.

| scope | before | after |
|---|---|---|
| the ten suites that import the shaper | 0 failing / 129 passing | 0 failing / **142** passing (13 added) |
| `src/lib/answer` + `src/lib/agent` | — | 0 failing / 1045 passing, 75 suites |
| new suite, red-first | **11 failing of 13** | 0 failing of 13 |

**Red first.** Eleven of the new suite's thirteen cases fail on unmodified `main`.
The two that pass before the change are meant to: a positive control (the table's
content still reaches the reader, so the invariant cannot be satisfied by an answer
that dropped the table) and a false-positive case (an answer whose labels carry no
artifact is unchanged).

**Three mutations, each caught.**

1. *Remove the row guard* — `normalizeAssemblyArtifacts` rewrites every line again:
   **13 of 18** cases across the two suites go red.
2. *Take the route the item forbids* — narrow `TABLE_CELL_SEPARATOR_RE` back to the
   em dash alone: **6 of 18** go red, including **all four** of the preceding item's
   cases. Its guard is live after this change rather than retired by it, which is
   the thing worth checking when a fix touches another item's evidence.
3. *Widen the row grammar* to any line containing a pipe: **2 of 18** go red, so the
   grammar's precision is asserted and not only its existence.

**The 18,900-input invariant, and the remainder it measures.** Over three dash
characters × five label shapes × three cells × 0–6 table rows × 0–4 prose sentences
× well-formed and malformed first row × three character targets × two line budgets:
**zero** answers deliver a half-row when the table is well formed. **7,101** do when
the first row arrives from the model already missing its trailing pipe — that row
never matched the row grammar, so the cleanup still rewrites it and the filter still
ignores it. Both counts are pinned in the suite, so the zero cannot go vacuous and
the remainder is visible to whoever takes it rather than described in prose.

**One assertion relaxed, in one direction, by measurement.** The preceding item's
suite asserted that the three dash characters produce byte-identical answers. That
held only because the cleanup reached inside a table row and mangled all three
identically — and reaching inside the row is this defect. With rows left alone, a
table cell keeps the text its caller supplied, so a hyphen label and an em-dash
label now differ by that one character. They are different labels. Measured over
that suite's own 6,640-input space: **1,355 answers differ, and all 1,355 differ
only by the dash character itself — zero differ structurally.** The comparison
therefore folds the three characters together, and both counts are pinned, so the
relaxation is bounded rather than open: if the 1,355 went to zero, a cell would have
stopped carrying the caller's own text and the folded assertion would no longer mean
what it says. The guard is not retired — with the narrowing mutation applied on top
of this fix, the folded comparison still fails **2,509** times over the same space.

Also run: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— exit **0**, judged on the exit code rather than on a grep; `npx eslint` over the
three changed files — exit 0, no findings; `node scripts/release-check.mjs --base
origin/main --head HEAD` — exit 0.

**Not caused by this change, and stated rather than absorbed.** A full
`npx jest src/__tests__/behaviors` run on this machine is unstable in a family of
census suites — `test-ci-coverage-census`, `programs-unit-directory-ci-coverage`,
`enterprise-context-ci-coverage`, `governance-tenant-library-ci-coverage`,
`t471-stale-suite-triage-ci-coverage`, `test-success-guard-assertions`. Successive
full-directory runs on the **unmodified** tree reported 3 then 5 failing suites, and
that family accounts for every failure seen with the change applied. Run on their
own — clean, or with this change and the new file staged — all six pass: **66 of
66**. They shell out to the census script per test and appear to contend under a
full-directory parallel run. The new test file needs no census refresh: the
repository-level census assertions are structural (internal consistency, the
behaviors directory not reported uncovered) rather than exact-count pins, and
`src/__tests__/behaviors` is already a covered directory.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic. No migration, no job, no flag, no data build, no operator step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`. No branch, local or ad-hoc Azure command touches shared runtime.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow at build time.
- ACA runtime invariant: to be proven after the deploy run — Container App template
  image digest equal to the 100%-traffic revision digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the visible answer text. **Owed, not
  claimed** — an agent may not perform a signed-in acceptance, so this record does
  not assert one. The behavior is proven at the shaper's public entry point.

## Rollback Plan

Revert the single squashed commit. The change is one function split in two plus a
line filter and its tests; there is no state, no migration and no stored output, so
a revert restores the previous behavior exactly — including both leaks.

## Audit Evidence

- The pull request and its required checks.
- The merge SHA, and the deploy run at or after it (a run keyed to the SHA may be
  cancelled by concurrency; read the newest run at or after it).
- `docs/releases/records/2026-09-25-c511-split-table-row-prose-leak.md` — this file.
- All three mutations are reproducible from the commit: drop the `TABLE_ROW_RE`
  test from the `.map` in `normalizeAssemblyArtifacts`; narrow
  `TABLE_CELL_SEPARATOR_RE` to `/\s+—\s+/g`; or widen `TABLE_ROW_RE` to `/\|/`.

## Known Gaps

- **A row that arrives already malformed is the measured remainder.** 7,101 of the
  18,900 searched inputs still deliver a half-row when the first row reaches the
  shaper without its trailing pipe. Such a row never matched the row grammar, so
  neither the filter nor this fix recognises it — it was already leaking before this
  change and still is. It is counted in the suite rather than left to prose, and it
  is a separate item: closing it means deciding what a malformed row should become,
  which is a product call about output, not a bug fix.
- **The trigger is still caller-supplied label text.** As with the preceding item,
  no production caller passes `labels` carrying this pattern today, so the leak was
  reachable through the public entry point but not yet observed in a delivered
  answer. That is a reason to fix it, not a reason to call it theoretical: the
  substitution path is live and what it substitutes is not this module's choice.
- Signed-in acceptance on the deployed SHA is owed.
