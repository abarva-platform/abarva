# Next Slice Plan: Workflow Validation Report Hardening

## 1. Purpose

Harden the readable Source workflow validation report so reviewers can quickly understand workflow safety before any workflow engine, approval engine, artifact versioning runtime, document export/import runtime, UI, API route, or model-assisted behavior is built.

The current deterministic runner already produces a structured report and markdown formatter. The next slice should make that report more review-ready, more explicit about blockers and remediation, and easier to compare with the Source context validation report.

This planning slice does not implement report hardening.

## 2. Why This Comes Before Workflow Engine Or UI

Workflow validation exists to prevent unsafe sourcing moves before they become product behavior.

Report hardening comes before workflow engine or UI because:

- reviewers need a clear view of which workflow rules are enforced
- healthy `BLOCK` outcomes should be visible and understood, not treated as failures
- `DEFER` outcomes should point to intentionally missing capabilities
- future UI should consume a stable report contract rather than inventing display logic
- workflow engine behavior should not be implemented until report expectations are reviewable
- approval/versioning/export/import runtime should not start before blocker and remediation language is stable

## 3. Desired Report Format

The hardened report should preserve the existing typed report object and markdown output while improving readability.

Recommended sections:

1. Suite summary
2. Outcome distribution
3. Fixture outcome table
4. BLOCK reasons
5. DEFER reasons
6. WAIVER_REQUIRED logic
7. Failed expectations / mismatches
8. Required remediations
9. Remaining workflow gaps
10. Explicit do-not-build scope
11. Recommended next slice

The markdown report should be readable in a PR, review packet, or future CLI output.

## 4. Displaying Current Summary

The report should prominently show:

`Source workflow validation: 12 total / 11 BLOCK / 1 DEFER / 0 mismatches`

It should also show:

- `PASS: 0`
- `BLOCK: 11`
- `DEFER: 1`
- `WAIVER_REQUIRED: 0`
- `FAIL: 0`
- `Mismatches: 0`
- suite verdict: `defer`

The suite verdict should be `defer` because one fixture intentionally requires upload parsing/citation validation before it can pass.

## 5. Showing BLOCK Reasons

Every `BLOCK` row should include:

- fixture id
- workflow rule id
- attempted action
- blocker reason
- evidence requirement
- Steward enforcement statement
- deterministic remediation

The report should make clear that most current `BLOCK` outcomes are healthy because they prove unsafe actions are blocked.

Examples of expected blocker reason language:

- RFP package must be approved and locked before Vendor Responses.
- Scorecard must be locked before Evaluation.
- Rich-tier RFP generation requires required inputs.
- Strategic release requires legal and procurement review path.
- Artifact lock requires resolved required comments.
- Approval completion requires assigned owner.
- Stage advancement cannot proceed while a required artifact needs inputs.
- Offline redline upload must create a new artifact version.
- Vendor response completeness requires pricing template or approved exception.
- Realized value requires measurement owner and evidence.
- Approval waiver requires authorized rationale.

## 6. Showing WAIVER_REQUIRED Logic

The current deterministic fixture result has zero `WAIVER_REQUIRED` outcomes, but the report should be ready for them.

Future `WAIVER_REQUIRED` rows should show:

- waiver-capable rule
- missing gate condition
- authorized waiver role
- required rationale field
- whether waiver evidence is present
- whether stage advancement remains blocked until waiver is captured

The report should avoid implying that waiver is a bypass. A waiver is a governed exception path with owner, authority, rationale, and audit trail.

## 7. Showing Remediation By Fixture

Every fixture should include one required remediation string.

Remediation should be deterministic and action-oriented.

Examples:

- approve and lock RFP package
- lock scorecard criteria and weights
- collect or waive required inputs
- configure legal and procurement review path
- resolve required reviewer comments
- assign approval owner
- create new artifact version for offline edit
- parse and validate uploaded document
- collect pricing template or approved exception
- assign measurement owner and attach evidence
- capture waiver rationale

## 8. Comparing Workflow Validation Report To Context Validation Report

The workflow validation report should be parallel to the context validation report, but not identical.

Context validation report:

- validates grounded Nexus response readiness
- focuses on event/stage/pattern/evidence/context completeness
- uses pass/defer/reject style outcomes
- guards against generic agent responses

Workflow validation report:

- validates workflow action safety
- focuses on gate enforcement, artifact readiness, approvals, versions, waivers, uploaded-document citation readiness, and value realization
- uses `PASS`, `BLOCK`, `DEFER`, `WAIVER_REQUIRED`, and `FAIL`
- guards against unsafe workflow advancement

Both reports should make missing context or missing workflow state visible before UI/model implementation.

## 9. Likely Files To Create Or Update Later

Likely updates in the future implementation slice:

- `src/lib/source/workflow-validation-runner.ts`
- `docs/abarva-source/build-pack/implementation-reviews/13_WORKFLOW_VALIDATION_REPORT_HARDENING_REVIEW.md`
- `CYCLE_STATE.md`

Possible new file only if separation becomes cleaner:

- `src/lib/source/workflow-validation-report.ts`

Do not create these files in this planning slice.

## 10. Validation Commands

For the future implementation slice:

```bash
npx eslint src/lib/source/workflow-validation-runner.ts src/lib/source/workflow-validation.ts src/lib/source/workflow-validation-fixtures.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

If a separate report formatter file is created:

```bash
npx eslint src/lib/source/workflow-validation-report.ts
```

Recommended deterministic smoke check:

```bash
npx tsx -e "import { getSourceWorkflowValidationReport, formatSourceWorkflowValidationReportAsMarkdown } from './src/lib/source'; const report = getSourceWorkflowValidationReport({ generatedAt: '2026-04-25T00:00:00.000Z' }); console.log(JSON.stringify({ total: report.totalFixtures, block: report.blockCount, defer: report.deferCount, mismatches: report.mismatchCount, verdict: report.suiteVerdict }, null, 2)); console.log(formatSourceWorkflowValidationReportAsMarkdown(report));"
```

## 11. Acceptance Criteria

The report-hardening slice is acceptable when:

- report summary clearly shows `12 total / 11 BLOCK / 1 DEFER / 0 mismatches`
- healthy `BLOCK` outcomes are described as expected enforcement, not failures
- intentional `DEFER` is explained with required future capability
- `WAIVER_REQUIRED` display logic is ready even if no current fixture uses it
- each fixture has clear blocker/defer/waiver explanation
- each fixture has deterministic remediation
- mismatches are obvious and treated as review blockers
- markdown output is readable in PR review
- report remains deterministic and does not call an LLM
- no workflow engine, approval engine, artifact versioning runtime, document export/import runtime, UI, API route, upload/parsing, or model behavior is implemented

## 12. Do-Not-Build List

Do not implement:

- workflow engine
- approval engine
- artifact versioning implementation
- document export/import implementation
- chat UI
- model calls
- API routes
- upload/parsing
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
