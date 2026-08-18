# AbarVa Client Reference Pack — v1.0 (FINAL)

**This is the pack a new client receives.** No other template set is approved, and nothing outside
this folder is a valid starting point for a client engagement.

Frozen 2026-08-15. Every file is hashed in `CLIENT_REFERENCE_PACK.json`.

## Start here

Open **`AbarVa_Template_Pack_Index_v3.xlsx`**. It is the front door and carries seven sheets:
`Start Here`, `Intake Workstreams`, `Review Queue`, `Source Extract Map`, `Canonical Mapping`,
`SME Review Matrix`, `Evidence and Gates`.

A client is **not** asked to fill in nineteen spreadsheets. They are asked to point us at exports,
documents and people they already have, through ten intake workstreams — each owned by a group that
already exists in their organisation. AbarVa maps that evidence into the canonical model.

## What is in this folder

| | Count | Purpose |
| --- | ---: | --- |
| Client workbooks (`.xlsx`) | 26 | The index front door, 19 canonical dimension templates, 6 source-extract helpers. Every one opens on a `Start Here` sheet naming its workstream, owner group, populating evidence, and canonical role. |
| Canonical column contracts (`.csv`) | 19 | The target shape. `template-manifest.json` is the sole authority on columns. |
| Governance (`.json`) | 5 | `ontology.json` (node and relationship types, segmentation), `client-intake-workstreams.json` (the ten workstreams), `quality-depth-rules.json` (depth minimums and waivers), `template-manifest.json`, `manifest.json`. |

## What "complete" means

A package is complete when it passes these — not when it has a lot of rows.

| Check | Bar |
| --- | --- |
| Dimensions conformant | 19 of 19 |
| Contract fields carrying data | ≥ 95% |
| Graph endpoints resolving | ≥ 99% |
| Row terminators | consistent within every file |
| Hollow rows | no conformant file ≥ 50% empty |

Enforced by `npm run audit:tenant-input-quality`, `npm run audit:tenant-graph-reconciliation`, and
`npm run validate:context-corpus`. These run in CI; they are not advisory.

## Worked example

`datasets/tenant-inputs/active/skyharbor-air/current` — **19/19 conformant, 285/286 fields carrying
data (99%), 5,009 rows, 99.6% of graph endpoints resolving.**

Synthetic, but built to this contract and passing every gate. It is the reference for what a finished
package looks like.

## Five rules that do not bend

1. **Columns come from `template-manifest.json`.** A package that does not match it is not conformant,
   whatever its row count.
2. **An empty field is an evidence request.** It is never filled with a placeholder, a generated
   identifier, or invented prose.
3. **A relationship endpoint is never satisfied by creating a node for it.** Unresolved endpoints are
   quarantined and reported.
4. **Money, counts and dates are deterministic or absent.** A figure that cross-source fact lineage
   reports as `CONFLICT` is not quoted at all.
5. **Completing this pack approves nothing.** Loading, retrieval indexing, assistant use and product
   projection each remain closed until SME review passes.

## Regenerating the workbooks

```
node scripts/audit/build-universal-template-workbook-quality-bar.mjs
```

Idempotent, and it never edits the `.csv` column contracts. Workbook hashes land in
`reports/tenant-template-quality-bar-2026-08-12/template-workbook-inventory.csv`.

## Changing this pack

This version is FINAL for client use. Amending a column contract is a governed change: it requires a
written justification, a migration path for existing packages, and re-validation across every active
tenant. Bump the version in `CLIENT_REFERENCE_PACK.json` and re-hash.
