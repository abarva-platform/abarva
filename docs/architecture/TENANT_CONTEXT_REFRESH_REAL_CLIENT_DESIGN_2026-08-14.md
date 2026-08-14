# Tenant Context Refresh Design For Real Client Execution

Status: design candidate. This document turns the layer-reconciliation audit into an executable product/data design. It does not approve a data load, product cutover, retrieval rebuild, or tenant promotion.

## Decision

Fix the refresh path by building the missing contract between client-owned intake and product-ready context:

```text
Client-owned source extracts
  -> validated intake packet
  -> Layer 2 adapter factory
  -> Layer 3 canonical enterprise model
  -> Layer 4 module projections
  -> retrieval/index context
  -> Home, Intelligence, Moves, Source, Tower, aVa
```

The current failure should not be repaired by asking clients to fill a larger canonical workbook, by letting Home continue to read Layer 1, or by letting aVa retrieve from partially reconciled graph rows. For real clients, the durable design is:

- clients provide owner-native extracts and SME validation,
- AbarVa owns mapping, adapters, canonical identity, and projections,
- product modules read only Layer 4 projections,
- aVa consumes only validated, cited module context bundles,
- every refresh runs in shadow before an explicit human promotion.

## Why This Is The Right Shape

The audit found two separate problems that look like one problem:

1. Layer 2 is not a working transform layer yet. Several declared adapter families have no implementation, and no mapping-profile dry-run can currently execute end to end.
2. Home still reads Layer 1 intake roots directly, so a Layer 4 refresh alone would not change what the product actually consumes.

Those are architecture gaps, not data-cleanup gaps. If we “refresh all layers” without fixing them, we produce nicer artifacts but not a repeatable client operating model.

## Target Operating Model

### Layer 1: Client Intake Packet

Layer 1 should be organized by the client data owner, not by AbarVa's canonical schema.

Each real client packet contains:

| Artifact | Owner | Purpose |
| --- | --- | --- |
| `packet_manifest.json` | AbarVa operator + client lead | Declares tenant, packet version, source owner, sensitivity, as-of date, and accepted files. |
| raw source extracts | Client source-system owners | Native exports from systems such as CMDB, ERP/GL, CLM, procurement, portfolio, HR, ITSM, cloud, data catalog, and interview notes. |
| validated source extracts | Client source-system owners | Certified extracts after client-side redaction, completeness checks, and owner approval. |
| source data passports | Client source-system owners | Plain-English guide for each extract: source system, extraction method, filters, date range, field meanings, known caveats. |
| mapping workbook | AbarVa + client SME | Maps client columns and terms to canonical concepts without asking the client to understand the internal data model. |
| SME validation log | Client SMEs | Records accepted gaps, corrections, conflicts, and signoffs before promotion. |

The universal Excel templates remain useful, but their role changes:

- for synthetic/demo tenants: they can be the source pack;
- for real clients: they are a guide and target mapping frame, not the only acceptable input shape.

### Layer 2: Adapter Factory

Layer 2 must become an executable adapter factory, not a set of report-only mappings.

Each adapter family must implement the same contract:

```text
AdapterInput
  tenantKey
  packetId
  sourceOwner
  sourceSystem
  sourceFile
  sourceClass
  mappingProfile
  parserVersion
  dataClassification
  sourceFingerprint

AdapterOutput
  canonicalObjectCandidates[]
  canonicalFactCandidates[]
  relationshipCandidates[]
  evidenceRecords[]
  quarantineRecords[]
  unmappedFields[]
  adapterCoverageReport
```

Required adapter families:

| Family | Client source examples | Canonical domains emitted |
| --- | --- | --- |
| `organization-and-workforce` | HR, org roster, operating model, ownership matrix | organizations, functions, owners, roles, decision rights |
| `application-and-cmdb` | ServiceNow CMDB, LeanIX, Apptio, app inventory spreadsheets | applications, systems, technology owners, hosting hints |
| `data-catalog-integration-and-lineage` | Collibra, Purview, Informatica, interface inventory, architecture repositories | data assets, integrations, reports, semantic layers |
| `infrastructure-and-cloud` | cloud inventory, data center inventory, network/security platform exports | platforms, hosting locations, environments, resilience attributes |
| `vendor-clm-and-procurement` | CLM, Coupa, Ariba, contract register, vendor master | vendors, contracts, obligations, renewals, commercial scope |
| `finance-ap-gl-and-fpa` | GL, AP, budget, Apptio, Anaplan | spend, budgets, cost centers, value baselines |
| `pmo-portfolio-and-benefits` | Planview, Clarity, Jira Align, program trackers | programs, initiatives, benefits, dependencies |
| `kpi-and-operational-telemetry` | KPI scorecards, ITSM, service reports, call-center metrics | metrics, baselines, outcomes, operational evidence |
| `risk-control-and-compliance` | GRC, audit findings, control registers | risks, controls, obligations, evidence |
| `interview-and-workshop-evidence` | transcript templates, stakeholder notes, workshop outputs | interview records, qualitative claims, decision gaps |

