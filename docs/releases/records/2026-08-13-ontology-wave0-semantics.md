# 2026-08-13-ontology-wave0-semantics — Wave 0: fix graph semantics before enrichment

## Release ID

`2026-08-13-ontology-wave0-semantics`

## Status

`candidate`

## Plain-English Summary

First wave of the enrichment sequence. Enrichment does not start with more rows; it starts with the
graph meaning what it says, because volume added on top of broken semantics is multiplied into every
downstream projection and cube.

Three defects were fixed in the reference tenant's relationship graph, all surfaced by the ontology
validator and invisible to every other gate:

- 1,025 endpoints typed `role` retyped to `org_unit`, resolved by matching the name against the
  organisation dimension rather than by pattern-matching the string.
- 62 `has_risk` edges pointing backwards (risk → system) had their direction corrected.
- One `function` endpoint carrying a parenthetical the dimension does not carry was resolved.

The ontology gained the declarations the validator showed were missing: a `measures` relationship
type, a `tower_initiative` node type, and a corrected home for interview evidence. A per-tenant
population-scope declaration was added for the two financial files whose undeclared scope previously
caused a reviewer to report an inconsistency that did not exist.

Violations went from **1,514 to 91**; endpoint integrity from 96% to 99%.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 semantics, applied to one Layer 1 file.

- **Layer 1:** four endpoint columns of one tenant's relationships file were rewritten. No other
  column, in any file, was modified. Row and column counts are unchanged.
- **Layers 2-4:** unaffected. Nothing loaded, no projection or cube rebuilt.

## Client Applicability

- All clients: no. Specific clients: none — synthetic cover tenant. Internal only: yes.
- Feature flag: none.

## Changes Included

- `scripts/data/apply-ontology-wave0-fixes.mjs`
- `datasets/tenant-inputs/active/skyharbor-air/current/12_relationships.csv` (endpoint columns only)
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json`
- `datasets/tenant-inputs/skyharbor-air/population-scope.json`
- `scripts/audit/validate-tenant-ontology.mjs` — expected-external endpoints are now reported
  separately from violations, so the gate can reach green and stay worth reading.

## QA / Validation

| Check | Result |
| --- | --- |
| Ontology violations, before → after | **1,514 → 91** |
| Endpoint integrity, before → after | 96% → **99%** |
| Rows in / out | 3,318 / 3,318 |
| Columns in / out | 25 / 25 |
| Cells changed outside the four endpoint columns | **0** |
| `npm run audit:tenant-input-quality` | passes |
| `npm run release:check` | passed |

A first attempt at this change corrupted 131 rows: a CSV round trip left a stray carriage return in
the final column of every CRLF-terminated row. It was caught by diffing every cell against `origin/main`
rather than by trusting the script's own report, the write was reverted, and the reader now strips the
artifact. The verification is recorded here because it is the reason the change is safe, not a
formality.

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action.

## Deployment Authority

- Repo-owned deploy workflow unchanged; no shared runtime mutator, image, flag or env change.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The relationships file returns to its previous content; nothing consumes the
ontology or scope declarations yet.

## Audit Evidence

- `reports/tenant-ontology/ontology-validation.json` — remaining violations with counts and samples.

## Known Gaps

- **91 violations remain, all genuine data gaps** deferred to Wave 3: 14 endpoints typed `role` whose
  name is a spend category (`Cybersecurity & IT Risk`), one vendor absent from the vendor dimension
  (`Infosys BPM`), and 76 endpoints for 8 Tower initiatives that exist in no programme record.
- 247 interview endpoints cannot resolve because interview evidence lives outside the active package.
  These are now classified as expected-external rather than violations. That is a modelling decision,
  not a fix — interview evidence arguably belongs inside the governed package.
- Only the reference tenant was processed. The other six active tenants have not been validated.
- The validator is still not wired into CI. It cannot be until the remaining 91 are triaged.
- Segmentation is declared in the ontology but no tenant carries the columns yet, so nothing inherits.
- Node identity is still by display name. A rename still breaks edges silently; that is Wave 1.

## Follow-ups

1. Wave 1 — stable identity columns, so edges join on IDs rather than display names.
2. Wave 2 — segmentation columns on the function dimension, then inheritance across the graph.
3. Run the validator across the other six active tenants and triage the results.
4. Wire the validator `--strict` once the backlog is clear.
