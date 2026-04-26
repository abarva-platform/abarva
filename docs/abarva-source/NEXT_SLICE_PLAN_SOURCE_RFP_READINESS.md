# Next Slice Plan: Source RFP Readiness Surface

Date: 2026-04-26

Status: planned only.

Scope: documentation and readiness planning only. Do not implement runtime code, UI, API routes, model calls, upload/parsing, RFP generation, artifact generation, evidence storage, workflow engines, approval engines, or Admin/Setup behavior in this slice.

## 1. Purpose

Plan a Source RFP readiness surface that tells users whether a sourcing event can safely move from Scope toward RFP package preparation.

The surface should answer:

- Is Scope complete enough for an RFP package?
- Which RFP tier is safe: Rich, Outline, or Stub?
- Which required inputs, approvals, artifacts, and evidence are missing?
- Which limitations must be visible before any RFP draft, outline, or data request is prepared later?
- What should Nexus recommend next?
- What should Sentinel, Steward, and Atlas caution before release readiness is implied?

This plan defines the readiness contract and behavior only. It does not generate an RFP.

## 2. Relationship To Scope Stage

RFP readiness is downstream of Scope readiness.

The Scope stage should define the event enough for vendors to understand what they are pricing, what is excluded, which baseline assumptions are approved, and what commercial constraints matter. The RFP readiness surface should consume Scope state and translate it into artifact readiness.

Required Scope signals include:

- current stage is Scope or ready-to-exit Scope
- in-scope and out-of-scope services
- sourcing archetype and rigor level
- required data baseline
- missing inputs
- approved assumptions
- stage-gate blockers
- evidence and citation status
- approval and waiver state

RFP readiness must not bypass Scope. If Scope is blocked, incomplete, or dependent on unapproved assumptions, RFP readiness should explain why only Outline or Stub behavior is safe.

## 3. RFP Tiering: Rich / Outline / Stub

Use the existing Source artifact tier model:

- Rich = decision-grade.
- Outline = useful but incomplete.
- Stub = dignified placeholder when prerequisites are missing.

### Rich

Rich RFP readiness means the event has enough client-specific, usable evidence and required approvals to support a release-quality RFP package later.

Rich requires:

- required Scope inputs complete
- required data categories at Usable Evidence or explicitly waived
- citations available for factual claims where applicable
- assumptions approved by the right owner
- RFP package prerequisites and review owners identified
- Steward gate status not blocking RFP preparation

### Outline

Outline RFP readiness means Source can safely assemble structure, sections, questions, and known gaps later, but cannot imply release readiness.

Outline is appropriate when:

- pattern structure is known
- some required inputs are missing
- evidence is available but not complete enough for decision-grade claims
- assumptions are visible but not fully approved
- release would still require review, approval, or additional data

### Stub

Stub RFP readiness means Source should produce a minimum data request, diagnostic questions, or prerequisite list later instead of pretending an RFP exists.

Stub is required when:

- Scope is materially incomplete
- required baseline data is missing
- evidence is uploaded, loaded, or available but not usable
- approvals or waivers are absent
- the event cannot safely enter RFP package preparation

## 4. Required Inputs

The readiness surface should identify required inputs by sourcing archetype and stage.

Common required inputs:

- sourcing event id and event name
- event owner and accountable sponsor
- current Source stage and gate state
- sourcing archetype and rigor level
- in-scope services
- out-of-scope services
- service volumes and baseline demand
- current vendor or internal support model
- current cost or run-rate baseline
- SLA, service-level, and performance expectations
- retained role and responsibility assumptions
- security, compliance, legal, and procurement constraints
- known vendor pool or market constraints
- pricing model expectations
- required attachments, datasets, or platform readiness records
- approved assumptions and open assumptions

Input readiness must distinguish missing, requested, uploaded, loaded, parsed, available, usable evidence, low confidence, stale, access restricted, waived, and not applicable states.

## 5. Required Approvals

RFP readiness should expose approval status before any later generation or release behavior is considered.

Required approvals may include:

- sourcing lead approval for Scope completeness
- business owner approval for in-scope/out-of-scope definitions
- finance approval for baseline cost and value assumptions
- procurement approval for RFP process and vendor instructions
- legal approval for contractual, liability, and compliance language
- security approval for data handling or control requirements
- Steward gate approval for moving from Scope to RFP package preparation
- explicit waiver approval for missing required inputs

