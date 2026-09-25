# 2026-09-25-c511-split-table-row-prose-leak — order the shaper's two passes so a table row cannot be split into prose

## Release ID

`2026-09-25-c511-split-table-row-prose-leak`

## Status

`candidate`

## Plain-English Summary

When an assistant answer contains a markdown table, the shared response shaper
compacts it for chat: it summarises the table into one line and keeps a few
sentences of prose around it. To build that prose it first strips the table rows
out, on the rule "a line that starts and ends with a pipe is table markup, not a
sentence".

Those two steps ran in the wrong order. Before the rows were stripped, a cleanup
pass rewrote the pattern `" - Breakdown:"` into a line break — a rule that exists
to unpick assembly artifacts in ordinary prose. When the text carrying that
pattern came from a substituted label rather than from the model, the rewrite
landed **inside** a table row and cut it in half. The first half then had no
trailing pipe and the second half no leading pipe, so neither looked like table
markup any more, both survived the strip, and the two halves were rejoined into a
sentence. The reader was handed raw markup in a support bullet:

```
- | Northwind | $1.2M Breakdown: modules idle | renewal March | | Crestline | ...
```

Measured on `main` at `7dd4aee76` through the public entry point: eight `|`
characters in the delivered answer, identically for a hyphen, an en dash and an
em dash, and for a label in any of the three cells.

The fix is the order of the two passes: rows are stripped first, so the cleanup
never sees one and cannot split one. The cleanup's own rule is untouched. That
matters, because narrowing it is exactly what a previous item widened — and the
suite from that item is what now keeps this fix from being taken back by the
cheaper route.

## Layer Impact

Release lane: `global-control-lane` — shared answer-shaping behavior for every
tenant, not client-scoped and not feature-flagged.

- **Layer 3 — Canonical model:** none. No schema, loader, projection or read
  model changes. No number changes; the shaper does not compute values.
- **Layer 4 — Products:** the visible text of a compacted assistant answer that
  contains a markdown table. Only answers that were already leaking markup change
  — an answer that never triggered the split is byte-identical, which is pinned as
  a test case in its own right.

## Client Applicability

- All clients: yes — `shapeSharedAdvisorResponse` is the shared settled-answer
  shaper, so any tenant whose answer carries a table is covered.
- Specific clients: none singled out.
- Internal only: no
- Public/demo only: no
- Feature flag: none. The change is a strictly narrower output (markup removed,
  prose kept), so it ships unflagged.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — `compactForChat` builds `proseOnly`
  as `removeSectionHeadings(normalizeAssemblyArtifacts(removeMarkdownTables(...)))`
  instead of running the cleanup innermost. Twelve lines, eleven of them the
  comment explaining why the order is load-bearing and why the cleanup rule must
  not be narrowed instead.
- `src/__tests__/behaviors/shared-shaper-table-prose-leak.test.ts` — new. Nine
  sweep cases (three dash characters × the label planted in each of the three
  cells) asserting no `|` reaches the reader, plus a positive control that the
  table's content is still delivered and a false-positive case that an answer with
  plain labels is unchanged.
- `src/__tests__/behaviors/shared-shaper-table-dash-class.test.ts` — one pinned
  character length updated `536 → 526`, in place and with the reason written above
  it. The bullet that shortened is the leaked row being replaced by a real
  sentence; an assertion that the answer contains no `|` is added beside it so the
  number is not the only thing holding that line. Nothing was deleted.

## QA / Validation

Measured in a dedicated worktree at `origin/main` `7dd4aee76`, with a clean
baseline over the same scope before the change.

| scope | before | after |
|---|---|---|
| the ten suites that import the shaper | 0 failing / 129 passing | 0 failing / 140 passing (11 added) |
| `src/lib/answer` + `src/lib/agent` | — | 0 failing / 1045 passing, 75 suites |
| new suite, red-first | 9 failing / 11 | 0 failing / 11 |

