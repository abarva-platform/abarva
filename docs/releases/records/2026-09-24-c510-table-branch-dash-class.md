# 2026-09-24-c510-table-branch-dash-class — Compact table summaries no longer depend on which dash character a label carries

## Release ID

`2026-09-24-c510-table-branch-dash-class`

## Status

`candidate`

## Plain-English Summary

When an advisor answer is too long for a chat surface, the shaper rebuilds it into a
short form. If the answer contained a markdown table, one line of that short form is a
summary of the table's first rows, built by joining each row's cells together and then
turning the join character into a colon.

That "turn the join character into a colon" step only recognised one of the three dash
characters the surrounding cleanup rules recognise. The consequence was not cosmetic: a
value label containing a hyphen in a particular position survived into the rebuild, a
later cleanup rule split it across two lines, the rebuilt answer no longer fit its line
budget, and the shaper fell back to a much shorter rebuild that dropped the table
summary entirely.

Measured through the public entry point on the same answer with the same labels, before
this change: with a hyphen, the reader got 382 characters in 3 lines and no table
summary; with an en dash, the same; with an em dash, 536 characters in 4 lines with the
summary intact. One character inside a label decided whether 154 characters of content
reached the reader.

This change makes the step recognise all three dash characters, so the three answers are
now byte-identical and all three keep the summary.

**What it costs, taken deliberately.** The step rewrites dash-shaped text inside a cell,
not only the separator between cells, because the text it has to neutralise lives inside
the cell. A cell reading `Feb 2026 – Jan 2027` now renders as `Feb 2026: Jan 2027` in the
compacted summary. That cost cannot be designed away by changing how cells are joined —
anything that leaves cell content untouched leaves the line break in place. The narrow
rule was not narrower in kind; it did the same thing to em-dash ranges already, for one
character out of three.

**No live user-visible defect is claimed, and this time that is measured rather than
assumed.** The label-substitution path that triggers the defect is reached through the
shaper's `labels` option. No production call site passes it: `shapeSharedAdvisorResponse`
has exactly one non-test caller, which forwards `options.labels`, and every
`shapeAgentResponseForSurface` call site in the app passes two arguments. The path is
exercised by tests today.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, not gated by a
feature flag.

Layer 4 (Products) only, and only the presentation of an answer that has already been
produced. No canonical model, adapter, intake or loader is touched. No number is
calculated, recalculated or rounded by this change; Tower's deterministic read models are
untouched.

## Client Applicability

- All clients: yes, on any chat surface that compacts a table-bearing answer.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — the table branch's neutralisation moves
  from `/\s+—\s+/g` to a named `TABLE_CELL_SEPARATOR_RE = /\s+[-–—]\s+/g`, matching the
  character class the artifact rule in the same file already uses. One executable line
  changes; the rest is the reasoning and the measurement beside it.
- `src/__tests__/behaviors/shared-shaper-table-dash-class.test.ts` — new behavioural
  suite, five cases.
- `src/__tests__/behaviors/shared-shaper-compact-line-gate.test.ts` — updated in place
  with the reason, not deleted. See "What this costs an existing control" below.

## QA / Validation

**Corpus cost, measured before landing rather than argued.** Of 3,328 non-empty markdown
table cells harvested from every `.ts`/`.tsx`/`.md` file under `src`, **zero** render
differently under the widened class. The only differing string found anywhere under `src`
is a fiscal-year range in a setup-data markdown file that no shaper caller reads; its
shape is reproduced as a pinned test case so the cost is visible rather than latent.

**Red first.** The new suite's first case fails against the pre-change rule — the hyphen
answer has no table summary to contain.

**Suite scope, same command both sides.** `npx jest --runTestsByPath` over the 15 suites
that import the shaper: **15 suites, 0 failed, 186 passed, 4 skipped** before;
**16 suites, 0 failed, 191 passed, 4 skipped** after. Exactly one existing case changed
behaviour under the fix and it is the one named below.

**Mutation check — six mutations, six caught** (failing-test counts of 8):

| Mutation | Failures |
|---|---|
| revert to the em dash alone (the pre-change state) | 5 |
| match the hyphen alone | 6 |
| drop the whitespace requirement (`/[-–—]/g`) | 1 |
| neutralise to a space instead of `": "` | 5 |
| delete the neutralisation entirely | 5 |
| drop the hyphen from the class (`/\s+[–—]\s+/g`) | 4 |

