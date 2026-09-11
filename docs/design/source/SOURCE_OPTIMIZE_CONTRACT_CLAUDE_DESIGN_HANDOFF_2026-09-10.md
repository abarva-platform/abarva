# Source Optimize Contract - Claude Design Handoff

## Purpose

Claude Design is redesigning Source 360 and Contract 360. It needs the real data model before
changing the page. Optimize Contract is not just a visual tab and not the same journey as a new
competitive sourcing event. It is the focused Door 1 workflow for an incumbent contract: pick one
existing governed contract, lock the baseline, read evidence, diagnose value, build the strategy,
approve/execute, and prove value through Finance/Tower.

This handoff is the design contract for the page. Use it as the source of truth for what the UI may
say, what it must refuse, and which objects actually exist.

The implementation-level final model is maintained in
`docs/design/source/SOURCE_CONTRACT_INTELLIGENCE_FINAL_DATA_MODEL_2026-09-11.md`. That document and
`src/lib/source/contract-intelligence/types.ts` supersede any abbreviated TypeScript examples in
this handoff when fields differ. Claude Design should bind to the produced record, not recreate a
parallel shape in the page.

## Product Boundary

| Surface              | Job                                                                                                  | Do Not Do                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Source 360 portfolio | Show where contract action should start across the book.                                             | Do not lead with generic counts or charts that do not change the decision.                |
| Contract 360         | Explain one contract: what it is, scope, economics, performance, relationship, evidence, and levers. | Do not repeat the same evidence-state block on every tab as filler.                       |
| Optimize Contract    | Move one selected contract through the incumbent-optimization workflow.                              | Do not make it look like the 11-stage new-event workflow or a magic "run savings" button. |
| New 11-stage event   | Run a competitive sourcing journey from strategy through value.                                      | Do not use it as the default path for every incumbent optimization.                       |

The main application navigation stays visible above Source at all times: Home, Intelligence, Moves,
Source, Tower, account, sign out. Contract 360 tabs and Optimize Contract stages are subnavigation;
they must not replace the main app nav.

## Current Optimize Contract Workflow

The current product has a real Optimize Contract route and workflow action API:

| Route or Module                                            | Meaning                                                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/source/optimize`                                         | Dedicated Optimize Contract route. It can open as a candidate picker or with `contractId`.                      |
| `/source/optimize?contractId=<id>`                         | Opens the seven-step incumbent-contract workflow for that contract.                                             |
| `/api/source/workspace/contract/<contractId>/optimization` | Creates or refreshes a contract-optimization event from Contract 360 and returns an approval URL.               |
| `/api/source/optimize/contract/<contractId>/workflow`      | Mutates the workflow state: strategy approval request, approval/sent-back, negotiated outcome, finance handoff. |
| `deriveOptimizeWorkflowPosition`                           | Derives the visible stage position from governed state, not hardcoded progress.                                 |
| `buildContractOptimizationSpine`                           | Ranks candidates, explains why a contract is surfaced, and lists source systems/evidence families.              |
| `buildContractOptimizationLedger`                          | Separates recoverable, avoided, negotiated, and realized value states.                                          |

This is not identical to a new contract event. It is a smaller, faster, evidence-led Door 1 journey.
The UI should say that plainly.

## Seven-Step Journey

| Step | Label                | Data Gate                                                                                  |
| ---- | -------------------- | ------------------------------------------------------------------------------------------ |
| 1    | Select contract      | One governed contract is selected.                                                         |
| 2    | Lock baseline        | `source.optimization_baseline.baseline_state = ready`; conflict blocks progress.           |
| 3    | Read evidence        | Required evidence families are loaded or explicitly missing.                               |
| 4    | Diagnose opportunity | Opportunity rows exist, are validated, and stated amounts trace to calculation runs.       |
| 5    | Build strategy       | At least one opportunity has a target position and a strategy approval request exists.     |
| 6    | Approve and execute  | Strategy approval is approved and a negotiated outcome is recorded.                        |
| 7    | Prove value          | Finance/Tower confirmation exists; no estimated amount becomes realized value before this. |

Design implication: show this as a journey rail or progress spine, not as a row of dashboard tabs.
Each step needs the next action and the blocker, because the blocker is the point.

## Canonical Data Model Copy

### Contract Context Facts

These are loaded as reviewed contract-intelligence facts in `source.canonical_fact_assertion`.

| Intake Field                | Canonical Fact Key              | UI Use                                          |
| --------------------------- | ------------------------------- | ----------------------------------------------- |
| `contract_english_overview` | `contract.purpose_summary`      | Plain-English "what this contract is" opener.   |
| `scope_english_summary`     | `contract.scope_summary`        | Scope tab thesis and bounded scope description. |
| `commercial_thesis`         | `contract.commercial_thesis`    | Economics and Optimize setup.                   |
| `relationship_summary`      | `contract.relationship_summary` | Relationship tab opener and boundary.           |
| `evidence_boundary_summary` | `contract.evidence_boundary`    | Evidence tab opener and aVa caveat.             |

Required payload/review fields: `review_state`, `confidence`, `payload.value_text`,
`payload.context_review_state`, `payload.context_reviewer_role`, `payload.context_reviewed_at`,
`payload.derived_from_load_run_id`, and `payload.basis_type = reviewed_contract_intelligence`.

### Contract Tab Intelligence

View: `source.contract_tab_intelligence_v1`

This is the primary data contract for Contract 360 tab storytelling. Claude Design should bind the
top narrative of each tab to this view before using any render-time fallback copy.

One selected contract should return seven rows:

| `tab_key`       | Meaning                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| `story`         | What the contract is, why it matters, and what action posture it implies.      |
| `scope`         | What applications, services, functions, and boundaries are actually in scope.  |
| `economics`     | What spend, AP, consumption, commitment, and ledger facts can be shown.        |
| `performance`   | Whether SLA, usage, or service-credit evidence supports a contractual ask.     |
| `relationship`  | Declared vendor, contract, workload, owner, and function relationships only.   |
| `evidence`      | Which evidence families are loaded, which are missing, and what that blocks.   |
| `optimize`      | Which governed levers are loaded, their evidence state, owner, and next step. |

Fields:

| Field                            | Render Rule                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `headline`                       | Large tab-specific claim. It must not be generic across tabs.                               |
| `allowed_executive_statement`    | The plain-English story the presenter may say.                                              |
| `supporting_evidence_summary`    | Compact row-count/source summary. Use it as proof text or provenance, not as the headline.  |
| `missing_evidence_summary`       | If present, render as an evidence gate; do not bury it in footnotes.                        |
| `action_prompt`                  | The next thing the user should do from this tab.                                            |
| `source_basis`                   | Human-readable source basis for the tab.                                                    |
| `confidence_level`               | `high`, `medium`, `low`, or `unverified`; controls visual treatment.                        |
| `confidence_rationale`           | Why this row is allowed.                                                                    |
| `review_status`                  | `system_generated_from_reviewed_sources` or `draft_gap` initially.                          |
| `provenance`                     | JSON counts/references to `source.contract_360`, evidence coverage, scope, and opportunity. |
| `derived_from_load_run_id`       | Invalidates the row when the source package is refreshed.                                   |

For cloud-consumption contracts, the record also carries separate native evidence families:
monthly spend, service or DBU usage, commitment coverage, cloud resources/accounts, AP
reconciliation, clauses, scope, and structured optimization opportunities. Usage must never be
added to monthly spend a second time. AP reconciliation supports billing state; it does not replace
invoice detail. A cloud package without raw searchable page text may still carry a reviewed plain-
English context boundary when its restricted document inventory and reviewer metadata pass; the UI
must show that boundary rather than inventing page citations.

Design implication: every Contract 360 tab should begin with a tab-specific narrative card from
this view. If the row is absent, the page should show a compact "tab intelligence not loaded" state
with the missing data family. It should not repeat the same contract header, vendor/date/notice
cards, or generic evidence-state strip as filler.

### Governed Contract Intelligence Record

The deterministic loader emits one `ContractIntelligenceRecord` per governed contract. This is the
binding contract for the richer tab experience. The record is built from Layer 2 adapter rows and is
safe for Layer 3 persistence only when its source references, review state, and quality gate pass.
Claude Design must consume this record as a projection input; it must not recreate these facts from
labels, filenames, or page layout.

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
    archetypeSourceBasis: string | null;
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
    metrics: Array<{
      key: string;
      label: string;
      value: string | number | null;
      meaning: string;
      sourceRefs: string[];
    }>;
    facts: Array<{
      key: string;
      label: string;
      value: string | number | null;
      meaning: string;
      sourceRefs: string[];
      reviewStatus: "loaded" | "partial" | "missing" | "not_required";
    }>;
  };
  evidenceLanes: Array<{
    key: string;
    label: string;
    state: "loaded" | "partial" | "missing" | "not_required";
    rowCount: number;
    sourceRefs: string[];
    supports: string[];
    blocks: string[];
    ownerRole: string | null;
  }>;
  anatomy: {
    nodes: Array<{
      id: string;
      kind: "contract" | "vendor" | "archetype" | "scope" | "document" | "clause" |
        "spend" | "invoice" | "performance" | "change_order" | "optimization" | "owner" | "lever";
      label: string;
      description: string;
      sourceRefs: string[];
    }>;
    relationships: Array<{
      fromId: string;
      toId: string;
      type: "provided_by" | "classified_as" | "covers" | "supported_by" | "owned_by" |
        "creates_opportunity" | "implemented_by";
      label: string;
      sourceRefs: string[];
    }>;
  };
  findings: Array<{
    label: string;
    valueType: "recoverable_leakage" | "avoided_cost" | "negotiated_improvement" | "realized_value";
    amountState: "sized" | "candidate" | "not_sized" | "not_applicable";
    amountUsd: number | null;
    evidenceState: "loaded" | "partial" | "missing" | "not_required";
    explanation: string;
    blockingGap: string | null;
    sourceRefs: string[];
  }>;
  levers: Array<{
    leverType: string;
    label: string;
    buyerAsk: string;
    negotiationLanguage: string;
    vendorConcession: string;
    currentTerm: string | null;
    targetTerm: string | null;
    valueBasis: string;
    amountState: "sized" | "candidate" | "not_sized";
    candidateRange: string | null;
    timingDependency: string | null;
    ownerRole: string | null;
    priority: number | null;
    riskIfIgnored: string | null;
    evidenceState: "loaded" | "partial" | "missing";
    evidenceRefs: string[];
  }>;
  derivedInsights: Array<{
    insightType: "purpose" | "scope" | "archetype" | "decision" | "evidence" | "sequence";
    statement: string;
    basis: string;
    sourceRefs: string[];
    reviewStatus: "draft" | "reviewed" | "approved" | "blocked_missing_evidence";
  }>;
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

### How Claude Design Must Render the Record

1. Start every tab with the tab-specific `story` field. Purpose comes before optimization. Scope
   comes before economics. Evidence boundaries come before any recommendation.
2. Render the anatomy as a traceable chain: contract -> vendor/archetype -> declared scope -> source
   documents/clauses -> spend/invoice/performance/change-order records -> findings -> levers -> owners.
   Only draw relationships present in `anatomy.relationships`; never add a guessed CMDB, Tower, system,
   application, or business-unit edge.
3. Use `evidenceLanes` to say what a data family enables and what it blocks. Do not render a wall of
   zeroes. If a lane is missing, show the owner and the decision it prevents.
4. Keep `findings` separated by value ledger. `realized_value` is empty until Finance/Tower evidence
   exists. `not_sized` is not zero and must not be displayed as a dollar amount.
5. Render `levers` as the client-ready report table: Lever, The ask, Why the vendor can agree,
   Evidence basis, Value state/amount, Owner, Timing, and Next step. Preserve the supplied negotiation
   language and label signal-stage rows clearly.
6. Render `industryIntelligence` only when `state = loaded` and every benchmark source is cited. A
   buyer-portfolio comparison is not an external benchmark. When missing, say what source is needed.
7. Do not invent or silently repair missing content. The loader must fail closed for malformed rows;
   the UI must explain the missing evidence in business language.

### Claude Output Contract and Token Budget

The Source contract-review prompt is the control boundary. It receives the governed record plus the
rules for evidence, amount states, archetype plays, anatomy, benchmark claims, and client-ready
formatting before generation. Claude Design must not add a second semantic scrubber or rewrite the
generated business language after the model returns it. Technical access-control, tenant isolation,
transport, and output-size controls remain independent safety controls.

The Source response budget is **8,192 output tokens**. This is deliberate: a useful response may need
to explain purpose, archetype, scope, evidence gaps, anatomy, sequencing, and a full lever table with
citations. Do not lower it to the generic 2,048-token default or truncate the table to fit a card.
The UI may provide a compact view and a client-ready export, but both must derive from the same
prompt-governed response and must preserve evidence state and amount-state labels.

### Archetype Mapping

Every contract visible in Contract 360 needs a declared archetype. Missing archetype is not a design
gap; it is a data-readiness gap.

| Field                         | Rule                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `contract_archetype_key`      | Canonical key, for example `cloud_consumption_commit`, `saas_subscription`, `managed_services`. |
| `contract_archetype_label`    | Human-readable label.                                                                           |
| `archetype_confidence`        | Mapping confidence; inferred mappings start lower than document-declared mappings.              |
| `archetype_source_basis`      | `document_declared`, `scope_and_pricing_inferred`, `vendor_category_inferred`, or `unmapped`.   |
| `archetype_playbook_version`  | Version of the authored evidence and negotiation playbook used.                                 |
| `archetype_review_state`      | `draft`, `reviewed`, or `approved`; only reviewed/approved is decision-grade.                   |
| `archetype_reviewer_role`     | Accountable reviewer role.                                                                      |
| `archetype_reviewed_at`       | Timestamp for staleness and review reset.                                                       |
| `archetype_required_evidence` | Evidence families expected for this archetype.                                                  |
| `archetype_missing_evidence`  | Families that block claims, visuals, or aVa advice.                                             |

Archetype determines the evidence checklist and lever playbook. Vendor category is only descriptive;
it must not silently stand in for archetype.

### Optimization Baseline

Table: `source.optimization_baseline`

| Field                                                         | Meaning                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `tenant_key`, `dataset_version`, `baseline_id`, `contract_id` | Identity and scope.                                                   |
| `baseline_state`                                              | `ready`, `missing`, or `conflict`; conflict blocks downstream claims. |
| `annual_value_usd`                                            | Contract annual value from governed baseline.                         |
| `pricing_schedule_annual_value_usd`                           | Pricing schedule annual value.                                        |
| `actual_annual_spend_usd`                                     | Observed annual spend.                                                |
| `total_committed_value_usd`                                   | Total committed value where applicable.                               |
| `conflict_amount_usd`                                         | Difference when baseline inputs conflict.                             |
| `detail`, `source_refs`, `payload`                            | Human explanation and provenance.                                     |

### Optimization Case

Table: `source.optimization_case`

| Field                                     | Meaning                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `optimization_case_id`                    | Stable case identity.                                                                                                                             |
| `door1_event_id`                          | Optional linked Source event.                                                                                                                     |
| `contract_id`, `vendor_id`, `baseline_id` | Scope of the optimization.                                                                                                                        |
| `case_state`                              | `intake`, `baseline_confirmed`, `evidence_review`, `calculation_validated`, `outreach_approval`, `outcome_recorded`, `finance_handoff`, `closed`. |
| `owner`                                   | Workflow owner.                                                                                                                                   |
| `next_action`                             | The single next action the UI should emphasize.                                                                                                   |
| `payload`, `created_at`, `updated_at`     | Supporting metadata and audit timing.                                                                                                             |

### Opportunity Spine

Tables: `source.optimization_opportunity`, `source.case_opportunity`,
`source.opportunity_valuation`, `source.calculation_run`, `source.calculation_input`,
`source.calculation_output`.

| Object                   | UI Meaning                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| Opportunity              | One lever or value candidate.                                     |
| Case opportunity         | Connects an opportunity to a case and records sequence/selection. |
| Valuation                | Stores value classification and amount state.                     |
| Calculation run          | Reproducible rule execution.                                      |
| Calculation input/output | Shows why a number is traceable instead of asserted.              |

Opportunity fields that matter for design: `opportunity_id`, `contract_id`, `label`, `value_type`,
`amount_usd`, `amount_state`, `stage`, `evidence_grade`, `confidence`, `deadline`, `owner`,
`blocking_gap`, `next_action`, `evidence_refs`, `calculation`, `overlap_treatment`,
`approval_state`, `narrative`, and `negotiation_detail`.

`negotiation_detail` contains the CXO-ready lever table fields:

| Field                 | Render As                                     |
| --------------------- | --------------------------------------------- |
| `buyerAsk`            | What we ask the vendor for.                   |
| `negotiationLanguage` | Client-ready wording.                         |
| `vendorConcession`    | Why the vendor can agree / what they give up. |
| `timingDependency`    | When the ask must be made.                    |
| `ownerRole`           | Who owns the action.                          |
| `priority`            | Sequence cue.                                 |
| `riskIfIgnored`       | Consequence of doing nothing.                 |

### Evidence and Requirements

Tables: `source.opportunity_evidence`, `source.evidence_requirement`,
`source.opportunity_requirement_status`, `source.evidence_request`.

Evidence families should drive the tab story and missing-proof state:

| Family                 | Owner                                | Why It Matters                                          |
| ---------------------- | ------------------------------------ | ------------------------------------------------------- |
| Contract baseline      | Contract manager / Legal ops         | Rights, term, pricing, renewal, benchmark, termination. |
| Application inventory  | App owner / CMDB steward             | What services/apps are actually in scope.               |
| Invoice summary        | AP / Finance operations              | Actual spend, billing variance, PO matching.            |
| Invoice exception      | AP / Procurement operations          | Duplicate, off-contract, and rate-card issues.          |
| SLA performance        | Service delivery / Vendor management | Credits, cure rights, service accountability.           |
| Ticket or usage volume | Service delivery / platform admin    | Demand versus baseline, DBU/service use, seats.         |
| Staffing model         | Vendor management / Tower lead       | Paid-for versus observed capacity.                      |
| Change order           | Contract manager / Category manager  | Recurring work hidden as change.                        |
| Renewal terms          | Contract manager / Legal ops         | Notice window and negotiation timing.                   |
| Evidence reference     | Vendor management                    | Citation map for exports and aVa.                       |

Do not show a zero-heavy evidence grid if the family is not loaded. Show a compact gap: what is
missing, who owns it, and what it unlocks.

### Workflow Actions

Route: `/api/source/optimize/contract/<contractId>/workflow`

| Action                         | Writes                                                           | Guardrail                                                  |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `create_approval_request`      | `source.approval_request` with type `vendor_outreach_strategy`   | Requires target position, traceable amount, and rationale. |
| `approve_request`              | `source.approval_decision`; keeps case in approval/outcome path  | Requires approver permission and pending request.          |
| `send_back_request`            | `source.approval_decision`; moves case back for revision         | Requires approver permission and rationale.                |
| `record_agreed_outcome`        | `source.negotiated_outcome`                                      | Agreement state only; does not claim realized value.       |
| `request_finance_confirmation` | `source.approval_request` with type `finance_value_confirmation` | Handoff only; Finance/Tower owns realized value.           |

Tables: `source.approval_request`, `source.approval_decision`, `source.negotiated_outcome`,
`source.finance_realization`, `source.finance_realization_evidence`.

## Four Value Ledgers

The page must keep these separate. Never blend them into one "savings" number.

| Ledger                 | Meaning                                                                       | When It Can Carry Dollars                                             |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Recoverable leakage    | SLA credits, duplicate charges, off-contract billing, rate-card variance.     | Only when invoice/SLA/rate-card evidence and calculation trace exist. |
| Avoided cost           | Renewal uplift avoided, shelfware removed, scope rationalized.                | Only when entitlement, renewal quote, or scope evidence supports it.  |
| Negotiated improvement | Price, term, index cap, volume tier, commitment timing, termination leverage. | Can be sized as candidate only through calculation/valuation rows.    |
| Realized value         | Finance-confirmed outcome.                                                    | Only through Finance/Tower confirmation evidence.                     |

Design implication: use labels like "candidate", "target position", "approved for outreach",
"agreed", and "finance-confirmed". Do not use "saved" unless the finance realization object exists.

## Required Source 360 Dashboard Story

The portfolio page should answer "where should the team work this quarter?", not "what data can we
chart?"

| Visual                     | Data Grain                                                                                    | Why It Leads                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Readiness vs value scatter | `annual_value`, `decision_ready_contracts`, `contract_count`, `candidate_amount_usd`, posture | Shows big/ready, big/blocked, small/ready, and leave-alone zones. |
| Credit funnel              | `credit_calculated`, `credit_claimed`, `credit_recovered`, `unclaimed_credit_usd`             | Separates calculated, claimed, and recovered value.               |
| Posture distribution       | under-consumed, over-consumed, aligned, leakage, not assessed                                 | Actionable with current data.                                     |
| Archetype coverage unlock  | mapped count, unmapped count, unmapped value, next fields required                            | Honest until all contracts are mapped.                            |
| Archetype concentration    | reviewed/approved `contract_archetype_key`                                                    | Only after mapping coverage is sufficient.                        |

Do not draw an archetype concentration chart from a placeholder/unmapped bucket. If coverage is
thin, the chart is not "missing"; the correct product story is "the book is not classifiable yet,
here is the backfill required."

## Required Contract 360 Tab Story

Each tab needs a distinct purpose. These are the minimum beats:

| Tab          | CXO Question                                                                | Render                                                                                              |
| ------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Story        | What is this contract and why should I care?                                | Purpose summary, commercial thesis, baseline facts, action posture, evidence state.                 |
| Scope        | What is actually in scope?                                                  | Plain-English scope summary, grouped apps/services, hosting, criticality, explicit boundary.        |
| Economics    | Are we ahead, behind, overpaying, or under-committed?                       | Commitment-vs-actual ramp, AP reconciliation, candidate vs finance-confirmed value.                 |
| Performance  | Does usage/performance support the commercial position?                     | DBU/service mix, service usage, SLA/tickets if present; otherwise missing-proof state.              |
| Relationship | What systems, owners, opportunities, and evidence connect to this contract? | Declared relationship map/list only; no inferred CMDB/Tower dependency claims.                      |
| Evidence     | What backs this?                                                            | Source files, clause rows, canonical facts, restricted raw-doc note; no empty page-span dashboards. |
| Optimize     | What should we ask for, why, when, and with what proof?                     | Exportable lever table plus sequence, blocker, approval state, and finance-proof state.             |

The render source for the tab opener is `source.contract_tab_intelligence_v1`. Secondary tables can
fill the body of the tab, but they should not be asked to invent the tab's executive story.

## aVa and Export Prompt Contract

aVa should answer like a pricing/CXO negotiation advisor, but only from the loaded objects above.
All restrictions must be in the prompt/input contract before generation. Do not scrub Claude's
response after the fact to make it compliant.

Minimum prompt contract for an Optimize answer:

1. Use only loaded `contract_360`, `optimization_opportunity`, calculation, evidence, approval,
   outcome, finance, and reviewed context facts for the selected contract.
2. Start with a two-to-three sentence executive answer.
3. Then render a table with: lever, action, buyer ask, rationale, evidence basis, value state,
   amount/range or not-sized state, owner, timing, blocker, next step.
4. Separate sized opportunities from signal-stage or evidence-gated opportunities.
5. Do not call candidate, negotiated, or agreed amounts "realized" unless Finance/Tower confirmation
   is loaded.
6. Do not invent benchmark rates, discount ranges, page citations, dates, or savings percentages.
7. If the user asks "why would the vendor agree?", answer from the loaded concession/rationale field
   or the authored archetype play; label anything else as advisor reasoning.
8. End with the single next governed action.

This same structure should power PDF export. The export should be a client-ready sample memo, not a
chat transcript.

## Design Don'ts

- Do not use "Run Optimize" unless it actually creates or advances persisted workflow state.
- Do not place a top-right "Optimize" CTA beside an "Optimize" tab.
- Do not repeat the same generic evidence-state box across tabs.
- Do not show empty evidence/page-span counters as if they are insight.
- Do not let vendor category replace contract archetype.
- Do not turn signal-stage opportunities into a total dollar headline.
- Do not hide the main app nav.
- Do not use raw contract document text in the public repo or visible demo artifacts.

## Example Story Beats

For a cloud data-platform consumption commitment:

- It is a usage-backed commercial commitment, not a generic software subscription.
- The executive issue is commitment timing versus adoption ramp.
- The first visual should show committed capacity versus observed usage over time.
- The lever table should separate re-timing/carry-forward/support rebase from lower-confidence
  discount or compute-mode signals.
- The next action is strategy approval or evidence backfill, not "claim savings."

For a public-cloud enterprise commitment:

- It is the mirror-image pattern when actual usage exceeds committed coverage.
- The executive issue is moving durable usage into better coverage while avoiding false savings.
- The first visual should show actual spend above/below commitment and the coverage gap.
- The lever table should focus on committed-use coverage, rightsizing, support economics, and
  governance/tags where evidence supports it.

## What Claude Design Should Produce

1. A Source 360 portfolio redesign that leads with decision pressure, not generic contract count.
2. A Contract 360 detail redesign where every tab has a distinct story grain.
3. A dedicated Optimize Contract workflow screen using the seven-step journey and workflow objects.
4. A CXO-ready lever table that can be exported unchanged into PDF.
5. Clear empty states that name the missing data family, owner, and unlock.
6. An archetype coverage/backfill panel instead of an unmapped-archetype chart.
7. aVa answer and PDF export layout using the same data model and prompt contract.

## Acceptance Criteria

- Main app nav is visible on every Source and Optimize Contract page.
- Contract 360 never repeats the same filler block across Story, Scope, Relationship, Evidence, and
  Optimize.
- Each selected contract reads seven `source.contract_tab_intelligence_v1` rows or shows an explicit
  missing-tab-intelligence gap.
- Optimize Contract shows current workflow step, blocker, and next action from governed state.
- The lever table is exportable and distinguishes sized, signal-stage, approved, agreed, and
  finance-confirmed states.
- Evidence tabs hide irrelevant zero-heavy widgets and show tab-specific gaps instead.
- Archetype charts render only from reviewed/approved mappings; otherwise the UI shows the backfill
  unlock.
- aVa answers use the same loaded objects and restrictions as the UI/export.
