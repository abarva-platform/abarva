# Next Slice Plan: Workflow Validation Runner

## 1. Purpose Of Workflow Validation Runner

Create a deterministic runner that executes the Source workflow validation fixtures and produces a clear report of whether Source workflow rules are being enforced as expected.

The runner should make unsafe workflow moves visible before any workflow UI, approval engine, artifact versioning implementation, document export/import, API route, or model-assisted behavior is built.

This slice is planning only. It does not implement the runner.

## 2. Relationship To Workflow Validation Fixtures

The workflow validation fixtures define the expected behavior for stage gates, artifact lifecycle, document review, approval routing, versioning, waiver behavior, uploaded-document citation readiness, vendor response completeness, and value realization.

The future runner should:

- import the deterministic workflow validation fixtures
- execute each fixture with the deterministic workflow validation evaluator
- compare actual outcome to expected outcome
- count PASS, BLOCK, DEFER, WAIVER_REQUIRED, and FAIL outcomes
- flag mismatches between expected and actual outcomes
- preserve healthy BLOCK and DEFER outcomes instead of forcing all scenarios to pass

Fixtures remain the source of truth for individual workflow rules. The runner is the review surface for the whole fixture suite.

## 3. Relationship To Context Validation Runner

Context validation and workflow validation are separate guardrails.

Context validation answers: Is Nexus grounded in the current Source event, stage, pattern, artifacts, scorecard, value, evidence, and missing inputs?

Workflow validation answers: Should Source allow, block, defer, or require waiver for a workflow action?

The future workflow validation runner should borrow the clarity of the context validation runner report, but it should not reuse context-specific scoring concepts such as anti-vanilla response risk, evidence score, or response confidence unless they are explicitly mapped to workflow safety.

## 4. Expected Report Format

The future report should be available as a typed object and as a readable markdown string.

Recommended report object fields:

- `reportId`
- `reportVersion`
- `generatedAt`
- `validationScope`
- `explicitOutOfScope`
- `totalFixtures`
- `passCount`
- `blockCount`
- `deferCount`
- `waiverRequiredCount`
- `failCount`
- `mismatchCount`
- `suiteVerdict`
- `resultsByFixture`
- `blockerExplanations`
- `deferExplanations`
- `waiverRequiredExplanations`
- `failedExpectations`
- `requiredRemediations`
- `remainingWorkflowGaps`
- `nextRecommendedSlice`

Recommended fixture row fields:

- fixture id
- title
- rule id
- attempted action
- expected outcome
- actual outcome
- expectation match state
- Nexus explanation
- Steward enforcement
- evidence requirements
- blocker reasons
- remediation required

## 5. Outcome Types

The runner should preserve the existing workflow validation outcome vocabulary:

- PASS: the action is safe and allowed, or the fixture confirms the expected safe state
- BLOCK: the action is blocked because a required gate, artifact, approval, review, evidence, or owner condition is missing
- DEFER: the action cannot be fully evaluated because required context is intentionally unavailable
- WAIVER_REQUIRED: the action may proceed only with authorized waiver and rationale
- FAIL: the deterministic validator allowed an unsafe action, blocked a safe action, or produced an unexpected outcome

Healthy BLOCK, DEFER, and WAIVER_REQUIRED results are acceptable when they match fixture expectations.

## 6. Showing Current Fixture Summary

The report should make the current deterministic outcome obvious:

- 12 total fixtures
- 11 BLOCK
- 1 DEFER
- 0 mismatches

The summary should also show:

- the suite verdict
- the number of expected outcomes matched
- any unexpected FAIL result
- any fixture whose actual outcome differs from expected outcome

Recommended summary line:

`Source workflow validation: 12 fixtures · 11 BLOCK · 1 DEFER · 0 mismatches`

## 7. Showing Blocker Explanations

Every BLOCK outcome should explain the specific missing workflow condition.

Examples:

- RFP package is not approved and locked.
- Scorecard weights and criteria are not locked.
- Required inputs are missing for Rich-tier RFP generation.
- Strategic release route lacks legal and procurement review.
- Required reviewer comments are unresolved.
- Approval route has no assigned owner.
- Required artifact is still Needs Inputs.
- Re-uploaded offline edits must create a new version.
- Vendor response is incomplete without pricing template or approved exception.
- Realized value cannot be marked without measurement owner and evidence.
- Approval cannot be skipped without waiver rationale.

The report should avoid generic workflow language. Each blocker should name the fixture, rule, evidence requirement, and remediation.

## 8. Showing Required Remediation

Each fixture result should include a deterministic remediation string.

Remediations should tell future builders what data, state, or product capability is needed next.

Examples:

- approve and lock the RFP package before vendor release
- lock the scorecard before Evaluation
- collect missing application inventory and workload baseline before Rich-tier RFP generation
- configure legal and procurement review roles for strategic events
- resolve or waive required reviewer comments before lock
- assign approval owner before recording approval
- create a new artifact version for offline-edited uploads
- parse and validate uploaded documents before citation
- add pricing template or approved exception before marking vendor response complete
- assign measurement owner and evidence before realized value is recorded
- capture waiver rationale before skipping required approval

## 9. Files Likely To Create

Future implementation slice may create:

- `src/lib/source/workflow-validation-runner.ts`
- `docs/abarva-source/build-pack/implementation-reviews/12_WORKFLOW_VALIDATION_RUNNER_REVIEW.md`

Optional if a readable formatter is cleaner:

- `src/lib/source/workflow-validation-report.ts`

Do not create these files in this planning slice.

## 10. Files Likely To Update

Future implementation slice may update:

- `src/lib/source/index.ts`
- `src/lib/source/workflow-validation.ts` only if runner-specific result metadata needs shared types
- `src/lib/source/workflow-validation-fixtures.ts` only if fixture metadata is missing
- `CYCLE_STATE.md`

The implementation slice should not update UI files, API routes, model runtimes, upload/parsing code, approval engines, or artifact versioning runtime.

## 11. Validation Commands

For the future implementation slice:

```bash
npx eslint src/lib/source/workflow-validation.ts src/lib/source/workflow-validation-fixtures.ts src/lib/source/workflow-validation-runner.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

If a separate report formatter is added:

```bash
npx eslint src/lib/source/workflow-validation-report.ts
```

Deterministic smoke check should resemble:

```bash
npx tsx -e "import { getSourceWorkflowValidationReport } from './src/lib/source'; console.log(JSON.stringify(getSourceWorkflowValidationReport(), null, 2));"
```

Exact command should match the implemented export names.

## 12. Acceptance Criteria

The workflow validation runner slice is acceptable when:

- all workflow validation fixtures are executed deterministically
- the report shows total fixture count and outcome counts
- the report shows 12 total / 11 BLOCK / 1 DEFER / 0 mismatches for current seeded fixtures
- each fixture row shows expected outcome, actual outcome, and match state
- blocker explanations are specific and tied to fixture evidence
- required remediations are deterministic and actionable
- DEFER outcomes remain visible rather than hidden
- any mismatch is surfaced as a review blocker
- no model calls are used
- no UI or API route is created
- no workflow engine, approval engine, artifact versioning runtime, or document export/import runtime is implemented
- review packet confirms scope boundaries and validation results

## 13. What Not To Build

Do not implement:

- workflow validation runner in this planning slice
- workflow engine
- approval engine
- artifact versioning implementation
- document export/import
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
- `/programs`, `/preview`, or `/demo` surfaces
