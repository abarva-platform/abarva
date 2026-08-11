# Source Execution Master Plan

Date: 2026-08-11

Status: afternoon kickoff plan. This is the repo-tracked execution contract for the next Source push. It does not mark any product path QA-passed.

## Product Architecture

Source has two different journeys. They must be built, tested, and reported separately.

| Surface            | Question                                                     | Journey                                    | Current stance                                                                    |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------- |
| Vendor 360         | Where should we look across the vendor relationship?         | Portfolio and vendor relationship analysis | Useful, but must keep improving prioritization clarity and evidence traceability. |
| Contract 360       | What does this agreement cover and what does evidence prove? | Contract evidence cockpit                  | Must summarize opportunities and evidence; it must not become the case workflow.  |
| Optimize Contract  | What action should we take on this incumbent contract?       | 7-stage optimization case                  | First-class Source module. Not a variant of New Event.                            |
| New Sourcing Event | How do we take a new or replacement need to market?          | 11-stage sourcing/RFP journey              | Separate governed market journey. Needs artifact and analytics quality hardening. |
| Tower              | What value was actually delivered?                           | Value proof and realization                | Owns outcome confirmation; estimates do not become realized value.                |

Official Source story:

> Vendor 360 tells us where to look. Contract 360 tells us what the evidence proves. Optimize Contract tells the team what to do and governs the action. New Sourcing Event takes a requirement to market. Tower confirms what value was actually realized.

## Non-Negotiable QA Definition

No stage, artifact, insight, aVa answer, or UI path is QA-passed unless all applicable proof types exist.

| Proof type       | Required evidence                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional proof | Signed-in browser run on `https://app.abarva.ai`, real clicks, screenshots, console/network notes, and reload checks.                                                           |
| Data proof       | Database/read-model readback for every persisted action, upload, generated fact, calculated amount, and approval.                                                               |
| Artifact proof   | Generated artifact inspected against ideal content, not just existence. Word count, section count, placeholders, citations, figures, export quality, and review state recorded. |
| Analytics proof  | The product must explain what it computed, what it restated, what it excluded, and why the insight is commercially useful.                                                      |
| Workflow proof   | User always knows current stage, required evidence, optional evidence, owner, blocker, next action, and approval path.                                                          |
| UI/UX proof      | Page fits the intended viewport, headers are professional, visual hierarchy is clear, no clutter blocks the decision, tables align, and visualizations add meaning.             |
| Guidebook proof  | Each stage tells the client what to collect next, from which system, from whom, at what grain/history, using which template, and how the workshop should run.                   |
| Governance proof | Human-in-the-loop actions, rationale, approval authority, co-approver paths, and audit records are explicit and persistent.                                                     |
| aVa proof        | aVa answers hard questions from governed context with citations, explicit unknowns, and deterministic chart/table payloads where requested.                                     |

Any missing proof makes the item `prototype`, `partial`, `blocked`, or `needs review`, never `passed`.

## Priority Board

### P0 - Must Close Before Claiming Product Readiness

