# 2026-06-10-source-runtime-wiring-step1 — Event→archetype resolver + run audit plan

## Release ID

`2026-06-10-source-runtime-wiring-step1`

## Status

`candidate`

## Plain-English Summary

The Source Event Archetype Framework merged in PR #3374 but was dormant — nothing
in the live runtime could turn a real sourcing event into one of the archetypes.
This change adds the **keystone bridge**: a pure resolver that maps the live
classifier's category (`ams`, `data_ai_platform`, `saas_renewal`, …) to a shipped
archetype, and refuses (rather than guessing) for categories that have no
archetype yet. It also adds the **step-by-step audit plan** that will govern an
upcoming real end-to-end Source run: every spine step has explicit gate criteria
that must all pass before proceeding.

No live request path is changed yet. The resolver is the foundation the remaining
call-site wiring will build on, one audited step at a time, during the real run.

## Layer Impact

- `global-control-lane`: additive pure module `event-archetype-resolver.ts` under
  `src/lib/source/archetypes/`. No runtime call-site references it yet.
- Docs: run audit plan under `docs/source/`.

## Client Applicability

- All clients: not yet (no runtime exposure).
- Specific clients: SkyHarbor named as the recommended first real run only.
- Internal only: this PR.
- Feature flag: none.

## Changes Included

- `src/lib/source/archetypes/event-archetype-resolver.ts` — category/event_type → archetype, explicit + refusing.
- `src/lib/source/archetypes/index.ts` — export the resolver.
- `src/lib/source/archetypes/__tests__/event-archetype-resolver.test.ts` — 9 tests.
- `docs/source/SOURCE_END_TO_END_RUN_AUDIT_PLAN.md` — per-step gate criteria for the real run.

## QA / Validation

- `npx jest src/lib/source/archetypes/` → **61 passed, 7 suites** (9 new).
- `npx tsc --noEmit` → clean in module.
- `npx eslint src/lib/source/archetypes/` → clean.
- `npm run audit:architecture-rules` → 0 violations.

## Rollout Plan

Merge to `main` via squash. No runtime rollout — dormant until the live ask-route
wiring is done step-by-step in the real run.

## Rollback Plan

Revert the squash commit. No runtime call-site references the module, so revert is
pure code removal with zero data/live-path impact.

## Audit Evidence

- This PR; jest output (61 passing); arch-rules JSON (0 violations).
- `docs/source/SOURCE_END_TO_END_RUN_AUDIT_PLAN.md`.

## Known Gaps

- 3 of 8 live categories have a shipped archetype (`ams`, `data_ai_platform`,
  `saas_renewal`); the other 5 refuse by design until shipped.
- Live call-site wiring (readiness→real EvidenceStateMap; `source-answer-engine`
  confidence→governed; `buildGroundedSourceAnswer` on the ask route; artifact
  quality gate) is NOT done — it is sequenced into the real run, audited per step.
