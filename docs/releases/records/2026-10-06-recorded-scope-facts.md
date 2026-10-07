# Source — the scope column is read as the facts it records

## Release ID

2026-10-06-recorded-scope-facts

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The Source New workspace rendered four governed facts as one paragraph.

`source_events.scope_description` is a single column but it is not free text:
`buildSourceScopeDescription` writes four labelled facts into it, and
`parseSourceScopeDescription` reads them back. The approval surface and the strategy builder already
parse it. The workspace did not, so the Request and Define panels showed the whole column under one
**"Scope"** heading, which an operator read as prose:

> Scope boundary: … Value target: … Baseline owner: … Category: …

Those are three separate things a buyer acts on — what is in and out, what the event is trying to
achieve, and who owns the baseline — plus a category.

Two defects, both observed on the running product:

1. **Four facts under one heading.** Now rendered as their own rows: *Scope boundary*, *Value
   target*, *Baseline owner*.
2. **The category appeared twice in the Request panel** — once as its own field and once inside the
   paragraph — and **not at all in the Define panel**. The split deliberately drops the category,
   because the event's own field is the authority for it.

## The boundary

**A description that carries no labels is left alone.** `parseSourceScopeDescription` resolves a
bare string to `scopeBoundary`, which is right for its existing callers and wrong here: a plain
sentence recorded as the scope *is* a scope, and relabelling that row "Scope boundary" renames it
without telling the reader anything new.

This was not a judgement call made in advance — the existing request-summary suite caught it. Its
fixture records a plain sentence, and the first version of this change renamed its row. The suite
was right and the code was wrong, so the split is now offered only when the column genuinely carries
labels.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product). One new view module, consumed by the Request fact builder and the Define panel.
No schema change, no migration, no new query, and no change to what is written — this is a read of a
column that already held these facts.

## Client Applicability

**All clients**, no gating and no feature flag. Visible on any event whose scope description is in
the labelled form; events with a plain description render exactly as before.

## Changes Included

- `src/lib/source/new-workspace/recorded-scope-facts.ts` — the view over the existing parser.
- `src/lib/source/new-workspace/historical-request-summary.ts` — Request facts split; the duplicate
  category removed.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — the Define panel renders the split.
- `src/__tests__/behaviors/source-recorded-scope-facts.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 10 cases |
| Workspace + new-workspace suites | PASS — 20 suites, 269 tests, no regression |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — return the category too (restore the duplicate) | PASS — 3 cases failed as intended |
| Mutation — split a bare description as well | PASS — 2 cases failed as intended |
| Mutation — never split (the defect restored) | PASS — 4 cases failed as intended |
| Mutation — keep the raw Scope row alongside the split | PASS — failed as intended |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Signed-in acceptance | NOT RUN |

The test fixture has the shape observed on the running product — four labels, in that order, in one
column — rather than a shape invented for the test.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. Both panels return to one "Scope" row holding the whole column, and the Request
panel repeats the category again.

## Audit Evidence

- A mutation that returns the category from the split fails, which is the specific duplicate this
  removes.
- A mutation that splits unlabelled descriptions fails, so a plain sentence cannot be silently
  relabelled.
- The Request builder's existing suite passes unchanged, so the split did not alter the row set for
  a description that was already rendering correctly.

## Known Gaps

- **Display only.** The column still stores four facts in one text field. Storing them separately is
  a schema change and is not attempted here.
- The Define panel still shows no category at all; this change removes the duplicate from the
  Request panel rather than adding the missing row to Define. Which panel should carry it is a
  product decision, not an implementation one.
- Labels are matched by the existing parser. A description written with a label the parser does not
  know still renders as one row, correctly, but silently.
- Not deployed and not live-proven. No signed-in readback. The defect was observed signed in; the
  fix has not been.