| ID       | Area                            | Scope                                                                                                                         | Expected outcome                                                                                                                       | Acceptance bar                                                                                                                                                                    |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-OC-01 | Optimize module identity        | Make Optimize Contract a distinct Source module with its own landing, case route, 7-stage rail, case header, and state model. | Users no longer see New Event intake for contract optimization. A selected contract and opportunity create or resume the correct case. | Browser proof from Contract 360 and `/source/optimize`; route stays in the 7-stage optimization journey; no generic intake; selected contract prefilled; reload stable.           |
| P0-OC-02 | Evidence readiness and baseline | Build the locked commercial baseline stage.                                                                                   | Procurement, Finance, business, and vendor start from the same baseline.                                                               | Baseline shows bought scope, period, rates/quantity, actual spend, addressable spend, assumptions, included/excluded/pending inputs; persisted readback; no unlocked value claim. |
| P0-OC-03 | Opportunity diagnosis           | Persist atomic opportunity rows with calculation lineage.                                                                     | Each opportunity has value/value range, source evidence, exclusions, blockers, deadline, owner, confidence, and action recommendation. | Every amount traces to reproducible calculation run; overlapping opportunities are controlled; missing evidence yields `Not sized` or `Evidence missing`, not zero.               |
| P0-OC-04 | Commercial strategy             | Build strategy stage from diagnosed opportunities.                                                                            | The system recommends an action path, vendor ask, fallback, walk-away, timing, owner, and risks.                                       | Strategy packet uses only validated opportunity/baseline facts and distinguishes recover, avoid, improve, monitor, and do-not-pursue.                                             |
| P0-OC-05 | Approval and outreach gate      | Human approval blocks vendor communication and value commitment.                                                              | No outreach, concession, savings claim, or commercial acceptance without appropriate approval.                                         | Approval page shows decision, evidence, value basis, risks, required approvers, rationale, and persistent audit row.                                                              |
| P0-OC-06 | Value proof and Tower handoff   | Connect approved outcome to Finance/Tower proof.                                                                              | Potential, validated, approved, vendor-agreed, observed, and finance-confirmed remain separate.                                        | Periodized realized value readback exists; Tower claim refs are visible; no estimate is shown as realized.                                                                        |
| P0-NE-01 | New Event mechanical completion | Complete blockers in the 11-stage journey.                                                                                    | The full market/RFP journey can progress with real proof.                                                                              | Executive Decision persistence, Selection approval entitlement, Transition parsing/readiness, and stage advancement are browser- and DB-proven.                                   |
| P0-NE-02 | Artifact quality                | Make core New Event artifacts client-ready.                                                                                   | RFP, Scope Memo, Executive Decision Brief, Pricing, BAFO, Transition, and Value artifacts are decision-useful.                         | Artifact quality score, content-QA score, no placeholders, citations, review state, export proof, and consultant verdict recorded.                                                |
| P0-NE-03 | Rich vendor response parsing    | Parse 50-75 page vendor proposals into durable response dossiers.                                                             | Evaluation/Pricing/BAFO/aVa can reason over actual proposal content, not file names.                                                   | Uploaded proposal produces sections, commitments, exceptions, assumptions, AI/automation claims, staffing, pricing dependencies, SLAs, risks, milestones, and citations.          |

### P1 - Must Close Before Executive Demo Without Caveats

| ID          | Area                          | Scope                                                        | Expected outcome                                                                                                        | Acceptance bar                                                                                                                                                             |
| ----------- | ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-UX-01    | Source stage simplification   | Apply Moves-style stage discipline to Source.                | One active decision, compact header, row-based evidence table, one primary action, no oversized fonts or label clutter. | 1440px desktop screenshot shows current intent, evidence table, blocker, and next action without hunting.                                                                  |
| P1-UX-02    | Required vs optional evidence | Replace prose/card pile with explicit row requirements.      | Users know exactly what to load, what is optional, where to get it, and what blocks approval.                           | Each row shows requirement, required/optional, source system, owner, grain/history, template, upload status, parser status, generated facts, artifact impact, next action. |
| P1-UX-03    | Forward progress clarity      | Completed evidence must lead to the approval gate.           | No user reaches `100% ready` and wonders what to do.                                                                    | Primary action becomes `Open approval gate`; disabled state explains the exact missing item before completion.                                                             |
| P1-INS-01   | Prompt context manifest       | Every generated artifact shows what evidence reached Claude. | Users can trust that uploads, notes, accepted artifacts, and human updates were considered.                             | Manifest lists evidence used, excluded, pending, human updates, prior-stage decisions, model, prompt version, token budget, and blockers.                                  |
| P1-AVA-01   | Hard aVa QA                   | Run aVa as an expert participant, not a chat toy.            | aVa explains why, what evidence, what action, what chart/table, and what is unknown.                                    | 25 Optimize questions and 25 New Event questions pass with citations, explicit unknowns, table/chart payload checks, and latency captured.                                 |
| P1-GUIDE-01 | Stage guidebooks              | Every stage prepares the next workshop/session.              | The product tells the client who to invite, what to pull, how to fill templates, and what must be decided.              | Guidebook exists for each Optimize stage and each New Event stage, dynamically reflecting use case, missing evidence, source systems, and prior approvals.                 |

### P2 - Scale And Portability

