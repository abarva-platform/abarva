# ECL Product Deterministic Needs

Status: product projection contract draft. No route repointing, data load, migration, or deployment is authorized by this document.

This document answers one question:

> What deterministic facts must ECL provide so Home, Tower, Source 360, and Intelligence can render credible product pages without inventing analytics in the UI?

The rule is simple: product pages read projections and context packs. They do not calculate source truth from raw files, source rows, or display-name joins.

## Product Data Flow

```text
ECL source/context/commercial/review tables
  -> snapshot
  -> context packs
  -> product projection builders
  -> projection manifest + product read tables
  -> product pages
```

The projection builder is where deterministic analytics live:

- aggregation logic;
- filters and cohorts;
- page-specific row shape;
- proof/gap flags;
- source hashes;
- freshness;
- rebuild command;
- browser/test evidence when a UI route is repointed.

The UI should render, filter, sort, drill, and compare. It should not decide what a number means.

## Cross-Product Projection Rules

| Rule                                                                                                                                                                        | Why it matters                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every projection row carries `tenant_key`, `assessment_id`, `snapshot_id`, `projection_key`, `projection_version`, and `source_hash`.                                       | Makes page output traceable to an ECL snapshot.                                                                                                                                                                |
| Every number comes from `ecl_context.measure`, `ecl_commercial.invoice_line`, `ecl_commercial.contract`, `ecl_commercial.sla_observation`, or a declared calculated metric. | Prevents UI-side invented math.                                                                                                                                                                                |
| Every relationship path comes from `ecl_context.relationship` using FK endpoints.                                                                                           | Prevents display-name joins.                                                                                                                                                                                   |
| Every metric key used by a projection or cube resolves to `ecl_context.metric_definition`; every measure-backed cube value resolves to `ecl_context.measure`.               | Prevents JSON lists from becoming unconstrained metric claims.                                                                                                                                                 |
| Every money value carries `basis`, `value_state`, `quality_state`, and source reference.                                                                                    | Keeps estimates, unknowns, conflicts, and verified values distinct.                                                                                                                                            |
| Every page has a `gap_flags_json` or equivalent gap list.                                                                                                                   | A page can say what is missing instead of silently implying completeness.                                                                                                                                      |
| A projection that backs a view with a declared admission gate must carry the gate result.                                                                                   | When the gate refuses, the projection carries the refusal: failed rule, measurement, evidence needed, and supported alternative. The page renders the refusal; it never renders a partial view as if complete. |
| Projection tests compare expected vs observed values.                                                                                                                       | Avoids status-stamp QA.                                                                                                                                                                                        |
| Browser QA is required for Home/Tower/Source visual routes before route repointing.                                                                                         | Data correctness is not visual proof.                                                                                                                                                                          |

## Home

Home is the executive orientation surface. It should explain what the enterprise is, what changed, what is known, what is unknown, and where to go next. Home should not be a warehouse browser.

Primary projection:

```text
ecl_projection.home_enterprise_landscape
```

Required packs:

```text
enterprise_orientation
technology_landscape
data_analytics_context
vendor_contract_context
program_value_context
ai_portfolio_context
```

### Home Page/Tab Needs

