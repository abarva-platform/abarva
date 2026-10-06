# Gate summary states whether it counted criteria or gate standing

## Release ID

`2026-10-05-gate-summary-basis`

## Status

Merged candidate — flag-free correctness fix to a payload field and one
printable product surface.

## Plain-English Summary

A program's synthesis context carries a small gate tally: `total`, `met`,
`unmet`. It is built two different ways, and only one of them is a measurement.

When a typed lifecycle pattern is available, the gate evaluator runs and those
numbers count real, evaluated criteria. When no typed pattern resolves, the
builder takes a shape-only fallback: there are no criteria to count, so it
reports the phase gate's own approval state as `total: 1`, `met: 1 or 0`.

Both paths fill the same two fields. So a surface that formats them as a ratio
cannot tell a measurement from a boolean. The printable program report did
exactly that, rendering `0 / 1 gates met` and labelling it a health score. Read
plainly, that says one criterion was assessed and failed. Nothing was assessed.
An instance with no typed pattern has no gate criteria at all, and the report
gave that absence the authority of a completed evaluation.

The fix does not change a single number. It adds the missing fact — which
question the pair answers — and lets the surface say it. The report now reads
`Gate not approved — no criteria evaluated` on the shape-only path and keeps
the familiar `3 of 4 gate criteria met` wording wherever the evaluator ran.

## Layer Impact

Lane: `global-control-lane` — this corrects a client-visible figure on a
printable report rendered with no feature-flag conjunct, so it is not gated
behind anything new and cannot be gated behind anything existing.

Layers 3 and 4. The canonical gate counts are left byte-identical; the only
data-model change is an additive, optional `basis` discriminator on the
existing `gatesSummary` payload field, which no stored object and no migration
touches. Layer 4 changes one projection's label. No tenant data, no canonical
object, no table, no key and no registry entry changes.

## Client Applicability

All clients, but only where an instance resolves no typed lifecycle pattern —
which is precisely the case the old wording described falsely. Instances with a
typed pattern see byte-identical wording, because the criteria branch keeps the
previous string.

## Why this is the honest direction

The counts were not wrong for the question their main readers ask. Several
consumers ask *can this advance?*, and for them an approved gate genuinely is
cleared. Redefining the shared tally to satisfy one surface would have broken
those readers to fix a label.

So the shared count stays as it is, and the surface that formats it gets the
basis it was missing. This is the same resolution two earlier figure-agreement
slices used: give the reader its own derivation rather than restating a number
other readers depend on.

The basis is also deliberately not inferred from `total === 1`. A pattern may
declare exactly one criterion for a stage, and guessing from the total would
relabel that real measurement as unmeasured. The shape-only path stamps itself
explicitly; an absent stamp reads as `criteria`.

## Changes Included

- `src/lib/reasoning/gate-summary-basis.ts` (new, pure): the `basis` type, a
  reader that defaults an absent stamp to `criteria`, an `isCriteriaMeasured`
  predicate, and `describeGateSummary` — the wording a surface should use.
- `src/lib/reasoning/types.ts`: additive optional `basis` on `gatesSummary`,
  documented with what each value means and which helper to format it with.
- `src/lib/reasoning/program-synthesis-context-builder.ts`: stamps `criteria`
  on the pattern-aware path and `gate-standing` on the shape-only fallback.
  Counts untouched at both sites.
- `src/app/programs/[id]/report/page.tsx`: the health-score line is derived
  through `describeGateSummary` instead of formatting `met / total` directly.
- Two test suites (new + extended), covering the module and the builder.

## QA / Validation

- **PASS** — `jest src/lib/reasoning/__tests__/gate-summary-basis.test.ts`:
  1 suite, 6 tests.
- **PASS** — `jest src/lib/reasoning/__tests__/program-synthesis-context-builder.test.ts`:
  1 suite, 38 tests, including three appended cases that pin the stamp at both
  construction sites. The builder half matters: a pure-module guard alone would
  stay green if the builder's stamp were reverted.
- **PASS** — the whole `src/lib/reasoning` directory: 59 suites, 769 tests.
  Run in full because the widened payload field is read across that layer.
- **PASS** — mutation check, 3 mutations, 3 deaths: reverting the shape-only
  stamp to `criteria` killed 1; forcing the ratio wording for every basis
  killed 3; inferring the basis from `total === 1` killed 1. Baseline restored
  to 769 of 769 afterwards. A fourth attempt reported 763 of 769 — six tests
  fewer, which meant the mutated file no longer parsed and the suite never ran,
  not that the mutation survived; it was re-run as a syntactically valid edit.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0, judged on the exit
  code.
- **PASS** — `eslint` over the four changed/added source files, exit code 0.
  One pre-existing unused-type warning in the shared types file is untouched.
- **PASS** — `release:check --base origin/main --head HEAD`, 11 of 11 gates.
- **NOT RUN** — signed-in walk. This surface is a printable program report, and
  the shape-only path needs an instance that resolves no typed pattern; neither
  is reachable from the enrolled demo tenant's seeded instances, all of which
  have typed patterns. Stated as not run rather than implied.
- **NOT RUN** — no catalog entry and no census refresh, deliberately. The
  required `Typecheck + reasoning-layer tests` job runs
  `npx jest src/lib/reasoning` with no path filter, so both new/extended suites
  are already swept. Verified by reading the workflow before adding anything.

## Audit Evidence

- The two construction sites in `program-synthesis-context-builder.ts`, each
  carrying a comment naming what its numbers counted.
- The mutation results above, which show each guard failing for the reason it
  exists.

## Rollout Plan

Ships with the next default-branch deploy through the repo-owned ACA main
deploy workflow. No flag to enable, no tenant enrollment, no data build.

## Rollback Plan

Revert the commit. The change is additive at the data-model level and
label-only at the surface, so a revert restores the previous wording with no
stored state to undo and no migration to reverse.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command of any kind
was run while building this slice.

## Known Gaps

- **Three other readers of this tally still state no basis.** The health board,
  the dashboard summary and the provenance ribbon helpers read `gatesSummary`
  and ask *can this advance?*, which is a fair use of the counts — but none of
  them says so, and a shape-only instance pools into them identically to a
  measured one. This slice gives them the field they would need; adopting it is
  the next instance.
- **A pooled percentage over mixed bases is still available to any caller.**
  Nothing yet stops a surface from averaging measured and gate-standing
  summaries into one rate. The honest fix is for pooling readers to exclude or
  separately report gate-standing instances, which is a change to those
  readers, not to this field.
- **The report surface has no render test.** The guard here is on the pure
  module and the builder; reverting just the one line in the report page would
  restore the ratio wording with every suite still green. Declared rather than
  implied.
- `waived` still counts toward `met` on the criteria path, and remains
  construction-only upstream. Untouched here.
