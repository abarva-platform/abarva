# Next Slice Plan: Source Context Validation Runner

Date: 2026-04-24

Status: planning only. Do not implement the runner until explicitly approved.

## 1. Purpose

Create a deterministic Source context validation runner that executes all approved golden fixtures and produces a structured pass/defer/reject report.

The runner should make context quality visible before any chat UI, model call, API route, upload/parsing flow, or Source workflow expansion is built.

The runner should answer:

- Which fixtures pass with current seeded context?
- Which fixtures defer because the context is not yet rich enough?
- Which fixtures fail because required context is missing or inconsistent?
- Which gaps are blocking safe chat/model implementation?
- Which anti-vanilla safeguards are covered?

## 2. Why Runner Comes Before Chat UI/Model Wiring

The fixture layer defines golden prompts and expected context requirements. The runner turns those fixtures into an executable product gate.

This should happen before chat/model wiring because:

- Nexus must be context-first, not prompt-first.
- We need repeatable proof that event, stage, lifecycle, owner, aging, missing input, scorecard, value, attachment, pattern, and action context is present.
- Deferred fixture states should remain visible instead of being hidden behind persuasive generated language.
- Model calls should not compensate for missing deterministic context.
- Chat UI should not be designed around unknown response readiness.

The runner gives the team a small, deterministic report that can be reviewed before any user-facing agent surface is built.

## 3. Files Likely To Create

Likely files:

- `src/lib/source/agent-validation-runner.ts`
- `docs/abarva-source/build-pack/implementation-reviews/06_CONTEXT_VALIDATION_RUNNER_REVIEW.md`

Possible later test file if approved:

- `src/lib/source/__tests__/agent-validation-runner.test.ts`

Do not create UI, route handlers, API endpoints, upload handlers, or model adapters in this slice.

## 4. Files Likely To Update

Likely updates:

- `src/lib/source/index.ts` to export runner types/functions.
- `CYCLE_STATE.md` after implementation.
- Possibly `src/lib/source/agent-validation.ts` if a small shared report type belongs with existing validation contracts.

Avoid updates to:

- Source React components.
- Source route pages.
- `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`.
- Agent/model runtimes.
- Upload/parsing modules.

## 5. Inputs And Outputs

Inputs:

- `SOURCE_AGENT_VALIDATION_FIXTURES`
- `validateSourceAgentValidationFixture`
- optional runner options:
  - fixture ids to include
  - include/exclude categories
  - expected minimum pass count
  - whether defer is allowed
  - whether failure should throw or return a report

Outputs:

- structured runner report
- per-fixture result list
- summary counts:
  - total fixtures
  - passed
  - deferred
  - failed
- grouped gap list
- anti-vanilla coverage list
- recommended next context gaps to address
- machine-readable boolean for whether the suite is acceptable for the current slice

## 6. Expected Report Format

The report should be plain TypeScript data, not UI output.

Conceptual shape:

```ts
type SourceContextValidationRunnerReport = {
  id: string;
  generatedAt: string;
  fixtureCount: number;
  passed: number;
  deferred: number;
  failed: number;
  verdict: 'pass' | 'defer' | 'fail';
  results: SourceAgentValidationFixtureResult[];
  gaps: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    fixtures: string[];
    summary: string;
  }>;
  antiVanillaCoverage: Array<{
    flag: SourceVanillaResponseFlag;
    fixtures: string[];
  }>;
  nextRecommendedActions: string[];
};
```

The runner should not print to console by default. Console/CLI behavior can come later if needed.

## 7. Pass/Defer/Reject Behavior

Use `pass`, `defer`, and `fail` internally. If the user-facing docs call it pass/defer/reject, map `fail` to `reject` in documentation/report labels if helpful.

Recommended behavior:

- `pass`: all required deterministic context exists for the fixture.
- `defer`: the fixture is valid but current context is not rich enough for a trustworthy final Nexus answer.
- `fail`: required context is missing in a way that violates the fixture contract or assembly failed unexpectedly.

Suite-level verdict:

- `pass` when all fixtures pass.
- `defer` when at least one fixture defers and none fail.
- `fail` when at least one fixture fails.

Current expected suite result:

- likely `defer`, because the fixture layer intentionally exposes known gaps:
  - portfolio context lacks full per-event/value ranking
  - pattern sections are not populated
  - scorecard defaults/overrides are empty
  - attachment summaries/citations do not exist yet

That `defer` result is useful and should not be hidden.

## 8. What Not To Build

Do not implement:

- chat UI
- model calls
- API routes
- upload/parsing
- event canvas expansion
- scorecard UI
- artifact drawer
- value ledger UI
- vendor flow
- AI/RFP generation
- `/programs` integration
- `/preview` or `/demo` surfaces
- `ProgramSurface`
- `src/lib/programs/mock.ts`

Do not add CLI, browser UI, dashboards, or admin panels unless separately approved.

## 9. Validation Commands

Expected validation for the runner slice:

```bash
npx eslint src/lib/source/agent-validation-runner.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

If a narrow Jest test is added:

```bash
npx jest src/lib/source/__tests__/agent-validation-runner.test.ts
```

Do not run or modify broad UI/browser flows for this slice unless a failure requires investigation.

## 10. Acceptance Criteria

The next slice is acceptable when:

- the runner executes all current Source validation fixtures deterministically
- the runner returns a structured report, not prose-only output
- pass/defer/fail counts are accurate
- deferred known gaps are preserved and visible
- failures are machine-readable
- anti-vanilla coverage is summarized
- the runner uses seeded Source context only
- no UI, API route, model call, upload/parsing, or Source workflow expansion is introduced
- validation commands pass
- implementation review packet documents behavior, gaps, and next recommendations