**Red first, then two mutations.**

1. *Red first.* The nine sweep cases fail on unmodified `main` — the value-cell
   case is the one already observed, and the vendor-cell and note-cell cases show
   the defect does not care which cell the label occupies. The positive control and
   the false-positive case pass before the change, which is what makes them
   controls rather than part of the detector.
2. *Mutation — revert the pass order.* Restoring
   `removeMarkdownTables(normalizeAssemblyArtifacts(...))` turns 9 of the new
   suite's 11 cases red, and the updated length assertion in the dash-class suite
   red as well (it reads 536 again). So the updated number is a live assertion, not
   a constant re-pinned to whatever the code now prints.
3. *Mutation — take the forbidden shortcut.* Narrowing the table branch's
   separator class back to the em dash alone — the "fix by narrowing the cleanup"
   route this item's acceptance rules out — turns 4 of the dash-class suite's 5
   cases red **and** the new suite's positive control red. The earlier item's guard
   is therefore still live after this change rather than retired by it, which was
   the thing worth checking.

Also run: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— exit 0, judged on the exit code rather than on a grep; `npx eslint` over the
three changed files — exit 0, no findings.

**Not caused by this change, and stated rather than absorbed.** A full
`npx jest src/__tests__/behaviors` run on this machine is unstable in the census
suite family (`test-ci-coverage-census`, `programs-unit-directory-ci-coverage`,
`enterprise-context-ci-coverage`, `governance-tenant-library-ci-coverage`,
`t471-stale-suite-triage-ci-coverage`). Three successive full-directory runs on the
**unmodified** tree reported 3 then 5 failing suites, and the same family accounts
for every failure seen with the change applied. Run on their own — clean or with
this change, with the new file staged — all five pass: 65 of 65. They shell out to
the census script per test, so they appear to be contending under a
full-directory parallel run. The new test file needs no census refresh: the
repository-level census assertions are structural (internal consistency, the
behaviors directory not reported uncovered) rather than exact-count pins, and
`src/__tests__/behaviors` is already a covered directory.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic; there is no migration, no job, no flag and no data build. Nothing
here requires an operator step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`. No branch, local or ad-hoc Azure command touches shared runtime.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow at build time.
- ACA runtime invariant: to be proven after the deploy run — Container App
  template image digest equal to the 100%-traffic revision digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the visible answer text. **Owed, not
  claimed** — an agent may not perform a signed-in acceptance, so this record does
  not assert one. The behavior is proven at the shaper's public entry point.

## Rollback Plan

Revert the single commit. The change is one expression's argument order plus
tests; there is no state, no migration and no stored output, so a revert restores
the previous behavior exactly — including the leak.

## Audit Evidence

- The pull request and its required checks.
- The merge SHA, and the deploy run at or after it (a run keyed to the SHA may be
  cancelled by concurrency; read the newest run at or after it).
- `docs/releases/records/2026-09-25-c511-split-table-row-prose-leak.md` — this file.
- The two mutation results above are reproducible from the commit: revert the
  argument order, or narrow `TABLE_CELL_SEPARATOR_RE` to `/\s+—\s+/g`, and run the
  two named suites.

## Known Gaps

- **A row already missing a pipe is out of scope.** This fix stops the cleanup
  from splitting a well-formed row. A row that arrives from the model already
  malformed — no trailing pipe, say — never matched the strip rule in the first
  place and still reaches prose. No instance was observed; it is named because the
  strip rule's shape makes it possible, not because it was measured.
- **The trigger is still caller-supplied label text.** As with the preceding item,
  no production caller passes `labels` carrying this pattern today, so the leak was
  reachable through the public entry point but not yet observed in a delivered
  answer. That is a reason to fix the ordering, not a reason to call it theoretical:
  the substitution path is live and what it substitutes is not this module's choice.
- Signed-in acceptance on the deployed SHA is owed.
