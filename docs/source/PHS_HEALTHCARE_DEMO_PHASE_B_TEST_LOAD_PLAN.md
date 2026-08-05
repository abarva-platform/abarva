# Synthetic Healthcare Demo Phase B Lab Data-Layer Population Plan

Status: designed_only, not_executed

Phase B may begin only after explicit Phase A audit approval and separate authorization for an isolated lab data build. This plan does not authorize a database load, migration, Cube/runtime update, deployment, tenant activation or mutation of any existing tenant.

## Source Corpus Contract

- Tenant key: `phs_health_demo_global`
- Dataset id: `phs-health-source-v1-202608`
- Dataset version: `v1`
- Activation target: `staged`
- Source-system extract CSVs: 40
- Required package state: `generated_not_loaded`
- Latest Phase A proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T185307Z.zip`
- Latest proof SHA-256: `a93bd23ed798016ff5849ea1d66a1dddffb621aefbaa77d1d20b88a62b1aa44b`

## Planned Data Layers

1. Layer 0 package proof: verify proof ZIP SHA-256, source ZIP integrity, package manifest counts, validator output, canary output and the 40-file source extract count.
2. Layer 1 raw source landing: land source release, 40 source files, source records and source field values with tenant key, dataset id, dataset version, as-of date, row hash and source URI.
3. Layer 2 source adapters: transform each source-owner/native extract into adapter outputs without forcing client intake into AbarVa canonical templates.
4. Layer 3 canonical candidates: stage vendor, contract, spend, service, application, platform, claims/enrollment, Stars/HEDIS, evidence and sourcing candidates with lineage and confidence.
5. Layer 3 model-fit deltas: apply only reviewed additive tables, nullable fields or projections required by the model-fit audit.
6. Layer 4 read models: build Source, Tower, Home, Intelligence, Moves and aVa projections from canonical candidates; no product reads Layer 1 files directly.
7. Analytics runtime: refresh Cube only in the isolated lab with security context including tenant key, dataset id, dataset version and as-of date.
8. Proof and reconciliation: reconcile PostgreSQL against package counts and Cube/read-model counts before signed-in product proof.

## Execution Sequence

1. Review the Phase A proof ZIP, generated package SHA-256 values, model-fit gaps and canary output.
2. Add approved tenant bootstrap and additive migrations through the governed lab lane.
3. Implement a PHS source-volume reader that consumes `phs_healthcare_demo_package_manifest.json` and its 40 `source_system_extracts/*.csv` files; do not silently substitute the separate `clients/healthcare-demo-new` corpus root.
4. Run source-volume plan mode and produce a file, row, field and hash manifest with no database connection.
5. Run source-volume preflight against the isolated lab database using least-privilege writer context and roll back the transaction.
6. Run the apply job as an ACA data-build job only after approval; write source release, files, records, field values, parser execution and gate rows.
7. Run independent reader verify and compare exact source-release, file, record, field and gate counts.
8. Run source adapters and canonical-candidate staging as separate plan, preflight, apply and verify jobs.
9. Reconcile vendor counts, contract counts, invoice totals, service credits, scope relationships, off-contract med/surg spend, rate-card variance, SaaS utilization, claims/enrollment aggregates, Stars/HEDIS measures, BPO normalized TCO and evidence counts.
10. Exercise Source, Home, Tower, Intelligence, Moves and aVa signed-in paths only after read-model proof exists.
11. Run cross-tenant isolation checks: other tenants see no healthcare context; healthcare sees no other-tenant context; invalid tenant requests block with no fallback.
12. Keep `activation_state=staged` and stop again for approval.

## Non-Negotiable Stops

- No source-volume apply without an approved package SHA.
- No migration without an approved additive model-fit delta.
- No Cube refresh until PostgreSQL source and canonical readbacks pass.
- No product proof until read models are populated and reconciled.
- No activation from `staged` to active without a separate human gate.
- No fallback from missing healthcare tenant context to any existing tenant.

## Rollback And Re-Run

Every lab job must be idempotency-keyed by tenant key, dataset id, dataset version, package SHA and execution id. A failed apply must either roll back in-transaction or leave a quarantined run state that can be independently counted and deleted by the approved tenant-scoped reset process before retry.
