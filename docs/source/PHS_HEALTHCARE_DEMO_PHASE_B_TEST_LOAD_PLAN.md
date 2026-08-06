# Synthetic Healthcare Demo Phase B Lab Data-Layer Population Plan

Status: continuous_lab_execution_in_progress

Phase B lab execution is proceeding only inside the isolated `foundation_v2_phs_demo` schema through the approved ACA data-build job path. This plan still does not authorize canonical promotion, Cube/runtime update, deployment, tenant activation or mutation of any existing tenant.

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

## Governed Expert Narrative And Architecture Quality

Narrative is the final governed layer. Do not generate final Home, architecture, Source, Intelligence, Moves or aVa prose until the relevant Layer 2 through Layer 5 data, relationships, deterministic findings, evidence and Cube/read-model reconciliations pass.

The prior generic consultant-narrative pattern is explicitly rejected. PHS executive artifacts must be assembled from a typed advisory packet, not from a thin raw-file prompt. The same packet assembler must serve both pre-generated governed artifacts and live aVa answers so there is one truth path.

The packet contract must separate `modelVisiblePacket`, `auditLineage` and `retrievalDiagnostics`. Claude receives only the model-visible packet. The audit path must preserve tenant and dataset identity, audience role, module, artifact type, as-of date, enterprise profile, business units, strategic priorities, entities, relationships, governed metrics, deterministic findings, risks, initiatives, decisions pending, evidence, interview assertions, conflicts, missing evidence, allowed conclusions, prohibited conclusions, required topics, required entity mentions, governed numbers, visuals and finding/result hash.

Module boundaries:

- Home describes known enterprise context, business units, systems, vendors, initiatives, outcomes, risks and evidence gaps. Home may explain implications but must not make sourcing awards or unsupported strategic recommendations.
- Architecture describes governed current state: applications, platforms, interfaces, hosting, data flows, operational ownership, vendor responsibilities, modernization dependencies, constraints and evidence gaps. It must not become a generic target-state cloud recommendation artifact.
- Source explains vendor, contract, performance, renewal, leverage and sourcing implications using governed commercial and operational facts.
- Intelligence and Moves provide options, trade-offs, recommendations, sequencing, risks, controls and decision actions after current state is established.

Role-specific lenses must be separate for Chief Procurement Officer, CDAO, CIO/CTO, health-plan executive and enterprise transformation sponsor. The lens changes emphasis and decision framing, not the underlying facts.

PHS artifacts must use governed PHS context when relevant, including hospital and health-plan operating context, Epic, Clarity, Caboodle, Hadoop retirement, SQL Server data marts, SAS, analytics managed services, Epic managed services, Workday, ServiceNow/CMDB, AWS and Databricks decision state, BPO current-state baseline and contractual versus aspirational supplier commitments. Do not force every entity into every artifact, but reject any artifact that could be reused unchanged for another health system.

Required narrative structures:

- Home executive brief: enterprise at a glance; what drives the business; operating model and business-unit context; technology and data landscape; strategic vendors and dependencies; transformations in motion; material risks and constraints; evidence confidence; unresolved questions; leadership decisions ahead.
- Current-state architecture assessment: executive architecture summary; business capabilities supported; application and platform landscape; data flows and integration; hosting and infrastructure; data and analytics estate; vendor and managed-service responsibilities; security, resilience and operations; modernization programs and dependencies; current-state constraints; evidence gaps and conflicts; decisions required before target-state commitment.
- Advisory decision brief: decision; evidence; why now; options; trade-offs; recommended direction; conditions for success; risks and controls; sequencing; decisions and actions.

Every material statement must distinguish observed fact, deterministic finding, expert interpretation, assumption, evidence gap or recommendation. Claude must not invent facts or numbers, change metrics, change Tower claim states, resolve evidence conflicts, treat unknown as zero, treat usage as value, label exposure as savings, treat aspirational supplier statements as contractual or attest on behalf of Finance, procurement or business leaders.

Generic-language control must reject filler when it substitutes for evidence, including phrases such as "rapidly evolving healthcare landscape", "embrace digital transformation", "unlock synergies", "leverage best-in-class capabilities", "drive innovation and operational excellence" and "establish a single source of truth".

