# Portfolio and deliverable-canvas figures agree with their own counts

## Release ID

`2026-10-05-portfolio-figure-noun-agreement`

## Status

Merged pending — opened as a release candidate, squash auto-merge armed.

## Plain-English Summary

Three product figures joined a count to a hard-coded plural noun, so none of
them could agree with its own number. The deliverables canvas rendered
`1 of 1 deliverables complete` for a phase holding a single deliverable; the
portfolio index would render `1 move shown` as `1 moves shown`; and a workshop
coverage note joined two counts to two fixed plurals in one sentence.

This is a further instance of a defect class this workstream has been sweeping
for several releases: a client-visible figure whose text cannot be right for
every value it can take. The fix moves all three strings into one pure module
that agrees each noun to the count it describes.

The three figures are **not** equally consequential, and the record states each
verdict separately rather than claiming one blanket severity:

- The **deliverables canvas summary is user-visible.** It is consumed by the
  program detail page, and its builder refuses an *empty* deliverable list while
  admitting a list of exactly one — so the singular case is reachable by
  construction, not hypothetically.
- The **portfolio index summary is construction-only today.** It is consumed by
  the index page, but the host passes the tenant's own Move count, which the
  current catalog fixes at three for one tenant and zero for the other. No
  catalog path yields a total of one, so the wrong reading is not reachable
  today. It is fixed because it becomes user-visible the moment any tenant
  carries exactly one Move.
- The **workshop coverage note has no product consumer at all.** Its builders
  are referenced only inside their own module. No reader has seen a wrong
  figure here, and this record does not claim otherwise.

## Layer Impact

Lane: `global-control-lane` — these three surfaces carry no feature flag at all,
so there is no flag to gate the change behind. This follows the precedent of the
preceding figure-correctness releases in this workstream.

Layer 4 (products) only. No change to canonical model, source adapters, or
client intake. No schema, migration, data-plane, or retrieval change. No new
dataset, no context/corpus object, no model prompt change. One new pure module
under `src/lib/programs/`; three existing modules delegate to it.

## Client Applicability

Specific clients, selected by feature flag — not applicable here: these
surfaces are ungated, so this change reaches **All clients** that can open the
portfolio index and the program detail canvas. Behaviour is identical for every
count except a total of one, where the noun becomes singular.

## Why this is the honest direction

A figure that cannot agree with itself is wrong for at least one value it can
take, and the reader cannot tell which value they are looking at. Agreeing the
noun costs nothing and removes a whole row of unreachable-but-wrong strings.

The noun agrees to the **total**, never to the numerator: `1 of 5 deliverables`
is correct and `1 of 5 deliverable` is not. A dedicated case pins that
direction, because agreeing to the numerator is the plausible wrong fix.

Where the wrong reading is not reachable today, this record says so instead of
inflating it into a user-visible defect. Two of the three figures are declared
construction-only on counted evidence, not asserted severity.

## Changes Included

- **New** `src/lib/programs/portfolio-figure-labels.ts` — one pure module with
  `agreeCountNoun` plus three formatters, each documented with its own
  reachability and product-consumer verdict.
- `src/lib/programs/deliverable-canvas-polish-view.ts` — the canvas summary
  delegates to `formatDeliverableCanvasSummary`.
- `src/lib/programs/programs-page-view.ts` — the index filter summary delegates
  to `formatProgramsIndexFilterSummary`.
- `src/lib/programs/program-health-scorecard.ts` — the coverage note delegates
  to `formatWorkshopCoverageNote`.
- `src/__tests__/integration/programs/programs-detail-prog22-deliverables-canvas.test.ts`
  — 3 cases: a one-deliverable canvas is reachable, the singular noun is used,
  and the noun agrees to the total and not the numerator.
- `src/__tests__/integration/programs/programs-index-page.test.ts` — 5 cases:
  singular total, agreement to the total, a zero total keeping the plural, and
  two coverage-note cases agreeing each of its two nouns independently.

