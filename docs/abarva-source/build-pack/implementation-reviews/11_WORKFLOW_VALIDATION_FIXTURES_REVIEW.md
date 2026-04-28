# 11 Workflow Validation Fixtures Review

Date: 2026-04-25

Status: implementation review for deterministic workflow validation fixtures. No UI, API routes, model calls, upload/parsing implementation, workflow engine, approval engine, artifact versioning implementation, document export/import implementation, `/programs`, `/preview`, or `/demo` work was performed.

## 1. Files Created

| File | Purpose | Notes |
| --- | --- | --- |
| `src/lib/source/workflow-validation.ts` | Defines Source-owned workflow validation types and deterministic per-fixture evaluation helpers. | Contract-only plus deterministic rule checks; no runtime workflow engine. |
| `src/lib/source/workflow-validation-fixtures.ts` | Defines 12 deterministic workflow validation fixtures. | Seeded fixture state only; no UI/API/model/upload behavior. |
| `docs/abarva-source/build-pack/implementation-reviews/11_WORKFLOW_VALIDATION_FIXTURES_REVIEW.md` | Captures this implementation review. | Documents files, fixture coverage, validation, and out-of-scope boundaries. |

## 2. Files Updated

| File | Purpose | Notes |
| --- | --- | --- |
| `src/lib/source/index.ts` | Source barrel exports. | Exports workflow validation contract and fixture modules. |
| `CYCLE_STATE.md` | Operating state. | Records deterministic workflow validation fixture completion and next recommended runner-plan slice. |

## 3. Fixture Coverage

The fixture slice includes all 12 approved workflow validation scenarios:

| Fixture | Rule | Expected outcome |
| --- | --- | --- |
| `source-workflow-rfp-package-approved-locked` | Cannot move to Vendor Responses if RFP package is not approved/locked. | BLOCK |
| `source-workflow-evaluation-requires-locked-scorecard` | Cannot begin Evaluation if scorecard is not locked. | BLOCK |
| `source-workflow-rich-rfp-missing-inputs` | Cannot generate Rich-tier RFP artifact when required inputs are missing. | BLOCK |
| `source-workflow-strategic-release-route-missing` | Cannot mark strategic sourcing event ready without legal/procurement review path. | BLOCK |
| `source-workflow-lock-artifact-unresolved-comments` | Cannot lock artifact with unresolved required reviewer comments. | BLOCK |
| `source-workflow-approval-owner-required` | Cannot approve artifact without assigned approval owner. | BLOCK |
| `source-workflow-required-artifact-needs-inputs` | Cannot advance stage if required artifact is still Needs Inputs. | BLOCK |
| `source-workflow-offline-edit-new-version` | Offline edited document re-upload creates a new version. | BLOCK |
| `source-workflow-uploaded-document-parse-before-citation` | Cannot cite uploaded document before it is parsed/validated. | DEFER |
| `source-workflow-vendor-response-pricing-template` | Cannot treat vendor response as complete if pricing template is missing. | BLOCK |
| `source-workflow-realized-value-owner-evidence` | Cannot mark value realized without measurement owner and evidence. | BLOCK |
| `source-workflow-approval-waiver-rationale` | Cannot skip approval without waiver rationale. | BLOCK |

## 4. Deterministic Behavior

The fixture layer defines:

- workflow validation outcomes: `PASS`, `BLOCK`, `DEFER`, `WAIVER_REQUIRED`, `FAIL`
- workflow action kinds for stage movement, evaluation, artifact generation, approval, upload, citation, vendor response completion, value realization, and waiver skip
- artifact status, artifact tier, approval status, and document parse status types
- seeded fixture state for events, artifacts, scorecards, required inputs, approval routes, reviewer comments, exports, uploads, vendor responses, value ledger state, and waivers
- deterministic per-fixture evaluation through `evaluateSourceWorkflowValidationFixture`
- deterministic fixture lookup through `getSourceWorkflowValidationFixture`
- deterministic bulk fixture evaluation through `evaluateSourceWorkflowValidationFixtures`

This is not a workflow runner/reporting slice. It provides fixture definitions and deterministic per-fixture evaluation only.

## 5. Outcome Summary

Deterministic smoke check:

```json
{
  "total": 12,
  "counts": {
    "BLOCK": 11,
    "DEFER": 1
  },
  "allMatch": true,
  "mismatches": []
}
```

The single DEFER is intentional: uploaded document citation must defer until parsing and validation exist.

## 6. Known Gaps

- No workflow validation runner/report exists yet.
- No approval engine exists.
- No artifact versioning runtime exists.
- No document export/import exists.
- No upload/parsing or citation validation runtime exists.
- No persistence model exists for approvals, comments, waivers, exports, uploads, or artifact versions.

These are intentionally deferred.

## 7. Validation Results

Commands run:

```bash
npx eslint src/lib/source/workflow-validation.ts src/lib/source/workflow-validation-fixtures.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
npx tsx -e "import { evaluateSourceWorkflowValidationFixtures } from './src/lib/source'; const results = evaluateSourceWorkflowValidationFixtures(); const counts = results.reduce((acc, r) => { acc[r.actualOutcome] = (acc[r.actualOutcome] ?? 0) + 1; return acc; }, {}); console.log(JSON.stringify({ total: results.length, counts, allMatch: results.every((r) => r.passesExpectation), mismatches: results.filter((r) => !r.passesExpectation).map((r) => ({ id: r.fixtureId, expected: r.expectedOutcome, actual: r.actualOutcome })) }, null, 2));"
```

Results:

- ESLint: passed
- TypeScript: passed
- Deterministic smoke check: passed

Note: the isolated `/tmp` worktree required a local `node_modules` symlink to the primary checkout for dependency resolution. No dependency files were staged.

## 8. Out Of Scope Confirmation

Not implemented:

- workflow engine code
- approval engine
- artifact versioning implementation
- document export/import
- UI
- API routes
- model calls
- upload/parsing
- event canvas expansion
- scorecard UI
- artifact drawer UI
- value ledger UI
- vendor flow
- AI/RFP generation
- `/programs`, `/preview`, or `/demo` work
- `ProgramSurface`
- `src/lib/programs/mock.ts`

## 9. Recommendation

Open a focused PR for this fixture slice. After it is reviewed/merged, the next controlled slice should be a docs-only workflow validation runner plan, followed by a deterministic runner/report implementation.