Adapter outputs are build artifacts. They can be deleted and regenerated. They are never hand-edited and never become product truth.

### Layer 3: Canonical Build And Reconciliation

Layer 3 owns identity, fact reconciliation, and graph validity.

The canonical build has four phases:

1. **Identity resolution**: create or match typed IDs for organizations, functions, capabilities, applications, platforms, vendors, contracts, programs, use cases, risks, metrics, evidence, and interviews.
2. **Fact arbitration**: when two sources assert the same fact, mark one as authoritative, mark conflicts explicitly, and block claimable values until an owner resolves them.
3. **Relationship validation**: accept only edges whose endpoints exist and whose verb/domain/range match the ontology. Everything else becomes a candidate repair item.
4. **Evidence binding**: attach provenance, source row, as-of date, confidence, sensitivity, and citation readiness to every object and fact.

Important rule: dangling graph references are not fixed by inventing missing objects. The repair queue has only three legal outcomes:

| Outcome | Meaning |
| --- | --- |
| catalogue object | Add a real canonical object from source evidence. |
| correct edge | Fix endpoint, direction, or verb based on source evidence. |
| drop edge | Remove unsupported relationship candidate from the graph. |

### Layer 4: Module Projection Boundary

Layer 4 is the consumption layer. Product modules read projections only, never Layer 1 or Layer 2.

Target read path:

```text
Layer 3 canonical store
  -> module projection builders
  -> ModuleContextPacket / module read models
  -> product pages and aVa
```

Minimum projections:

| Projection | Consumers | Contents |
| --- | --- | --- |
| Home enterprise context snapshot | Home, Home aVa | enterprise profile, functions, systems, vendors, programs, risks, metrics, evidence gaps, validated graph slices |
| Intelligence answer context packet | Intelligence, cross-module aVa | cited facts, relationship paths, contradiction register, unsupported-question list |
| Moves context packet | Moves, aVa | business priorities, capabilities, systems, owners, KPIs, use-case candidates, value hypotheses, evidence gaps |
| Source commercial context packet | Source, Source aVa | vendors, contracts, spend, renewals, obligations, rate cards, sourcing events, commercial evidence |
| Tower measurement context packet | Tower, Tower aVa | metrics, baselines, committed value, measured value, finance validation, caveats |

Home's current direct Layer 1 reads should be replaced by a module context call. During migration, direct reads may remain only as an explicitly logged compatibility fallback.

## Refresh State Machine

Every tenant refresh should move through explicit states:

```text
RAW_RECEIVED
  -> VALIDATED_PACKET
  -> ADAPTER_DRY_RUN
  -> ADAPTER_PASSED
  -> CANONICAL_CANDIDATE
  -> GRAPH_VALIDATED
  -> L4_SHADOW_BUILT
  -> RETRIEVAL_SHADOW_INDEXED
  -> CLIENT_SME_REVIEWED
  -> PROMOTION_APPROVED
  -> ACTIVE_PROMOTED
  -> PRODUCT_PROVEN
```

Hard stops:

| State | Promotion blocker |
| --- | --- |
| `VALIDATED_PACKET` | missing manifest, unknown tenant, owner not declared, sensitivity not declared, source fingerprint missing |
| `ADAPTER_DRY_RUN` | required field mappings missing, parser errors, unmapped critical fields |
| `CANONICAL_CANDIDATE` | duplicate IDs, unresolved authoritative source, money conflicts, restricted data without policy |
| `GRAPH_VALIDATED` | dangling endpoints above threshold, invalid domain/range, undeclared relationship verbs |
| `L4_SHADOW_BUILT` | projection reads Layer 1 or Layer 2, missing required module domains |
| `RETRIEVAL_SHADOW_INDEXED` | index missing source citations, blocked objects reach agent context |
| `CLIENT_SME_REVIEWED` | SME has unresolved corrections or unaccepted gaps |
| `PROMOTION_APPROVED` | no named human approval, no rollback pointer |
| `PRODUCT_PROVEN` | signed-in page/aVa proof missing or aVa fails refusal tests |

