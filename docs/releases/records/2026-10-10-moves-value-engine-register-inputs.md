# 2026-10-10 — Moves value engine, increment 2: register inputs and cost basis

## Release ID

`2026-10-10-moves-value-engine-register-inputs`

## Status

`candidate`

## Plain-English Summary

Increment 1 added the deterministic value engine. It could read a register
row or a ROM snapshot only through a resolver that nothing supplied. This
release supplies the register resolver, decides what cost a value case is
measured against, and adds the first read of an evaluated case.

- **Register inputs.** A value-model input can name an assumptions-register
  row, such as V1. The register's own rule decides what counts. A confirmed or
  corrected row counts on its answer value; a confirmed row with no separate
  answer counts on the working value it confirmed. An open row counts on its
  working value but is flagged as needing validation. A proposed, rejected or
  superseded row does not count: the lever is blocked as an unresolved input,
  and the sentence names the row and its status (and, for a superseded row,
  the row that replaced it). A missing row, or a counted row with no number,
  also blocks. It is never read as zero.
- **Default ranges.** When an input declares no range of its own, its
  low/high band comes from the row's confidence: 1 gives ±50%, 3 gives ±25%,
  5 gives ±10%. These are the engine's existing named constants.
- **Cost basis.** The case is measured against, in order: an approved ROM
  snapshot, when a loader is provided (an injected interface only; the ROM
  snapshot path is a separate change and nothing here depends on it); else the
  reviewed P4 estimate model's low/base/high total for the delivery model the
  case is funded on; else nothing, and the case is blocked with a reason. The
  figure an author typed into the value model's own cost is not a basis. The
  expert-kernel default planning rate card is never used. A kernel cost figure
  can only be carried as a labelled, uncounted cross-check: "P2 planning
  benchmark, superseded".
- **Read-only value case.** `GET /api/v1/programs/<moveId>/value-case`
  returns the evaluated case: levers and their statuses, formula terms, the
  monthly cash curve, NPV, payback, breakeven and sensitivity. It also returns
  how each register input resolved and a sentence for every input that blocks.
  It writes nothing.

## Product decisions recorded

- **No default delivery model.** The reviewed estimate always prices both
  internal and vendor delivery for each role pair. Choosing the cheaper or
  the dearer one would decide the funding question for the reader, so the
  case names it (`?delivery=internal` or `?delivery=vendor`). Without it, the
  cost is blocked with a sentence that says so.
- **An approved ROM snapshot that cannot be read blocks.** It does not fall
  back to the estimate, because the ROM snapshot ranks first.
- **US dollars only.** The engine works in dollars and cents. A cost in
  another currency blocks; no conversion rate is assumed.
- **Who sees figures.** This follows the register's own rule. Anyone who can
  change the register, and anyone with financial visibility, sees every
  figure. A read-only viewer without financial visibility sees which levers
  count and what blocks the case, but no amount. Every sentence in the
  response is written without figures, so it is safe for either viewer.

## Layer Impact

- Release lane: `experimental` (feature-flagged; default off).
- Products layer: two new pure modules in `src/lib/programs/value-engine/`
  (register inputs, cost basis), a response projection, one read-only route,
  and a numeric twin of the register's figure rule.
- Canonical model: no schema change. It reads the existing register and P4
  capture rows only.

## Client Applicability

- All clients: no change while the flag is off. The route answers 404 with a
  sentence.
