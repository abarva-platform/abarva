# Synthetic Healthcare Demo Phase B Lab Data-Layer Population Plan

Status: designed_only, not_executed

Phase B may begin only after explicit Phase A audit approval and separate authorization for an isolated lab data build. This plan does not authorize a database load, migration, Cube/runtime update, deployment, tenant activation or mutation of any existing tenant.

## Source Corpus Contract

- Tenant key: `phs_health_demo_global`
- Dataset id: `phs-health-source-v1-202608`
- Dataset version: `v1`
- Activation target: `staged`
- Layer 1 release CSVs: 54 named CSV files; 38 enterprise-context files, 1 optional-domain context file, 11 existing BPO sourcing-event files and 4 BPO transition/transformation files
- Required package state: `generated_not_loaded`
- Latest Phase A proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip`
- Latest proof SHA-256: `a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553`

## Planned Data Layers

1. Layer 0 package proof: verify proof ZIP SHA-256, source ZIP integrity, package manifest counts, validator output, canary output, core-source completeness and optional-domain readiness.
2. Layer 1 raw source landing: land source release, approved source files, source records and source field values with tenant key, dataset id, dataset version, as-of date, row hash and source URI.
3. Layer 2 source adapters: transform each source-owner/native extract into adapter outputs without forcing client intake into AbarVa canonical templates.
4. Layer 3 canonical candidates: stage vendor, contract, spend, service, application, platform, optional aggregate outcome, evidence and sourcing candidates with lineage and confidence.
5. Layer 3 model-fit deltas: apply only reviewed additive tables, nullable fields or projections required by the model-fit audit.
6. Layer 4 read models: build Source, Tower, Home, Intelligence, Moves and aVa projections from canonical candidates; no product reads Layer 1 files directly.
7. Analytics runtime: refresh Cube only in the isolated lab with security context including tenant key, dataset id, dataset version and as-of date.
8. Proof and reconciliation: reconcile PostgreSQL against package counts and Cube/read-model counts before signed-in product proof.

## Execution Sequence

1. Review the Phase A proof ZIP, generated package SHA-256 values, model-fit gaps and canary output.
2. Add approved PHS-only schema/bootstrap through the governed lab lane; target schema is `foundation_v2_phs_demo`, not `foundation_v2_healthcare_gs`.
3. Use the PHS source-volume reader that consumes `phs_healthcare_demo_package_manifest.json` and the 54 named Layer 1 release CSVs classified in the manifest; do not silently substitute the separate `clients/healthcare-demo-new` corpus root.
4. Run source-volume plan mode and produce a file, row, field, hash, source-file context and target-contract manifest with no database connection.
5. Run source-volume preflight against the isolated lab database using least-privilege writer context and roll back the transaction.
6. Run the apply job as an ACA data-build job only after approval; write source release, files, source-file routing context, records, field values, parser execution and gate rows.
7. Run independent reader verify and compare exact source-release identity/hash, all 54 filenames, per-file SHA/counts, 54 source-file context rows, source-group counts, demo-priority counts, record count, field count and gate counts.
8. Run source adapters and canonical-candidate staging as separate plan, preflight, apply and verify jobs.
9. Reconcile vendor counts, contract counts, invoice totals, service credits, scope relationships, off-contract med/surg spend, rate-card variance, SaaS utilization, optional aggregate health-plan outcome snapshots, BPO normalized TCO and evidence counts.
10. Exercise Source, Home, Tower, Intelligence, Moves and aVa signed-in paths only after read-model proof exists.
11. Run cross-tenant isolation checks: other tenants see no healthcare context; healthcare sees no other-tenant context; invalid tenant requests block with no fallback.
12. Keep `activation_state=staged` and stop again for approval.

## Layer 0 And Layer 1 Plan Output

The non-mutating plan command is:

```bash
npm run source:phs-healthcare-demo:data-layer-plan -- \
  --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z \
  --out-dir /Users/anand/Downloads
```

Latest plan ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Data_Layer_Plan_20260805T230818Z.zip`
Latest plan SHA-256: `5f525057fec4202c173a4a65f0a5d522cb8635927bddd79e1a2083ce2544d783`

Latest database target contract:

- Schema: `foundation_v2_phs_demo`
- Tenant key: `phs_health_demo_global`
- Namespace: `phs-healthcare-demo-source-volume-v1`
- Writer role: `foundation_v2_phs_demo_writer`
- Reader role: `foundation_v2_phs_demo_reader`
- Release alias: `phs-healthcare-demo-phase-a-source-volume-v1`
- Expected source release: `phs-health-source-v1-202608:source-volume-v1:447910ac3c16`
- Isolation scope: `ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY`

Latest plan counts:

- Source files: 54
- Enterprise/context files: 39
- Existing BPO sourcing-event files: 11
- BPO transition/transformation files: 4
- Required core source extracts: 38
- Optional health-plan outcome snapshot rows: 12
- Source records: 54,967
- Source field slots: 1,640,131
- Source-file context rows: 54
- Source field-value rule: insert all field slots, including explicit blank cells
- Restricted detailed health-plan extracts present: 0
- Mutation executed: false

## Layer 1 Executable Source-Volume Loader

The PHS-specific Layer 1 loader is:

```bash
npm run source:phs-healthcare-demo:layer1:self-test
npm run source:phs-healthcare-demo:layer1:plan -- \
  --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z \
  --out-dir /Users/anand/Downloads
```

The loader reads only the approved `phs_healthcare_demo_package_manifest.json` and the 54 package-owned release CSVs classified in that manifest. It does not rely on folder names alone, does not reuse the separate `healthcare-demo-new` corpus root and does not require the detailed payer claims/enrollment or detailed Stars/HEDIS extracts.
For ACA execution, the loader may read an approved package ZIP through `PHS_HEALTHCARE_DEMO_PACKAGE_ZIP_URL`; it extracts the ZIP in-container and refuses to continue unless the SHA-256 matches `a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553`.

Supported modes:

- `migrate:dry` / `migrate:apply`: exact PHS schema/RLS migration proof for `foundation_v2_phs_demo`; no source rows are loaded by this step.
- `self-test`: local SQL batch-order check with no package read and no database connection.
- `plan`: package integrity, proof-ZIP SHA, source file, row, field and hash proof with no database connection.
- `preflight`: isolated lab database read/write capability check inside a rolled-back transaction.
- `apply`: ACA data-build job only; requires `PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true`, the approved proof SHA, exact PHS schema/role/tenant/namespace/release contract and an ACA job context.
- `verify`: independent reader readback of exact source release identity/hash, all 54 filenames, per-file SHA/counts, source-file context rows, source record count, source field count, parser execution and gate counts.

The apply command is intentionally hard-stopped until an isolated lab target and approved ACA data-build job are identified:

```bash
PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true \
PHS_HEALTHCARE_DEMO_APPROVED_PROOF_SHA256=a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553 \
npm run source:phs-healthcare-demo:layer1:apply -- \
  --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z \
  --approved-proof-sha256 a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553
```

## Event Context Architecture

Tenant enterprise context flows into Source as context candidates. A sourcing event references selected applications, services, vendors, contracts and evidence IDs, then a later governed job may pin an immutable event-context snapshot. This plan-only step defines the future snapshot contract but does not create a snapshot, adapter output, canonical row, recommendation version, Move or outcome-tracking row.

Adapter priority after a future approved Layer 1 apply:

1. Priority A BPO hero: process volumes, workforce, cost baseline, rebadge and retention, transition and knowledge transfer, AI/process transformation commitments, retained organization, supplier responses, commercials, evaluation, clarifications, BAFO and normalized TCO.
2. Priority B supporting enterprise context: CMDB applications, CSDM business services, vendor services, contract scope, contract terms and rates, ITSM/SLA performance, service credits, interfaces, dependencies, programs, risks and modernization initiatives.
3. Deferred: optional health-plan outcome snapshot, med/surg experiences, non-demo analytics and low-value peripheral sources.

## Non-Negotiable Stops

- No source-volume apply without an approved package SHA.
- No source-volume apply from local/non-ACA execution.
- No source-volume apply into `foundation_v2_healthcare_gs` or any non-PHS schema.
- No migration without an approved additive model-fit delta.
- No Cube refresh until PostgreSQL source and canonical readbacks pass.
- No product proof until read models are populated and reconciled.
- No activation from `staged` to active without a separate human gate.
- No fallback from missing healthcare tenant context to any existing tenant.

## Rollback And Re-Run

Every lab job must be idempotency-keyed by tenant key, dataset id, dataset version, package SHA and execution id. A failed apply must either roll back in-transaction or leave a quarantined run state that can be independently counted and deleted by the approved tenant-scoped reset process before retry.
