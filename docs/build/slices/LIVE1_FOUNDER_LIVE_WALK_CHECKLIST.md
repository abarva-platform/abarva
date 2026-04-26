# LIVE1 - Founder Live Walk Checklist

Slice ID: LIVE1
Slice name: Founder Live Walk Checklist
Wave: wave-13
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane A (parallel build run)
Slice type: qa
Owner: qa
Branch: live/live1-founder-live-walk-checklist

## Goal

Land a deterministic, file-pure TypeScript library, Jest suite, and documentation that define a
step-by-step live demo checklist covering all major AbarVa surfaces. Each step includes: what to
click, what to say, what the audience should see, a fallback if the surface is blocked, and an
honest readiness caveat. The library is fully type-safe, has no network calls, no model calls, and
no side effects.

## Deliverables

### Created

- `src/lib/qa/founder-live-walk-checklist.ts` — TypeScript read model with `WalkStepStatus` type,
  `WalkStep` interface, `FounderLiveWalkChecklist` interface, and `buildFounderLiveWalkChecklist()`
  builder function returning 12 steps covering all major AbarVa surfaces.

- `src/__tests__/integration/qa/founder-live-walk-checklist.test.ts` — Jest integration test suite
  (deterministic, file-pure, no network, no model calls) verifying: valid checklist shape, exactly
  12 steps, `generatedAt` is `'2026-04-26'`, non-empty required fields on every step, valid
  `WalkStepStatus` values, unique step IDs, non-empty fallbacks and readiness caveats, and
  `totalSteps` equals `steps.length`.

- `docs/demo/FOUNDER_LIVE_WALK_CHECKLIST.md` — Human-readable markdown rendering of all 12 steps
  in table format with a final Demo Readiness Summary section and explicit caveats.

- `docs/build/slices/LIVE1_FOUNDER_LIVE_WALK_CHECKLIST.md` — This slice contract document.

### Updated

- `docs/build/build-slices.json` — LIVE1 entry appended.
- `docs/build/production-readiness.json` — note appended to `validation_qa.notes`.
- `docs/build/build-waves.json` — wave-13 created with LIVE1 in plannedSlices and completedSlices.

## Validation

1. `npx tsc --noEmit --pretty false` — clean (no TypeScript errors)
2. `npx jest src/__tests__/integration/qa/founder-live-walk-checklist.test.ts --no-coverage` — all pass
3. `npx eslint --max-warnings=0 src/lib/qa/founder-live-walk-checklist.ts src/__tests__/integration/qa/founder-live-walk-checklist.test.ts` — clean

## Scope

File-pure TypeScript library and documentation only. No application code changes, no UI
modifications, no migrations, no model calls, no production systems touched.

## Code complete: 2026-04-26

The following conditions are met for `code_complete`:

1. `buildFounderLiveWalkChecklist()` is exported and returns a fully typed `FounderLiveWalkChecklist`.
2. All 12 steps are present, covering: home, admin (x3), programs (x2), tower, intelligence (x2),
   source (x2), architecture.
3. Every step has non-empty id, route, surface, purpose, expectedQuestion, primaryAgent, whatToClick,
   whatToSay, expectedVisibleSignal, fallbackIfBlocked, readinessCaveat, and a valid status.
4. Jest suite passes with all assertions green; tests are deterministic and file-pure.
5. TypeScript compiles clean with `--noEmit`.
6. ESLint passes with `--max-warnings=0`.
7. Markdown documentation renders all 12 steps with a readiness summary section.
8. JSON manifests updated without status promotion.

## What is NOT claimed

- No production-readiness component status is promoted.
- No deployment occurred; this is library + documentation only.
- No live demo execution was performed; the checklist documents intended behavior.
- No external API, database, or Clerk authentication was called.
