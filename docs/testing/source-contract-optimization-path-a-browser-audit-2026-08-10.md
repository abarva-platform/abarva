# Source Event And Contract Optimization Browser Audit Plan

## Status

`partial_path_a_run_open_findings`

This is the signed-in browser audit plan for both Source entry paths. It is not a QA pass. The journey is complete only after the evidence described here is captured from `https://app.abarva.ai` with a signed-in session.

## Purpose

Source has two distinct product journeys that must be tested separately:

| Path                                | User entry                                          | Expected journey                                                                                                                                          | What it is proving                                                                                                          |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Path A — Optimize Existing Contract | Contract 360 `Optimize` tab for a selected contract | Short contract-optimization journey: Strategy, Scope, Commercial Baseline, Negotiation Plan, Executive Decision, Agreement, Value                         | Whether governed contract evidence can become a defensible optimization case for a named incumbent contract                 |
| Path B — Create New Event           | Source `New event` without a selected contract      | Original competitive sourcing / RFP journey: Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, Value | Whether a new sourcing event can be created, evidenced, governed, approved, and carried through the full sourcing lifecycle |

Path A is not the 11-stage competitive RFP journey. Path B is not a contract-specific optimization shortcut. A QA pass requires both paths to show the right journey, right evidence asks, right parser behavior, right approval gates, and right generated outputs for their use case.

The audit must prove where each workflow helps a sourcing executive, where it loses the user, what data it asks for, what it parses, what Claude actually receives, and what artifacts are produced.

The audit question is:

> If a sourcing CXO starts from a real contract, can AbarVa turn governed contract evidence into a defensible optimization case, or does the workflow only restate the data back to them?

## Required Starting Path A — Optimize Existing Contract

1. Open Contract 360 for `CTR-090`.
2. Navigate to the `Optimize` tab.
3. Click `Start / continue optimization`.
4. Confirm the route is preloaded from Contract 360:
   `/source/new?intent=contract-optimization&contractId=...`

Primary contract:

| Field                                                   |                              Expected live value |
| ------------------------------------------------------- | -----------------------------------------------: |
| Contract                                                | `CTR-090 - Salesforce Data Platform Agreement 3` |
| Fit rank                                                |                                             `#1` |
| Fit score                                               |                                         `86/100` |
| Evidence state                                          |                               `5 ready / 0 gaps` |
| Annual contract value                                   |                                         `$43.5M` |
| Actual spend                                            |                                         `$37.4M` |
| Total committed value                                   |                                        `$173.9M` |
| Recoverable leakage                                     |                                          `$755K` |
| Invoice / duplicate / off-contract / rate-card variance |                                          `$2.4M` |
| Renewal uplift avoided / shelfware / scope rationalized |                                          `$2.4M` |
| Negotiated improvement                                  |                                          `$1.3M` |
| Finance-confirmed realized value                        |                                          `$940K` |

Optional contrast contract:

| Field          | Expected live behavior                               |
| -------------- | ---------------------------------------------------- |
| Contract       | `CTR-024 - CloudPeak`                                |
| Purpose        | Prove honest degradation when evidence is missing    |
| Expected state | Four ledgers not established, evidence gaps explicit |

## Required Starting Path B — Create New Event

Path B starts from Source `New event`, not from a Contract 360 optimization CTA.

1. Open `https://app.abarva.ai/source/new`.
2. Create a realistic new sourcing event using the plain-language intake, without passing `intent=contract-optimization` and without a preselected `contractId`.
3. Confirm the created event is not bound to a single incumbent contract unless the user explicitly selects one in the intake.
4. Confirm the event shows the original 11-stage sourcing journey:
   Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, Value.
5. Confirm the Scope stage asks for sourcing-scope evidence, not contract-optimization ledger evidence.
6. Upload at least one generated evidence file through the visible workflow, then confirm parser status, Files workspace status, approval readiness, and downstream artifact behavior.
7. Confirm approvals, generated artifacts, Intelligence, Files, and next-stage guidance match an RFP/sourcing event rather than an incumbent optimization case.

Path B fails if it inherits the 7-stage contract-optimization journey, preloads an unrelated contract, or skips RFP-only artifacts without an explicit non-RFP sourcing archetype.

## Non-Negotiable Ground Rules

