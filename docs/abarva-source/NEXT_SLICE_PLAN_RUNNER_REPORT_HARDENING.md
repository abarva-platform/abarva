# Next Slice Plan: Source Runner Report Hardening

Date: 2026-04-24

Status: planning only. Do not implement runner report hardening until explicitly approved.

## 1. Purpose

Create a deterministic validation report artifact or CLI-style output for the Source context validation runner.

The report should make validation state easy to review without requiring a developer to inspect raw objects or fixture internals. It should clearly show:

- total fixture count
- pass/defer/reject summary
- fixture-by-fixture outcomes
- remaining intentional defers
- unresolved gaps
- anti-vanilla coverage
- recommended next remediations

This is an operating/readiness artifact, not a UI surface.

## 2. Why Runner Report Hardening Comes Before Chat/Model/UI

Runner report hardening comes before chat/model/UI because reviewers need deterministic proof that Source context is strong enough before user-facing Nexus behavior exists.

The current runner already produces structured data. The next slice should make that data easier to consume as a repeatable review artifact so the team can:

- verify context grounding before model-assisted responses
- preserve intentional defers instead of hiding them behind polished prose
- see whether fixture changes are improving real readiness
- avoid building chat UI around unknown or weak context
- confirm anti-vanilla safeguards remain active after each Source slice

No chat UI, API route, model call, upload/parsing, or workflow expansion is needed to achieve this.

## 3. Files Likely To Create

Likely files:

- `src/lib/source/agent-validation-report.ts`
- `docs/abarva-source/build-pack/implementation-reviews/08_RUNNER_REPORT_HARDENING_REVIEW.md`

Possible file if a generated static report artifact is approved:

- `docs/abarva-source/build-pack/validation/source-context-validation-report.md`

Do not create app routes, React components, API routes, upload handlers, model adapters, or browser surfaces in this slice.

## 4. Files Likely To Update

Likely updates:

- `src/lib/source/agent-validation-runner.ts`
- `src/lib/source/agent-validation-fixtures.ts` only if fixture metadata is needed for clearer reporting
- `src/lib/source/index.ts` if a new report module is exported
- `CYCLE_STATE.md` after implementation

Possible updates only if needed:

- `src/lib/source/agent-validation.ts` for report-specific type contracts

Avoid updates to:

- Source UI components
- Source route pages
- `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`
- agent/model runtimes
- upload/parsing modules

## 5. Expected Report Format

The report should be deterministic and review-friendly.

Recommended TypeScript shape:

```ts
type SourceContextValidationReadableReport = {
  generatedAt: string;
  suite: {
    total: number;
    pass: number;
    defer: number;
    reject: number;
    verdict: 'pass' | 'defer' | 'reject';
  };
  fixtureRows: Array<{
    id: string;
    prompt: string;
    category: string;
    expected: 'pass' | 'defer' | 'reject';
    actual: 'pass' | 'defer' | 'reject';
    status: 'matches_expected' | 'unexpected';
    groundingScore: number;
    actionabilityScore: number;
    evidenceScore: number;
    keyGaps: string[];
  }>;
  intentionalDefers: Array<{
    fixtureId: string;
    reason: string;
    remediationRequiredBeforePass: string;
  }>;
  remainingGaps: Array<{
    id: string;
    severity: string;
    fixtures: string[];
    summary: string;
  }>;
  recommendations: string[];
};
```

The slice may also expose a markdown formatter such as:

- `formatSourceContextValidationReportAsMarkdown(report)`

The formatter must be deterministic and must not call models.

## 6. Showing 8 Pass / 2 Defer / 0 Reject Clearly

The report should show the suite summary near the top:

```text
Source Context Validation: 10 fixtures
PASS: 8
DEFER: 2
REJECT: 0
Suite verdict: DEFER
```

It should explain that `DEFER` is expected while intentional blockers remain:

- RFP generation is blocked by missing required client inputs.
- Vendor response summary is blocked by lack of real uploaded client evidence.

The report should distinguish:

- expected defer
- unexpected defer
- reject
- pass

This prevents reviewers from misreading the suite verdict as a failure when the remaining defers are deliberate product guardrails.

## 7. Showing Remaining Intentional Defers

The report should explicitly call out:

1. `source-golden-artifact-generate-rfp`
   - Reason: Scope gate remains blocked by missing application inventory and analytics workload baseline.
   - Required before pass: client inputs, gate readiness, and artifact readiness.

2. `source-golden-attachment-vendor-response-summary`
   - Reason: only a seed placeholder attachment exists; no real uploaded vendor response or client evidence exists.
   - Required before pass: real upload, parse summary, attachment citations, and confidence.

These should remain visible even when the overall fixture count improves.

## 8. Showing Recommended Next Remediations

Recommended next remediations should come directly from deterministic runner gaps and fixture outcomes.

Current expected recommendations:

- Keep vendor-response summary deferred until a real uploaded response is parsed and cited.
- Keep artifact generation blocked until Scope missing inputs and gate checks are satisfied.

The report should not recommend building chat UI or model calls as remediation for missing deterministic context.

## 9. Validation Commands

Expected validation for the runner report hardening slice:

```bash
npx eslint src/lib/source/agent-validation-runner.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

If a new report module is created, include it:

```bash
npx eslint src/lib/source/agent-validation-report.ts src/lib/source/agent-validation-runner.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation.ts src/lib/source/index.ts
```

Recommended deterministic smoke check:

```bash
npx tsx -e "import { getSourceContextValidationReport } from './src/lib/source/agent-validation-runner.ts'; console.log(JSON.stringify(getSourceContextValidationReport(), null, 2));"
```

If a markdown formatter is added:

```bash
npx tsx -e "import { getSourceContextValidationReport, formatSourceContextValidationReportAsMarkdown } from './src/lib/source'; console.log(formatSourceContextValidationReportAsMarkdown(getSourceContextValidationReport()));"
```

## 10. Acceptance Criteria

The runner report hardening slice is acceptable when:

- the runner exposes a deterministic review-friendly report shape or formatter
- the report shows 10 total, 8 pass, 2 defer, 0 reject clearly
- expected versus actual fixture outcomes are visible
- intentional defers are called out with reasons and required remediation
- remaining gaps are grouped and readable
- recommended next remediations are deterministic
- no UI, API route, model call, upload/parsing, or workflow expansion is introduced
- validation commands pass
- implementation review packet documents report shape, output, and remaining limitations