| Page/tab                   | Deterministic driver                                                                               | Minimum fields                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Executive Brief            | Enterprise/profile objects, strategy/interview-derived priorities, top measures, top gaps.         | `tenant_name`, `industry`, `revenue_band`, `employee_count`, `business_segments`, `headline_claims`, `priority_themes`, `known_gaps`, `basis`, `review_state`.                                          |
| Our Business               | Business segments, functions, operating model relationships, revenue/member/patient/site measures. | Segment/function list, revenue or volume split, function ownership, operating dependencies, interview citations.                                                                                        |
| Strategy & Value Creation  | Program objects, strategic priorities, outcome measures, value hypotheses, Tower handoff state.    | Priority, funded programs, baseline/target outcomes, expected value, owner, confidence, proof status.                                                                                                   |
| How We Operate             | Process, organization, workflow, platform dependencies.                                            | Function-to-process, process-to-app, owner, pain point, manual work count, automation candidate flag.                                                                                                   |
| Technology & Data          | Applications, infrastructure, data platforms, data products, integrations, D&A volumetrics.        | App counts by function, tier mix, hosting mix, data platforms, marts, report counts, ETL counts, users, data volumes, relationship coverage.                                                            |
| Performance & Value        | KPI and spend/value measures.                                                                      | Baseline, actual, target, forecast, value state, source count, conflict flag, Tower handoff state.                                                                                                      |
| Leadership Perspective     | Interview source records and synthesized themes.                                                   | Interviewee role/function, strategic/tactical theme, quote/citation reference, theme frequency, priority alignment, AI curiosity/concern.                                                               |
| What Needs Attention       | Gap/conflict/risk/control/value readiness projections.                                             | Gap code, affected object, severity, owner role, next evidence needed, source basis, handoff module.                                                                                                    |
| Current-state architecture | Resolver-backed architecture projection with admission result.                                     | Function, apps, vendors, hosting, platforms, criticality, lifecycle watch, missing joins, relationship confidence, `admission_status`, `refusal_json` when refused.                                     |
| Current-state data flow    | Resolver-backed data-flow projection with topology fitness gate.                                   | Source platform, ingestion pattern, data product/mart, report/ETL/user counts, consuming function, topology fitness measurement, unresolved path flag, `admission_status`, `refusal_json` when refused. |
| What has been loaded       | Source/file/object/measure coverage.                                                               | Source files by type, records by type, objects by type, measures by metric family, verified/unverified counts.                                                                                          |
| Browse the record          | Slice/dice read model over objects, measures, and relationships.                                   | Dimension options, visible columns, filters, source reference, value state, review state, drill target.                                                                                                 |
| Applications & Systems     | Application object slice.                                                                          | App name, function, vendor, owner, hosting, criticality, lifecycle, users, annual spend, contracts, dependencies.                                                                                       |
| Vendor Contracts           | Vendor/contract slice.                                                                             | Vendor, contract, service lines, scope, renewal, spend, SLA, document proof, Source 360 link.                                                                                                           |
| Infrastructure & Platforms | Infrastructure/platform slice.                                                                     | Platform, hosting model, capacity, resilience, apps hosted, data products hosted, risk/control links.                                                                                                   |
| Data Assets & Integrations | Data product/flow slice.                                                                           | Source system, landing platform, mart/product, consuming report/tool/function, volume, users, regulatory flag.                                                                                          |

Home analytics are driven by `ecl_context.object`, `ecl_context.relationship`, `ecl_context.measure`, `ecl_commercial.*`, interview-derived review facts, and context packs. Home must show completeness and gaps; it must not pretend a missing volume, report count, or relationship is zero.

Home architecture/data-flow rule: pages must obtain architecture views through the resolver contract. `end_to_end_data_flow` must run its admission gate. If the record cannot answer the declared question, the projection stores and the page renders a refusal with failed rules, measurements, evidence needed, and supported alternatives. A refusal is not an empty result set and not a soft warning.

## Tower

Tower is the deterministic value, risk, spend, adoption, and action-control surface. Tower numbers must be harder than Home prose.

Primary projections:

```text
ecl_projection.tower_command_center
ecl_projection.tower_value_chain
ecl_projection.tower_evidence_queue
ecl_projection.tower_ai_portfolio
```

Required packs:

```text
tower_value_context
program_value_context
vendor_contract_context
ai_portfolio_context
risk_control_context
```

### Tower Page/Tab Needs

| Page/tab            | Deterministic driver                                                  | Minimum fields                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Command Center      | Measures, program objects, risk/control relationships, review events. | Portfolio value, blocked value, claimable value, evidence maturity, risk pressure, action count, last refresh.                                  |
| Value Proof         | Baseline/actual/target/forecast measures and source references.       | Claim ID, baseline, actual, target, value amount, value state, finance validation state, source count, conflict flag, gate status, gate reason. |
| Decision Lanes      | Program/value/risk/evidence scoring projection.                       | Program, lane, blocker, funded amount, supported value, proof score, risk score, owner, next gate, gate reason.                                 |
| Evidence            | Source files, source records, documents, extractions, review events.  | Evidence ID, affected metric/claim, source basis, verification state, missing evidence, reviewer role, due window, gate reason.                 |
| Recommended Actions | Gap/risk/value readiness rules.                                       | Action ID, priority, owner role, amount exposed, evidence requirement, handoff module, readiness, gate reason.                                  |
| AI Portfolio        | AI use-case/tool objects and adoption/value/risk measures.            | Use case, tool, users, adoption, spend, expected value, measured value, model risk/control status, data readiness.                              |
| Cost Lens           | Invoice lines, contracts, spend measures.                             | Spend by vendor/function/platform/program, variance, allocation basis, unmapped spend, source quality.                                          |
| Risk Lens           | Risk/control objects and relationships.                               | Risk, affected app/vendor/program, control state, severity, unresolved evidence, owner.                                                         |
| Adoption Lens       | Usage telemetry and persona/function measures.                        | Tool/app/use case, active users, licensed users, adoption trend, function, workflow.                                                            |

