# 2026-06-09-ws-e-lakeshore-reconciliation — Lakeshore canonical reconciliation (WS-E)

## Release ID

`2026-06-09-ws-e-lakeshore-reconciliation`

## Status

`candidate`

## Plain-English Summary

Reconciles Lakeshore Holdings — already loaded (1,329 records, ~8,987 Azure
Search docs, Kyriba vector-proven) — into the canonical framework, rather than
treating it as empty. Declares the governed dataset manifest, maps every loaded
Lakeshore CSV to a CONTEXT_FRAMEWORK_v1 dimension (all 12 covered), points future
Lakeshore loads at the governed Admin bulk path with WS-B idempotency, and runs
the live answer-quality probe for Lakeshore in-VNet to prove the reconciled load
is grounded, cited, and tenant-safe.

## Layer Impact

- `client-data-lane` / `corpus-knowledge-lane`: governance reconciliation
  (manifest + dimension map + doc) for an existing tenant load. No schema change;
  no data mutation (the manifest + docs describe the existing load).

## Client Applicability

- Specific client: Lakeshore Holdings (`lakeshore-holdings`).
- Internal only: governance + QA artifacts.

## Changes Included

- `docs/governance/dataset-manifests/lakeshore-holdings-current-state-v1.json`
- `docs/governance/LAKESHORE_CANONICAL_RECONCILIATION_2026-06-09.md`

## QA / Validation

- `npm run validate:context-corpus:manifests` → passed (Lakeshore manifest valid,
  canonical client_key).
- `npm run audit:architecture-rules` / `release:check` /
  `npm run validate:context-corpus` → green.
- **Live ACA run:** the WS-G answer-quality probe was run for `lakeshore-holdings`
  in-VNet; results appended to the reconciliation doc.

## Rollout Plan

Merge to `main`. The manifest brings Lakeshore under the new-dataset governance
gate; future Lakeshore loads use the WS-C governed Admin bulk path.

## Rollback Plan

Revert the PR. Governance docs + manifest only; no data effect.

## Audit Evidence

- PR URL: (filled on open).
- Manifest validation pass; live Lakeshore probe logs.

## Context Ingestion Evidence

Applicable (reconciliation). Lakeshore's existing load is described, not
re-loaded: committed + indexed + retrievable per the 2026-06 audits. The WS-E
manifest + dimension map bring it under canonical governance; the live probe
proves grounded/cited/tenant-safe answers. "Loaded" ≠ "indexed" ≠ "retrievable"
≠ "cited" — each state is named separately.

## Known Gaps

- The original Lakeshore load did not produce setup/admin approval-ledger rows
  (`pilot_ingestion_*`); future loads via the WS-C path will.
- The reconciliation declares + maps + verifies; a full re-load of every CSV
  through the governed path (to regenerate provenance uniformly) is an optional
  follow-up, not required since the data is already committed + indexed.