Approval states should remain separate from artifact status. A draft or outline artifact is not release-ready until approvals and locks are satisfied.

## 6. Artifact Status

The RFP readiness surface should report artifact status without creating or mutating artifacts.

Relevant artifact states:

- Not Started
- Draft
- Needs Inputs
- Needs Review / In Review
- Changes Requested
- Approved
- Locked
- Issued / Published
- Superseded
- Archived

RFP readiness should explain the relationship between artifact tier and artifact status:

- Rich tier can still be Draft, Needs Review, or not yet approved.
- Outline tier can be useful while still blocked from release.
- Stub tier should identify missing prerequisites instead of filling content.
- Locked or Issued status cannot be inferred from content quality alone.

No status in this plan should imply artifact generation, document export, or vendor release.

## 7. Evidence/Citation Status

Evidence and citation status should be first-class readiness inputs.

The readiness surface should show:

- which required claims have usable evidence
- which claims have evidence placeholders only
- which uploaded files are not parsed or validated
- which available data is low confidence, stale, or access restricted
- which facts lack citations
- which assumptions are user-approved but not evidence-backed
- which waived gaps have owner, reason, and downstream impact

Rules:

- Uploaded is not citeable.
- Loaded is not usable evidence.
- Available is not validated evidence.
- Parsed does not automatically mean decision-grade.
- Usable Evidence can support claims, sections, scorecards, pricing assumptions, and value narratives.
- Access Restricted evidence must not be used by an agent or user that cannot access it.

Sentinel should own the caution language when evidence is missing, low confidence, stale, or uncited.

## 8. Data Readiness Dependency

RFP readiness depends on the Source data readiness contract and the Admin/Setup-owned platform readiness state.

Source should consume data readiness. It should not own:

- connector setup
- dataset inventory
- upload handling
- parsing
- access control resolution
- evidence ledger runtime
- Admin/Setup workflows

The readiness dependency should map platform data state into Source consequences:

- Rich blocked by missing required usable evidence.
- Outline allowed when structure is known but evidence is incomplete.
- Stub required when the minimum data request is the only safe artifact direction.
- Waived gaps allowed only when owner, reason, and downstream impact are visible.

If the data readiness contract is unavailable, the RFP readiness surface should degrade to low-context planning and must not imply Rich readiness.

## 9. Nexus/Sentinel/Steward Behavior

### Nexus

Nexus should:

- state the safest RFP tier
- explain what is missing from Scope for RFP preparation
- recommend the next action, such as minimum data request, assumption approval, or review routing
- distinguish readiness from generation
- avoid writing RFP content in this slice

### Sentinel

Sentinel should:

- validate evidence and citation readiness
- flag unsupported claims, uncited sections, stale data, and unparsed uploads
- prevent uploaded or loaded-only files from being treated as citeable
- lower confidence when inputs are pattern-level or seeded

### Steward

Steward should:

- enforce Scope-to-RFP gate behavior
- identify approval, waiver, owner, and lock blockers
- explain cannot-proceed reasons
- route setup/data blockers back to Admin/Setup
- preserve auditability for waivers and approvals

### Atlas

Atlas should:

- summarize executive impact of weak RFP readiness
- label value assumptions as projected or low confidence when baselines are weak
- avoid treating projected value as realized value

## 10. What Not To Build

Do not build:

- RFP generation
- RFI generation
- artifact generation
- document export
- document upload
- parsing
- citation extraction
- evidence ledger runtime
- connector setup
- Admin/Setup UI
- Source UI
- API routes
- model calls
- chat UI
- workflow engine behavior
- approval engine behavior
- vendor portal behavior
- pricing normalization runtime
- scorecard runtime changes
- database migrations
- production readiness promotion

This slice is a planning document only.

## 11. Acceptance Criteria

This planning slice is acceptable when:

- this document exists at `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_RFP_READINESS.md`
- it defines purpose and Scope-stage relationship
- it defines Rich / Outline / Stub RFP readiness behavior
- it lists required inputs and approvals
- it separates artifact tier from artifact status
- it defines evidence and citation readiness rules
- it states the data readiness dependency on Admin/Setup-owned platform readiness
- it defines Nexus, Sentinel, Steward, and Atlas behavior
- it explicitly lists what not to build
- no runtime code, UI, API, model call, upload/parsing, RFP generation, or database migration files are changed
- validation passes:
  - `git diff --check`
  - trailing whitespace check
  - non-ASCII punctuation check