| ID         | Area               | Scope                                                  | Expected outcome                                      | Acceptance bar                                                                                                                                    |
| ---------- | ------------------ | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-PORT-01 | Tenant portability | Keep Source capability tenant-agnostic.                | The demo dataset is a canary, not hardcoded logic.    | Second-tenant smoke uses same services, stages, evidence classes, UI components, and missing-evidence behavior with zero cross-tenant reads.      |
| P2-DATA-01 | Template coverage  | Source templates become operational extraction guides. | Clients know exactly where and how to pull each file. | Template instructions list owner role, source systems, extracts, grain, history, validation rules, examples, and upload/parser mapping.           |
| P2-OBS-01  | Product telemetry  | Measure where users stall.                             | We improve based on workflow friction, not anecdotes. | Events capture stage, action, blocker, parse result, approval result, artifact quality, and aVa answer outcome without leaking sensitive content. |

## Optimize Contract 7-Stage Acceptance Matrix

| Stage                    | User decision                                             | Data required                                                                                                      | Artifact/output                           | Analytics/insight must add                                                                                                | Guidebook/template requirement                      | Human/governance gate                                         |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| 1. Evidence readiness    | Is there enough evidence to size or act?                  | Contract terms, invoices, rate cards, SLA/service credits, usage, renewal, benchmark, finance confirmation status. | Evidence Readiness Packet.                | Explains loaded/missing evidence, what each gap blocks, owner, and due date.                                              | Data request guide by source system and owner.      | Human can accept evidence readiness or request more evidence. |
| 2. Commercial baseline   | What did we buy, for what period, at what baseline?       | Scope, period, pricing schedule, quantities, actual spend, addressable spend, assumptions, exclusions.             | Locked Baseline.                          | Shows included, excluded, pending, conflicts, and baseline confidence.                                                    | Baseline workbook and workshop guide.               | Baseline lock requires owner rationale and audit record.      |
| 3. Opportunity diagnosis | Which atomic opportunities exist?                         | Parsed opportunity evidence and calculation runs.                                                                  | Opportunity Diagnosis.                    | Separates recoverable leakage, avoided cost, negotiated improvement, and realized value maturity without double counting. | Opportunity review guide and exception template.    | Human confirms which opportunities proceed.                   |
| 4. Commercial strategy   | What should we do commercially?                           | Diagnosed opportunities, rights, deadlines, supplier alternatives, risk, business constraints.                     | Negotiation Strategy and Vendor Ask List. | Recommends target, fallback, walk-away, customer give, vendor get, timing, and risks.                                     | Strategy workshop guide.                            | Strategy approval before outreach.                            |
| 5. Approval and outreach | Are we authorized to contact the vendor or commit action? | Strategy packet, approvers, value basis, risks, legal/procurement constraints.                                     | Approval Brief and Outreach Pack.         | Highlights what is approved, conditional, or blocked.                                                                     | Approval checklist and communication template.      | Required approvers, rationale, and co-approver workflow.      |
| 6. Negotiation/execution | What happened with the vendor and what changed?           | Vendor offers, counters, concessions, amendments, corrected invoices, credits, quantity changes, tasks.            | Commercial Outcome Record.                | Tracks movement from ask to vendor agreement with evidence and open terms.                                                | Negotiation log template and decision guide.        | Human acceptance of outcome and legal/commercial documents.   |
| 7. Value proof           | What value was actually realized?                         | Credit memo, corrected invoice, PO/budget change, finance actuals, effective period, Tower claim refs.             | Value Proof Tracker.                      | Separates potential, validated, approved, vendor agreed, observed, and finance confirmed.                                 | Finance proof guide and periodized actual template. | Finance confirmation only creates realized value.             |

## New Event 11-Stage Acceptance Matrix

