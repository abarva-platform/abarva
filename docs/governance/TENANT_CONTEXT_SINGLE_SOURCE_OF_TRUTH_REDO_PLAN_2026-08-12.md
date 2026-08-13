# Tenant Context Single Source Of Truth Redo Plan

Status: approved design seed; execution begins with read-only inventory only.
Date: 2026-08-12
Release lane: client-data-lane
Scope: synthetic tenant context packages, source adapters, canonical dimensions, derived module projections, and retirement controls.

## Executive Decision

The current tenant-context estate has too many plausible places to look for truth: active inputs, generated packs, standard packs, interviews, approved narrative, module reports, Source proof packages, Tower projections, and older runtime fixtures. Some of these are valid evidence or build artifacts, but they are not all allowed to be truth.

The redo establishes one rule:

> One tenant has one registry-declared active context package. Everything else is upstream evidence, generated output, product projection, offline proof, or retired archive.

This plan starts with the selected healthcare cover tenant, then repeats the same operating model for the selected airline cover tenant. It does not physically delete or move old files until inventory, reconciliation, validation, and a retirement manifest pass.

## Architecture Contract

This plan implements `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`.
Client-facing workbook and template outputs must also follow `docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md`.

The non-negotiable layer model is:

```text
Layer 1: Client Intake
  What the client or synthetic source systems give us, organized by data owner.

Layer 2: Source Adapters
  Re-runnable mappings from intake shape into canonical enterprise objects.

Layer 3: Canonical Enterprise Model
  The source of truth. Every object has an ID and every relationship lives here.

Layer 4: Products
  Home, Intelligence, Moves, Source, Tower, Learn, and Pricing read projections only.
```

Rules this redo must preserve:

- No product owns data.
- Products may not read Layer 1 or Layer 2 directly.
- Adapter output is disposable build output, not truth.
- Tenancy comes from `datasets/tenant-inputs/tenant-input-registry.json`.
- Money, counts, and metrics are deterministic; model narrative may explain them, not invent them.
- Synthetic or planning-grade material must never become live-client truth without promotion gates.

## Target Operating Model

The intake model is:

```text
Client systems, documents, and stakeholders
        -> 10 client-facing intake workstreams
        -> 6 to 8 reusable source-adapter families
        -> 19 canonical Nexus context dimensions
        -> Home, Intelligence, Moves, Source, Tower
```

The important distinction:

> The 19 are canonical Nexus context dimensions, not 19 client questionnaires.

Clients should provide raw extracts, documents, and guided interview answers. Nexus/aVa should map, validate, normalize, reconcile, and project.

## Ten Client-Facing Intake Workstreams

| Workstream | Typical owners | Typical evidence |
| --- | --- | --- |
| Enterprise Strategy and Operating Model | CEO strategy, COO, CIO | Strategy, operating model, priorities, business units |
| Organization, Workforce, and Decision Rights | HR, COO, CIO leadership | Org charts, RACI, role catalogs, governance forums |
| Applications, Infrastructure, and Architecture | Enterprise architecture, IT ops | CMDB, application inventory, hosting, cloud, data center, diagrams |
| Data, Integration, and Analytics | CDAO, data engineering, integration teams | Data catalog, integrations, lineage, BI, AI platforms |
| Vendors, Contracts, and Procurement | Procurement, vendor management, legal | CLM exports, contracts, vendor master, renewals, sourcing history |
| Finance, Spend, and Value | CFO, FP&A, AP, procurement finance | Budget, GL, invoices, purchase orders, rate cards, benefit records |
| Programs, Portfolio, and Change | PMO, transformation office | Portfolio register, milestones, dependencies, funding, benefits |
| Risk, Security, Controls, and Compliance | CISO, risk, audit, compliance | Risk registers, controls, findings, incidents, regulatory obligations |
| Operations, KPIs, and Process Evidence | COO, process owners, service management | Process maps, operational metrics, tickets, service evidence |
| Interviews, Questionnaires, and Executive Signals | Sponsor, discovery lead | Role-specific interviews, questionnaires, workshop notes |

The workstreams are a catalog, not a burden. A Source-only engagement may activate a smaller subset. A full enterprise-context engagement may activate all ten.