- Specific clients: the synthetic demo tenant has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_value_engine_v1` (tenant policy).

## Changes Included

- `src/lib/programs/assumption-register/model.ts`: `effectiveValue`, the
  numeric twin of `effectiveFigure`, carrying the row's confidence.
- `src/lib/programs/value-engine/register-inputs.ts`: the register resolver,
  built on an injected `listAssumptions`. It reads once, and not at all when
  the case reads no row.
- `src/lib/programs/value-engine/cost-basis.ts`: the cost-basis precedence.
- `src/lib/programs/value-engine/value-case-view.ts`: the response projection,
  the figure redaction and the refusal sentences.
- `src/app/api/v1/programs/[programId]/value-case/route.ts`: the read. The
  order is tenancy, then the flag (which needs the caller's tenant), then the
  Move (the shared cause-blind 404), then the program grants.
- `src/lib/features/registry.ts` and the generated manual: the flag summary.
- Generated: the test census and the tenancy-fence census.
- Tests: three new suites and new cases in the register model suite.

## QA / Validation

- A synthetic golden case, with every figure worked by hand. The spend base
  comes from a confirmed row (8,000,000, confidence 5). The reduction comes
  from an open row (0.12, confidence 3). The discount rate comes from a
  corrected row (answer 0.08; the wrong working value 0.10 is never used).
  The cost is the reviewed internal estimate ($135,000 / $150,000 /
  $180,000):
  - Annual: $311,040 low, $460,800 base, $633,600 high. Each figure
    recomputes exactly from its formula terms.
  - Payback: month 7 (low), 4 (base), 3 (high). NPV matches an independent
    month-by-month discount.
  - Breakeven: a 3.90625% reduction (closed form).
  - The open row is flagged as needing validation, on the target and on the
    driver delta it feeds.
- Every register status, missing rows, counted rows with no number,
  confidence bands and range override, the release-path case, out-of-domain
  register values, cost-basis precedence and every blocked reason are each
  covered. So are route order, the flag (a truthy non-boolean does not turn
  it on), the cause-blind 404, both directions of figure redaction, and named
  500s for failed reads.
- New tests: register inputs (33), cost basis (37), value-case route (24),
  register model (14).
- Mutation checks: 95 mutations across every new module, `effectiveValue` and
  the route. Each was applied alone and the file restored from a private
  backup. All 95 fail a test, except one that fails the type check. That one
  removes the resolver's ref-kind guard, which behaves the same at runtime.
  Three survivors from the first pass were closed with new tests: a corrected
  row's sentence, rounding an estimate to the nearest cent, and not mutating
  the saved case. One malformed mutant was rewritten and then killed.
- Combined run: programs library, feature flags, value-case, register and
  capture routes, and the aVa propose tool (231 suites, 3,664 tests) pass.
- `npm run typecheck`: clean. ESLint: clean on all changed files.
- `npm run audit:lib-orphans`: no change against the baseline.
- `npm run audit:route-reachability` and `npm run check:export-reachability`:
  nothing new unreachable.
- `npm run audit:test-ci-coverage:write`: covered test files rise by exactly
  the three new suites (2,785 → 2,788). The new route test directory is fully
  covered by the v1 API route sweep. The two library suites are covered by the
  `src/lib/programs/__tests__` sweep.
- Tenancy-fence census regenerated: the new route is recorded with the same
  classification as its sibling register route.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on only for
the synthetic demo tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: `moves_value_engine_v1` in the flag registry,
  with the tenant allowlist environment variable.
- Live signed-in proof required: on the demo Move, `GET .../value-case`
  answers `value_model_not_structured` with its sentence while the value plan
  is free text. No editor writes a structured model yet, so the evaluated
  path is proven by the route tests until increment 4.

## Rollback Plan

Turn the flag off, or revert through a pull request. Nothing is written by
this release, so there is no data to undo.

## Audit Evidence

- Pull request and CI results.
- The golden case, mutation results and census changes above.

## Known Gaps

- No ROM snapshot loader is wired yet. The route always measures against the
  reviewed estimate, or blocks. A lever input that names a ROM snapshot stays
  unresolved.
- The delivery model is a query parameter. It is not yet stored with the
  value model; that belongs to the editor (increment 4).
- A register value is used in the unit it was recorded in. A share stored as
  12 (percent) instead of 0.12 is refused as out of range, with the row named.
  It is not converted.
- No editor, generation context, gate, workbook or Tower projection reads the
  engine yet (increments 3 to 5).