No feature flag declared. No catalog entry and no test-census change: all cases
went into suites that already exist under `src/__tests__/integration/`, which
`test:integration` sweeps by directory.

## QA / Validation

**PASS** — targeted suites. The two suites carrying the new cases:
51 passed / 51 total (8 of them new).

**PASS** — whole integration directory. `jest src/__tests__/integration/programs`:
65 suites passed, 1 skipped, 1483 tests passed, 20 skipped, exit code 0. Run
after the change on the current base.

**PASS** — typecheck. `tsc -p tsconfig.json --noEmit` exit code 0, no output.

**PASS** — lint. `eslint` over all six changed files, exit code 0, no findings.

**PASS** — mutation check, 5 of 5 killed. Each guard was mutated and the suites
re-run before this record claimed the guard works:

| mutation | result |
|---|---|
| canvas noun back to a hard-coded plural | 1 red |
| canvas noun agrees to the numerator instead of the total | 1 red |
| index noun back to a hard-coded plural | 1 red |
| coverage note's category noun back to a hard-coded plural | 2 red |
| coverage note's template noun back to a hard-coded plural | 2 red |

**NOT RUN** — signed-in walk of this change. It needs the deploy that carries
it. The portfolio index and the canvas are both reachable on the live product,
so a walk is claimable once merged and deployed.

**NOT RUN** — narrow-viewport measurement. The test environment does not lay
out, so the singular strings have not been measured at phone width. They are
one character shorter than the plural they replace, so no new overflow is
expected.

## Audit Evidence

- Product-consumer check per figure, which is what separates the user-visible
  figure from the two construction-only ones: the canvas summary is consumed by
  the program detail page and the index summary by the index page, while the
  scorecard builders are referenced only inside their own module and its suites.
- Reachability of the singular case, counted rather than asserted:
  - canvas — the builder returns null for an empty deliverable list and admits a
    one-item list, so a total of one is reachable by construction. A case pins
    that the one-item view is non-null with a total of one.
  - index — the host passes the tenant's Move count; the current catalog holds
    three Moves for one tenant and zero for the other, so a total of one is not
    reachable today.
  - coverage note — no product consumer, so reachability is moot.
- Mutation table above, run before this record was written.
- The existing canvas assertion on the summary only checked it was non-empty, so
  no pre-existing assertion had to be conformed for the canvas. No existing
  assertion in either suite changed.

## Rollout Plan

Squash-merge to `main` through the repo-owned main deploy workflow. No flag to
enrol, no env var, no migration, no data build. The change is live for all
clients as soon as the merged image reaches 100% traffic.

## Rollback Plan

Revert the squash commit. The three call sites are one-line delegations and the
new module has no other dependents, so a revert restores the prior strings
exactly. No data or schema state is involved, so there is nothing to unwind.

## Deployment Authority

Deployed only by the repo-owned ACA main deploy workflow. No ad-hoc
`az containerapp` command, no traffic weight change, no registry build outside
that workflow, and no change to the shared web Container App template from this
branch.

## Known Gaps

- **The signed-in walk of this change is owed** and is not claimed. It needs the
  deploy carrying this commit.
- **A discrepancy in how one suite is reported, found while placing these cases
  and deliberately not fixed here.**
  `src/__tests__/integration/programs/program-health-scorecard.test.ts` fails at
  parse under a direct single-file jest invocation (its import block pulls two
  types in as values), yet the whole-directory run that `test:integration` uses
  reports it neither passed nor failed, and that run exits 0. So the canonical
  gate is green and no red is being hidden from CI, but one suite's ~20 cases
  may not be executing. This was not chased inside a figure-agreement slice;
  it wants its own investigation and is filed separately.
- The singular strings have not been measured at a narrow viewport.
- The index figure's singular branch stays unreachable until a tenant carries
  exactly one Move; it is fixed in advance rather than left as a latent wrong
  string.