The third of those **survived the first time it was run**, and it is not a no-op: it
renders `multi-year` as `multi: year`. The corpus had no fixture cell containing an
internal hyphen, and a downstream rule that strips whitespace before punctuation made the
mutation's output identical on every fixture that did exist. The whitespace on both sides
of the class is the entire boundary between a cell separator and a hyphenated word, and
widening the class makes that boundary carry more weight than it used to — so a case was
added for it and the mutation now fails.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
with `tsconfig.tsbuildinfo` removed first — **exit 0, zero diagnostics**, exit code read
directly rather than through a pipe. **ESLint** over the three touched files — exit 0.

## What this costs an existing control, and what is NOT claimed

The suite added when the compact rebuild's line budget was last reviewed exists to prove
that the line half of the first rebuild gate is **reachable** and decides the outcome. The
path it measured is the path this change closes, and that was foreseen in its own closing
paragraph.

Searched before landing over **24,900 constructed inputs** — every dash character, five
label shapes including repeated and trailing patterns, 0–8 table rows, 0–5 prose
sentences, with and without bullets, four character targets and five line budgets — with
the gate instrumented to record both of its operands: **zero** inputs drive the first
rebuild over its line budget while under its character target after this change. The
identical search against the narrow rule finds **3,904**, over an identical **17,331**
gate evaluations. The search can see the state it reports missing, which is the only
reason its zero means anything.

So the operand now has no reachable false case. C-510's acceptance asked for a second
still-reachable fixture as the price of landing; the search says none exists, so **that
precondition is falsified rather than met**. It is recorded here and in both suites rather
than quietly skipped. The operand is **kept**; whether an unreachable guard should be kept
or deleted is filed back to the backlog as its own item rather than decided in a test
file.

An earlier draft tried to replace the lost fixture with an invariant — that every returned
answer obeys its `maxParagraphs` budget in lines. Over the same space **5,757 of 24,900**
answers do not, and they are right not to: the early return is measured in paragraphs on
purpose, and the entry point runs the cleanup once more *after* the gate, so the returned
text is not the text the gate judged. That draft assertion stated a contract the code
never had and would have passed on whichever fixtures were checked first. It was replaced
by an equivalence assertion over 13,280 comparisons, which the narrow rule fails.

## Known Gaps

1. **An existing control loses its reachable case, and no replacement fixture exists.**
   The line half of the first rebuild gate has no reachable false case after this change
   — searched, not assumed, in both directions. Deleting that operand today fails no
   test. It is kept, and the keep-or-delete decision is filed back to the backlog rather
   than taken here.
2. **A second defect of the same cause is left open and filed, not fixed.** The cleanup
   rule splits a table row *before* the table filter runs, so neither half of the split
   row matches the filter's pattern any more, the row escapes the filter, and raw `|`
   markup reaches the reader as prose. Reproduced on the label path in the updated suite
   and deliberately not pinned as expected output. Filed as its own item.
3. **The corpus measurement covers `src`.** Cells authored at runtime by a model are not
   in any corpus and cannot be. The pinned range case states the cost for that class
   rather than claiming it does not exist.
4. **No signed-in proof.** Stated and justified under Deployment Authority: no production
   call site reaches the changed path.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image from the merge
SHA and deploys it. No migration, no flag, no data build, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change. No `az` command is run by hand.
- Approved image digest: set by the deploy workflow from the merge SHA; recorded in the
  pulse entry once the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image must
  equal the image of the sole 100%-traffic revision.
- Worker image invariant: unchanged by this release; asserted by the same workflow proof.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** The changed path is reached only when a caller
  supplies the shaper's `labels` option, and no production call site does. A signed-in
  lane here would be a proof with no subject. This is a measurement, not a waiver: if a
  caller starts passing labels, that caller owes the proof.

## Rollback Plan

Revert the PR. The change is one executable line with no state, no migration and no flag,
so a revert restores the prior behaviour exactly. The deploy workflow then rebuilds from
the revert SHA.

## Audit Evidence

- PR for this branch, with the before/after suite counts and the mutation table above.
- The corpus harvest: 3,328 cells, zero differing.
- The reachability search: 24,900 inputs, 17,331 gate evaluations, 3,904 decisive before
  and 0 after.
- CI run on the PR head.
- The deploy run keyed to the merge SHA, and its runtime-invariant artifact.
