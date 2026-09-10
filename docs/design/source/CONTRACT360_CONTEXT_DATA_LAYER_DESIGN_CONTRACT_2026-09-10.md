# Contract 360 Context Data Layer Design Contract

## Purpose

Source Contract 360 must not ask the product page to invent contract meaning at render time. The
loader must produce reviewed, evidence-bound contract intelligence; Source then projects it with
clear state, provenance, and gaps.

This is the design contract for Claude Design and product implementation. It is about what the page
may render from the data layer, not about visual style alone.

## Layer Contract

| Layer                   | Ownership                                                       | Contract 360 Meaning                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layer 1 client intake   | Client/source-system extracts and restricted document summaries | Contract register, scope mappings, monthly spend, usage, invoices/AP reconciliation, clauses, opportunities, evidence manifest, and reviewed context brief fields. |
| Layer 2 adapters        | Loader and source adapter scripts                               | Validate tenant, contract, vendor, evidence refs, review state, and row coverage. Emit canonical rows and canonical fact assertions.                               |
| Layer 3 canonical model | Source tables and `source.canonical_fact_assertion`             | Own facts, amounts, dates, entity IDs, relationships, and reviewed context assertions.                                                                             |
| Layer 4 products        | Source dashboards, aVa grounding, exportable summaries          | Render the story by tab. Never fabricate missing scope, evidence, relationships, or opportunity sizing.                                                            |

## New Reviewed Context Facts

The cloud-consumption package requires these reviewed fields in `cloud_contract_register.csv`:

| Field                       | Canonical fact key              | What It Means                                                                           | Design Use                             |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| `contract_english_overview` | `contract.purpose_summary`      | Plain-English answer to "what is this contract?"                                        | Story tab opener and export summary.   |
| `scope_english_summary`     | `contract.scope_summary`        | Human-readable scope boundary derived from loaded scope rows and contract context       | Scope tab thesis, not a table caption. |
| `commercial_thesis`         | `contract.commercial_thesis`    | Interprets the commercial posture without restating calculated amounts in prose         | Economics and Optimize setup.          |
| `relationship_summary`      | `contract.relationship_summary` | Declared relationship boundary: vendor, contract, applications, evidence, opportunities | Relationship tab opener.               |
| `evidence_boundary_summary` | `contract.evidence_boundary`    | What evidence is loaded and what remains restricted or absent                           | Evidence tab opener and aVa caveat.    |

Each field is loaded into `source.canonical_fact_assertion` with:

| Field                              | Required Rule                                                   |
| ---------------------------------- | --------------------------------------------------------------- |
| `review_state`                     | Must be `reviewed` or `approved` before Layer 4 can project it. |
| `confidence`                       | Comes from the source row confidence, not from the page.        |
| `payload.value_text`               | The reviewed prose body.                                        |
| `payload.context_review_state`     | Review state from the intake package.                           |
| `payload.context_reviewer_role`    | Named reviewer role.                                            |
| `payload.context_reviewed_at`      | Review timestamp.                                               |
| `payload.derived_from_load_run_id` | Staleness key; regenerated loads invalidate old context.        |
| `payload.basis_type`               | `reviewed_contract_intelligence`.                               |

## No Prose-Smuggled Numbers

Derived prose may explain a number, but it must not author, estimate, or restate one. Money, dates,
usage percentages, commitment amounts, invoice totals, and notice periods render from extracted
numeric/date fields beside the prose.

Correct pattern:

> The governed financial fields show committed platform capacity materially ahead of observed usage.

Incorrect pattern:

> Usage is roughly 4% and the gap is worth seven figures.

## Tab Story Grain

Every tab needs a distinct grain. Repeating the same evidence-state card across all tabs reads as
filler and hides what the data actually knows.