## Source Adapter Families

Start with eight reusable adapter families:

| Adapter family | Canonical dimensions commonly populated |
| --- | --- |
| Application, CMDB, and architecture | Applications, infrastructure, relationships, evidence |
| Infrastructure, cloud, and platform | Infrastructure, applications, risks, metrics |
| Data catalog, integration, and lineage | Data assets, applications, relationships, evidence |
| Vendor, CLM, and procurement | Vendors/contracts, spend/value, risks, managed services, relationships |
| Finance, AP, GL, and FP&A | Spend/value, metrics, programs, vendors, evidence |
| PMO, portfolio, and benefits | Programs, AI use cases, metrics, risks, relationships |
| GRC, security, and service management | Risks, controls, operational evidence, metrics, applications |
| KPI and operational telemetry | Metrics, operational evidence, Tower fact inputs |

Interviews and questionnaires are a governed discovery channel with the same provenance and attestation model. They are not a substitute for source-system evidence.

## Canonical Dimension Contract

The 19 canonical dimensions remain the internal target model. They should be generated or validated from intake/adapters, not hand-assembled by clients as the primary workflow.

Expected categories:

- Source-backed dimensions: enterprise profile, functions, org ownership, workforce, applications, data assets, infrastructure, vendors/contracts, spend/value, programs, AI use cases, risks/controls, metrics, managed services, operational evidence.
- Derived or enriched dimensions: relationships, evidence sources, industry context patterns, expert lenses.

## Business Capability Profile Contract

The redo must add a generated, SME-validated capability profile layer for business questions that cut across multiple dimensions.

A capability profile is not another client questionnaire and not an independent source of truth. It is a Layer 3-derived, evidence-linked profile that assembles a client's operating model into business-language views such as contact center, provider network management, revenue cycle, claims operations, aircraft maintenance, airport operations, digital commerce, finance close, or cyber operations.

Each profile must align to the client's actual business model, not AbarVa's module boundaries. A healthcare tenant, for example, may need profiles by plan/member operations, provider operations, clinical operations, finance, and shared enterprise services. An airline tenant may need profiles by airport operations, aircraft maintenance, crew, commercial, loyalty, cargo, finance, and shared technology. The labels are client-specific and must be validated by client SMEs.

Minimum profile fields:

- tenant key
- capability profile ID
- capability name
- business model segment or line of business
- primary business function
- secondary/supporting functions
- business owner
- technology owner
- data owner
- process owner
- core applications and platforms
- supporting technologies and infrastructure
- vendors and contracts
- data domains and integrations
- critical KPIs and baseline status
- known issues, constraints, and risks
- active programs, Moves, AI use cases, or Source opportunities
- interview signals used
- source-system evidence used
- unresolved evidence requests
- confidence and attestation status
- SME reviewer, review date, and disposition
- allowed module usage
- blocked claims

Capability profiles are useful because they let aVa answer natural business questions without forcing the model to infer the business structure from disconnected rows. Example question:

> What do we use for contact center today, how does it support the plan business and provider business, who owns it, which KPIs matter, and what issues should we know before proposing AI or sourcing action?

For that question, the profile should assemble the relevant systems, owners, data flows, contracts, KPI baselines, interview signals, and gaps into one governed view. If the profile cannot distinguish plan/member service from provider support, it must say so and open an evidence request instead of guessing.

Client SMEs must validate capability profiles before any registry activation, canonical load, retrieval indexing, aVa use, Source use, Moves use, or Tower projection. Validation must cover:

- whether the capability label matches the client's business language
- whether the included systems and technologies are complete enough
- whether owners and decision rights are correct
- whether business-line segmentation is correct
- whether KPI definitions and baselines are acceptable
- whether known issues are fair, current, and not overstated
- whether interview-only signals are clearly marked
- whether the profile is allowed for planning, sourcing, value tracking, or executive narrative

Generated capability profiles remain `draft_generated_context` until SME disposition is `approved` or `approved_with_caveats`. A profile with no SME validation may be used for internal audit and gap analysis only.

## Required Provenance Per Raw Extract

