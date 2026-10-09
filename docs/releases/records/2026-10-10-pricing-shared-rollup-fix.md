# 2026-10-10 — Pricing effort engine: shared-block roll-up and hours totals fix

## Release ID

`2026-10-10-pricing-shared-rollup-fix`

## Status

`candidate`

## Plain-English Summary

Two counting defects in the pricing effort engine's roll-up code
(`src/lib/pricing/effort-engine/cost-engine.ts`) are fixed.

- **Hours totals counted a rule's hours once per role.** The engine emits
  one line per (activity pack, rule, role). Every role line repeats the
  rule's pack-level hours (`moduleHours`); the role's own share is
  `roleHours`. `aggregateTotals` summed `moduleHours` on every line, so a
  rule split across three roles was counted three times. Hours are now
  counted once per (pack, rule). Costs were already right: each role line's
  cost is its own allocated share, and they are still summed per line.
- **The portfolio roll-up counted only the first line of a shared block.**
  `rollUpPortfolio` deduplicated shared lines by the shared-cost reference
  alone. A shared pack with several rule or role lines therefore kept only
  its first line, even inside the one Move that owns it, so a one-Move
  portfolio came out below that Move's own total. A shared block is now
  deduplicated as a whole: the first Move (by input order) that carries the
  reference owns it, every line of the block in that Move counts, and every
  later Move's copy is dropped. `occurrenceCount` now counts Moves, not
  lines, as its docstring always said.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 (canonical model) calculation library only. No schema, migration,
  reference data, route or UI code changes.
- Products: the Moves cost/effort estimate shows the corrected hours on its
  next run. `rollUpPortfolio` has no product caller yet.

## Client Applicability

- All clients: yes, for estimates priced by role mix (the default basis).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This is a correctness fix to an existing calculation.

### Totals that change

- **Displayed, on the next run:** `totals.totalRawHours` and
  `totals.totalExpectedHours` of a role-mix estimate drop to the true
  hours. The cost/effort results view shows these as "Raw hours" and
  "Expected hours". On the reference pack, 46 of 49 activity packs have more
  than one role, so every role-mix archetype changes (for example, the
  first archetype's golden fixture goes from 9,902.04 h to 3,630.92 h).
- **Unchanged:** every cost total (labor, manual, total), the gap count,
  the low/expected/high range (it is computed from cost), and every pod-basis
  output.
- **Persisted:** approved estimate snapshots are append-only rows. Existing
  rows are not rewritten and keep the hours they were approved with. A
  snapshot approved after this release records the corrected hours. The
  business-case projection that reads snapshots does not read hours.
- **Portfolio:** `rollUpPortfolio` deduplicated totals rise to include every
  line of each shared block once. It has no product caller, so nothing
  displayed or stored changes.

## Changes Included

- `cost-engine.ts`: `aggregateTotals` counts hours once per (pack, rule);
  `rollUpPortfolio` deduplicates shared blocks whole, by first owning Move,
  and counts occurrences per Move. Docstrings describe both rules.
- `__tests__/cost-engine.test.ts`: new exact-arithmetic cases for
  multi-role hours, out-of-scope exclusion, same rule code in two packs, a
  gap on a rule's first role line, multi-line shared blocks across two and
  three Moves (both orders), and a one-Move portfolio equal to the Move's
  own total. One existing case is changed (see QA).
- `__tests__/effort-engine.test.ts`: an engine-level case — the synthetic
  pack's hours total is 539 h, not 939 h, and equals the summed role hours.
- `__tests__/golden-fixtures.test.ts`: the two hours columns are re-pinned
  (costs unchanged), with a comment saying why, and a new per-archetype
  check that role-mix and pod hours agree.

## QA / Validation

- Failing tests first: 8 new or changed cases failed against the old code,
  each for the stated reason (for example, 939 h instead of 539 h; 1,000,000
  instead of 1,390,000 for a two-Move portfolio).
- Existing pinning test: the case "a single Move's own already_funded line
  is deduped against itself" expected 400,000 from two role lines of one
  shared pack. It was captured from the code when the engine was first
  added; no design document states a within-Move rule. It pins the defect:
  it made a one-Move portfolio smaller than that Move's own 800,000 total.
  It now expects 800,000 and `occurrenceCount` 1.
- Golden fixtures: the hours were captured by running the engine, not
  derived independently. The engine's own test already said role lines
  repeat pack-level hours and must never be summed across roles.
- Comparison run (temporary script, deleted): old and new `aggregateTotals`
  over every archetype in the committed reference pack, in four scenarios
  (traditional, AI-accelerated, vendor-led, client-led) and both pricing
  bases, with module factors and shared references on the shared packs.
  64 outputs, 3,584 line items. Cost fields differing: 0. Outputs with
  identical totals: 32 (all pod outputs). Outputs with changed hours: 32
  (all role-mix outputs). Every hours change equals exactly
  (role lines − 1) × hours, summed over the 952 multi-role rule groups; the
  1,112 single-line rule groups contribute the same hours as before.
  Unexplained differences: 0. After the fix, role-mix hours equal pod hours
  for every archetype.
- Portfolio comparison: all 56 ordered pairs of archetypes. Naive sums
  unchanged in 56 of 56. Deduplicated totals changed in 56 of 56, because
  every shared pack in the reference pack has several role lines. Under the
  old code, a two-Move total could fall below one Move's own total. A
  one-Move portfolio equals the Move's own total in 8 of 8 archetypes (old
  code: 0 of 8). With shared references removed, old and new outputs are
  identical in 56 of 56.
- Mutation checks: 16 of 16 mutants killed, one edit at a time with an
  in-memory restore. They cover the hours key (pack only, rule only), no
  dedup, out-of-scope hours, raw versus expected, block owner (inverted,
  never set, last instead of first), first-line-only, per-line occurrence
  counting, block cost not summed or not totalled, and shared-class
  membership.
- `npx jest src/lib/pricing scripts/pricing`: 47 suites, 515 tests, pass.
- `npm run typecheck`: clean. `npx eslint` on the changed files: pass.
- `npm run audit:lib-orphans`: no change against the baseline.
- `npm run audit:test-ci-coverage:write`: no new test files; the census is
  unchanged.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The next estimate run
shows corrected hours. No data migration and no backfill.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: none; no flag.
- Live signed-in proof required: run one role-mix estimate and confirm its
  expected hours equal the summed role hours. Cost must match the previous
  run for the same inputs.

## Rollback Plan

Revert through a pull request. No schema or data depends on the change.
Snapshots approved while the fix was live keep their corrected hours after
a revert.

## Audit Evidence

- Pull request and CI results.
- The failing-first tests, comparison run and mutation results above.

## Known Gaps

- The per-bucket hours in `moves-workflow/execution-service.ts` (`groupBy`)
  still sum `moduleHours.expected` per line. The by-pack breakdown
  overstates multi-role packs. The by-role breakdown shows each role the
  rule's full hours instead of its `roleHours` share. This is a separate
  change.
- Snapshots approved before this release keep the overstated hours. They
  are not rewritten, and no marker says which ones predate the fix.
- The hours key is (activity pack, rule) within one output. A hand-built
  output with two distinct contributions under the same pack and rule code
  would be counted once. The engine never emits that.
- The deduplicated portfolio keeps the first owning Move's copy of a block.
  If two Moves price the same block differently, the first one's figure
  wins. Nothing reports the difference yet.
- The PR4 release record still quotes the old golden hours. It is a
  historical record and is left unchanged.