No first model response is publishable. The required process is governed generation, deterministic structure/evidence lint, independent expert critic, revision and final deterministic validation. Accepted artifacts require overall score at least 8.5/10, tenant specificity at least 9/10, evidence grounding at least 9/10, no prohibited-claim failures and no unresolved factual contradictions represented as resolved.

Pre-generate only these governed artifacts for the demo after the required data layers pass: Enterprise Current-State Brief, Data and Analytics Current-State Assessment, Technology Architecture Current-State Assessment, Procurement and Vendor Landscape Brief, BPO Sourcing Decision Brief and AWS/Databricks Decision Brief. Store each accepted artifact as `narrative.artifact` with tenant key, dataset id/version, artifact type, audience role, packet hash, finding/result hash, generated timestamp, model/version, critic score, evidence references and staleness state. If the underlying dataset, findings or decisions change, mark the artifact stale.

Final demo acceptance must show a side-by-side audit for each governed artifact: narrative claim to packet fact/finding to source record to evidence span to Cube measure where applicable. Rendering a document is not quality proof.

## Execution Sequence

1. Review the Phase A proof ZIP, generated package SHA-256 values, model-fit gaps and canary output.
2. Add approved PHS-only schema/bootstrap through the governed lab lane; target schema is `foundation_v2_phs_demo`, not `foundation_v2_healthcare_gs`.
3. Use the PHS source-volume reader that consumes `phs_healthcare_demo_package_manifest.json` and the 54 named Layer 1 release CSVs classified in the manifest; do not silently substitute the separate `clients/healthcare-demo-new` corpus root.
4. Run source-volume plan mode and produce a file, row, field, hash, source-file context and target-contract manifest with no database connection.
5. Run source-volume preflight against the isolated lab database using least-privilege writer context and roll back the transaction.
6. Run the apply job as an ACA data-build job only after approval; write source release, files, source-file routing context, records, field values, parser execution and gate rows.
7. Run independent reader verify and compare exact source-release identity/hash, all 54 filenames, per-file SHA/counts, 54 source-file context rows, source-group counts, demo-priority counts, record count, field count and gate counts.
8. Run source adapters and candidate staging as separate migration, self-test, preflight, apply and verify jobs.
9. Reconcile vendor counts, contract counts, invoice totals, service credits, scope relationships, off-contract med/surg spend, rate-card variance, SaaS utilization, optional aggregate health-plan outcome snapshots, BPO normalized TCO and evidence counts.
10. Assemble governed advisory packets only after Layer 2 through Layer 5 data, relationships, deterministic findings, evidence and Cube/read-model reconciliations pass.
11. Generate and validate only the six approved governed artifacts, using the shared packet assembler, deterministic lint, independent critic, revision and final validation.
12. Exercise Source, Home, Tower, Intelligence, Moves and aVa signed-in paths only after read-model proof and narrative artifact quality proof exist.
13. Run cross-tenant isolation checks: other tenants see no healthcare context; healthcare sees no other-tenant context; invalid tenant requests block with no fallback.
14. Keep `activation_state=staged` and stop again for approval.

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

Layer 1 ACA execution has now passed schema apply, source-volume preflight, source-volume apply and independent reader verify. The verified counts are 54 source files, 54 source-file context rows, 54,967 source records, 1,640,131 source field values, one parser execution and two source-volume gates.

## Layer 2 Adapter/Candidate Staging

The PHS-specific Layer 2 commands are:

```bash
npm run source:phs-healthcare-demo:layer2:migrate:dry
npm run source:phs-healthcare-demo:layer2:migrate:apply
npm run source:phs-healthcare-demo:layer2:self-test
npm run source:phs-healthcare-demo:layer2:preflight
npm run source:phs-healthcare-demo:layer2:apply
npm run source:phs-healthcare-demo:layer2:verify
```

Layer 2 writes only `normalized_objects`, `knowledge_candidates` and three adapter gate rows inside `foundation_v2_phs_demo`. It preserves field-level lineage from the loaded source-field slots and keeps every candidate in `pending_review`.

Expected Layer 2 counts:

- Normalized objects: 54,967
- Knowledge candidates: 54,967
- Adapter gates: 3

Layer 2 does not create canonical objects, publish baselines, refresh Cube, update product read models or activate the PHS tenant.

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
