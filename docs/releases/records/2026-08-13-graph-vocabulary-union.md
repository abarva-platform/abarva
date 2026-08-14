# 2026-08-13-graph-vocabulary-union — Derive the graph ontology from all tenants, not one

## Release ID

`2026-08-13-graph-vocabulary-union`

## Status

`candidate`

## Plain-English Summary

The first version of this ontology was derived from a single tenant's graph and then used to measure
every other tenant. Six of seven "failed", one at 33% endpoint integrity with 2,915 violations, and the
obvious next step looked like rewriting those six to match.

That would have been a large migration justified by a sample of one.

A survey of all seven tenants found 32 node types and 40-plus relationship types in use. Most of the
undeclared ones are plain synonyms: `leader`, `owner` and `role` all mean an accountable party;
`platform` means infrastructure; `ai_use_case` means use case; `application_system` means system. A
handful are genuinely distinct concepts that the ontology simply lacked — a contract is not a vendor,
a data domain is not a data asset, and holding-company tenants legitimately model operating companies
as nodes.

So the ontology is now the union of what tenants actually express. Synonyms are collapsed at validation
time, costing nothing and rewriting no tenant data. Genuinely distinct concepts are declared rather
than erased.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 semantics and the validator. **No tenant data was modified.**

## Client Applicability

All clients: no. Internal contract and audit tooling. Feature flag: none.

## Changes Included

- `ontology.json` — 11 → 19 node types, 16 → 21 relationship types, plus a synonym map of 15 node and
  16 relationship variants
- `scripts/audit/validate-tenant-ontology.mjs` — resolves synonyms before checking

## QA / Validation

Violations across all seven active tenants, before and after:

| Tenant | Before | After |
| --- | ---: | ---: |
| healthcare-demo-new | 1,670 | **612** |
| apex-retail | 3,085 | **2,427** |
| lakeshore-holdings | 665 | **431** |
| meridian-health | 2,915 | **2,788** |
| lakeshore-industries | 518 | 515 |
| first-capital-financial | 1,139 | 1,203 |
| skyharbor-air | 90 | 90 |
| **total** | **10,082** | **8,066** |

`npm run release:check` passed. `node --check` clean.

## Read the integrity percentages carefully — the denominator changed

Reported endpoint integrity **fell** for several tenants (one from 33% to 2%). No data got worse.
Previously, an endpoint whose type was undeclared was counted as a violation but excluded from the
resolution check. Now that those types are declared, their endpoints are resolved too — and many do not
resolve. The measurement got stricter and more honest; the percentage is not comparable across the
change, which is why violation counts are given above instead.

## An error found and fixed mid-change

Several synonyms are **inverse** relations rather than direct renames. `uses` runs function → system
while `supports` runs system → function, so mapping one onto the other reverses the meaning and
produces domain/range violations that look like data defects but are mapping errors. The first pass got
five of these wrong and generated roughly 450 spurious violations. Each entry was then checked against
the direction it is actually used in.

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action. The validator remains outside CI.

## Deployment Authority

Repo-owned deploy workflow unchanged. No runtime, image, flag or env change. Live signed-in proof
required: no.

## Rollback Plan

Revert the squash commit. No tenant data is affected either way.

## Audit Evidence

- `reports/tenant-ontology/ontology-validation.json` — per-tenant violations by class with samples.

## Known Gaps

- **One tenant's graph is unusable and this does not fix it.** `lakeshore-industries` has 519 edges
  whose `from_object_name` and `to_object_name` are **empty**. The types are present, the endpoints are
  not. Its graph cannot resolve to anything and the validator can only report that.
- **The remaining problem is identifier convention, not vocabulary.** Tenants disagree on what an
  endpoint name *is*: some use display names (`Epic Hyperspace`), others snake_case identifiers
  (`clinical_ehr`). A synonym map cannot bridge that; it needs per-tenant resolution against the
  identity ledger built in Wave 1. That is the larger remaining piece of graph work.
- `first-capital-financial` got slightly worse (1,139 → 1,203) for the same denominator reason — more
  of its endpoints are now checked.
- The synonym map is a judgement about meaning. `dependency → system` and `control → risk` are
  defensible but arguable, and collapsing a genuine distinction loses information silently. Each entry
  is one line in the ontology so it can be disputed individually.
- Six new node types were declared, but three (`data_domain`, `portfolio_company`, `holding_company`)
  point at home dimensions that do not carry them as keys, so their endpoints will report unresolved.
  That is deliberate: the gap is now visible rather than the type being unknown.

## Follow-ups

1. Resolve graph endpoints through the Wave 1 identity ledger so ID-style and name-style endpoints both
   resolve.
2. Investigate why one tenant's relationship endpoints are empty.
3. Re-run the segmentation inheritance once endpoints resolve — several tenants should segment far
   better than they do today.
