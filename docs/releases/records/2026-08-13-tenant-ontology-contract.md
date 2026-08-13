# 2026-08-13-tenant-ontology-contract — Declared node/edge ontology and a validator for it

## Release ID

`2026-08-13-tenant-ontology-contract`

## Status

`candidate`

## Plain-English Summary

Reviewing a well-built tenant package produced three wrong conclusions in a single sitting, all from
one cause: the data was correct, but nothing declared what it meant.

- An edge type (`role`) meant two different things — an executive position and a job family — and
  lived in neither dimension. 1,039 edges pointed at a type with no home table.
- A spend file's population was undeclared, so it was compared against a differently-scoped vendor
  file and reported as internally inconsistent. It was not; the comparison was invalid.
- A deliberately modelled acquired subsidiary was nearly renamed as stray data, because nothing
  declared it as an entity.

A careful reader with full file access got all three wrong. A model with a retrieval window will do
worse, faster, and with more confidence. Volume of rows does not fix this; declared types do.

This adds the missing declaration — node types with a home dimension and key column, relationship
types with a declared domain and range, per-file population scope, and a typed contract for interview
claims — plus a validator that checks a tenant's graph against it.

Run against the most complete tenant package, the validator found **1,514 violations that every
existing gate passes**: two undeclared node types, one undeclared edge type, 62 edges with reversed
direction, and two dangling endpoints.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 semantics. No tenant data was modified, nothing was loaded,
no runtime path changed.

## Client Applicability

- All clients: no. Internal contract and audit tooling.
- Specific clients: none.
- Internal only: yes.
- Feature flag: none.

## Changes Included

- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json`
- `scripts/audit/validate-tenant-ontology.mjs`
- `reports/tenant-data-assessment-2026-08-13/assessment.md`

## QA / Validation

| Check | Result |
| --- | --- |
| `node --check` on the validator | pass |
| Validator against the reference tenant | 3,318 edges / 6,636 endpoints scanned; 1,514 violations surfaced |
| `undeclaredNodeType` | `role` ×1039, `tower_initiative` ×76 |
| `undeclaredEdgeType` | `measures` ×26 |
| `domainRangeViolation` | `has_risk` reversed ×62 (risk→system instead of system→risk) |
| `unresolvedEndpoint` | `function` ×1, `vendor` ×1, `interview` ×247 |
| Tenant files written | **0** |
| `npm run release:check` | passed |

## Rollout Plan

Merge to `main`. The validator is not yet wired into a workflow — deliberately, because it fails today
on real findings. Wiring it is the follow-up, once the findings are triaged.

## Deployment Authority

- Repo-owned deploy workflow: unchanged. Shared runtime mutators: none. No image, flag, or env change.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. Nothing depends on the ontology yet.

## Audit Evidence

- `reports/tenant-ontology/ontology-validation.json` — every violation with counts and samples.
- `reports/tenant-data-assessment-2026-08-13/assessment.md` — the assessment that produced it.

## Known Gaps

- The validator is **not wired into CI**. It would fail today. Wiring it before triage would red-line
  every PR, which is how the last gate got ignored.
- `tower_initiative` and `interview` endpoints have no home dimension. The ontology names the problem
  rather than inventing a table for it.
- Interview endpoints resolve at 0% because interview IDs are not carried in the evidence dimension.
  The typed interview-claim contract in the ontology is a declaration, not yet an implementation.
- The `has_risk` reversal is reported, not corrected. Fixing it edits tenant data and belongs in its
  own reviewed change.
- Node identity is still by display name, not by stable ID. Renaming a vendor silently breaks its
  edges. Adding ID columns to the contract is the larger follow-on this file makes visible.
- Population scope is declared as required but not yet enforced, and no tenant declares it today.

## Follow-ups

1. Triage the 1,514 findings, then wire the validator into CI with `--strict`.
2. Add stable identity columns to the canonical contract so edges join on IDs, not display names.
3. Implement the typed interview-claim contract so interview statements can be corroborated or
   contradicted computationally rather than editorially.
