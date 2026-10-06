# Source Command Center Data Contract

## Purpose

This is the handoff contract for redesigning Source 360 screens from the Source Command Center visual template. The HTML template defines layout, hierarchy, labels, density, and interaction shape. It does not define facts. All facts must bind to the governed Source workspace projection or render a specific backfill state.

## Route and Binding Rule

Use the rich Source workspace path:

- Route surface: `/source/workspace` and `/source/preview/workspace`
- Loader projection: `loadSourceWorkspacePortfolio`
- Client shell: `WorkspaceExecutiveShell`
- Data contract: `SourceWorkspacePortfolioData`

Do not use `/source/portfolio` for this redesign. That older route is thinner and does not carry the Contract 360, evidence, optimization, vendor-position, or aVa grounding rows needed by the template.

## Layer Boundary

Layer 4 Source renders Layer 3/read-model projections only. It may format, sort, filter, summarize, and hide unsupported states. It must not invent money, dates, vendor identity, contract scope, clause existence, usage, performance, relationship coverage, or negotiation evidence at render time.

If a tab cannot bind to the row family listed below, it should render a precise missing-input state:

- What is missing
- Why it blocks the claim or visual
- Which owner or loader has to provide it
- Which tab becomes richer once loaded

Never use the same generic evidence block across tabs as filler.

## Selected Rich-Contract Set

The first fully rendered demo set should be limited to contracts with staged synthetic depth packages and governed evidence paths. These are the contracts Claude Design should use as the no-empty-cell reference set:

- `MER-TECH-DBX-001`: cloud consumption commit / data platform agreement
- `MER-CLOUD-AWS-001`: cloud consumption commit / enterprise cloud agreement
- `MER-CLOUD-AZURE-001`: cloud consumption commit / enterprise cloud agreement
- `MER-TECH-LAAMS-001`: application managed services / renewal optimization agreement

For these contracts, every Contract 360 tab should render a dense, contract-specific story. If any required row family is missing, the loader/enrichment backlog is not done. The UI should show a designed backfill state only while the package is being completed; it should not ship repeated filler blocks as a substitute for depth.

Fully rendered means:

- Story has a reviewed contract-purpose summary, archetype, commercial thesis, action posture, top lever, owner, and renewal/notice posture.
- Scope has named applications or workload groups, plain-English scope description, business function, criticality, hosting/location, and run-cost or a clear reason the archetype does not require run-cost.
- Economics has month-by-month commitment, actual spend/usage, invoice, paid, AP variance, and separate recoverable/avoidable/negotiable/realized value ledgers.
- Performance has SLA or service-quality observations required by the archetype, breach/credit state, and a concise answer to whether performance supports the optimization position.
- Relationship has declared vendor, contract owner, business owner, finance owner, change orders, case/opportunity owner, and declared dependencies when loaded.
- Evidence has source-document manifest, reviewed extracted facts, row counts by evidence family, clause references, and missing-input rows only where a required evidence family is absent.
- Optimize has a lever table, buyer ask, vendor concession/rationale, evidence basis, value state, amount or unsized signal state, accountable owner, blocker, and next action.

The design should assume these four are the CXO walk-through contracts. Other register-only contracts can remain thin, but they must be visibly labeled as register-only or depth-layer pending so the product never looks accidentally empty.

## Portfolio Model

`SourceWorkspacePortfolioData` is the page-level object.

- `tenantKey`: tenant identifier from the governed registry
- `asOfDateIso`: portfolio as-of date
- `semanticLayer`: Source V4 cube UI catalog exposed for agent and UI context
- `v4Snapshot`: canonical Source workspace snapshot
- `categoryQuality`: contract category/archetype quality summary
- `workspaceDiagnostics`: dataset label, dataset ID/version, analytics provider, active load run, V4 versus legacy row counts, and mismatch warning
- `cockpit`: Source command-center cockpit data
- `impact`: Source impact layer
- `contracts`: governed contract register/detail rows
- `vendors`: vendor contract portfolio rollups
- `applicationScope`: contract-to-application/service scope rows
- `initiativeDependencies`: contract-to-initiative dependency rows
- `reads`: availability flags for contracts, vendors, application scope, and initiative dependencies

Design implication: the Command tab can combine cockpit, impact, contracts, and vendors. Contract tabs should bind to selected-contract slices of the same families.

## Command Tab Bindings

The Command tab should answer: where should the sourcing team point this week?

Primary row families:

