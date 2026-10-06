# 2026-10-05-moves-home-reconciliation-strip — Moves: the portfolio landing's reconciliation strip agrees with its own counts

## Release ID

`2026-10-05-moves-home-reconciliation-strip`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves portfolio landing ends with a strip that reconciles what
the client declared they are running against what the product is tracking: four
figures — declared programmes, tracked records, declared budget, declared value.

All four were composed inline inside the landing's page component. That
component is an async server component — it checks module access, resolves
tenancy and reads the data plane — so it cannot be rendered in a test. The four
strings it produced were therefore never pinned by anything, and three defects
had accumulated in them:

1. **The count and its noun never agreed.** The declared figure was composed as
   the count followed by the fixed word "programmes" and the tracked figure as
   the count followed by the fixed word "records". A single-programme inventory
   read "1 programmes"; a single-move portfolio read "1 records". Both are
   reachable: the reconciliation reader returns nothing at all only when the
   declared inventory is empty, so a declared count of exactly one reaches this
   strip, and the tracked count is simply the portfolio's length.

2. **A non-finite total would have rendered as money.** The declared budget and
   value come from a projection total. The test for "is there a figure?" admitted
   any number, including a non-finite one, which the currency formatter renders as
   a dollar sign followed by "NaN" — a figure-shaped string in a slot an
   executive reads as an amount.

3. **The copy and the rule that selects it were two separate derivations.** The
   token shown for an undeclared amount was written as a literal at each of the
   two slots, so a wording change at one slot and the rule choosing it could
   drift apart. This is the third time this workstream has met that shape, and
   the second time on this surface.

This change moves all four derivations into one pure module, fixes the
agreement so a count of one reads singular, treats a non-finite total as
undeclared rather than formatting it, and makes the undeclared token a single
named value that the rule itself returns — so copy and rule cannot disagree.
The host keeps a one-line call.

A declared **zero** is deliberately not treated as an absence. Zero is a figure
the inventory asserted and is shown as one; only a missing or unusable figure
reads as undeclared. That is the same rule this workstream applies elsewhere:
the product does not quietly convert "they told us a number" into "they told us
nothing", or the reverse.

One further correctness fix travels with it. The legacy (pre-redesign) landing
renders the same two amounts from the same projection and had the same
non-finite hole; it now shares the new rule while keeping its own, more explicit
wording for an absent figure.

On a tenant where the redesigned landing is off, the strip this change fixes
does not render at all. This is a correctness fix inside an already-flagged
surface plus the matching fix on the legacy surface, so it declares no new flag.

## Layer Impact

Lane: `experimental` — a correctness fix confined to a feature-flagged,
non-default capability (`moves_home_v2`), plus the same rule applied to the two
equivalent figures on the legacy landing. No new flag is introduced.

- `4 PRODUCTS` (Moves): the four strings in the portfolio landing's
  reconciliation strip, and the two amount cells on the legacy landing's
  reconciliation panel. No gate, no advance rule, no persistence, no API shape
  change — every figure is derived at render time from facts already loaded.
- `3 CANONICAL MODEL`: unchanged. No schema, no migration, no stored value. The
  reconciliation reader and the declared-portfolio projection are read exactly
  as they already are.

## Client Applicability

