# Non-Serving Context Semantic Map

This is an explicit admission map, not name similarity. Source contract `ec-private-context/v0` is a fictional, private parser contract; registered v3 remains the production default. No workbook alias or compound-cell split is admitted here. The implementation maps are exported from `scripts/ecl/ec_private_candidate_types.ts` and tested against disposable schema/dictionary constraints.

## Object Types

| Design type | ECL catalog/table | Boundary |
| --- | --- | --- |
| enterprise | enterprise | Enterprise scope |
| segment | business_segment | Declared segment |
| function | business_function | Declared function |
| org_unit | organization | Declared organization |
| role | persona | Accountable role, not an employee |
| workforce_cohort | organization | Retained semantic detail, not an organization total |
| process | process | Declared process |
| capability | capability | A1 catalog addition; not a process count |
| application | application | Logical application only |
| application_module | application_module | Never an additional application |
| platform | infrastructure | Declared hosting platform |
| deployment | application_deployment | Separate deployment grain |
| data_asset | data_product | Source asset grain, no whole-estate inference |
| etl_job | data_flow | Retained job semantic detail, not a flow total |
| supplier | vendor | Legal/declared supplier identity |
| contract | contract | Contract object |
| service | process | Retained service semantic detail, not a process total |
| financial_line | spend_line | No aggregation across incompatible bases |
| program | program | Program object |
| initiative | initiative | A1 catalog addition; string attributes do not count |
| metric_definition | metric | Definition, not an observation |
| risk | risk | Risk object |
| control | control | Declared control, not tested effectiveness |
| ai_use_case | ai_use_case | Use case, not realized benefit |
| ai_tool | ai_tool | Tool object |
| usage_observation | metric | Retention-only semantic detail, not a metric definition total |
| evidence_request | evidence_request | Absence/request, never received evidence |
| source_document | ecl_source.document | Not forced into object catalog |
| evidence_item | source-linked evidence sidecar | Exact version/locator retained; not verified evidence or an object |
| leadership_observation | leadership_observation | Response basis retained, never fabricated transcript |
| strategic_priority | strategic_priority | Priority distinct from funded work |
| data_flow | data_flow | Declared integration flow |

Narrower types remain in `canonical_semantic_type` and source attributes. Default estate totals may not add retention-only grains. Evidence sidecars must not be presented as a completed extraction or human sign-off.

## Predicates And Canonical Orientation

All design predicates carry the `design:` prefix. Only admitted business rows become ECL relationships. `cites_document` is an evidence SIDECAR, not a business gap or a graph predicate. The ECL check and V6 dictionary are both exercised by disposable tests; dictionary orientation wins. Inverse traversal is a query, never a second physical edge.

| Design predicate | Stored canonical predicate | Stored direction |
| --- | --- | --- |
| has_segment | HAS_SEGMENT | enterprise → segment |
| has_function | HAS_FUNCTION | enterprise → function |
| belongs_to_segment | BELONGS_TO_SEGMENT | function/org unit → segment |
| part_of_unit | PART_OF_UNIT | function → org unit |
| accountable_to | ACCOUNTABLE_TO | subject → persona |
| performs | PERFORMS | function → process |
| realizes | REALIZES | process → capability |
| supports_process | SUPPORTS | application → process |
| module_of | MODULE_OF | module → logical application |
| deployment_of | DEPLOYMENT_OF | deployment → logical application |
| hosted_on | HOSTED_ON | deployment/asset/job → platform |
| feeds | FEEDS | application/job/asset → asset |
| supplied_by | SUPPLIED_BY | application/contract/service/tool → vendor |
| covered_by | COVERED_BY | application/service → contract |
| implements | IMPLEMENTS_CAPABILITY | initiative → capability |
| part_of_program | PART_OF_PROGRAM | initiative → program |
| advances | ADVANCES_PRIORITY | program/initiative → priority |
| applies_to | APPLIES_TO | risk → application/process/asset/service |
| mitigated_by | MITIGATES | **control → risk**, reverse source endpoints |
| uses_tool | USES | use case → tool |
| assists_process | ASSISTS_PROCESS | use case → process |
| works_in | WORKS_IN | cohort → function |
| requests_evidence_for | EVIDENCE_REQUESTED_FOR | request → subject |
| cites_document | SIDECAR | evidence item → exact document revision; no graph edge |
| attributed_to_role | ATTRIBUTED_TO | observation → persona |
| cost_for | COST_OF | financial line → application/service |
| measures | MEASURES | metric definition → process |