| Tab          | Primary Data Grain                                                          | CXO Question It Answers                                                        | What To Render                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Story        | `contract.purpose_summary`, header facts, commercial thesis                 | What is this contract and why should I care?                                   | Purpose paragraph, vendor, term, renewal, commercial posture, evidence state.                                                                  |
| Scope        | `source.contract_scope` and `contract.scope_summary`                        | What business services and applications are actually in scope?                 | Grouped application/service coverage with business function, criticality, hosting, and explicit "not proven beyond these rows" boundary.       |
| Economics    | Contract header, monthly spend, commitment coverage, AP reconciliation      | Are we ahead, behind, overpaying, or under-committed?                          | Commitment-vs-actual ramp, AP reconciliation state, finance-confirmed vs candidate value.                                                      |
| Performance  | Usage/service/SLA rows only where loaded                                    | Are service, usage, and operational facts supporting the commercial position?  | DBU/service mix, job cadence, SLA/ticket evidence if present; otherwise a compact missing-evidence state specific to performance.              |
| Relationship | Vendor, contract, scope rows, declared relationship rows, opportunity links | How does this contract connect to systems, owners, and decisions?              | Relationship map/list using only declared rows; no CMDB or Tower dependency inference.                                                         |
| Evidence     | Evidence manifest, canonical facts, clause rows, restricted-source state    | What documents and extracted facts back this?                                  | Loaded-file inventory, clause-bearing rows, fact counts, restricted raw-doc note; hide document-page widgets when document text is not loaded. |
| Optimize     | Opportunity rows, calculations, evidence refs, authored archetype plays     | What should we ask for, why can the vendor agree, and what is sized vs signal? | Exportable lever table: action, ask, rationale, evidence basis, worth/sizing state, owner, timing, blocker.                                    |

## Basis Badges

Use visible basis badges so a CXO can see why a statement exists:

| Badge             | Meaning                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Document term     | Extracted from contract or order-form rows.                                                         |
| Usage evidence    | Backed by monthly spend, DBU/service usage, or cloud coverage rows.                                 |
| AP reconciled     | Backed by invoice/AP reconciliation rows.                                                           |
| Scope mapped      | Backed by `source.contract_scope`.                                                                  |
| Archetype play    | Selected from an authored playbook for the contract archetype.                                      |
| Advisor signal    | Derived ask or rationale awaiting benchmark/SKU/comparator evidence.                                |
| Restricted source | Raw document stays outside the repo; only governed summaries or synthetic evidence rows are loaded. |

## Negotiation Intelligence

For levers, split the object into two classes:

| Component | May Be Derived At Load? | Rule                                                                                                                   |
| --------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ask       | Yes                     | Must cite contract terms, usage pattern, or authored archetype play.                                                   |
| Rationale | Yes                     | Must explain why the vendor can agree without inventing benchmarks.                                                    |
| Sequence  | Yes                     | Prefer authored play table keyed by `lever_type`; do not let model reasoning reorder the play without a visible basis. |
| Sizing    | No                      | Comes only from extracted rows and deterministic calculations. Signal-stage items render as not sized.                 |
| Benchmark | No                      | Requires a loaded comparator or accepted benchmark source.                                                             |

## Design Implications

1. Do not place the same generic evidence block on every tab.
2. Do not show zero-heavy evidence grids when the relevant evidence type is absent; show a compact
   tab-specific gap and the exact data needed to unlock it.
3. The main application nav must remain visible in the Source shell; Contract 360 sub-tabs live
   below it and must not replace it.
4. The top-right action should not duplicate a selected tab name. "Run Optimize" and an "Optimize"
   tab together are ambiguous; use one primary path and make the selected tab the page mode.
5. Every contract detail page needs a plain-English purpose block before metrics.
6. aVa and PDF export should use the same loaded context facts and lever rows as the page.

## Databricks Design Story

Databricks should read as a consumption-commitment contract, not a generic vendor detail page:

- Purpose: Databricks-on-AWS lakehouse, SQL, model serving, and pilot analytics capacity.
- Commercial posture: committed platform capacity is materially ahead of observed usage.
- Action posture: renegotiate timing, carry-forward, support rebase, discount review, and serverless
  parity as candidates; do not claim realized savings until finance confirms.
- Evidence boundary: structured rows are loaded; full raw contract documents remain restricted
  outside the public repo.

## AWS Design Story

AWS should contrast with Databricks:

- Purpose: enterprise AWS cloud consumption and support.
- Commercial posture: actual usage runs above the committed run rate.
- Action posture: move durable usage into committed coverage, rightsize, reduce egress leakage, and
  review support economics.
- Evidence boundary: monthly spend, usage, inventory, tag quality, AP reconciliation, clauses, and
  opportunities are loaded as synthetic demo evidence.