- All clients: No.
- Specific clients, selected by feature flag: the redesigned landing renders
  only where `moves_home_v2` is enabled; its tenant list is currently non-empty
  (one synthetic demo tenant used for signed-in review). The legacy-panel half
  of the change applies wherever that flag is off.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_home_v2` (tenant policy; no new flag added by this
  change).

## Changes Included

- `src/lib/programs/portfolio-reconciliation-summary.ts` — **new**, pure.
  `buildPortfolioReconciliationSummary(facts, formatUsd)` returns the strip's
  four strings or nothing when there is no reconciliation; `countOf(count,
singularNoun)` makes a count agree with its noun from a single spelling;
  `hasDeclaredAmount` is the one rule for "is there a usable figure?", declared
  as a type predicate so a caller that passes the check can hand the figure
  straight to a formatter; `formatDeclaredAmount` chooses between the formatter
  and the named undeclared token **via** that predicate. The currency formatter
  is injected, so the module stays pure and framework-free.
- `src/app/(maestro)/strategic-moves/page.tsx` — the redesigned landing's
  reconciliation prop is now one call to that module; the legacy panel's two
  amount cells use the shared predicate and keep their own wording. The
  component holds no derivation of its own for these figures.
- `src/components/strategic-moves/__tests__/portfolio-reconciliation-summary.test.ts`
  — **new**: a count of one reads singular and every other count (including
  zero) reads plural; the strip never pairs a count of one with a plural noun;
  a missing, NaN or infinite figure reads as undeclared while a declared zero
  reads as a figure; each amount is read from its own field, both independently
  and mirrored; and no reconciliation produces no strip.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new suite by
  exact path, since `src/components/strategic-moves/__tests__` is not swept by
  directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `jest` (new suite `portfolio-reconciliation-summary`) — **PASS**: 13/13.
- `jest` (whole `src/components/strategic-moves/__tests__` directory, the
  preservation evidence for the surfaces this change feeds) — **PASS**:
  34 suites / 417 tests, re-run on the base after a second rebase (which picked
  up a sibling's portfolio value-line fix on the same host, so the earlier
  figures of 410 and 413 would both have been stale).
- Mutation check of the new guards — **PASS**, all five deliberate mutations
  died: restoring the always-plural noun (i.e. restoring the defect) failed 3 of
  13 cases; dropping the non-finite check failed 1; treating a declared zero as
  undeclared failed 1; swapping the two counts at the builder failed 3; and
  cross-wiring the two amounts failed 1.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, 0 type errors across
  the project.
- `eslint` on all changed files — **PASS**: 0 errors, 0 warnings.
- Test-CI registration proof — **PASS**: census `coveredTestFiles` 2528 → 2529
  with `uncoveredTestFiles` unchanged at 164, both counts regenerated on this
  change's own base rather than read from the committed file.
- Signed-in visual walk of this fix — **NOT RUN**: it needs the ACA deploy that
  carries this commit. Owed, and listed under Known Gaps.

## Rollout Plan

Merge to `main` via squash PR with auto-merge. Ships with the next ACA web image
through the repo-owned `aca-main-deploy` workflow. No flag change, no tenant
enrollment change and no data migration are part of this rollout. From the first
render after deploy, a single-programme or single-move portfolio reads in the
singular, and a projection that returns an unusable total reads as undeclared
instead of as a dollar amount.

## Rollback Plan

Revert the PR — the four strings return to being composed inline, with no data
to unwind, since nothing is persisted. Alternatively, disabling `moves_home_v2`
for a tenant removes the redesigned strip entirely (the legacy panel's half of
the fix would remain, and is itself a strict improvement). Both are immediate and
need no migration.

## Deployment Authority

No ad-hoc Azure action was taken or is required. Ships only via the repo-owned
`aca-main-deploy` workflow on merge to `main`. This change shifts no shared
Product/Lab web traffic, mutates no revision weights, changes no Container App
template, env var, scale rule or secret, and runs no data-build job.

## Known Gaps

- **No signed-in walk of this fix yet.** It requires the deploy carrying this
  commit. The walk is also the only way to see the strip at the width an
  executive reads it on.
- **The two landings word an absent amount differently** — the redesigned strip
  shows a dash, the legacy panel says "not declared". The rule behind both is now
  one rule, but the wording is not, and a dash is weaker: a reader cannot tell it
  from a formatting placeholder or from zero. Making the redesigned strip say
  what it means is a copy decision on a design-locked surface, so it is recorded
  here rather than taken unilaterally.
- **The strip's own honesty about scope is unchanged and still partial.** The
  declared-vs-tracked comparison runs over the projection's named sample rather
  than an exhaustive inventory, which the reader is told by its being labelled a
  count and not a diff. This change does not widen or narrow that; it is noted
  so the figures are not read as an exhaustive reconciliation.
- The landing host's own call site cannot be pinned the way the phase host's can:
  it is an async server component, so there is no render-and-mutate test
  available. Pulling the decision out, as this change does, is the only
  available shape; the one-line wiring that remains is covered by type checking
  alone.
- Nothing in this flag-gated surface has been measured at phone width; jsdom does
  not lay out.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR, plus the newly
  registered suite in the AI-surface control catalog job.
- The count/noun agreement rule, the undeclared-figure rule and the per-field
  independence of the four figures are covered by
  `src/components/strategic-moves/__tests__/portfolio-reconciliation-summary.test.ts`.
- Registration of that suite is evidenced by the census delta recorded above.
