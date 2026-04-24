# 05 Context Validation Fixtures Review

Date: 2026-04-24

Status: implementation review packet for deterministic Source context validation fixtures.

## 1. Inventory

Created:

- `src/lib/source/agent-validation-fixtures.ts`
- `docs/abarva-source/build-pack/implementation-reviews/05_CONTEXT_VALIDATION_FIXTURES_REVIEW.md`

Updated:

- `src/lib/source/agent-validation.ts`
- `src/lib/source/index.ts`
- `CYCLE_STATE.md`

Not touched:

- Source UI components
- chat UI
- API routes
- model runtimes
- upload/parsing code
- event canvas, scorecard UI, artifact drawer, value ledger UI, vendor flow, AI/RFP generation
- `/programs`, `/preview`, `/demo`, `ProgramSurface`, `src/lib/programs/mock.ts`

## 2. Scope Summary

This slice adds deterministic golden-prompt fixtures that validate whether future Nexus responses can be grounded in the current Source context bundle.

The slice does not generate Nexus responses. It checks whether the seeded Source context contains the event, stage, lifecycle, missing input, owner, aging, pattern, scorecard, value, attachment, artifact, and allowed-action data needed for future responses.

The fixtures are intentionally data-first. They produce structured validation results, expected pass/defer/fail outcomes, context-used summaries, and vanilla-response failure flags.

## 3. Fixtures Added

| Fixture | Prompt | Context | Expected Verdict | Why |
|---|---|---|---|---|
| `source-golden-dashboard-attention` | "What needs my attention?" | Portfolio/dashboard | `defer` | Portfolio context exists, but full event/value-at-stake coverage is not yet rich enough for final agent answers. |
| `source-golden-dashboard-most-at-risk` | "Which sourcing event is most at risk?" | Portfolio/dashboard | `defer` | Portfolio risk is present, but event-level lifecycle/aging/value ranking needs richer portfolio snapshots. |
| `source-golden-scope-move-to-rfp` | "Can we move to RFP?" | Data & AI / Scope | `pass` | Event, stage, lifecycle, missing inputs, gate, owner, aging, artifacts, value, and allowed actions are present. |
| `source-golden-scope-missing-data` | "What data do we still need?" | Data & AI / Scope | `pass` | Missing inputs and required artifacts are deterministic and tied to Scope. |
| `source-golden-scorecard-commercial-weight` | "Can I change commercial weight to 25%?" | Scorecard governance | `defer` | Scorecard exists, but default weights and override history are not populated yet. |
| `source-golden-artifact-generate-rfp` | "Generate the RFP." | Artifact readiness | `defer` | Scope is blocked and missing inputs prevent final RFP generation. |
| `source-golden-attachment-vendor-response-summary` | "Summarize this vendor response." | Vendor response attachment | `defer` | Attachment id is selected, but no parsed summary/citation exists. |
| `source-golden-pattern-data-ai-rationale` | "Why is this a Data & AI Modernization sourcing event?" | Pattern grounding | `defer` | Pattern identity exists, but relevant pattern sections are not populated yet. |
| `source-golden-value-projected-realized` | "What value is projected versus realized?" | Value ledger | `pass` | Projected and realized value ledger state exists and realized value remains explicitly empty. |
| `source-golden-wait-state-owner` | "Why are we waiting and who owns it?" | Wait state | `pass` | Waiting status, owner, aging, blocker, missing input, gate, and actions are present. |

## 4. Validation Behavior

The validator:

- builds context through `buildSourceContextAssemblyResultFromSeed`
- uses seeded Source context only
- checks required context scope, event id, stage key, lifecycle status, missing inputs, owner, aging, pattern, scorecard, value ledger, attachment summaries, artifacts, gates, and allowed actions
- returns `SourceAgentValidationResult`
- returns `SourceAgentValidationFixtureResult`
- exposes context-used summaries from `getSourceContextUsed`
- flags generic-response failure controls through `SourceVanillaResponseFlag`
- represents pass/defer/fail thresholds through `SOURCE_DEFAULT_VALIDATION_PASS_CRITERIA`

The validator does not:

- call an LLM
- generate response text
- create UI state
- hit an API route
- upload or parse files
- mutate Source events

## 5. Anti-Vanilla Coverage

The fixture layer now checks the main anti-vanilla rules:

- current event is required when event context is available
- current stage is required when the prompt is stage-specific
- lifecycle status must be available where relevant
- missing inputs must be present for gate/readiness prompts
- owner and aging must be available for wait-state and action prompts
- pattern/archetype context must be present for pattern prompts
- scorecard defaults/overrides must be present for weight-change prompts
- value ledger context must be present for value prompts
- attachment summaries/citations must be present for file-specific prompts
- generic response flags are carried per fixture

## 6. Known Gaps Found

These gaps are product-useful and are intentionally surfaced as `defer`, not hidden:

- Portfolio context does not yet carry full per-event snapshots, value-at-stake ranking, or lifecycle/aging detail for all events.
- Pattern context currently has identity/archetype but no relevant pattern sections.
- Scorecard context has criteria, approval state, and lock status, but no default weight rationale or override history.
- Attachment context has selected attachment ids but no uploaded file metadata, parsed summaries, or citations.
- RFP generation readiness is correctly blocked by missing Scope inputs and should not produce generated RFP content yet.

## 7. Validation Results

Commands run:

```bash
npx eslint src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

Results:

- ESLint: passed
- TypeScript: passed

## 8. Review Recommendation

Review should focus on:

- whether the 10 golden prompts are the right first validation set
- whether `pass` versus `defer` expectations are correct
- whether the fixture result type is sufficient for the future harness
- whether portfolio/context-builder gaps should be addressed before UI/chat work

Recommended next step after review:

- commit this fixture slice
- then create a narrow test harness around `validateSourceAgentValidationFixtures`
- still do not build chat UI, model calls, API routes, upload/parsing, or Source UI expansion

