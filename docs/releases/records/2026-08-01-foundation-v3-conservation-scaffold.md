# 2026-08-01-foundation-v3-conservation-scaffold — Foundation Conservation Gate Scaffold

## Release ID

`2026-08-01-foundation-v3-conservation-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds the schema and operator tooling needed to measure Foundation pipeline output against design expectations instead of adjacent-layer parity. The change is warn-first: it records expected-versus-actual breaches and natural-key quality snapshots, but does not hard-fail existing runs or invalidate an active baseline.

The day-one report now distinguishes executable expectations from frozen snapshots. Expectations that can be answered from a layer upstream of the defect being measured carry executable SQL and are re-derived by the report generator. Expectations that still depend on not-yet-loaded intake or absence declarations are visibly marked as `literal_snapshot` and name their pending relation.

`executable_sql` is valid only when the basis query reaches a layer upstream of the defect being measured. If the defect is registration, a query against evidence repeats the defect as the target and must remain `literal_snapshot` until the intake expectation relation exists.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 / evidence: Adds first-class natural-key columns to evidence items so row identity can be measured and indexed without reloading the raw evidence layer.

Layer 3 / working candidates: Adds first-class natural-key columns to candidate tables so candidate collapse can be detected and later repaired without relying on JSON payload inspection.

Operations: Adds a design expectation ledger, expectation-linked checkpoint columns, and pre/post quality snapshots.

Expectation governance: Stores reusable registered queries, `basis_mode`, basis query references, pending basis relation, referenced basis relations, written relations, and a non-overlap constraint. Active expectations cannot overlap on the same stage/object/scope, and expectations cannot be promoted beyond warn mode without a reviewer.

Conflict governance: Adds a seedable conflict assertion shape for semantic value-role conflicts with both positions, evidence refs, and blocked downstream computations.

Claim governance: Adds a three-state claim permission enum and source-value mappings so `yes`/`partial`/`no` and boolean realized-value fields can be mapped without loss before Cube model generation.

Claim projection testing: Adds a projection-stage expectation requiring partial claim values to carry caveats into consumption projections before Cube consumes them.

Finding visibility: Seeds F-01 as a blocked finding-rule state pending the interview intake relation, so blocked is distinguishable from absent or not-fired.

Architecture: Records Cube as the product semantic layer before Superset, with baseline, broker-boundary, restriction-rendering, generated-model, and pre-aggregation conservation constraints.

Products: No direct product-surface change. The report generator only produces operator evidence.

## Client Applicability

- All clients: schema scaffold and report tooling are tenant-neutral.
- Specific clients: none.
- Internal only: operator report output.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260801162000_foundation_v3_conservation_scaffold.sql`
- Script: `scripts/knowledge/build-foundation-v3-day-one-breach-report.mjs`
- Package script: `foundation-v3:day-one-breach-report`
- ADR: `docs/architecture/adr/ADR-0016-cube-before-superset-semantic-layer.md`
- Operator seeds: registered queries, design expectations, derivation rule breakdown, and conflict assertions emitted by the report generator.

## QA / Validation

- Pass: `node --check scripts/knowledge/build-foundation-v3-day-one-breach-report.mjs`
- Pass: `npm run foundation-v3:day-one-breach-report -- --tenant <tenant> --export-dir <export-dir> --out-dir <out-dir>` against a local Azure layer export; produced a 13-row warn-mode breach report.
- Pass: executable report rows re-derived expected counts from the export and validated that declared basis relations match the SQL `FROM`/`JOIN` relations.
- Pass: one generic query harness executed an expectation-basis query and a finding-rule query without branching on query kind.
- Pass: deterministic T1/T2/T3 derivation report emits per-rule evaluated/resolved/unresolved counts and prior-count deltas.
- Pass: shared T3 delimiter/normalization policy is emitted with the registered derivation query and report.
- Pass: Crew and Station Productivity Copilot semantic value-role conflict seed carries both evidence refs and blocks value-ratio/value-claim computations while open.
- Pass: F-01 is represented as blocked pending interview intake rather than silently omitted.
- Pass: partial claim caveat expectation reports source caveat availability separately from downstream projection certification.
- Pass: authored-file banned-term scan returned no hits.
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR. Apply the migration through the approved database migration path for the target lab data plane. Run the day-one breach report against an exported or live-readback layer package before flipping any expectation from `warn` to `fail`.

## Deployment Authority

- Repo-owned deploy workflow: not required by this change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no, because no product route changes.

## Rollback Plan

The migration is additive. If rollback is required before dependent code uses the new objects, drop the new operations tables, checkpoint columns, natural-key columns, and indexes in a controlled database migration. The report script can be removed or ignored with no data-plane impact.

## Audit Evidence

- Migration diff.
- Script syntax check.
- Generated day-one breach report from an operator-provided export.

## Known Gaps

No hard-fail conservation enforcement is included yet. Source-register, parser-visible row, interview chunk, evidence-gap, and metric-grain expectations still depend on missing intake/absence declaration tables and are therefore marked `literal_snapshot`. Natural-key backfill, candidate repair, review-policy dry run, baseline rebuild, Cube model generation, Cube deployment, Superset sync, finding catalogue implementation, and product semantic API wiring remain separate follow-up changes.
