# 2026-10-05-discovery-blueprint-config-loader — Discovery blueprint config contract + loader (Phase 2)

## Release ID

`2026-10-05-discovery-blueprint-config-loader`

## Status

`candidate`

## Plain-English Summary

Phase 2 of the configurable archetype layer. Phase 1 made the blueprint catalog
a keyed data structure and let a declared archetype win. This adds the
**validated config contract** and a loader, so the catalog can be sourced from
configuration — a JSON file today, a database table or a setup UI later —
instead of only hardcoded code.

- A Zod schema defines exactly what a blueprint must look like (ids snake_case,
  at least one evidence family with unique ids, an interview roster, optional
  suggestion keywords).
- `loadDiscoveryBlueprintCatalog(configuredSource?)` overlays a validated
  configured source on top of the built-in seed: a configured entry with a new
  id **adds** an archetype; one matching a seed id **overrides** it. A source
  that fails validation is **rejected whole** — the seed is returned unchanged
  and the errors are surfaced — so a malformed config can never leave the
  product with a partial or empty catalog.
- `validateBuiltInDiscoveryBlueprintCatalog()` checks the seed itself against
  the contract.

This is the seam the data-plane will plug a DB/config source into (separate
step); nothing in this change reads an external source yet, so behavior is
unchanged.

## Layer Impact

Release lane: `global-control-lane` — shared orchestrator contract + loader. No
runtime behavior change: no caller loads an external source yet.

- `3 CANONICAL MODEL` / archetype layer: additive. A validated catalog contract
  (`DiscoveryBlueprintSchema`) + a loader that overlays configured blueprints on
  the built-in seed, with whole-source rejection on invalid config.

## Client Applicability

- All clients: the contract + loader are available; no runtime source is wired,
  so no client-visible change.
- Specific clients: none.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — additive; no caller reads an external source yet.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` — Zod
  schemas (`EvidenceFamilySchema`, `InterviewRoleSchema`,
  `DiscoveryBlueprintSchema`, catalog schema), `loadDiscoveryBlueprintCatalog`,
  and `validateBuiltInDiscoveryBlueprintCatalog`, co-located with the catalog
  they govern (a reachable module, so no orphan `src/lib` module).
- `src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-config.test.ts`
  — seed validates, overlay-add, overlay-override, whole-source rejection on
  invalid config, and family-id uniqueness (CI-wired path).

## QA / Validation

- `jest` (config suite) — **PASS**: 6/6.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors.
- `audit:test-ci-coverage:check` — **PASS**: census refreshed; new suite
  CI-covered.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag; no runtime change — the loader
has no external source wired yet.

## Rollback Plan

Revert the PR. The change is additive (schema/loader added to an existing module + new tests); reverting
removes the contract/loader with no data, migration, or behavior impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- No external source is wired yet. Pointing the loader at a DB table / config
  file and populating it (manifest-governed) is the data-plane follow-on.
- Phase 3 (reusable family library + composition) is the next increment in this
  lane.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- Whole-source rejection and seed preservation are covered by
  `discovery-blueprint-config.test.ts`.