Every raw extract or uploaded source file must carry:

- tenant key
- intake workstream
- source system
- source object or report name
- source-system record ID when available
- extract timestamp
- effective date or reporting period
- source owner
- business owner
- extraction method
- full versus incremental extract
- file hash
- certification or attestation state
- data classification
- known limitations

Clients should not be asked to assign a subjective confidence score to each row. Nexus should calculate confidence from source authority, freshness, completeness, corroboration, conflict state, and validation results.

## Redo Phase A: Healthcare Cover Tenant

### A0. Freeze And Inventory

Create a truth inventory across all known artifact families:

- `datasets/tenant-inputs/active/<tenant>/current`
- `datasets/tenant-inputs/<tenant>/standard-*`
- `datasets/tenant-inputs/generated/<tenant>/*`
- `datasets/tenant-inputs/<tenant>/interviews`
- `datasets/tenant-inputs/<tenant>/derived`
- `datasets/tenant-inputs/<tenant>/approved-content`
- related `reports/*`
- older runtime fixtures and product references under `src`
- loader, adapter, and generation scripts that can read or write the tenant

Each file receives:

- path
- tenant key
- artifact family
- architecture layer
- source-of-truth eligibility
- recommended action
- reason

### A1. Choose The New Active Package ID

Create one new governed package root:

```text
datasets/tenant-inputs/<tenant>/v2026-08-governed-intake/
```

Expected folders:

```text
00_manifest/
raw/
validated/
mapping/
source-adapters/
canonical-dimensions/
interviews/
derived/
approved-content/
reports/
```

The registry must eventually point to exactly one active package or active alias. Until validation passes, the existing active root remains unchanged.

### A2. Reconcile Conflicting Claims

Produce a claim reconciliation table with:

- claim
- value asserted
- asserting file
- source family
- authoritative source
- final allowed value
- blocked narrative
- reviewer
- status

Known conflict classes to check include:

- geography and operating footprint
- facility count
- platform/lakehouse status
- cloud/provider state
- vendor and contract counts
- value, spend, budget, and benefit claims
- active module readiness versus offline proof

### A3. Make Interviews First-Class

The new package must include:

- interview question bank
- executive and role-specific response file
- interview data dictionary
- interview guidance
- coverage matrix
- evidence request log
- generated insight summary
- mapping from interview claims to canonical objects or gaps

Interview-derived facts are proposed signals until corroborated or explicitly attested.

### A4. Rebuild Layer 2 And Layer 3

Rebuild source-adapter outputs and canonical dimensions from approved intake only.

No hand edits to adapter output. If the output is wrong, fix the input, mapping, or adapter.

### A5. Rebuild Layer 4 Projections

Only after Layer 3 validation passes, rebuild:

- Home context and architecture projections
- Intelligence/aVa context bundles
- Moves context packages
- Source read models
- Tower deterministic marts and cubes

Layer 4 artifacts are disposable and must be traceable back to Layer 3 and source evidence.

### A6. Runtime Guard

Add guardrails so runtime surfaces cannot silently read retired or adjacent truth candidates:

- no direct product reads from Layer 1 or Layer 2
- no imports from retired tenant roots
- no older runtime fixtures as source of truth
- no more than one active registry package per tenant
- no unregistered generated package promoted by path convention

## Redo Phase B: Airline Cover Tenant

Repeat the same process after Phase A inventory and validation pass:

- inventory all artifact families
- create one governed package root
- reconcile claims
- normalize interview coverage
- rebuild adapters and canonical dimensions
- rebuild product projections
- retire old folders through manifest, not ad hoc deletion

Phase B must reuse the Phase A scripts and validation gates. If it needs custom logic, that is a design smell and must be documented.

## Retirement Strategy

Do not delete first. Retire through manifest first.

Required retirement artifacts:

- `retirement-manifest.csv`
- old path
- artifact family
- replacement path
- reason
- owner
- retirement date
- deletion eligibility
- rollback path

Allowed retirement states:

| State | Meaning |
| --- | --- |
| active | registry-declared source package |
| source-evidence | immutable upstream evidence |
| generated-output | re-runnable adapter or derived output |
| product-projection | Layer 4 output only |
| offline-proof | useful proof package, not live truth |
| retired-in-place | retained for audit but blocked from runtime |
| archive-ready | can move to external archive after review |
| delete-ready | can be removed after rollback window |

## GPT Design Validation

Validation performed by Codex/GPT-5 on 2026-08-12.

Rubric:

| Gate | Result | Notes |
| --- | --- | --- |
| Aligns to four-layer information architecture | PASS | Plan separates intake, adapters, canonical truth, and projections. |
| Avoids creating another source of truth | PASS | New package is registry-gated and old artifacts are classified. |
| Handles interviews explicitly | PASS | Interviews become a governed discovery workstream with evidence status. |
| Preserves synthetic/offline boundaries | PASS | Offline proofs stay non-runtime until promotion gates pass. |
| Supports repeatability across tenants | PASS | Phase B must reuse Phase A scripts and gates. |
| Has safe retirement controls | PASS | Retire-in-place before deletion; runtime guards required. |
| Identifies hard human gates | PASS | Registry activation, physical retirement, deletion, and runtime use are gated. |
| Ready for incremental execution | PASS_WITH_GATES | Safe to begin read-only inventory. Not safe to move/delete/load/promote yet. |

GPT validation conclusion:

> The design is comprehensive enough to start execution incrementally. The first approved execution slice is read-only inventory and classification. Registry activation, file retirement, product rewiring, data-plane loading, and deletion require separate validation evidence and explicit operator approval.

## Execution Checklist

| Step | Status | Output |
| --- | --- | --- |
| Add tracked design plan | complete | This document |
| Add release-control record | complete | `docs/releases/records/2026-08-12-tenant-context-truth-consolidation-plan.md` |
| Add read-only inventory script | complete | `scripts/audit/tenant-context-truth-inventory.mjs` |
| Run Phase A/B initial inventory | pending | `reports/tenant-context-truth-redo/<run>/` |
| Review inventory with operator | pending | human approval |
| Draft new governed package manifests | pending | package manifest and source register |
| Reconcile conflicts | pending | claim reconciliation table |
| Generate SME-validated capability profile drafts | pending | capability profile report and SME review matrix |
| Rebuild adapters/canonical dimensions | pending | generated outputs |
| Validate canonical package | pending | validation report |
| Rebuild projections | pending | module read models |
| Retire old files/folders | pending | retirement manifest and runtime guard |

## Hard Gates

These actions are not approved by this design document alone:

- changing `tenant-input-registry.json` active roots
- deleting or moving old tenant files
- loading data into Azure/Postgres
- promoting Active Tenant Access
- changing signed-in runtime routing
- declaring retrieval, aVa, Source, Tower, or Home live-proof
- turning synthetic or offline proof material into client truth

Each hard-gate action needs its own scoped plan, dry run, apply step, readback, and evidence.

## Execution Log

| Date | Slice | Status | Evidence |
| --- | --- | --- | --- |
| 2026-08-12 | Path-only truth inventory for healthcare and airline cover tenants | complete | `reports/tenant-context-truth-redo/2026-08-12-path-only/` |
| 2026-08-12 | Healthcare cover tenant execution draft: retirement manifest, claim reconciliation seed, augmentation candidates, layer refresh sequence | complete | `reports/tenant-context-truth-redo/meridian-health-execution-draft-2026-08-12/` |
| 2026-08-12 | MER-AUG-003 interview governance expansion as draft Layer 1 discovery package | complete | `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/interviews/`; `reports/tenant-context-truth-redo/meridian-health-interview-governance-2026-08-12/` |
| 2026-08-12 | Draft SME-gated business capability profiles, including contact center proof pattern | complete | `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/derived/capability-profiles/`; `reports/tenant-context-truth-redo/meridian-health-capability-profiles-2026-08-12/` |
| 2026-08-12 | SME review workbook generated from draft capability profiles | complete | `/Users/anand/Downloads/Meridian-Capability-Profile-SME-Review-2026-08-12.xlsx`; `reports/tenant-context-truth-redo/meridian-health-capability-profiles-2026-08-12/sme-review-workbook-manifest.json` |
| 2026-08-12 | Universal template pack brought to the client review workbook quality bar; index workbook rebuilt as the client front door and a governed `Start Here` added to all 25 other pack workbooks | complete | `scripts/audit/build-universal-template-workbook-quality-bar.mjs`; `reports/tenant-template-quality-bar-2026-08-12/` |
| 2026-08-12 | Both cover tenants classified across Layer 1-4 with derived claim reconciliation, adapter gap register, and hard gate register; Layer 1 governed intake draft packages prepared | complete | `scripts/audit/tenant-layer-refresh.mjs`; `reports/tenant-layer-refresh-2026-08-12/`; `datasets/tenant-inputs/<tenant>/v2026-08-governed-intake/00_manifest/` |

