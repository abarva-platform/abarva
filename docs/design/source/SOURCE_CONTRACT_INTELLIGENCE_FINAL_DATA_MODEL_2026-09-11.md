# Source Contract Intelligence: Final Data Model

## Decision

Contract intelligence is a governed load-time projection over the canonical Source model. It is
not a render-time prompt assembled from page labels, and it is not a new product-owned database.

The model has four layers:

```text
Layer 1  client/system intake and restricted documents
         -> source package files, document inventory, page text, reviewed context fields

Layer 2  source adapters and quality gates
         -> typed canonical rows, stable IDs, source references, reconciliation results

Layer 3  canonical enterprise model
         -> contracts, vendors, evidence, facts, conflicts, opportunities, relationships, approvals

Layer 4  Source products and aVa
         -> Contract 360 tabs, Optimize workflow, exportable report, governed model prompt
```

No layer may skip the next layer. A page is not considered data-rich because a file exists; the
package must pass identity, lineage, row-shape, reconciliation, and evidence gates.

## Layer 1: Intake Contract

The client or source system supplies native extracts. The loader accepts the native shape and
normalizes it only in Layer 2.

| Intake family | Required identity | Typical fields | Unlocks |
| --- | --- | --- | --- |
| Contract register | `tenant_key`, `dataset_version`, `contract_id`, `vendor_ref` | title, category, archetype, annual value, dates, notice, owners | Story, baseline, archetype |
| Executed documents | `document_id`, `contract_id`, `source_file_id` | file name, document type, hash, page count | Evidence, clauses, purpose |
| Page text | `document_id`, page/section key | extracted text, extraction hash, source span | Citable document claims |
| Contract clauses | `clause_id`, `contract_id`, `document_id` | clause type, text, section/page, review state | Terms, rights, restrictions |
| Scope and CMDB | `scope_row_id`, `contract_id`, `application_ref` | service, function, hosting, criticality, run cost | Scope and anatomy |
| Spend/consumption | `observation_id`, `contract_id`, period | committed, actual, invoiced, paid, usage units | Economics and ramps |
| Invoice/AP | `invoice_line_id`, `contract_id`, invoice period | PO, line, billed, paid, exception, match status | Leakage and reconciliation |
| Performance/ITSM | `performance_row_id`, `contract_id`, period | target, actual, breach, ticket volume, credit | Performance and recovery |
| Change orders/QBR | `change_id` or `qbr_id`, `contract_id` | recurring work, approval, owner, scorecard | Scope leakage and governance |
| Opportunity findings | `opportunity_id`, `contract_id` | type, basis, amount state, evidence refs, owner | Candidate value |
| Negotiation levers | `lever_id`, `contract_id`, `lever_type` | ask, rationale, concession, timing, owner, risk | Optimize table and sequence |
| Reviewed context | `contract_id`, fact key | purpose, scope summary, commercial thesis, relationship boundary | Human-readable tab story |

Raw contract files remain in the restricted document/artifact path. The canonical model stores
governed metadata, extracted facts, citations, hashes, and reviewed summaries, not an uncontrolled
copy of confidential document contents.

## Layer 2: Adapter Contract

The adapter is pure and re-runnable. It must fail closed on malformed CSV rows, unknown contract IDs,
tenant mismatches, missing source references, invalid dates, and invalid evidence state.

Primary implementation:

- `adaptContractDepthPackage()` emits typed adapter rows and `qualityGate`.
- `projectContractDepthPackage()` emits product-neutral read models and the intelligence record.
- `buildContractIntelligenceRecords()` builds deterministic story, evidence lanes, anatomy, findings,
  and lever rows.
- `buildContractIntelligencePrompt()` places all model restrictions before the governed record.

Every adapter row carries:

```ts
{
  tenantKey,
  datasetVersion,
  stableRowId,
  contractId,
  sourceFileId,
  sourceRowId,
  sourceSystem,
  reviewStatus,
  sourceRefs,
  payload
}
```

The adapter quality gate reports business-labelled coverage, not opaque ratios:

- contracts with citable document pages
- contracts with declared scope
- contracts with monthly spend or usage
- contracts with invoice/AP evidence
- contracts with performance evidence
- contracts with documented opportunities
- contracts with structured negotiation levers
- managed-services contracts with resource, invoice-detail, workload-volume, and QBR evidence

## Layer 3: Canonical Enterprise Model

The new intelligence projection binds to existing canonical Source substrates:

| Canonical object | Existing store | Contract-intelligence use |
| --- | --- | --- |
| Contract/vendor baseline | `source.contract_360` | identity, terms, archetype, owners, baseline amounts |
| Scope relationship | `source.contract_application_scope` | declared application/service/function relationships |
| Evidence coverage | `source.contract_evidence_coverage_v1` | loaded, partial, missing, and blocked lanes |
| Contract facts | `source.canonical_fact_assertion` | reviewed purpose, scope, thesis, relationship, clause facts |
| Fact conflicts | `source.fact_conflict` | unresolved contradictions block sizing/approval |
| Source row lineage | `source.source_record_snapshot` | immutable source hashes and row-level provenance |
| Entity links | `source.evidence_entity_link` | evidence-to-contract/vendor/opportunity relationships |
| Opportunities | `source.optimization_opportunity` and related evidence/calculation tables | value type, amount state, evidence grade, owner, next action |
| Approval and outcome | `source.approval_request`, `source.approval_decision`, `source.negotiated_outcome`, finance realization tables | workflow state; realized value remains Finance-owned |
| Graph relationships | `intelligence_v6.relationship_edges` and quality-scored graph tables | only reviewed, normalized, tenant-scoped anatomy edges |
| Restricted/generated artifacts | `source_artifacts` / governed generated-artifact registry | raw documents, client-ready exports, and model outputs with hashes/status |

The intelligence record is therefore a read-model contract, not the source of truth. Its fields are
rebuilt when the load run, canonical facts, or authored playbook changes.

## Contract Intelligence Record

One record is produced per `(tenant_key, dataset_version, contract_id, model_version)`.

```ts
type ContractIntelligenceRecord = {
  modelVersion: string;
  tenantKey: string;
  datasetVersion: string;
  contract: {
    contractId: string;
    vendorId: string | null;
    vendorName: string;
    title: string;
    archetypeKey: string | null;
    archetypeLabel: string | null;
    archetypeSourceBasis: "document_declared" | "scope_and_pricing_inferred" | "vendor_category_inferred" | "unmapped" | null;
    archetypeConfidence: "high" | "medium" | "low" | "unverified";
    archetypePlaybookVersion: string | null;
    startDate: string | null;
    endDate: string | null;
    noticePeriodDays: number | null;
    annualValueUsd: number | null;
  };
  story: {
    purpose: string | null;
    scope: string | null;
    decision: string;
    evidenceBoundary: string;
    headline: string;
  };
  baseline: {
    metrics: ContractIntelligenceMetric[];
    facts: ContractIntelligenceFact[];
  };
  evidenceLanes: ContractIntelligenceEvidenceLane[];
  anatomy: {
    nodes: ContractIntelligenceAnatomyNode[];
    relationships: ContractIntelligenceAnatomyRelationship[];
  };
  findings: ContractIntelligenceFinding[];
  levers: ContractIntelligenceLever[];
  derivedInsights: ContractIntelligenceDerivedInsight[];
  industryIntelligence: {
    state: "loaded" | "missing_benchmark" | "not_applicable";
    archetypeKey: string | null;
    benchmarkSources: string[];
    allowedUses: string[];
    blockedClaims: string[];
  };
  review: {
    status: "draft" | "reviewed" | "approved" | "blocked_missing_evidence";
    missingEvidence: string[];
    reviewerRole: string | null;
    reviewedAt: string | null;
    derivedFromLoadRunId: string;
  };
  provenance: {
    sourceFiles: string[];
    sourceSystems: string[];
    sourceRefs: string[];
    buildVersion: string;
  };
};
```

The complete field definitions are implemented in:
`src/lib/source/contract-intelligence/types.ts`.

## Anatomy Model

Anatomy is a deterministic graph slice. It does not infer relationships from document names,
directory names, vendor category, or model intuition.

```text
contract
  -> provided_by -> vendor
  -> classified_as -> archetype
  -> covers -> declared scope
  -> supported_by -> document / clause / spend / invoice / performance / change order
  -> creates_opportunity -> finding / lever
  -> owned_by -> accountable owner
lever
  -> implemented_by -> approved action / finance handoff
```

Each node and edge carries a stable ID, plain-English label, description, and source references.
Only canonical relationship verbs are allowed. A missing edge is a visible boundary, not an
invitation to infer one.

## Evidence and Review States

