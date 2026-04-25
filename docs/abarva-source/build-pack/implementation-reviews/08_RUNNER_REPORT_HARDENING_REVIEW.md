# Runner Report Hardening Review

Date: 2026-04-24

Status: implementation review packet for deterministic Source validation report hardening.

## 1. Files Changed

Created:

- `src/lib/source/agent-validation-report.ts`
- `docs/abarva-source/build-pack/implementation-reviews/08_RUNNER_REPORT_HARDENING_REVIEW.md`

Updated:

- `src/lib/source/index.ts`
- `CYCLE_STATE.md`

No Source UI, chat UI, API routes, model runtime, upload/parsing, event canvas, scorecard UI, artifact drawer, value ledger UI, vendor flow, AI/RFP generation, `/programs`, `/preview`, or `/demo` files were modified.

## 2. Functions Added

Added deterministic report functions:

- `getSourceContextValidationReadableReport(options)`
- `createSourceContextValidationReadableReport(runnerReport)`
- `formatSourceContextValidationReport(report)`
- `formatSourceContextValidationReportAsMarkdown(report)`
- `getIntentionalSourceValidationDefers(runnerReport)`
- `getSourceContextValidationRemediations(runnerReport)`

Existing runner functions remain intact:

- `getSourceContextValidationReport(options)`
- `runSourceContextValidationFixtures(options)`
- `summarizeSourceContextValidationResults(results, fixtures, options)`
- `getSourceContextValidationFixtureById(id)`

## 3. Report Shape

The readable report includes:

- `reportId`
- `reportVersion`
- `generatedAt`
- `validationScope`
- `explicitOutOfScope`
- suite summary:
  - total fixtures
  - pass count
  - defer count
  - reject count
  - suite verdict
- `resultsByFixture`
- `deferReasons`
- `rejectReasons`
- `remainingContextGaps`
- `recommendedRemediations`
- `nextRecommendedSlice`

Fixture rows include:

- fixture id
- prompt
- category
- persona
- surface
- stage key when available
- expected outcome
- actual outcome
- status
- dimensions checked
- context grounding score
- actionability score
- evidence score
- missing context reasons
- vanilla-response risk flags
- recommended remediation

## 4. Sample Report Summary

Expected current summary:

```text
Source Context Validation: 10 fixtures
PASS: 8
DEFER: 2
REJECT: 0
Suite verdict: DEFER
Expected current outcome: 10 total / 8 pass / 2 defer / 0 reject
```

This suite verdict remains `DEFER` by design because two fixtures should not pass without missing client inputs or real uploaded client evidence.

## 5. Fixture Outcome Summary

Current expected fixture outcomes:

- PASS: `source-golden-dashboard-attention`
- PASS: `source-golden-dashboard-most-at-risk`
- PASS: `source-golden-scope-move-to-rfp`
- PASS: `source-golden-scope-missing-data`
- PASS: `source-golden-scorecard-commercial-weight`
- DEFER: `source-golden-artifact-generate-rfp`
- DEFER: `source-golden-attachment-vendor-response-summary`
- PASS: `source-golden-pattern-data-ai-rationale`
- PASS: `source-golden-value-projected-realized`
- PASS: `source-golden-wait-state-owner`

## 6. Remaining Intentional Defers

### Generate The RFP

Fixture: `source-golden-artifact-generate-rfp`

Reason: required client inputs are still missing, so RFP generation must remain blocked at the Scope gate.

Required before pass: upload/validate application inventory and analytics workload baseline, then clear the Scope gate and artifact readiness checks.

### Summarize This Vendor Response

Fixture: `source-golden-attachment-vendor-response-summary`

Reason: no real uploaded vendor response or client evidence exists; only a seed placeholder attachment is present.

Required before pass: upload a real vendor response, parse it into an attachment summary, attach citations, and record confidence before summarization can pass.

## 7. Remaining Gaps

The report preserves remaining gaps instead of hiding them:

- Scope input gaps for application inventory and analytics workload baseline.
- Attachment citation gap for vendor response summarization.
- Placeholder-only attachment summary.
- Digital App Build vendor response pricing-template gaps.
- Client-specific citation coverage remains incomplete for some seeded event claims.

## 8. Validation Results

Validation commands run:

```bash
npx eslint src/lib/source/agent-validation-report.ts src/lib/source/agent-validation-runner.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
npx tsx -e "import { getSourceContextValidationReadableReport, formatSourceContextValidationReportAsMarkdown } from './src/lib/source'; const report = getSourceContextValidationReadableReport(); console.log(JSON.stringify({ total: report.suite.totalFixtures, pass: report.suite.passCount, defer: report.suite.deferCount, reject: report.suite.rejectCount, verdict: report.suite.verdict, intentionalDefers: report.deferReasons.map((item) => item.fixtureId) }, null, 2)); console.log(formatSourceContextValidationReportAsMarkdown(report).split('\\n').slice(0, 12).join('\\n'));"
```

Results:

- ESLint: passed.
- TypeScript: passed.
- Deterministic readable report smoke check: passed.
- Smoke summary: 10 total, 8 pass, 2 defer, 0 reject, verdict `defer`.
- Intentional defers surfaced: `source-golden-artifact-generate-rfp`, `source-golden-attachment-vendor-response-summary`.

Note: this clean temp worktree required a local `npm ci` before validation because it did not have `node_modules`. `npm ci` completed with existing dependency deprecation/audit warnings, and no source files were changed by dependency installation.

## 9. Boundary Confirmation

Confirmed scope:

- deterministic report output only
- seeded Source context only
- no UI
- no chat UI
- no API routes
- no model calls
- no upload/parsing
- no event canvas expansion
- no scorecard UI
- no artifact drawer
- no value ledger UI
- no vendor flow
- no AI/RFP generation
- no `/programs`, `/preview`, or `/demo` implementation