Current execution boundary remains unchanged: no registry activation, no active-root overwrite, no Azure/Postgres load, no canonical layer refresh, and no product projection refresh.

### Open findings carried out of the 2026-08-12 layer classification

- The airline cover tenant's active intake package conforms to the universal column contract; the
  healthcare cover tenant's does not (18 of 19 dimensions off-contract). **Decided — see the GATE-08
  decision below.**
- None of the four implemented mapping profiles can run against either tenant's active root, and six
  of the ten declared adapter families have no implemented adapter.
- `npm run audit:tenant-input-quality` validated file presence and row-count depth but not column
  conformance against `template-manifest.json`, which is how an off-contract active package passed.
  **Closed:** conformance was added to that gate, and the gate itself — which had never been invoked
  by any workflow — was wired into CI.

## GATE-08 Decision: The Column Contract Is Authoritative

Decided 2026-08-13. This resolves the open fork and is binding until amended here.

> The column contract in `template-manifest.json` is authoritative. The non-conforming package is
> remediated to the contract. The contract is **not** amended to match it.

### Why

| Evidence | Finding |
| --- | --- |
| Conformance across active tenants | 6 of 7 conform 19/19. Amending the contract would make six packages non-conforming to accommodate one. |
| Registry policy | `universalTemplateStandardV3IsOnlyApprovedStandard: true` already declares this contract the only approved standard. Amending it to fit one package inverts the policy rather than applying it. |
| Expressive power | The non-conforming shape is a governance wrapper — `record_id / entity_id / business_name / context_item / dimension / evidence_id` plus per-dimension extras. It has no `annual_spend_usd`, `term_start`, `term_end`, `renewal_date`, `fte_count`, or `criticality`. Questions Source and Tower exist to answer ("which contracts renew next quarter", "what is the run cost of this tower") are unanswerable from it — not because values are missing but because there is nowhere to put them. |
| Provenance | The non-conforming rows declare `source_type: synthetic_v3_context_generation`. This is a generation artifact, not client-provided evidence. There is no client to renegotiate a schema with, and regenerating it costs nothing but compute. |
| Information density | Contract fields carrying at least one value: 99% for the two packages generated to the contract, 23% for the non-conforming one. The contract shape is demonstrably carrying more of the model, not merely a different naming of it. |
| Coexistence | The conforming packages carry provenance columns (`original_source_file`, `source_fingerprint`, `conflict_status`, …) *on top of* the contract columns, and the gate permits extras. Governance metadata and the contract are not in tension. |

### What this means in practice

The remediation is additive, not destructive. The non-conforming package does not need its governance
columns stripped; it needs the contract columns present and populated alongside them, exactly as the
conforming packages already do.

### Binding constraint on the remediation

Where a contract column has no deterministic source in the existing data, it must be left **empty and
raised as an evidence request**. It must not be inferred, back-filled from narrative text, or
generated. Money, counts, and dates are deterministic or they are absent.

This constraint has teeth: the quality gate now reports, per tenant, how many contract fields actually
carry a value. A package that "conforms" by adding empty columns will show its fill rate collapse, so
a hollow remediation is visible rather than green.

### Explicitly not done by this decision

Deciding the shape is not the same as changing the data. Regenerating the package and repointing any
active root remain `GATE-02` and still require scoped approval, a dry run, a readback, and evidence.
No tenant file was written when this decision was recorded.