Twenty-six mapped business predicates plus one evidence sidecar. No business `predicate_not_admitted` gaps remain in this source dictionary. `SUPPORTS` and `USES` already exist in V6; the disposable ECL constraint admits them and all six added business verbs. It reads the actual existing check expression, retains every existing form (including legacy inverses), and adds each missing verb independently. Reapplying the draft adds nothing when all verbs are present. Dictionary additions are directed, non-executive-safe rehearsal metadata with explicit semantic endpoint families, not production graph adoption.

The six added predicates implement declared source relations only. `PART_OF_UNIT` is membership, not an inferred owner; `PERFORMS` and `REALIZES` do not establish process or capability maturity. `IMPLEMENTS_CAPABILITY` and `PART_OF_PROGRAM` do not grant funding or approval. `ASSISTS_PROCESS` does not establish usage, realized benefit or measured performance. No inverse, transitive relation, owner, maturity, approval or benefit is inferred. `cites_document` validates the evidence item's canonical document reference and retains its exact revision and locator as sidecar lineage, without creating a graph object or edge.

## Time, Qualifiers And Provenance

Intervals are half-open; invalid or reversed intervals fail. A module/deployment/function cannot have multiple logical parents over overlapping validity for its declared parent predicate. Deployment hosting carries its exact environment; data feeds carry an exact native flow reference matching endpoints. Segment shared-service qualifiers remain explicit. All six added business predicates require empty qualifiers; other qualifiers are rejected rather than silently discarded.

Identity follows the existing canonical UUID algorithm: declared namespace, tenant, assessment, kind and native key, never label. Source assertions remain separate even within one source; no first/newest/average arbitration. Measurement identity preserves definition version, population, dimensions, period/calendar/timezone, scenario, method, basis and unit/currency. A grain index must not destroy competing assertions.

## Access And Shadow Contract

Absent source access is `unknown`/`deny`, not a tenant-level grant. Source, object, assertion, measurement and relationship rows retain explicit access dependencies and declared revision markers. Fingerprints include source and typed-reference dependencies; relationship dependencies use canonical endpoint order and include a declared flow reference separately. Source-only, citation-only and referenced-object access changes invalidate the affected fingerprints without rewriting source bytes or canonical identities.

Document evidence links validate the canonical document and exact revision before becoming sidecars. The disposable source-record writer retains their metadata and governed candidate envelope in `attributes_json`; a physical readback checks that this survives persistence. That column addition exists only in the test-only SQL draft, not a production migration.

Shadow contract `ec-slice-v6-shadow/v2` compares exact source bindings, names, JSON evidence, qualifiers and validity as well as node/edge identities and semantic types. Empty half-open intervals are invalid. JSON key order does not matter; source validity representations are compared exactly. A structural match never grants readiness, review, access or serving authority.

## Acceptance Boundary

The draft lives outside `supabase/migrations` and refuses any database other than `ecl_admission_test`. Source/review tables already exist in the committed baseline. Remaining additions are assertion history, full observation metadata and rule evaluations. No physical production migration, owner ratification, unsigned-manifest promotion, source load, index or serving decision is implied.

Admission here means a typed relationship candidate can be represented in a disposable rehearsal. All candidates remain synthetic, `not_reviewed`, `not_indexed`, `blocked` and excluded from downstream context, with independent verification `not_performed` and declaration/load/serving/Finance approvals `not_granted`. Pure shadow planning remains `not_ready`, governance-blocked, non-executive-safe, ineligible for serving and excluded from adoption even when structural comparison matches. This contract changes no production adapter selection, private corpus, manifest, approval, serving path or product projection.
