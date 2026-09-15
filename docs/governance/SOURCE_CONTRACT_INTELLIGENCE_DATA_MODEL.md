# Source Contract Intelligence Data Model

This document is the implementation contract for Contract 360, Optimize,
Coverage, Education, exports, and Source aVa. It is a Layer 3 read model over
canonical Source facts. No product surface may create a contract fact.

## Layered object model

| Layer | Object                                                                                                   | Purpose                                                   | Allowed producer                        |
| ----- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| L1    | Contract documents, SOWs, change orders, invoices, usage, performance, ownership extracts                | Client-owned intake organized by data owner               | Client/operator                         |
| L2    | Adapter rows and source file lineage                                                                     | Preserve source grain, row identity, hashes, and load run | Deterministic adapter                   |
| L3    | Contract facts, terms, scope, spend, performance, usage, evidence, opportunities, claims, playbook rules | Governed source of truth and explainable projections      | Deterministic loader, approved reviewer |
| L4    | Contract 360, portfolio command center, Optimize, Education, Source aVa, exports                         | Read-only product projections                             | Product read adapters                   |

## Contract intelligence record

The contract record is keyed by `(tenant_key, dataset_version, contract_id)` and
must carry:

- declared contract identity and vendor identity;
- explicit `archetype_key`, `archetype_label`, mapping basis, confidence, and source;
- contract purpose only when extracted or reviewed; otherwise `null` with a visible review state;
- scope nodes and relationships to the systems, workloads, business functions, and owners that are actually loaded;
- evidence lanes with row counts, status, what the lane supports, and what remains blocked;
- deterministic facts and metrics with source references and as-of dates;
- opportunities and claim-level provenance;
- archetype education and industry context from an approved playbook;
- `derived_from_load_run_id`, `dataset_version`, model version, and provenance.

`vendor_category`, filename, folder name, and model intuition must never classify
an otherwise unmapped contract. The fallback is an explicit `unmapped` playbook,
not a guessed archetype.

## Opportunity claim

`source.opportunity_claim` is one row per statement that may appear in a lever
table, memo, Contract 360 narrative, or aVa answer. `claim_role` is one of:

`problem`, `current_term`, `deadline`, `calculation`, `proposed_ask`,
`proposed_target`, `vendor_rationale`, `sizing`, `risk`.

Every claim contains:

- `statement` and `basis`;
- `scenario_kind`: signed record, proposed target, or benchmark comparable;
- amount or range only when the amount is valid for that basis;
- structured `source_refs` with source system, table, record id, document, page, and span;
- calculation run/rule, benchmark, or playbook rule references when applicable;
- `produced_by`, generation reference, reviewer reference, and review timestamp;
- computed evidence status and load-run lineage.

Basis rules:

1. `client_record` requires at least one resolvable source reference.
2. `calculated` requires a completed calculation run and a declared arithmetic rule whose inputs can be recomputed.
3. `benchmark` requires a named comparable benchmark with source, method, vintage, and review state.
4. `playbook_rule` requires a versioned authored rule; it selects a play, it does not assert a contract fact.
5. `judgment` requires explicit judgment labeling. It may describe an ask or rationale but cannot create a value.
6. `not_recorded` is the honest state when evidence or a valid method is not present.
7. Claude-authored content requires a generation record. Attribution cannot be added retroactively.
8. Approval changes workflow state only. It cannot change basis, sources, amounts, or evidence status.

Signal-stage and proposed claims render without a dollar amount unless a valid
calculation or reviewed benchmark supports one. Candidate value is never
realized value; realized value requires Finance/Tower confirmation evidence.

## Archetype and industry intelligence

`source.contract_archetype_playbook` is the reusable education object. It owns
Track, Load, and Observe questions and guidance, required evidence families,
industry context, and prohibited benchmark claims. A contract selects one
playbook from its explicit mapping; it does not generate a bespoke playbook.

`source.archetype_source` records the reviewed sources supporting an archetype
or its industry context. `source.market_benchmark` records comparable benchmark
inputs, including methodology, locator, vintage, archetype, and industry. An
industry context paragraph may frame a question. It may not become a market
rate, percentile, discount, or savings amount without a reviewed benchmark.