| Stage              | Must prove                                                                                    | Artifact-quality gate                                                          | Analytics/insight gate                                                                 | Guidebook/template gate                | Human/governance gate                          |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| Strategy           | Trigger, value hypothesis, scope intent, owner, and next evidence plan are clear.             | Strategy memo is decision-useful and accepted or explicitly draft.             | Explains why the event matters and what data a generic workflow would not know.        | Scope collection guide produced.       | Sponsor/owner action persists.                 |
| Scope              | In/out, retained/vendor work, volumetrics, owners, dependencies, and exclusions are explicit. | Scope memo has structured inventory and citations.                             | Shows scope risk, missing owners, and readiness blockers.                              | RFP data guide and templates produced. | Scope gate persists and reloads.               |
| RFP                | Supplier package protects value levers and requests comparable responses.                     | RFP has no placeholders and cites evidence.                                    | RFP intelligence identifies clause gaps and repair tasks.                              | Vendor response guide produced.        | RFP release gate persists.                     |
| Responses          | Long vendor proposals are ingested, parsed, and made analyzable.                              | Response dossier exists per vendor/version.                                    | Claims, exceptions, assumptions, AI accelerators, staffing, SLAs, and risks are cited. | Evaluation guide produced.             | Human review/acceptance state persists.        |
| Evaluation         | Scores are evidence-backed and human-final.                                                   | Scorecard has weights, AI suggestions, human scores, overrides, and citations. | Explains why vendor rankings changed.                                                  | Pricing guide produced.                | Human score lock persists.                     |
| Pricing            | Bids are normalized into comparable TCO.                                                      | Pricing workbook export is inspected and usable.                               | Assumptions, pass-throughs, escalators, and traps are surfaced.                        | BAFO guide produced.                   | Pricing assumptions are locked.                |
| BAFO               | Final asks are vendor-specific and evidence-based.                                            | BAFO pack has asks tied to gaps/traps.                                         | Explains expected impact and unresolved risks.                                         | Executive decision guide produced.     | BAFO decision persists.                        |
| Executive Decision | Leadership can approve with evidence, alternatives, risks, and conditions.                    | Decision brief is board-ready.                                                 | Shows recommendation, tradeoffs, value basis, and unknowns.                            | Selection guide produced.              | Approval entitlement and rationale persist.    |
| Selection          | Award decision, baseline, obligations, and handoff conditions are locked.                     | Award record is complete.                                                      | Explains why selected option wins and what must be monitored.                          | Transition guide produced.             | Award approval persists.                       |
| Transition         | Workstreams, owners, milestones, risks, obligations, and exit criteria are tracked.           | Transition plan parses uploaded readiness rows.                                | Shows implementation risk and readiness.                                               | Value proof guide produced.            | Transition gate persists.                      |
| Value              | Outcome is observed and finance-confirmed.                                                    | Value proof pack separates target, estimate, agreement, and actual.            | Shows realized value only from finance/operational proof.                              | Ongoing realization template produced. | Finance confirmation persists and feeds Tower. |

## Build Slices And Order

The afternoon kickoff should use short, proof-bearing slices. Each slice must end with a pull request or an explicit blocked proof note.

| Order | Slice                                          | Why first                                            | Work included                                                                                               | Done only when                                                                                  |
| ----- | ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1     | Optimize module contract and routing hardening | Prevents journey confusion.                          | Verify `/source/optimize`, Contract 360 CTA, direct event route, selected contract, and case stage mapping. | Browser proof for selected and unselected flows; New Event still routes to 11 stages.           |
| 2     | Optimize evidence readiness + baseline         | No commercial action is defensible without baseline. | Persist/read baseline inputs, evidence inventory, missing/blocker rows, and calculation readiness.          | DB readback plus browser proof that missing evidence blocks sizing/action without showing zero. |
| 3     | Opportunity diagnosis spine                    | This is where the product creates value.             | Atomic opportunity model, calculation run, included/excluded/pending records, overlap controls.             | Golden hero and contrast contracts both behave correctly; all numbers trace.                    |
| 4     | Compact workflow shell                         | Reduces clutter while build continues.               | Moves-style header, left tree/subtree, row-based evidence table, one primary action, completion states.     | Full-page visual review at 1440px and 1920px; no large headers or label clutter.                |
| 5     | Guidebooks/templates                           | Turns workflow into advisory operating system.       | Stage-specific workshop guides, source-system instructions, templates, owners, grain/history.               | Each active stage shows what to collect next and where to get it.                               |
| 6     | Artifact and prompt manifest                   | Prevents thin or ungrounded outputs.                 | Context manifest, prompt budget/model, evidence used/excluded/pending, human updates, artifact QA scoring.  | Generated artifacts disclose context and score against ideal; placeholders block readiness.     |
| 7     | aVa hard QA                                    | aVa is the differentiator.                           | 25 Optimize + 25 New Event questions, tables/charts, citations, unknown handling.                           | Exported transcripts and structured results pass; failures become backlog.                      |
| 8     | New Event mechanical blockers                  | Keeps original 11-stage path real.                   | Persistence, entitlement, transition parser, rich proposal dossier parsing.                                 | Full 11-stage run can complete with evidence and artifact scoring.                              |
| 9     | Second-tenant smoke                            | Ensures product, not a canary-only demo.             | Run same services/components against the next tenant after the canary tenant is stable.                     | No tenant-specific code fork; missing evidence stays explicit.                                  |