- `cockpit.verdict`: headline, deciding axis, binding chip, and support facts
- `cockpit.actionQueue`: ranked action rows with contract, counterparty, action verb, why, deadline, gate, annual value, and opportunity ID
- `cockpit.topContracts`: material contracts with term, renewal, confidence, and source-document state
- `cockpit.claimQualityControls`: what Source refuses to claim
- `impact.evidenceCoverage`: credit funnel and coverage lanes
- `impact.actionCandidates`: richer action-drawer details
- `impact.vendorPositions`: readiness/value scatter and vendor action position

Required design behavior:

- Show a compact KPI strip: contracted value, commitment at risk, unclaimed credit, and decision posture.
- Show a decision queue from `cockpit.actionQueue` or `impact.actionCandidates`.
- If no action rows exist, say that no governed action rows are loaded. Do not show a blank queue as if work is done.
- Show evidence lanes from row counts: spend, performance, contracts with depth, action candidates, aVa bundles, and register state.
- Show the credit funnel only from `credit_calculated_usd`, `credit_claimed_usd`, `credit_recovered_usd`, and `unclaimed_credit_usd`.

## Contracts Tab Bindings

The Contracts tab should answer: which contract has enough depth to open?

Primary row families:

- `contracts`: register/detail rows, count, value, dates, renewal posture, confidence
- `impact.evidenceCoverage`: depth status by contract
- `impact.actionCandidates`: next action by contract
- `contractDiscovery.focusableContractRows`: combines register contracts plus supplemental depth/action contracts without changing register totals

Required design behavior:

- Separate register count from supplemental depth count.
- Badge supplemental rows as depth-layer rows.
- Let vendor drilldown show every linked register and depth/action contract.
- Keep portfolio headline count register-owned.
- Do not bury rich rows below a first-page table limit; search and vendor click-through must find them.

## Contract 360 Tab Bindings

For selected contracts, each tab needs a different story and a different row family.

- Story: `contracts`, `impact.evidenceCoverage`, `impact.actionCandidates`, `impact.claimCards`, and any reviewed `impact.storyline` rows. It should explain what the contract is, why it matters, and what is actionable now.
- Scope: `applicationScope` and selected-contract coverage rows. It should describe plain-English scope from named applications/services, business function, criticality, hosting, and run cost. If application rows are absent, show a scope-backfill request.
- Economics: monthly spend/commitment observations carried through the Contract 360 detail view, invoice/payment/AP state, and opportunity value ledgers. Keep recoverable, avoidable, negotiable, and realized value separate.
- Performance: SLA/performance observations, breach rows, credit-calculated state, and whether performance supports the commercial posture.
- Relationship: declared vendor, contract owner, business owner, finance owner, change orders, and initiative/application dependencies. Do not infer CMDB, tower, or app graph coverage without declared rows.
- Evidence: document files, page-text facts, extracted clauses, spend evidence, usage evidence, performance evidence, and evidence gaps. If raw documents are intentionally absent from a demo-safe layer but structured evidence is loaded, say that explicitly.
- Optimize: `impact.actionCandidates`, optimization opportunities, claim cards, negotiation detail, deterministic sequence, evidence state, authority state, finance confirmation state, and blockers.

Required design behavior:

- Each tab gets a tab-specific headline and insight.
- Repeated generic evidence-state cards are not allowed.
- Empty cells should be replaced with specific missing-input language where the archetype requires the data.
- Missing data that is not required for the archetype should say `Not required for this archetype`, not `Not established`.

## Optimize Workflow Data

Optimize Contract is a governed workflow, not a button that merely changes tabs. Its visible state is derived from:

- `SourceContractActionCandidateRow.action_candidate_id`
- `opportunity_id`
- `contract_id`
- `vendor_ref` and `vendor_name`
- `title`
- `action_type`
- `opportunity_type`
- `finding_summary`
- `deterministic_basis`
- `candidate_amount_usd`
- `priority`
- `readiness_state`
- `evidence_state`
- `authority_state`
- `finance_confirmation_state`
- `next_action`
- `accountable_role`
- `decision_due_date`
- `coverage_state`
- `blocker_if_missing`
- `citation_basis_json`
- `load_run_id`

Design implication: the Optimize tab should read like a client-ready memo table:

- Lever
- Buyer ask
- Why the vendor can agree
- Evidence basis
- Value state
- Amount
- Owner
- Next step

Signal-stage levers must be visible but not sized as realized or approved savings. If benchmark data, target term, per-SKU usage split, ticket-volume family, or application inventory is missing, show the blocker directly in the row.

## Coverage Tab Bindings

The Coverage tab should answer: where is Source ready to tell a richer story, and where does data need backfill?

Primary row families:

- `impact.vendorPositions`: readiness versus value
- `impact.evidenceCoverage`: coverage states and row counts
- `categoryQuality` and evidence coverage contract archetypes: mapped/unmapped archetype status

Required design behavior:

- Use readiness versus value as the hero visual.
- Show archetype mapping progress.
- Use posture or readiness cuts before archetype concentration when archetype mapping is incomplete.
- Do not draw an archetype concentration chart from a large unmapped placeholder bucket.

## Data Augmentation Backlog

The visual template can be fully supported only if the load process enriches selected demo contracts with the row families below.

- Contract purpose summary: reviewed, source-basis-linked, load-run-scoped summary of what the contract is
- Archetype mapping: every selected contract must declare an archetype and playbook version
- Scope rows: applications/services, business function, criticality, hosting, run cost, relationship method, confidence
- Economics rows: monthly commitment, actual usage/spend, invoice amount, paid amount, AP exception state
- Usage rows: for cloud/consumption contracts, SKU or workload split where needed for serverless/classic and discount analysis
- Performance rows: SLA target, actual, breach flag, credit formula, credit state
- Relationship rows: vendor, contract owner, business owner, finance owner, change orders, initiative/app dependencies
- Evidence manifest: source documents, page text facts, extracted clause facts, review state, reviewer, timestamp
- Optimization rows: lever, ask, rationale, evidence basis, blocker, value state, amount/range, owner, next step, deadline
- aVa bundle: allowed claims, refusal rules, citation sources, and answer-format contract for CXO/pricing negotiation responses

## Load-Time Derived Intelligence

When a real or synthetic contract document is mapped to an archetype, the loader should derive reviewed intelligence at load time, not at render time. These derived objects must be governed facts with `source_basis`, `confidence_level`, `confidence_rationale`, provenance, `derived_from_load_run_id`, review status, reviewer, and timestamp.

Allowed load-time derivations:

- Contract purpose: what the agreement is for, in plain English
- Scope narrative: which workloads, services, platforms, or towers are declared in scope
- Commercial thesis: why this is a commitment, leakage, performance, renewal, or control story
- Archetype play selection: which authored playbook levers apply and why
- Negotiation ask and sequencing rationale: what to ask first, what to hold back, and what evidence changes the ask
- Evidence-gap narrative: what is missing, who owns it, and what claim it blocks
- aVa answer contract: approved response structure, refusal rules, and citation requirements

Not allowed as derived prose:

- New money, savings, dates, notice periods, clause existence, vendor identity, usage metrics, or performance metrics. Those must come from extracted rows or calculations over extracted rows.
- Market benchmark claims unless a benchmark source row exists.
- Application, CMDB, tower, or dependency coverage unless declared relationship rows exist.
- Finance-confirmed value unless a finance/Tower realization row exists.

Negotiation levers should be split intentionally: the ask and strategic rationale may be derived from the archetype playbook plus contract evidence, but sizing must come from calculation rows. Unsized signals remain visible as signals and must not roll into sized negotiable value.

## Loader Acceptance Gate For Rich Contracts

Before a selected rich contract is marked ready for the redesigned Contract 360 experience, the data-build job should emit a contract-level coverage result:

- `story_ready`
- `scope_ready`
- `economics_ready`
- `performance_ready`
- `relationship_ready`
- `evidence_ready`
- `optimize_ready`
- `ava_ready`

Each readiness flag should include row counts, blocker text, owner, and evidence source IDs. A contract is demo-ready only when every archetype-required flag is ready or explicitly `not_required_for_archetype`. Empty strings, placeholder text, zero-fill rows, and generic "Not established" cells do not count as ready.

## Claude Design Instructions

Treat this document as the data boundary and the HTML file as the visual boundary.

- Preserve the main application nav; Source is selected in the global nav.
- Preserve the Command/Contracts/Levers/Evidence/Coverage top tabs on the Source workspace.
- Preserve Story/Scope/Economics/Performance/Relationship/Evidence/Optimize tabs on selected Contract 360 pages.
- Each tab must tell one specific story, not repeat the same evidence block.
- Bind every number and claim to the row family named in this handoff.
- Render missing required data as a designed backfill state with owner and blocker.
- Render not-required data as not required for the archetype.
- Keep recoverable, avoidable, negotiable, and realized/finance-confirmed value separate.
- Keep signal-stage opportunities separate from sized opportunities.
- Never scrub or rewrite model output after generation; answer constraints and refusal rules belong in the aVa input prompt and grounding bundle.
- Use the selected rich-contract set as the tab-by-tab fidelity target. If a tab is thin for those contracts, assume the data layer is incomplete, not that the design should pad it.
