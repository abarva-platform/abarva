# Next Slice Plan: Source Context Validation Fixtures

Date: 2026-04-24

Status: planning only. Do not implement fixtures until explicitly approved.

## 1. Purpose

Create deterministic validation fixtures that prove the Source context builder can support context-aware Nexus behavior before any chat UI, API route, model call, or upload workflow exists.

The slice should validate that seeded Source context can answer golden prompts through structured, deterministic expectations:

- which event is in scope
- which stage is active
- what status, owner, aging, and next action are present
- what is missing
- what value context exists
- what pattern/archetype context exists
- what actions are allowed
- what context was used
- when the response must refuse, defer, or ask for more context

## 2. Why This Comes Before Chat UI/Model Wiring

Validation fixtures come first because Source must not become a generic chat surface attached to a dashboard.

Before building chat UI or model wiring, we need proof that the underlying context layer can:

- distinguish portfolio, event, stage, and failure contexts
- separate deterministic facts from model-assisted synthesis
- detect missing event or stage context
- flag low evidence coverage
- produce allowed actions from current event/stage state
- expose "what Nexus used" for later UI rendering
- fail deterministic golden prompts when output would be too generic

This reduces the risk of building a polished UI around weak or under-contextualized agent behavior.

## 3. Files Likely To Create

Likely files, subject to implementation review:

- `src/lib/source/context-validation-fixtures.ts`
- `src/lib/source/context-validation-fixtures.test.ts`

Optional later files, if the fixture set grows:

- `src/lib/source/context-validation-golden-prompts.ts`
- `src/lib/source/context-validation-expected-results.ts`

## 4. Files Likely To Update

Likely updates:

- `src/lib/source/index.ts` to export fixture types/helpers if they are intended for internal tests or future harness use.
- `CYCLE_STATE.md` after the fixture slice is completed.
- `docs/abarva-source/build-pack/implementation-reviews/05_SOURCE_CONTEXT_VALIDATION_FIXTURES_REVIEW.md` after implementation, if requested.

Avoid updates to:

- Source UI components.
- API routes.
- agent/model runtimes.
- upload/parsing code.
- `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`.

## 5. Golden Prompts To Implement

Use deterministic seeded Source context only.

Portfolio/dashboard prompts:

- "What needs my attention?"
- "Which sourcing event is most at risk?"
- "Where is the most value at stake?"

Event-level prompts:

- "What is the status of Data & AI Modernization SI Selection?"
- "What is the next action?"
- "Who owns the next action?"
- "How long has this been aging?"

Scope-stage prompts:

- "Can we move to RFP?"
- "What data do we still need?"
- "Explain scope readiness."
- "Generate the minimum data request."

Scorecard/value prompts:

- "Can I change commercial weight to 25%?"
- "What value is at stake?"
- "What assumptions support the value?"

Failure-context prompts:

- "What is the event status for an unknown event id?"
- "Can Nexus answer without a selected event?"

## 6. Expected Deterministic Outputs

Fixtures should assert structured outputs, not free-form prose.

Expected output fields:

- context scope: portfolio, event, stage, or failure
- event id and event name when available
- stage id/name when available
- lifecycle status
- owner fields
- aging days
- due date when available
- blockers
- required inputs
- missing inputs
- pattern/archetype
- rigor level
- projected value fields when stored
- scorecard lock/default context when available
- allowed actions
- context-used summary
- context quality scores/labels
- missing context reasons
- validation pass/fail result

No fixture should expect invented client facts, vendor facts, realized value, file summaries, or citations that are not present in seed data.

## 7. Pass/Fail Criteria

A fixture passes when:

- the builder returns the expected context scope
- event-specific prompts include the expected event context
- stage-specific prompts include the expected stage context
- missing-input prompts return seeded missing inputs
- allowed actions match current deterministic state
- low-evidence or missing-context states are explicitly flagged
- unknown event ids produce deterministic failure semantics
- no generated narrative, model call, fake citation, fake file summary, or vendor recommendation is produced

A fixture fails when:

- output could apply to any company/event
- current event is omitted when event context exists
- current stage is omitted when stage context matters
- a move-forward answer ignores missing inputs or gates
- value claims appear without stored value context
- scorecard guidance ignores seeded/default scorecard context
- unknown event ids throw unexpectedly instead of returning deterministic failure data

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

## 9. Validation Commands

Expected validation for the fixture slice:

```bash
npx eslint src/lib/source src/components/AbarvaNav.tsx src/components/chrome/PrimaryNav.tsx
npx tsc --noEmit --pretty false
npm run build
```

If a test runner is already configured for TypeScript unit tests, add the narrow fixture test command once implementation begins. Do not introduce a new broad testing framework without review.

## 10. Acceptance Criteria

The next slice is acceptable when:

- fixtures are deterministic and use seeded Source context only
- portfolio, event, stage, and failure contexts are covered
- golden prompts are represented as structured fixtures
- expected outputs are asserted as data, not prose snapshots
- validation catches generic/vanilla answers before chat UI exists
- no UI, API route, model call, upload/parsing, or Source workflow expansion is introduced
- `src/lib/source/context-builder.ts` remains the only context assembly source used by fixtures
- docs and `CYCLE_STATE.md` are updated after completion