## Development And QA Loop Per Slice

Every slice follows the same loop.

1. Define the user decision and the data/evidence classes needed.
2. Implement the smallest code/data change that makes the decision better.
3. Add unit/view-model tests for calculations, missing evidence, conflicts, and route selection.
4. Add or update prompt/context tests when artifacts or aVa are touched.
5. Run local validation: focused tests, lint, TypeScript, release check when release-relevant.
6. Open PR with safe public wording.
7. Merge through the approved lane only after validation.
8. Deploy only through repo-owned ACA workflow when runtime changes exist.
9. Verify live with signed-in browser.
10. Record evidence: screenshots, route, console/network notes, DB/readback query, artifact exports, aVa transcripts, and verdict.

## Tracking Format

Each active work item should be tracked with this row shape.

| Field            | Required value                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| ID               | Stable ID from this plan.                                                      |
| Journey          | Optimize Contract or New Event.                                                |
| Slice/stage      | Exact slice and stage.                                                         |
| User decision    | The decision improved.                                                         |
| Product value    | Why the user could not easily get this from a generic workflow.                |
| Evidence classes | Data used and missing.                                                         |
| UI surface       | Page/tab/component.                                                            |
| Artifact impact  | Artifact changed or generated.                                                 |
| aVa impact       | Questions/charts/tables affected.                                              |
| Governance       | Approval/human gate affected.                                                  |
| Tests            | Unit, integration, browser, data readback, artifact audit, aVa.                |
| Status           | Designed, implemented, local-pass, PR, merged, deployed, live-proven, blocked. |
| Proof path       | Folder, PR, run, screenshot, readback, transcript, or artifact.                |

## Kickoff Checklist

Use this checklist before starting the afternoon build.

- Confirm heartbeat/status automation is paused or intentionally enabled.
- Pick one active owner per artifact/component to avoid duplicate work.
- Start from a clean worktree on `origin/main`.
- Reconfirm the current live route before coding.
- Do not touch tenant data unless the slice explicitly requires data-plane work and the required dataset manifest/load gate exists.
- Treat the current demo dataset as a canary only; no hardcoded tenant, contract, vendor, or stage semantics.
- Keep missing evidence visible and non-additive value types separate.
- Prioritize first-five-minute demo impact before deep-stage polish.

## Current Known State

- Optimize route normalization for the stale approval URL was deployed and live-proven by PR `#6155`.
- The broader Optimize Contract module is not QA-passed.
- New Event 11-stage journey has repo-tracked mechanical, artifact-quality, analytics, data, and aVa gaps in:
  - `docs/codex-handoff/SOURCE_NEW_EVENT_BACKLOG_2026-08-10.md`
  - `docs/codex-handoff/SOURCE_NEW_EVENT_ARTIFACT_ANALYTICS_AUDIT_2026-08-10.md`
- Shared browser audit requirements live in:
  - `docs/testing/source-contract-optimization-path-a-browser-audit-2026-08-10.md`

## Decision For This Afternoon

Start with Optimize Contract slices 1 and 2, because they establish the separate module and the baseline discipline needed for every later commercial claim. In parallel, keep New Event blockers visible but do not mix the 11-stage sourcing journey into Optimize Contract.

The bar is not "it works." The bar is:

> A sourcing CXO can understand the decision, trust the evidence, see what is missing, approve the right action, and explain how the value will be proven.