## aVa Readiness Contract

aVa readiness is five states, not one:

| State | Required proof |
| --- | --- |
| loaded | canonical candidate or active canonical records exist with lineage |
| indexed | Azure-native retrieval/index job completed for the same version |
| retrievable | deterministic query returns expected records and citations |
| cited | rendered aVa answer includes valid citations to allowed evidence |
| refuses | aVa declines or caveats conflicted, restricted, missing, or non-agent-ready facts |

aVa may not receive raw Layer 1 rows, adapter outputs, unvalidated graph candidates, or product-specific ad hoc files. It should receive a governed module context bundle with:

- tenant key and active version,
- requested module and purpose,
- allowed domains,
- cited records,
- validated relationship paths,
- conflict/caveat register,
- unsupported question list,
- data-class and sensitivity filters,
- exact readiness flags.

## Real Client Implementation Pattern

The client experience should be simple:

1. We give them an intake checklist by source owner, not a canonical schema manual.
2. They export what they already have from each system.
3. They certify as-of date, filters, redactions, and owner.
4. AbarVa runs adapter dry-runs and returns a gap report in plain English.
5. Client SMEs resolve gaps, conflicts, and mapping questions.
6. AbarVa builds a canonical candidate and a shadow product projection.
7. Client SMEs review Home/Moves/Source/Tower context snapshots before activation.
8. Only then do we promote to active runtime and prove aVa with citations and refusal tests.

This lets Enterprise ChatGPT or client-side AI help map raw extracts into templates, but the authoritative act remains client certification plus AbarVa adapter validation. AI can propose mappings; it cannot certify source truth.

## Implementation Waves

### Wave 1: Make Layer 2 Real

- Implement the six missing adapter families identified by the audit.
- Add executable fixtures for each adapter family with representative source extracts.
- Require every mapping profile to emit canonical candidates, evidence, quarantine, and coverage reports.
- Make adapter dry-run failure visible in CI/reporting.

Exit criteria:

- every required adapter family has at least one executable profile;
- each active test tenant has a passing dry-run for the domains it claims to support;
- no adapter emits product-owned shapes.

### Wave 2: Canonical Graph Repair Queue

- Split graph rows into accepted edges and repair candidates.
- Reject accepted edges with missing endpoints, undeclared verbs, or invalid domain/range.
- Add a review queue that asks for one of three actions: catalogue object, correct edge, or drop edge.
- Preserve external evidence references as evidence gaps, not graph defects.

Exit criteria:

- accepted graph has no phantom edges;
- dangling references are zero or explicitly blocked before product projection;
- graph quality is measured on accepted edges, not total raw relationship rows.

### Wave 3: Layer 4 Projection Boundary

- Build module projection builders from Layer 3 accepted objects, facts, relationships, and evidence.
- Route Home through the module context serving contract.
- Log and meter any temporary Layer 1 compatibility fallback.
- Add a test that fails if product code imports or reads tenant intake roots directly.

Exit criteria:

- Home, Intelligence, Moves, Source, and Tower have named projection contracts;
- Home's default route can render from Layer 4 without reading Layer 1;
- direct Layer 1 reads are either removed or explicitly marked as temporary fallback with evidence.

### Wave 4: Shadow Refresh And aVa Proof

- Build shadow projections for a selected tenant without changing active runtime.
- Index the same version into the retrieval layer.
- Run deterministic answerability tests and refusal tests.
- Promote only after SME approval and rollback pointer creation.

Exit criteria:

- loaded/indexed/retrievable/cited/refuses all pass for the same version;
- signed-in browser proof shows Home and aVa reading the promoted active version;
- no model-generated value is promoted as deterministic fact.

## Non-Negotiables

- No product reads Layer 1 or Layer 2 as a normal runtime path.
- No adapter output is hand-edited.
- No dangling graph edge becomes accepted by manufacturing its endpoint.
- No money/value metric is calculated by Claude.
- No synthetic or planning-grade data becomes a real-client claim.
- No active promotion happens without a named human approval and rollback pointer.

## First Build Slice

Start with one representative tenant and one narrow, valuable question:

> "What systems, technologies, applications, vendors, owners, KPIs, and known issues support this business capability today?"

The first slice should cover:

- organization/workforce,
- applications/CMDB,
- infrastructure/cloud,
- vendors/contracts,
- KPIs/operational telemetry,
- interviews/workshop evidence,
- relationships,
- Home projection,
- aVa cited answer and refusal proof.

This is enough to prove the real-client operating model without boiling the ocean. Once it works, expand horizontally by adapter family and vertically by module.