Tower analytics must be metric-definition driven. The metric dictionary must include at least:

```text
annual_spend_usd
baseline_cost_usd
actual_cost_usd
target_cost_usd
forecast_value_usd
validated_value_usd
blocked_value_usd
active_users
licensed_users
adoption_rate_percent
data_volume_tb
report_count
etl_job_count
sla_target
sla_actual
risk_severity_score
control_coverage_percent
```

Tower must never calculate ROI, savings, value, or risk from narrative text. If a metric has no baseline or source, the projection emits a gap/action, not a value.

Tower gate rule: every gated value claim must carry `claim_gate_status`, `claim_gate_reason_code`, `claim_gate_reason_detail`, `evidence_needed_json`, and `next_gate`. A summary may say "97 claims are gated" only when the 97 underlying claim rows each explain why.

## Source 360

Source 360 is the commercial and vendor evidence surface. This is where ECL needs the deepest grain.

Primary projections:

```text
ecl_projection.source_vendor_360
ecl_projection.source_contract_360
ecl_projection.source_event_workspace
ecl_projection.source_value_levers
```

Required packs:

```text
source_360_context
vendor_contract_context
technology_landscape
tower_value_context
risk_control_context
```

### Source Page/Tab Needs

| Page/tab               | Deterministic driver                                                            | Minimum fields                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Vendor Portfolio       | Vendor objects, contracts, invoice lines, app/platform scope, SLA observations. | Vendor, spend, contract count, covered apps/functions, renewal exposure, SLA trend, risk/control links.                    |
| Vendor 360             | One vendor slice over all relationships and measures.                           | Vendor profile, contracts, service lines, apps supported, invoices, SLA, issues, opportunities, document proof.            |
| Contract 360           | Contract header, service lines, scope, invoices, SLA, document extraction.      | Contract term, renewal, notice, TCV/annualized value, service lines, scope, spend history, SLA, verified extraction state. |
| Renewal                | Contract term and renewal projections.                                          | Renewal date, notice date, spend at risk, owner, scope, SLA issues, evidence gaps, recommended action.                     |
| Events                 | Sourcing event/workflow objects and linked evidence.                            | Event, category, incumbent, scope, gate status, vendor responses, pricing facts, evaluation state.                         |
| Compare                | Vendor response/pricing/evaluation measures.                                    | Vendor, bid/response facts, score dimensions, price deltas, exceptions, missing proof.                                     |
| Value                  | Tower-compatible value measures and commercial levers.                          | Lever, baseline spend, addressable spend, validated savings, blocked value, confidence, source basis.                      |
| Approvals              | Review events and gate states.                                                  | Approval item, affected contract/event, required evidence, decision, reviewer role, timestamp.                             |
| Sourcing Opportunities | Rules over spend, renewal, SLA, risk, duplication.                              | Opportunity, vendor/category, value range, evidence state, affected functions/apps, Source action.                         |

Source analytics are driven by `ecl_commercial.contract`, `contract_service_line`, `contract_scope`, `invoice_line`, `sla_observation`, vendor/application/platform objects, and document extractions. Vendor/contract depth must not be collapsed into one shallow vendor row.

## Intelligence

Intelligence is the reasoning and advisory surface. It should consume governed context packs and deterministic summaries; it should not become a second analytics engine.

Primary projections/packs:

```text
ecl_projection.intelligence_context_pack
ecl_projection.intelligence_pattern_evidence
ecl_projection.intelligence_question_context
```

Required packs:

```text
enterprise_orientation
technology_landscape
data_analytics_context
vendor_contract_context
ai_portfolio_context
program_value_context
risk_control_context
```

### Intelligence Page/API Needs

| Page/API             | Deterministic driver                                             | Minimum fields                                                                                    |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Advisory page        | Context packs plus cited measures/relationships.                 | Tenant summary, known facts, gaps, relevant objects, evidence citations, confidence.              |
| Enterprise landscape | Same projection family as Home, but optimized for query context. | Object counts, relationship coverage, top risks, top vendors, data/AI readiness, missing domains. |
| Ask/query APIs       | Retrieval-safe packs and citation map.                           | Pack key/version, permitted facts, blocked facts, citation refs, freshness, access class.         |
| Insights/evaluate    | Pattern evidence projection.                                     | Pattern, evidence rows, affected objects, strength, conflict state, recommended next evidence.    |
| Pattern detail       | Relationship + measure + source evidence slice.                  | Pattern code, linked systems/vendors/functions/programs, supporting measures, gaps, source basis. |
| Context summary      | Snapshot/context-pack manifest.                                  | Snapshot ID, pack versions, source hash, indexed/retrieved/cited state, blocked domains.          |

