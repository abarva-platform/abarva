# Next Slice Plan: Workflow Validation Fixtures

## 1. Purpose

Create a deterministic fixture plan for validating AbarVa Source workflow safety before implementing workflow UI, approval routing, artifact versioning, document export/import, or workflow engine behavior.

The slice should prove that Source can represent and test unsafe workflow moves in seeded data. The fixtures should make it obvious when an action should be allowed, blocked, deferred, require waiver, or fail.

## 2. Why Fixtures Come Before Workflow Implementation

Workflow richness is now a product requirement, but it should not immediately become runtime behavior.

Fixtures come first because they:

- define expected gate behavior before UI makes it clickable
- prevent a linear tracker from pretending to be enterprise workflow
- keep approvals, waivers, versions, and review states deterministic
- create a safe test bed for Steward enforcement and Nexus explanations
- expose missing seed data before implementing storage or workflow engines
- avoid building document collaboration surfaces before artifact lifecycle rules are clear

No workflow implementation should start until the fixture layer can express the required unsafe and safe action states.

## 3. Relationship To Context Validation

Context validation checks whether Nexus responses are grounded in the current Source context.

Workflow validation checks whether Source should permit or block a workflow action.

Artifact review validation checks whether a document is ready for review, approval, lock, release, reopen, or rework.

These should stay separate:

- context validation uses SourceAgentContextBundle, golden prompts, and anti-vanilla response checks
- workflow validation uses fixture state, attempted action, expected outcome, blocker reasons, waiver rules, and Steward enforcement
- artifact review validation uses artifact version, review comments, approval state, evidence/citation state, and lock/reopen rules

The first fixture slice should not call a model. Nexus explanations should be deterministic expected strings or structured expectation fields.

## 4. Workflow Scenarios To Fixture

### Scenario 1: RFP Release Requires Approved/Locked Package

- Attempted action: move from RFP/RFI Package to Vendor Responses
- Fixture state: RFP package is Draft or In Review
- Expected outcome: BLOCK
- Required evidence: artifact status, approval status, lock status
- Expected explanation: RFP package is not approved and locked, so vendor release is not defensible

### Scenario 2: Evaluation Requires Locked Scorecard

- Attempted action: begin Evaluation
- Fixture state: scorecard is Draft or editable
- Expected outcome: BLOCK
- Required evidence: scorecard lifecycle state, approval status, lock state
- Expected explanation: evaluation cannot begin until scorecard weights and criteria are locked

### Scenario 3: Rich-Tier RFP Requires Required Inputs

- Attempted action: generate Rich-tier RFP artifact
- Fixture state: required client inputs are missing
- Expected outcome: BLOCK or DEFER depending on missing input category
- Required evidence: required input checklist, artifact tier rules, missing context
- Expected explanation: only Stub or Outline sections are safe until required inputs arrive

### Scenario 4: Strategic Readiness Requires Legal/Procurement Route

- Attempted action: mark strategic sourcing event ready for vendor release
- Fixture state: strategic event lacks legal/procurement review path
- Expected outcome: BLOCK
- Required evidence: rigor level, event value, approval routing table
- Expected explanation: strategic sourcing requires legal and procurement review before release

### Scenario 5: Lock Requires Resolved Required Comments

- Attempted action: lock artifact
- Fixture state: required reviewer comments are unresolved
- Expected outcome: BLOCK
- Required evidence: comment status, reviewer requirement, waiver state
- Expected explanation: unresolved required comments must be resolved or waived before lock

### Scenario 6: Approval Requires Assigned Owner

- Attempted action: approve artifact
- Fixture state: artifact requires approval but has no assigned approval owner
- Expected outcome: BLOCK
- Required evidence: approval route and owner assignment
- Expected explanation: approval cannot be recorded without an assigned approval owner

### Scenario 7: Stage Cannot Advance With Artifact Needs Inputs

- Attempted action: advance stage
- Fixture state: required artifact is Needs Inputs
- Expected outcome: BLOCK or WAIVER_REQUIRED when waiver is allowed
- Required evidence: required artifact list, artifact status, waiver status
- Expected explanation: required artifact still needs inputs and blocks stage advancement unless waived with rationale

### Scenario 8: Offline Edit Creates New Version

- Attempted action: re-upload edited DOCX and treat it as the same version
- Fixture state: artifact v0.4 was exported and edited offline
- Expected outcome: BLOCK
- Required evidence: export record, upload record, artifact version chain
- Expected explanation: re-uploaded external edits must create a new artifact version

### Scenario 9: Uploaded Document Requires Parsing Before Citation

- Attempted action: cite uploaded document in recommendation
- Fixture state: uploaded document exists but parse status is parsing or parseFailed
- Expected outcome: DEFER or BLOCK
- Required evidence: parse status, citation status, Sentinel validation result
- Expected explanation: uploaded document cannot be cited until parsed and validated

### Scenario 10: Vendor Response Complete Requires Pricing Template