| State | Meaning | Product treatment |
| --- | --- | --- |
| `loaded` | Rows exist and references pass validation | May support a claim within its source boundary |
| `partial` | Some rows exist but required fields/families are missing | Show the supported portion and the blocking gap |
| `missing` | No governed rows are available | Do not show a zero or a claim; show owner and unlock |
| `not_required` | Archetype does not require the family | Say not required for this archetype |
| `draft` | Generated or extracted but not reviewed | Visible as draft; not decision-grade |
| `reviewed` | Reviewed by named role | Available to approved product projections |
| `approved` | Approved for decision use | May drive action workflow and export |
| `blocked_missing_evidence` | A required evidence lane prevents the claim | No sizing or approval progression |

## Findings, Levers, and Money Rules

Every value row carries both `valueType` and `amountState`.

| Value type | Meaning | Dollar rule |
| --- | --- | --- |
| `recoverable_leakage` | Credit, duplicate, off-contract, or rate-card recovery | Requires invoice/SLA evidence and calculation trace |
| `avoided_cost` | Future spend prevented by entitlement/scope/renewal action | Candidate until the relevant approval/outcome closes |
| `negotiated_improvement` | Price, term, commitment, timing, or protection ask | Size only from deterministic calculation rows |
| `realized_value` | Finance/Tower-confirmed result | Never populated from a model estimate |

`not_sized` is not zero. Signal-stage rows remain visible but carry no dollar amount. `candidate`,
`pending`, `approval_required`, and `finance_unconfirmed` are not savings.

## Claude Prompt and Output Contract

The prompt receives, in this order:

1. system access, tenant, and confidentiality boundaries;
2. non-negotiable evidence and amount-state rules;
3. archetype playbook rules and benchmark restrictions;
4. output format and plain-English CXO style rules;
5. the governed `ContractIntelligenceRecord` and source references;
6. the user's question.

Claude may produce narrative, explanation, sequencing rationale, and client-ready negotiation
language grounded in the record. Claude may not invent facts, numbers, dates, benchmarks,
relationships, owners, or sizing. The product does not semantically scrub the answer afterward. The
prompt is the business-content control boundary; access control, tenant isolation, transport safety,
and output-size controls remain independent technical controls.

Source surfaces use an **8,192-token output budget**. The generic 2,048-token budget remains for
other surfaces. The larger budget is needed to explain purpose, archetype, scope, evidence gaps,
anatomy, sequencing, and a complete lever table without collapsing the answer into opaque labels.

## Layer 4 Product Bindings

| Product surface | Binds to | Required story |
| --- | --- | --- |
| Source portfolio | `buildContractIntelligenceReadout()` plus portfolio projections | Which contracts deserve work and why |
| Contract 360 Story | `record.story` and contract baseline | What the contract is and why it matters |
| Scope | anatomy scope nodes and scope evidence lane | What services/applications are explicitly covered |
| Economics | baseline metrics, spend, invoice, and ledger findings | What is committed, observed, billed, paid, and confirmed |
| Performance | performance lane and performance findings | Whether service evidence supports an ask |
| Relationship | anatomy nodes/edges and declared owners | How contract, vendor, scope, evidence, and decisions connect |
| Evidence | evidence lanes, document inventory, clauses, fact assertions | What is proven, what is missing, and what it unlocks |
| Optimize | levers, findings, calculations, approvals, playbook sequence | What to ask for, why, worth state, owner, timing, and next step |
| aVa | same governed record and prompt contract | A concise answer that preserves source, state, and gaps |
| PDF/email export | same approved record and generated response/artifact registry | A client-ready lever report with provenance and no hidden recalculation |

Each tab has one distinct headline and one distinct missing-evidence action. A generic evidence-state
block may appear only where it is the tab's actual story; it must not be copied across all tabs as
filler.

## Refresh and Staleness

Every intelligence record carries `derivedFromLoadRunId`, `datasetVersion`, `modelVersion`, source
hashes, and review timestamps. A new document, source extract, adapter version, or playbook version
creates a new record version and resets review state where the basis changed. Old records remain
auditable but cannot silently continue to drive current advice.

## Final Gate

The data model is complete only when all of these are true for the contract cohort being shown:

1. contract, vendor, archetype, and tenant identity reconcile;
2. document inventory and page text are citable where document claims are shown;
3. scope, spend/usage, invoice, performance, and change-order rows pass their applicable gates;
4. every relationship has a declared source reference;
5. opportunities and levers have valid evidence refs, owner, timing, and amount state;
6. unresolved blocking conflicts prevent sizing and approval;
7. the Layer 3 refresh produces current governed records;
8. the seven Contract 360 tabs, Optimize workflow, aVa prompt, and export read from the same record;
9. signed-in browser proof confirms the live product renders the reconciled data.

Until the final gate passes, the correct product state is an explicit evidence gap, not an empty
card, invented value, or polished but unsupported narrative.