- Use the signed-in production app only: `https://app.abarva.ai`.
- Use real clicks and browser state, not API-only probing.
- Capture console and network logs for the full run.
- Screenshot every distinct screen state.
- Do not mutate `source.contract_360`, vendor registers, or the golden contract evidence tables.
- Do not claim pass/fail without visible UI evidence and, where relevant, database or generated-context evidence.
- Do not approve a stage merely to get past it unless the approval action, rationale, user identity, and generated downstream output are captured.

## Evidence Output Folder

Every run must write a folder under `/Users/anand/Downloads`, for example:

`/Users/anand/Downloads/source-contract-optimization-path-a-audit-YYYYMMDD-HHMMSS/`

The folder must contain:

- Screenshots, numbered in journey order.
- Console log export.
- Network log or HAR where available.
- Every downloaded template, unchanged.
- Every generated upload file, grouped by the stage or evidence slot that requested it.
- Parser/readiness screenshots after every upload.
- Generated artifact exports or screen captures.
- A written report using the report structure in this document.

## Part 1: Input Inventory

Enumerate every input each journey asks for, step by step. Keep Path A and Path B separate in the report; do not combine their evidence asks into a single checklist.

For each ask, capture:

| Field              | Required capture                                                  |
| ------------------ | ----------------------------------------------------------------- |
| Screen             | Exact screen title and step name                                  |
| Ask text           | Exact on-screen wording                                           |
| Evidence slot      | `EVID-*` ID if visible in a template URL                          |
| Input mode         | upload, structured field, confirmation, approval, rationale, chat |
| Required/optional  | as shown in UI                                                    |
| Template link      | URL if present                                                    |
| Template headers   | exact CSV/XLSX column headers                                     |
| Pre-buildable      | yes/no, with reason                                               |
| Parser expectation | row grain, required columns, expected accepted row count          |

Audit rule: download every template first and inspect the headers before generating files. If a slot has no template, capture the step description verbatim, derive the most likely headers, upload a first-pass file, and record the parser error if it fails.

Generated data for `CTR-090` must reconcile to the live contract facts:

- `$43.5M` annual value.
- `$37.4M` actual spend.
- `$173.9M` total committed value.
- `120` day notice period.
- limited benchmarking.
- `2 of 4` weak leverage signals.

Estimates must be labelled as estimates. Derived facts must include derivation notes.

## Part 2: Client-Supplied Artifact Simulation

At least one key artifact must be produced in a client-supplied version after the system has produced or prefilled an initial version.

The client version must include:

- A few realistic edits.
- At least one deliberately changed value.
- At least one deliberately wrong or contradictory value.
- Clear indication that it is client-supplied.

Verify whether the product:

- detects divergence from the AI/system draft;
- versions the artifact;
- treats it as authoritative;
- flags conflicts;
- silently stores it without impact.

## Part 3: Per-Upload Parsing And Storage Verification

For every uploaded file, verify all of the following:

| Check           | Required evidence                                                      |
| --------------- | ---------------------------------------------------------------------- |
| Stored          | UI state plus file row in Files & Deliverables                         |
| Parsed          | fact count and parser status                                           |
| Readiness       | `STORED`, `PARSED`, `NEEDS PARSER`, `PARSER FAILED`, or `SEARCH-READY` |
| Row-count match | uploaded row count equals fact count, or mismatch documented           |
| CSV behavior    | upload and status                                                      |
| XLSX behavior   | upload and status, especially if it fails while CSV succeeds           |
| Scope binding   | file is tied to the right contract, stage, evidence slot, and tenant   |

Silent count mismatches are failures. A stored file that does not satisfy readiness is not a pass.

## Part 4: Claude Prompt Assembly Verification

This is the highest-value audit step. The report must show what context is actually assembled when an artifact is generated.

Relevant code anchors:

- `src/lib/source/agent-generation/context-binder.ts`
- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/types.ts`
- `src/lib/source/contracts/upstream-satisfaction.ts`

Answer with evidence:

1. Do parsed file facts reach `SourceGenerationContext`?
2. Do session-evidence documents, workshop notes, and meeting outputs reach the generation context?
3. Do uploaded files that sit in generic Files & Deliverables reach the artifact prompt, or are they only stored?
4. Do upstream artifacts reach the prompt only when accepted or authoritative?
5. Does gate approval trigger generation on this optimization journey?
6. Are current-stage and next-stage guidebooks present in the prompt when appropriate?
7. What is the actual prompt token budget and model for each generated artifact?

The report must quote the assembled context inventory, not just infer from code.

## Part 5: Artifact Quality And Completeness

For every produced artifact:

| Field              | Required capture                                                |
| ------------------ | --------------------------------------------------------------- |
| Artifact ID        | generated ID or route                                           |
| Stage              | stage that produced it                                          |
| Trigger            | upload, approval, user action, auto-generation                  |
| Quality score      | exact displayed score                                           |
| Content-QA score   | exact displayed score                                           |
| Blockers           | exact text                                                      |
| Word count         | measured                                                        |
| Section count      | measured                                                        |
| Tables             | populated with real numbers or placeholders                     |
| Lineage            | every material figure traces to live facts or uploaded evidence |
| Consultant verdict | strong, acceptable, thin, or failed                             |

Any invented number is a failure. Any placeholder-only artifact is a failure for a golden-contract demo path.

## Part 6: Analytics Verdict

Assess what the workflow actually computes versus what it restates.

Required questions:

- Are the four ledgers computed from evidence or restated from uploaded evidence?
- Does the workflow identify recoverable leakage by matching contract terms, invoices, rates, SLA history, and credits?
- Does it distinguish avoided cost from negotiated improvement and realized value?
- Is there benchmark comparison or peer context?
- Is there trend analysis over time?
- Does it recommend a specific negotiation position with evidence, or merely describe the contract?
- Does it explain why this contract is an optimization candidate in a way a sourcing CXO would accept?

## Part 7: Next-Step Guidance And Guidebooks

At every stage transition, capture whether the tool behaves like an advisor or like a form.

For each stage, record:

| Stage | Guidebook exists | Workshop/session guide | Template links | Owner/action checklist | Next-stage prep generated | Notes |
| ----- | ---------------- | ---------------------- | -------------- | ---------------------- | ------------------------- | ----- |

Check specifically for:

- workshop templates;
- interview guides;
- meeting agendas;
- data-request templates;
- owner/action checklists;
- next-stage readiness packs;
- guidance on who must provide what evidence by when.

## Part 8: Workflow And Experience Friction Log

Known issues to retest on Path A:

- XLSX uploads fail to parse while CSV succeeds.
- Approval page says `0 of N gate items met` while rail shows complete.
- Approval ledger says approver not recorded even for signed-in approval with rationale.
- Completed steps retain live-looking action buttons that do nothing.
- Stage step lists render another stage's steps.
- Session-evidence upload boxes have no connection to any step or gate.
- Files workspace lacks explicit stage/type selection.
- Upload widget retains stale selected file after prior upload.
- Stage completion does not clearly progress to approval.

Known issues to test on Path B:

- The original New Event path must not route to Contract 360 or a contract-optimization event unless a contract is explicitly selected.
- The 11-stage sourcing rail must remain visible for a competitive sourcing/RFP event.
- Scope evidence asks must make clear which evidence rows require upload versus human confirmation.
- When all Scope items are complete, the primary next action must clearly take the user to the approval gate.
- Files, Intelligence, approvals, and generated artifacts must reflect uploaded evidence and not only the initial intake text.

For every friction item, capture:

| Field             | Required capture         |
| ----------------- | ------------------------ |
| Severity          | P0/P1/P2/P3              |
| Screen            | where it occurred        |
| What happened     | observed behavior        |
| Expected behavior | sourcing CXO expectation |
| Evidence          | screenshot/log/request   |
| Smallest fix      | minimum product/code fix |

## Required Final Report Structure

The audit report must include:

1. Executive verdict: whether Path A is demo-safe.
2. Executive verdict: whether Path B is demo-safe.
3. Complete input inventory by path.
4. Template inventory with exact headers by path.
5. Generated upload files inventory.
6. Parse/storage results per file.
7. Prompt-assembly findings.
8. Artifact-by-artifact quality assessment.
9. Analytics verdict.
10. Next-step guidance map.
11. Prioritized friction list.
12. Data and UI defects requiring code changes.
13. Product backlog: improve/standardize before second-tenant replication.

Do not soften findings. A clean report on a journey with real holes is a failed audit.
