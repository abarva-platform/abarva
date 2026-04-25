# 27 WORKFLOW VALIDATION HARNESS

## Purpose

The workflow validation harness verifies whether AbarVa Source permits, blocks, defers, or requires waiver for workflow actions correctly.

Context validation asks: is Nexus grounded in the right Source context?

Workflow validation asks: should Source allow this workflow action?

Both are required before production.

## Validation Outcomes

- PASS: expected safe action is allowed or expected unsafe action is blocked correctly.
- BLOCK: attempted action is blocked because a required gate, artifact, review, approval, or evidence condition is missing.
- DEFER: action cannot be evaluated because required context is intentionally unavailable.
- WAIVER_REQUIRED: action may proceed only with authorized waiver and rationale.
- FAIL: Source allows an unsafe action, blocks a safe action, or gives the wrong explanation.

## Harness Inputs

Each validation scenario should define:

- fixture state
- attempted action
- expected result
- expected Nexus explanation
- expected Steward enforcement
- evidence needed
- acceptance criteria

The first implementation should use deterministic seeded Source fixtures only. It should not call models, APIs, upload parsing, or live workflow runtimes.

## Core Scenarios

### 1. RFP Release Requires Approved/Locked Package

- Fixture state: RFP package is Draft or In Review.
- Attempted action: move from RFP/RFI Package to Vendor Responses.
- Expected result: BLOCK.
- Nexus explanation: RFP package is not approved and locked, so vendor release is not defensible.
- Steward enforcement: prevent stage advancement.
- Evidence needed: artifact status, approval status, lock status.
- Acceptance criteria: action is blocked and missing artifact state is named.

### 2. Evaluation Requires Locked Scorecard

- Fixture state: scorecard is Draft or editable.
- Attempted action: begin Evaluation.
- Expected result: BLOCK.
- Nexus explanation: evaluation cannot start until the scorecard is locked.
- Steward enforcement: prevent evaluation stage activation.
- Evidence needed: scorecard lifecycle state, approval status, lock state.
- Acceptance criteria: action is blocked and scorecard lock requirement is visible.

### 3. Rich-Tier RFP Requires Required Inputs

- Fixture state: required inputs are missing.
- Attempted action: generate Rich-tier RFP artifact.
- Expected result: BLOCK or DEFER depending on missing input category.
- Nexus explanation: only outline/stub sections can be drafted until required inputs arrive.
- Steward enforcement: prevent Rich-tier status.
- Evidence needed: required input checklist, artifact tier rules, missing context.
- Acceptance criteria: Rich-tier generation is not allowed and missing inputs are listed.

### 4. Strategic Event Requires Legal/Procurement Review Path

- Fixture state: strategic event lacks legal/procurement approval route.
- Attempted action: mark event ready for vendor release.
- Expected result: BLOCK.
- Nexus explanation: strategic sourcing requires procurement and legal route before release.
- Steward enforcement: require approval route configuration.
- Evidence needed: rigor level, event value, approval routing table.
- Acceptance criteria: action is blocked and missing route roles are named.

### 5. Lock Requires Resolved Required Comments

- Fixture state: required reviewer comments unresolved.
- Attempted action: lock artifact.
- Expected result: BLOCK.
- Nexus explanation: unresolved required comments must be resolved or waived.
- Steward enforcement: prevent lock.
- Evidence needed: comment status, reviewer requirement, waiver state.
- Acceptance criteria: lock is blocked and unresolved comments are listed.

### 6. Approval Requires Assigned Owner

- Fixture state: artifact requires approval but no approver is assigned.
- Attempted action: approve artifact.
- Expected result: BLOCK.
- Nexus explanation: approval cannot be recorded without an assigned approval owner.
- Steward enforcement: prevent approval completion.
- Evidence needed: approval route, owner assignment.
- Acceptance criteria: action is blocked and owner assignment is required.

### 7. Stage Cannot Advance With Artifact Needs Inputs

