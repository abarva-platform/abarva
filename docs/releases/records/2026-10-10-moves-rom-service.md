# 2026-10-10 — Moves ROM cost engine, increment 3: ROM service, release roll-up and live-formula workbook

## Release ID

`2026-10-10-moves-rom-service`

## Status

`candidate`

## Plain-English Summary

The third increment of the rough-order-of-magnitude (ROM) cost engine for
Moves. It adds the first consumer of the engine core: a pure ROM service, a
workbook builder whose numbers are real Excel formulas, and one read-only,
flag-gated preview route.

What a caller can now do, for a Move in an enrolled workspace:

- **Post a ROM structure.** Use cases with component counts by driver (data
  sources, source tables, standard data entities, dashboard views, design
  rows, validation rows); unit hours per driver, each with a source and a
  confidence; releases that group the use cases, each marked not designed or
  designed; one shared foundation block; a pod (a pod template code, or
  explicit role, level and FTE members) with a delivery location, provider
  class and rate basis; and the friction, productive share and hours per
  FTE-week, each with a source.
- **Get it priced.** Each hours line is count × unit hours × friction and
  carries the engine's formula terms. Each release, and the foundation,
  buys whole weeks of the pod through the existing pod pricer, at rates from
  the cost foundation (role × level × location × provider class) with their
  provenance. A not-designed release carries a 0.75 / 1.50 band; a designed
  one carries the existing score tiers.
- **See the foundation counted once.** The total runs through the existing
  portfolio roll-up, with the foundation's lines carried as one shared block
  under one shared-cost reference. Each release also shows what it would
  cost on its own, foundation included, and the total shows the double count
  it avoided.
- **Download a live-formula workbook** with `?format=xlsx`: Estimate, Component
  Library, Pod & Rates, Releases and Assumptions tabs. Hours, weeks (with
  CEILING), member cost, rates, ranges and the total are formulas built from
  the formula terms, and each formula cell carries a cached value equal to the
  engine's own number.

What it refuses, with a sentence: a counted driver with no unit hours (there
is no reference default, so nothing is guessed), a designed release without
range inputs, a use case in two releases or in none, an empty release, a pod
template with unmatched roles, a rate that does not resolve from the cost
foundation, and malformed input. No AI productivity credit is applied, and the
route writes nothing.

## Layer Impact

- Release lane: `global-control-lane`, behind a tenant flag.
- Layer 3 (canonical model) calculation library: a new pure service and
  workbook builder over the existing engine core. No change to the engine
  core, schema, migrations or reference data.
- Layer 4 (products): one new read-only Moves route. No UI calls it yet.

## Client Applicability

- All clients: no change. The route answers "not enabled" unless the
  workspace is enrolled.
