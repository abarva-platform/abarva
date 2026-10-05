# Moves portfolio landing: the value line counts the governed field, not its label

## Release ID

`2026-10-05-moves-home-value-line-governed-field`

## Status

Merged pending — opened as a release candidate PR against `main`, squash
auto-merge armed. Not `live-proven`: the signed-in walk of this build is owed
once a deploy carries it.

## Plain-English Summary

The redesigned Moves portfolio landing shows one line summarising how much of
the portfolio has declared a value: "N of M moves have declared value; the rest
declare in Charter."

That N was being derived the wrong way. The landing took each move's
**formatted, on-screen value label** and counted the ones that did not read
"Declares in Charter" — the fallback copy a move carries when it has declared
nothing. So the figure depended on a string of display copy. Change that copy
in any way, for any reason — a design pass, a wording tweak, a translation —
and every move's label stops matching the comparison, so N jumps to M and the
landing reports the whole portfolio as having declared a value when none of it
has. Nothing in the suite would have failed.

This change makes the figure read the governed field it is actually about. A
single predicate, `hasDeclaredValue`, decides whether a move's `valueAtStake`
declares anything; the value-formatting function consults that predicate to
choose its fallback copy, and the landing's value line counts with it. The
count and the copy are now pinned to each other by tests rather than coupled
through a string, and the value-line builder's signature takes the governed
field, so comparing a rendered label at the host is a type error.

No figure on the screen changes today: the new predicate reproduces the
existing branch conditions exactly, which the added cases assert in both
directions. This is the same defect class as the three capture-phase-strip
fixes that preceded it — a client-visible figure inferred from the wrong
source — found by asking of this figure, as of those, *what measured this?*

## Layer Impact

Lane: `global-control-lane` — the correction lands on a surface that is already
enrolled for a synthetic demo tenant, so it cannot be hidden behind a new OFF
flag. It is a correctness fix inside an existing flagged capability, declaring
no new flag and changing no flag's enrollment.

Layer 4 (Products · Moves) only. No change to layers 1–3: no intake template,
no source adapter, no canonical model object, no schema, no migration, no
loader, no read model. The governed `valueAtStake` field is read, never
written, and nothing is invented from it.

Shared seats untouched: no feature-flag declaration, no route prop, no entry in
the AI-surface control catalog (the suite that carries the new cases is already
registered), and therefore no test-CI-coverage census change.

## Client Applicability

Specific clients, selected by feature flag. The landing renders only where the
portfolio-landing flag is enabled; its tenant list is non-empty and holds one
synthetic demo tenant. Every other tenant continues to see the legacy landing,
which does not render this line and is untouched by this change.

No real client data, identity, or engagement is involved.

## Changes Included

- `src/components/strategic-moves/moves-home-mapper.ts`
  - New `hasDeclaredValue(valueAtStake)`: the one predicate deciding whether a
    move declares a value. Verified above zero, or any projected range,
    counts as declared; an absent field, an empty field, or a verified zero
    with nothing projected does not.
  - New `DECLARES_IN_CHARTER` constant for the fallback copy, documented as
    presentation only and explicitly not to be compared against.
  - New `buildPortfolioValueLine(values)`: the landing's one-line summary,
    derived from the governed field, with the existing singular/plural copy
    preserved verbatim.
  - `formatMoveValue` now picks its fallback via the predicate instead of
    falling through, so copy and predicate cannot disagree.
- `src/app/(maestro)/strategic-moves/page.tsx`
  - The landing host calls `buildPortfolioValueLine` over each move's
    `valueAtStake` and no longer filters formatted labels. The comment records
    why.
- `src/components/strategic-moves/__tests__/moves-home-mapper.test.ts`
  - Four cases: the predicate's truth table in both directions over seven
    governed-field shapes; the fallback copy appears exactly when nothing is
    declared (the drift guard); the line's counts; the singular/plural copy.

## QA / Validation

- **PASS** — `jest src/components/strategic-moves/__tests__/moves-home-mapper.test.ts`
  plus the adapter and landing-component suites: 3 suites, 19 tests.
- **PASS** — the whole `src/components/strategic-moves/__tests__` directory:
  33 suites, 401 tests, 17s, re-run on the rebased base. Run in full rather
  than as a subset because the
  mapper feeds the landing component every sibling suite renders.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0.
- **PASS** — `eslint` over the three changed files, exit code 0.
- **PASS** — mutation check of the new cases, 4 of 5 mutations killed:
  the fallback copy drifting from the predicate (2 cases red), the predicate
  dropping its projected branch (5 red), the predicate dropping its
  above-zero test on a verified amount (3 red), the line losing its singular
  (1 red).
- **DIAGNOSED, NOT A GAP** — the fifth mutation, counting inside the line by
  the formatted string again, kills nothing. That is correct and is the
  point: the copy and the predicate agree by construction and the suite pins
  that agreement, so the two derivations are equivalent *today*. The guard
  against the old derivation is the agreement case, which fails the moment
  the copy drifts, plus the signature, which no longer accepts a label. The
  code comment states this so the surviving mutation is not later misread as
  an untested path.
- **NOT RUN** — signed-in walk. This build is not deployed; the walk is owed
  and is recorded as a gap below.
- **NOT RUN** — phone-width measurement. The suite runs in jsdom, which does
  not lay out.

## Rollout Plan

Squash-merge to `main` through the repo-owned main deploy workflow. No flag
change, no enrollment change, no env or secret change, no data build, no
migration. The landing's value line changes its derivation and not its output,
so the enrolled tenant sees the same figure after the deploy as before it.

## Rollback Plan

Revert the squash commit. The change is three files, two of them
self-contained additions to a pure module and its suite, and the third a
four-line substitution at one call site. Nothing persists state, so a revert
restores the prior behaviour immediately with no data to unwind.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. No ad-hoc Azure command was run for this change: no
`az containerapp update`, no revision weight change, no registry build, no
traffic assignment. No shared runtime template was touched. This record claims
`merged`, not `live-proven`.

## Known Gaps

- **The signed-in walk of this build is owed**, together with the walks of the
  other open slices in this workstream, once a deploy carries them.
- **The line's copy still speaks of "the rest" when there is no rest.** When
  every move has declared a value the line reads "M of M moves have declared
  value; the rest declare in Charter", asserting something about an empty
  remainder. That is a copy decision on a design-locked surface, so it is
  recorded here rather than changed in a correctness slice.
- **The landing host's own call site is still unpinned.** The route is an
  async server component with server-only imports, so unlike the phase
  surface's client component it cannot be rendered in jsdom. This slice moves
  the decision out of the host into a tested pure module and leaves the host
  holding only the mapping from portfolio rows to that module's input; that
  one-line mapping is still asserted by nothing.
- **The reconciliation summary beside this line is derived in the host the
  same way** — four fields formatted inline from the reconciliation totals,
  untested for the same structural reason. Not swept in this slice; a
  candidate for the same treatment.

## Audit Evidence

- Branch `feat/moves-home-value-line-governed-field`, one commit, three files.
- Net delta against `origin/main` by `git diff --stat origin/main...HEAD`,
  recorded on the PR.
- Mutation runs listed under QA / Validation, each reverted from a backup copy
  of the module immediately after its run; the module's final state is the
  committed one.
- `npm run release:check -- --base origin/main --head HEAD`, run locally
  before the push.