## aVa contract context

For a contract question, Source aVa receives a whole-contract context packet,
not only the active tab and not a document count. The packet includes:

- exact contract and vendor identity;
- archetype and mapping provenance;
- purpose, scope, terms, amendments, pricing, invoices, usage, performance, change orders, owners, and evidence gaps;
- claim rows with source references, basis, review state, scenario state, and allowed use;
- deterministic metrics and calculation outputs;
- archetype education and industry boundary;
- current load run and freshness state.

The execution order is `resolve -> retrieve -> calculate -> synthesize ->
validate -> answer`. Missing or conflicted evidence is carried into the answer;
it is not replaced with generic assumptions. Cross-contract questions resolve a
second contract explicitly and never borrow facts from the selected contract.

## Content-proof contract for the redesigned detail view

The supplied content-proof artifact is a reference for information architecture,
not a source of facts. Each contract detail view must be able to answer a distinct
question without repeating another tab's numbers. The Layer 3 record therefore
provides these binding primitives:

| View chapter        | Required governed inputs                                                                         | Reader outcome                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Story               | reviewed purpose, archetype, commercial baseline, next decision                                  | What the agreement is and why it matters                       |
| Scope and ownership | declared scope rows, business functions, systems/workloads, owners, observed activity            | What is covered, what is being used, and who can settle intent |
| Economics           | signed fee components, periodized spend, invoice and settlement states, calculation lineage      | What the agreement costs and which ledger is unresolved        |
| Performance         | obligations, periods, incidents/tickets, credits, completeness and cutoff                        | Whether service delivery supports the position                 |
| Optimize            | claim rows, current term, ask, target, vendor rationale, owner, timing, overlap and amount state | What to pursue first and what is deliberately not sized        |
| Evidence reference  | resolvable source records, document/page spans, conflicts, missing artifacts, calculation runs   | Why a conclusion is allowed, blocked, or provisional           |
| Playbook reference  | authored archetype rules, required inputs, thresholds, industry context and sources              | What to track, load, observe, and revisit over time            |

Every chapter may carry `headline`, `narrative`, `exhibit`, `mapping`,
`takeaway`, `ask_a_va`, and `limitations`, but each must retain its own source
references, confidence, review state, and load-run lineage. These are not strings
the UI may invent from a row count. A missing field renders as a named boundary
and the artifact that would close it.

The shared record now carries a `reporting` object. Its `asOfDate` is nullable by
design: when no cutoff is declared, the record says so; it does not silently use
the scenario date. The object also carries period bounds, excluded observations,
completeness, and source references so every chart and table uses the same time
boundary. Metrics carry numeric value, unit, basis, cutoff, and completeness in
addition to their reader-facing formatted value.

`education` is required on newly built records and is selected from the approved
archetype playbook. It contains Track, Load, Observe, thresholds, required
facets, missing evidence, and provenance. Performance can be `not_required` only
when the selected archetype says it is inapplicable; zero rows alone never make
that decision. Industry context can frame a question, but cannot supply a market
rate, percentile, discount, or savings amount without a reviewed benchmark.

## Readiness and display rules

- `loaded`, `indexed`, `retrievable`, `cited`, `reviewed`, and `approved` are separate states.
- A missing lane is missing, not zero.
- A lane marked `not_required` by the archetype is explained as inapplicable, not shown as an evidence failure.
- Portfolio, Contract 360, Optimize, exports, and aVa use the same Layer 3 claim/read model.
- The UI may narrate these objects, but it may not recompute, relabel, or upgrade them.

## Batch refresh contract

Both contract-depth and cloud-consumption packages write claims in the same
Layer 3 transaction as opportunities and evidence. The loader readback must
assert opportunity, evidence, and claim counts. A data refresh is not complete
until the package manifest passes, the Azure Container Apps Job succeeds, the
Layer 2/3/4 readbacks reconcile, and signed-in tab-by-tab proof shows the same
contract identity and values.

The schema migration is additive. The hardened `contract_intelligence_v2`
projection is the preferred read model; `v1` remains available as a rollback
compatibility path until the new model is proven in production.
