# PROD2 - Production Readiness Tracker Update Rules and Validator

Slice ID: PROD2
Slice name: Production Readiness Tracker Update Rules and Validator
Status: code_complete
Authored: 2026-04-25
Primary agent: Lane C (parallel build pack)
Depends on: PROD1

## Purpose

PROD2 lands the deterministic, file-pure validator that enforces the
canonical structure, status discipline, and honesty rules of
`docs/build/production-readiness.json`. It also extends
`docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md` with three new
sections that define how every multi-lane build pack must update the
tracker, how parallel-lane conflicts on the manifest are resolved, and
how the validator is used.

PROD2 is the read-only enforcement companion to PROD1. It does not
mutate the manifest, does not call any external service, does not
poll Vercel, does not call Claude or OpenAI, and does not implement
any UI. It is a pure deterministic library plus a typed integration
test plus three protocol appendices.

## What Changed

- New module
  [src/lib/admin/production-readiness-validator.ts](../../../src/lib/admin/production-readiness-validator.ts):
  - Public types: `ProductionReadinessValidationSeverity`,
    `ProductionReadinessValidationFinding`,
    `ProductionReadinessValidationResult`,
    `ProductionReadinessValidationRule`.
  - Public constants:
    `PRODUCTION_READINESS_VALIDATION_RULES` (canonical, ordered).
  - Public helpers: `validateProductionReadinessManifest`,
    `validateProductionReadinessComponent`,
    `summarizeProductionReadinessValidation`.
  - Imports only canonical types and constants from
    `@/lib/admin/production-readiness`. No imports from
    `@/lib/source`, `@/lib/nexus`, `@/lib/sentinel`, `@/lib/atlas`,
    `@/lib/agent`, `@/lib/auth`, or supabase.
  - No `Date.now`, `Math.random`, `new Date(`, `fetch(`, anthropic,
    openai, useState, useEffect, "Coming soon", "TBD", or
    "Lorem ipsum".

- Twelve canonical rules enforced today, in canonical order:
  1. `manifest_parses` - input is a structurally valid manifest object.
  2. `all_required_components_exist` - every component id in
     `PRODUCTION_READINESS_COMPONENT_IDS` is present.
  3. `all_statuses_valid` - every component, dimension, and gate
     status is in its canonical enum.
  4. `all_dimensions_present` - every component records every
     readiness dimension.
  5. `all_testing_gates_present` - every component records every
     testing gate.
  6. `production_ready_requires_all_gates_pass` - if a component is
     `production_ready`, every testing gate must be `passing`.
  7. `pilot_ready_requires_route_smoke_or_persona_walk` - if a
     component is `pilot_ready`, at least one of `route_smoke` or
     `live_persona_walk` must have progressed past `not_started`.
  8. `every_component_has_next_action` - every component has a
     non-empty `nextAction`.
  9. `every_blocker_has_severity_and_description` - every blocker
     records a canonical severity and a non-empty description.
  10. `no_live_monitoring_claim_unless_source_says_live` - the
      manifest does not claim live monitoring, live observability, or
      a live dashboard unless `manifest.source` declares live or CI
      evidence. Explicit negations such as "no live monitoring" are
      allowed.
  11. `overall_readiness_percent_within_planned_range` - the manifest's
      `overallReadinessPercent` is within the `production_readiness`
      indicator's `percentLow` and `percentHigh` range.
  12. `maturity_snapshot_present` - the manifest's `maturitySnapshot`
      exists with non-empty `indicators` and `areas`.

- New tests
  [src/__tests__/integration/admin/production-readiness-validator.test.ts](../../../src/__tests__/integration/admin/production-readiness-validator.test.ts):
  - The validator returns `passed: true` on the real
    `production-readiness.json` manifest loaded via
    `loadProductionReadinessManifest()`.
  - Each canonical rule has at least one negative test case that
    mutates a deep clone of the real manifest and asserts the
    matching finding is produced.
  - Rule coverage check: every rule id in
    `PRODUCTION_READINESS_VALIDATION_RULES` appears at least once in
    the test file.
  - Module hygiene check: validator source has no forbidden imports,
    no model/API calls, no non-deterministic clocks, no React hooks,
    and no placeholder language.

- Protocol update
  [docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md](../PRODUCTION_READINESS_UPDATE_PROTOCOL.md)
  appends three new sections without removing any prior content:
  - §H Mandatory tracker update on every batch.
  - §I Parallel-lane conflict policy.
  - §J Validator usage (PROD2).

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  PROD2 entry with status `code_complete`, risk `low`,
  `dependsOn: ['PROD1']`, the five-file allowlist, the standard
  forbidden-files list, and bumps `lastUpdated`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa` notes append a line acknowledging that PROD2
    adds a deterministic validator with twelve canonical rules and
    a passing integration test, while CI wiring is still deferred.
    `nextAction` is updated to mention CI integration is deferred.
  - `production_deployment` notes append a line acknowledging that
    the protocol now mandates a tracker update per pack and defines
    a parallel-lane conflict policy for cherry-pick integration.
  - No component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are unchanged.
  - `lastUpdated` is bumped to the slice authorship date.

## Why It Is Safe

- The validator is pure and deterministic: it reads the manifest
  passed in by the caller, walks structural fields, and returns a
  finding list. It performs no I/O, no network calls, no clock
  reads, and no random calls.
- The validator never mutates the manifest. The integration test
  uses `JSON.parse(JSON.stringify(...))` deep clones for negative
  cases, so the real manifest is preserved.
- The protocol additions are append-only. No prior protocol section
  is removed or rewritten.
- The manifest update is append-only at the note level and does not
  promote any component status. PROD2 deliberately leaves
  `validation_qa` at `tested` and `production_deployment` at
  `blocked`.
- The slice depends on PROD1 only. It does not import or reference
  any product runtime module.

## How To Re-Run

1. Run TypeScript:
   `npx tsc --noEmit --pretty false`
2. Run validator integration test:
   `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts`
3. Run the existing tracker integration test to confirm no
   regression: `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts`
4. Run the production build:
   `npm run build`
5. Re-parse manifest and slice JSON files:
   `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`

## What Is Explicitly Out Of Scope

- The validator does not enforce semantic readiness rules beyond
  status, dimension, gate, blocker, and snapshot shape. It does not
  judge whether a recorded gate evidence string is truthful.
- The validator does not call any model, run any agent, or read any
  external system. It is a deterministic schema + status linter.
- PROD2 does not wire the validator into CI. A later slice will add
  a GitHub Action and a Vercel deploy gate.
- PROD2 does not promote any component. `validation_qa` remains
  `tested`, not `pilot_ready` or `production_ready`. The
  introduction of a validator is implementation evidence, not
  runtime evidence.
- PROD2 does not change auth, migrations, supabase, or any product
  UI route.

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa`, `production_deployment`.
- Readiness/status changes: none. `validation_qa` stays `tested`.
  `production_deployment` stays `blocked`.
- Blockers added or removed: none.
- `nextAction` updated: `validation_qa` only, to call out CI
  integration as deferred.
- Notes added: one line per touched component recording the PROD2
  validator landing and the protocol update for tracker mandates and
  parallel-lane conflict policy.