Intelligence may synthesize narrative, but deterministic facts must arrive already resolved or explicitly marked `conflicting`, `unknown`, or `insufficient`. It must not convert weak evidence into confident recommendations.

## Product-Specific Projection Manifest Additions

The base `ecl_projection.projection_manifest` should be enough for rebuild tracking, but each projection output should include these columns or equivalent metadata:

| Field                    | Purpose                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `page_key`               | Product page/tab identifier.                                                                                               |
| `row_key`                | Stable row key for browser/tests.                                                                                          |
| `primary_object_id`      | Main object rendered by the row.                                                                                           |
| `metric_keys_json`       | Display/cache list of metrics used by the row; governed metric identity still resolves to `ecl_context.metric_definition`. |
| `relationship_ids_json`  | Relationship paths used by the row.                                                                                        |
| `source_refs_json`       | Source records/doc extractions used.                                                                                       |
| `basis_summary`          | `source_recorded`, `document_extracted`, `interview_derived`, etc.                                                         |
| `value_state`            | `known`, `estimated`, `unknown`, `not_applicable`, `conflicting`.                                                          |
| `quality_state`          | `passed`, `warning`, `blocked`, or page equivalent.                                                                        |
| `gap_flags_json`         | Missing evidence, missing relationship, missing owner, missing baseline, etc.                                              |
| `admission_status`       | `admitted`, `refused`, or `not_applicable`.                                                                                |
| `admission_gate_key`     | Gate identifier such as `end_to_end_data_flow`.                                                                            |
| `admission_result_json`  | Full admission/refusal result for resolver-backed views.                                                                   |
| `claim_gate_status`      | `claimable`, `gated`, `blocked`, or `not_applicable`.                                                                      |
| `claim_gate_reason_code` | Deterministic reason why a Tower/Source claim is gated or blocked.                                                         |
| `evidence_needed_json`   | Specific missing evidence required to admit the view or clear the claim gate.                                              |

## Minimum Projection Builders

Do not build every page at once. Build the smallest set that proves the model:

| Order | Projection                  | Why first                                                                                   |
| ----: | --------------------------- | ------------------------------------------------------------------------------------------- |
|     1 | `home_enterprise_landscape` | Proves executive summary, loaded coverage, architecture/data flow, and browse-record needs. |
|     2 | `source_contract_360`       | Proves deep commercial/document/source evidence and avoids shallow vendor data.             |
|     3 | `tower_command_center`      | Proves deterministic value/spend/evidence logic.                                            |
|     4 | `intelligence_context_pack` | Proves aVa consumes governed packs and cites facts without raw context.                     |

Each builder must produce:

- row count;
- metric count;
- relationship count;
- source reference count;
- gap count;
- output hash;
- rebuild command;
- planted-failure test;
- product route/browser proof before repointing.

## Deterministic Analytics Backlog

| Need                                                       | ECL source                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| Function-to-application architecture                       | `object` + `relationship` + app measures.                               |
| Application-to-vendor/contract scope                       | `relationship` + `ecl_commercial.contract_scope`.                       |
| Application-to-hosting/platform                            | `object` + `relationship` + infra/platform measures.                    |
| Data platform/mart/report/ETL/user volumetrics by function | `measure` on data platform/product/function objects.                    |
| Vendor spend and renewal exposure                          | `invoice_line` + `contract` + `measure`.                                |
| Contract service depth                                     | `contract_service_line` + document extraction.                          |
| SLA performance                                            | `sla_observation` + metric definitions.                                 |
| Budget and value proof                                     | `measure` + `invoice_line` + program relationships.                     |
| AI tool/use-case adoption                                  | AI objects + usage measures + risk/control relationships.               |
| Interview-derived priorities and maturity                  | Interview source records + reviewed context objects/measures.           |
| Evidence gaps and contradictions                           | `review_event`, `value_state`, `quality_state`, source conflict checks. |

If a product page needs a fact not listed here, the answer is not to add UI math. The answer is to add the metric, relationship, or commercial grain to ECL and prove it through a projection builder.