- Attempted action: mark vendor response complete
- Fixture state: vendor response exists but pricing template is missing
- Expected outcome: BLOCK or WAIVER_REQUIRED
- Required evidence: vendor response checklist, pricing template presence, exception log
- Expected explanation: vendor response is not comparable without pricing template or approved exception

### Scenario 11: Realized Value Requires Owner And Evidence

- Attempted action: mark value realized
- Fixture state: projected value exists, but measurement owner or evidence is missing
- Expected outcome: BLOCK
- Required evidence: value ledger owner, measurement method, evidence/citation
- Expected explanation: realized value cannot be asserted from projection alone

### Scenario 12: Approval Waiver Requires Rationale

- Attempted action: skip required approval
- Fixture state: required approval is missing and no waiver rationale exists
- Expected outcome: BLOCK
- Required evidence: approval route, waiver authority, waiver rationale
- Expected explanation: approval can be waived only by authorized role with rationale

## 5. Expected Outcomes

Fixture outcomes should use:

- PASS: expected safe action is allowed or expected unsafe action is blocked correctly
- BLOCK: action is blocked because a required gate, artifact, review, approval, or evidence condition is missing
- DEFER: action cannot be evaluated because required context is intentionally unavailable
- WAIVER_REQUIRED: action may proceed only with authorized waiver and rationale
- FAIL: Source allows an unsafe action, blocks a safe action, or gives the wrong explanation

The fixture runner should not force all scenarios to PASS. Healthy BLOCK and WAIVER_REQUIRED outcomes are expected.

## 6. Files Likely To Create

Likely implementation files for the next approved slice:

- `src/lib/source/workflow-validation.ts`
- `src/lib/source/workflow-validation-fixtures.ts`
- `src/lib/source/workflow-validation-runner.ts` if a separate runner is needed
- `docs/abarva-source/build-pack/implementation-reviews/12_WORKFLOW_VALIDATION_FIXTURES_REVIEW.md`

Do not create these files in this planning slice.

## 7. Files Likely To Update

Likely update files for the next approved slice:

- `src/lib/source/index.ts`
- `src/lib/source/mock-seed.ts`
- `src/lib/source/types.ts` only if Source-owned workflow fixture types require shared domain additions
- `CYCLE_STATE.md`

Potential docs update after implementation:

- `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`
- `docs/abarva-source/build-pack/15_ACCEPTANCE_CRITERIA.md` only if fixture implementation reveals criteria gaps

## 8. Deterministic Seed Data Required

Seed data should be explicit, typed, and clearly non-production.

Required seeded state:

- sourcing event stage and attempted next stage
- event rigor level and value tier
- artifact records with status, tier, owner, version, lock state, and approval state
- RFP package record in Draft or In Review
- scorecard record with unlocked/editable state
- required input checklist with missing inputs
- approval route records with missing owner, missing legal/procurement route, pending approval, and waiver state
- reviewer comments with unresolved required comments
- export record for artifact v0.4
- uploaded edited document record that must create v0.5
- uploaded document parse states: parsing and parseFailed
- vendor response record with missing pricing template
- value ledger record with projected value and missing measurement owner/evidence
- waiver record with absent rationale

Seed data must not invent real client facts, vendor facts, final recommendations, or realized value.

## 9. Validation Commands

For the future implementation slice:

```bash
npx eslint src/lib/source/workflow-validation.ts src/lib/source/workflow-validation-fixtures.ts src/lib/source/workflow-validation-runner.ts src/lib/source/index.ts src/lib/source/mock-seed.ts src/lib/source/types.ts
npx tsc --noEmit --pretty false
```

If a deterministic runner exists in that slice, add a smoke check such as:

```bash
npx tsx -e "import { getSourceWorkflowValidationReport } from './src/lib/source'; console.log(getSourceWorkflowValidationReport())"
```

Exact command should match the implemented export names.

## 10. Acceptance Criteria

The workflow validation fixtures slice is acceptable when:

- all 12 core workflow scenarios are represented
- each fixture includes fixture state, attempted action, expected outcome, expected Nexus explanation, expected Steward enforcement, evidence needed, and acceptance criteria
- outcomes use PASS, BLOCK, DEFER, WAIVER_REQUIRED, or FAIL
- deterministic seeded data is enough to evaluate the fixture without UI, API routes, model calls, upload/parsing, or workflow runtime
- unsafe stage advancement is blocked in fixtures
- artifact lock, approval, waiver, upload citation, versioning, and value realization rules are represented
- the fixture layer distinguishes workflow validation from context validation
- review packet documents outcomes, known gaps, and why no workflow implementation was done

## 11. What Not To Build

Do not implement in the fixture planning or fixture slice:

- workflow engine code
- approval engine
- artifact versioning implementation
- document export/import
- real upload/parsing
- chat UI
- model calls
- API routes
- event canvas expansion
- scorecard UI
- artifact drawer UI
- value ledger UI
- vendor flow
- AI/RFP generation
- `/programs` integration
- `/preview` or `/demo` surfaces
- `ProgramSurface`
- `src/lib/programs/mock.ts`

