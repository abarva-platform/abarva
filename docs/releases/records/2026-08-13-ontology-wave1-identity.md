# 2026-08-13-ontology-wave1-identity — Wave 1: stable identity for graph nodes

## Release ID

`2026-08-13-ontology-wave1-identity`

## Status

`candidate`

## Plain-English Summary

Graph edges joined on display names. An edge said `to_object_name = "Amadeus IT Group"`, so renaming
that vendor silently broke every edge pointing at it. Renaming is not exotic — it happens on every
merger, rebrand, and data-quality pass — and after a load the breakage sits in Postgres underneath
every projection built on top of it.

Every node now carries an ID, and edges carry the IDs of both endpoints alongside the names.

The important design decision: **identity is persisted, not derived**. An ID minted from a hash of the
name would change when the name changes, which is exactly the failure it claims to prevent. IDs are
minted once into a per-tenant identity ledger and reused on every later run. A rename is an alias
declared against the existing entry — not guessed by the script, because automatic rename detection is
string similarity wearing a suit and would merge two real objects the first time two vendors had
similar names.

## Layer Impact

Release lane: `client-data-lane`. Layer 1 columns, Layer 3 semantics. Nothing loaded, no projection or
cube rebuilt.

## Client Applicability

All clients: no. Specific clients: none — synthetic cover tenant. Internal only: yes. Feature flag: none.

## Changes Included

- `scripts/data/assign-stable-identity.mjs`
- `datasets/tenant-inputs/skyharbor-air/identity-ledger.json` — 1,219 entries
- ID columns added to 10 dimension files; `from_object_id` / `to_object_id` added to relationships

## QA / Validation

| Check | Result |
| --- | --- |
| **Rename-safety test** — rename a vendor, declare the alias, re-run | **PASS**: ID unchanged (`VEN-064b902f9f`), all 5 referencing edges preserved |
| Edge endpoints resolved to an ID | 6,298 / 6,636 (95%) |
| Rows lost, any file | **0** |
| Columns removed, any file | **0** |
| Existing cells changed, any file | **0** |
| Idempotency — second run byte-identical | **PASS** |
| Ontology violations | 91, unchanged |
| `npm run release:check` | passed |

Two failures were found and fixed during this work, both by testing rather than by reading:

1. The first rename test failed: the ID survived but referencing edges dropped from 5 to 0. Edge
   resolution was still name-based one level down. It now resolves through the ledger, so an edge
   still carrying a pre-rename label resolves to the same object.
2. A row-count check caught two files losing rows on write. The cause is a pre-existing defect —
   an unbalanced quote in the source makes the parser merge a hundred fields into one row, and Papa
   and Python recover from it differently. The script now refuses to write any file it could not parse
   cleanly, rather than persisting one parser's interpretation as data loss.

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action.

## Deployment Authority

Repo-owned deploy workflow unchanged. No shared runtime mutator, image, flag, or env change. Live
signed-in proof required: no.

## Rollback Plan

Revert the squash commit. All changes are additive columns plus one new file; nothing consumes the IDs
yet.

## Audit Evidence

- `datasets/tenant-inputs/skyharbor-air/identity-ledger.json` — every minted ID with its canonical
  name and declared aliases. This is the artefact that makes a rename survivable, and the one to
  inspect if an edge ever fails to resolve.
- `reports/tenant-ontology/ontology-validation.json` — endpoint resolution after the change.
- The rename-safety test is reproducible: rename a vendor in the dimension, add the new name to that
  entry's `aliases`, re-run the script, and confirm both the ID and the referencing edge count are
  unchanged.

## Known Gaps

- **Two files are blocked, not fixed**: `03_workforce_roles.csv` and `07_vendors_contracts.csv` carry
  malformed CSV quoting and were deliberately left unwritten, so they have no ID column. Repairing the
  quoting is a data fix for Wave 3. Until then those two dimensions cannot participate in ID-based joins.
- 338 endpoints resolve to no ID: the 91 known ontology gaps plus 247 interview endpoints whose
  evidence lives outside the active package.
- Only the reference tenant was processed. The other six active tenants have no identity ledger.
- A rename is only survivable if someone declares the alias. Nothing yet detects an undeclared rename,
  which would present as a new object and an orphaned old one.
- Nothing consumes the IDs yet. Edges still carry names, and every downstream reader still joins on
  them. Switching readers to IDs is separate work.
- The ledger has no retirement concept. An object removed from a dimension keeps its ledger entry
  forever, which is safer than deleting but will accumulate.

## Follow-ups

1. Repair CSV quoting in the two blocked files, then re-run to give them IDs.
2. Wave 2 — segmentation columns on the function dimension, then inheritance across the graph.
3. Move downstream readers onto IDs so the identity actually does work.