- Fixture state: required artifact status is Needs Inputs.
- Attempted action: advance stage.
- Expected result: BLOCK.
- Nexus explanation: required artifact still needs inputs.
- Steward enforcement: prevent stage advancement unless authorized waiver exists.
- Evidence needed: required artifact list, artifact status, waiver status.
- Acceptance criteria: action is blocked or WAIVER_REQUIRED when waiver is allowed.

### 8. Offline Edit Creates New Version

- Fixture state: artifact v0.4 was exported.
- Attempted action: upload edited DOCX and treat it as same version.
- Expected result: BLOCK.
- Nexus explanation: re-uploaded external edits must create a new artifact version.
- Steward enforcement: create new version or reject same-version mutation.
- Evidence needed: export record, upload record, artifact version chain.
- Acceptance criteria: same-version overwrite is prevented.

### 9. Uploaded Document Requires Parsing/Validation Before Citation

- Fixture state: uploaded document exists but parse status is parsing or parseFailed.
- Attempted action: cite the uploaded document in recommendation.
- Expected result: DEFER or BLOCK.
- Nexus explanation: document cannot be cited until parsed and validated.
- Steward enforcement: prevent evidence claim from using unvalidated file.
- Evidence needed: parse status, citation status, Sentinel validation result.
- Acceptance criteria: citation is not trusted prematurely.

### 10. Vendor Response Complete Requires Pricing Template

- Fixture state: vendor response exists but pricing template is missing.
- Attempted action: mark vendor response complete.
- Expected result: BLOCK or WAIVER_REQUIRED.
- Nexus explanation: response cannot be comparable without pricing template or approved exception.
- Steward enforcement: prevent complete status unless exception is approved.
- Evidence needed: vendor response checklist, pricing template presence, exception log.
- Acceptance criteria: incomplete vendor response is not marked complete silently.

### 11. Realized Value Requires Owner And Evidence

- Fixture state: projected value exists, but measurement owner or evidence is missing.
- Attempted action: mark value realized.
- Expected result: BLOCK.
- Nexus explanation: realized value requires measurement owner and evidence.
- Steward enforcement: prevent realized status.
- Evidence needed: value ledger owner, measurement method, evidence/citation.
- Acceptance criteria: realized value cannot be asserted from projection alone.

### 12. Approval Waiver Requires Rationale

- Fixture state: required approval is missing.
- Attempted action: skip approval without rationale.
- Expected result: BLOCK.
- Nexus explanation: approval can be waived only by authorized role with rationale.
- Steward enforcement: require waiver record.
- Evidence needed: approval route, waiver authority, waiver rationale.
- Acceptance criteria: silent skip is prevented.

## Additional Scenario Families

Future harness expansion should cover:

- parallel approval completion
- approval expiration and escalation
- scorecard material override approval
- vendor Q&A addendum issuance
- locked artifact reopen flow
- selection memo evidence sufficiency
- contract/mobilization readiness
- value realization attribution

## Difference From Context Validation

Context validation:

- evaluates Nexus response grounding
- checks event, stage, pattern, artifact, scorecard, value, evidence, and suggested action references
- catches vanilla GPT/Claude style responses

Workflow validation:

- evaluates workflow permission and enforcement
- checks whether actions should be allowed, blocked, deferred, or require waiver
- catches unsafe stage movement, premature artifact release, unsupported approvals, and audit gaps

Source needs both:

- context validation prevents generic advice
- workflow validation prevents unsafe execution

## Agent Roles In Harness

Nexus:

- explains the blocker or allowed action in event-specific language
- names missing artifacts, approvals, inputs, evidence, or owners
- recommends the next safe step

Steward:

- enforces workflow state
- blocks unsafe movement
- requires waiver and rationale
- logs decision and blocker state

Sentinel:

- validates evidence, citations, uploaded documents, and support for claims

Atlas:

- summarizes blocked/ready posture for executives

## Acceptance Standard

The workflow harness is ready for implementation when:

- each scenario has deterministic fixture state
- expected result is explicit
- Nexus explanation can be verified without a model
- Steward enforcement outcome is explicit
- evidence requirements are listed
- waiver behavior is explicit where applicable
- unsafe workflow actions cannot pass silently