- Specific clients: the synthetic demo tenant only, for signed-in review.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_rom_engine_v1` (tenant policy, default off).

## Changes Included

- `src/lib/pricing/moves-workflow/rom-service.ts` (new): the typed ROM
  structure, validation with a refusal sentence per failure, the per-line
  formula terms, pod pricing per release and for the foundation, the named
  and score-tier ranges, and the roll-up with the foundation counted once.
  Pure; all reference data comes through injected loaders.
- `src/lib/pricing/moves-workflow/rom-workbook.ts` (new): the five-tab
  workbook built with ExcelJS, formulas from formula terms, cached values,
  and money in integer cents beside a dollars column. Caller text is written
  as text, never as a formula.
- `src/lib/pricing/moves-workflow/rom-reference.ts` (new): loaders over the
  committed reference pack (rate bands, delivery locations, provider classes,
  pod library, active range policies), each read once per loader set.
- `src/app/api/v1/programs/[programId]/rom/preview/route.ts` (new):
  `POST`, read-only. Order of fences: tenancy, the flag, the Move (the
  existing cause-blind unreadable-Move body), then the program access policy.
  Every refusal carries an authored `detail`.
- `src/lib/features/registry.ts`: the `moves_rom_engine_v1` flag.
- Regenerated: the Nexus manual, the test CI coverage census and the tenancy
  fence census.
- Three new test suites.

## QA / Validation

- Golden case: pass. Two use cases in two releases and a shared foundation,
  with synthetic counts, invented unit hours and synthetic rate bands.
  Exact results: use-case hours 157.3 and 215.6, foundation 78.1; weeks 2,
  3 and 1; plans $9,600, $14,400 and $4,800; total low / plan / high
  $23,760 / $28,800 / $38,160; total hours 451. Counting the foundation in
  both releases would have summed to $33,600, so the roll-up counts it once.
- Not-designed band: pass. A not-designed release uses 0.75 / 1.50 whatever
  range inputs it carries; a designed one uses the score tier.
- Workbook: pass. The workbook is written to xlsx bytes and read back. A
  small formula evaluator in the test recomputes every formula cell from its
  formula (not its cached value) and matches the cached value and the engine
  output. Editing a count and a unit-hours cell and recomputing gives the
  same totals as a fresh engine run on the edited structure.
- Refusals: pass. Missing unit hours, invalid unit hours, structural errors,
  unresolved rates, unmatched pod templates and missing range inputs.
- Route: pass. Tenancy first, flag before the Move read, the unreadable-Move
  body before the policy, both policy refusals, JSON and xlsx responses, bad
  body, bad format, a missing reference pack (503, not cached) and an
  unexpected failure, each with a `detail` sentence.
- Mutation checks: pass. 78 mutants across the service, workbook, reference
  loaders, route and flag, applied one at a time and restored from a private
  copy; all killed. One first-draft mutant (an `excludeTenants` list on a
  tenant-policy flag) was behaviour-neutral by construction and was replaced
  with a meaningful one.
- `npx jest src/lib/pricing scripts/pricing` plus the route and feature-flag
  suites: 54 suites, 695 tests, pass.
- `npm run typecheck`: clean. ESLint on the changed files: clean.
- `npm run audit:lib-orphans`: no change against the baseline.
- `node scripts/audit/route-reachability-check.mjs`: no new unreachable
  components or exports.
- Test CI coverage census: three new test files, all swept
  (`coveredTestFiles` 2,776 → 2,779; uncovered unchanged at 164).
- Tenancy fence census: the new route is a direct fence with behavioral
  coverage.
- `npm run docs:nexus-manual:check`: current.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The route is off for
every workspace except the enrolled synthetic demo tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: the registry entry in
  `src/lib/features/registry.ts`, or the flag's tenant allowlist environment
  variable, through the same deploy workflow.
- Live signed-in proof required: a signed-in POST for the demo tenant,
  JSON and xlsx, before this is called live-proven.

## Rollback Plan

Remove the tenant from the flag, or revert through a pull request. No data,
schema or other caller depends on the new code, and the route writes
nothing.

## Audit Evidence

- Pull request and CI results.
- The golden, workbook, refusal, route and mutation results above.

## Known Gaps

- No reference unit hours exist yet. Every unit-hours value is supplied by
  the caller with a source and a confidence; a missing one is refused.
- No UI calls the route yet, and nothing is persisted: the preview is
  recomputed on each request.
- The ROM computes hours as driver × unit hours directly through the formula
  terms contract rather than through effort-engine rules, because no ROM
  effort rules exist in the reference pack yet.
- One pod prices every release and the foundation. Per-release pods, tool
  licences and the agent capacity scenario are not part of a ROM yet.
- The total range is the sum of the release and foundation ranges (a fully
  correlated spread).
- Role-mapping flags read a pod member's mapping provenance when the pod
  library carries it. Until proposed role mappings land in the pod library,
  template pods show as confirmed and only explicit members can be marked
  proposed.
- The workbook's weeks formula mirrors the pod pricer's whole-period
  tolerance. Excel's own ROUND can differ from the engine at exact binary
  half-way cases; the cached values always carry the engine's numbers.
- The reference loaders read the committed pack from disk. The pod library
  has no database table yet, so rate bands are read from the pack too rather
  than from the database, for one consistent source version.
