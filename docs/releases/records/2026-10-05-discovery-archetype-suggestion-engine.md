# 2026-10-05-discovery-archetype-suggestion-engine — Discovery archetype suggestion engine (Phase 1)

## Release ID

`2026-10-05-discovery-archetype-suggestion-engine`

## Status

`candidate`

## Plain-English Summary

Phase 1 of the configurable archetype layer. With the catalog + declared-wins
resolver in place, this adds the setup-time **suggestion** engine:
`suggestDiscoveryArchetypes(text)` ranks the catalog's archetypes by how well
their keywords match a Move's text, so an origination or setup flow can *propose*
an archetype for a human to confirm and declare ("this looks like Data Foundation
— use it?"). It is a hint, never authority: resolution still honors the declared
archetype, and nothing is selected without a human declaring it. The general
default is never suggested, and empty/no-signal text returns nothing.

To make the engine cover the whole catalog, the three existing blueprints get
`suggestionKeywords` (derived from their current matcher regexes). Runtime
inference is untouched — these keywords feed only the suggestion path.

## Layer Impact

Release lane: `global-control-lane` — shared orchestrator catalog metadata + a
new pure suggestion function. No resolution behavior changes.

- `3 CANONICAL MODEL` / archetype layer: additive. `suggestDiscoveryArchetypes`
  reads `DISCOVERY_BLUEPRINT_CATALOG` + `suggestionKeywords`; no caller's
  resolution path changes.

## Client Applicability

- All clients: the suggestion helper is available to setup/origination surfaces;
  it changes no runtime resolution on its own.
- Specific clients: none.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — pure addition; resolution behavior unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` —
  `suggestDiscoveryArchetypes` + `DiscoveryArchetypeSuggestion`; backfill
  `suggestionKeywords` on the three existing non-default blueprints (derived
  from their current matcher regexes).
- `src/lib/deliverables/orchestrator/__tests__/discovery-archetype-suggest.test.ts`
  — ranking, default-never-suggested, empty input, limit, and the
  "suggestion is a hint, not authority" property (CI-wired path).

## QA / Validation

- `jest` (suggestion suite) — **PASS**: 6/6.
- `jest` (catalog + regression: `discovery-blueprint-catalog`,
  `evidence-readiness`, `discovery-plan`) — **PASS**: 35/35.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors.
- `audit:test-ci-coverage:check` — **PASS**: census refreshed; new suite
  CI-covered.

## Rollout Plan

Merge to `main` via squash PR after the catalog + declared-wins change
(`2026-10-05-discovery-blueprint-catalog-declare`) lands, so this builds on the
catalog. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. No flag; no runtime resolution change on merge.

## Rollback Plan

Revert the PR. The change is additive (a new function + keyword metadata);
reverting removes the suggestion helper with no data, migration, or resolution
impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- The suggestion is not yet surfaced in an origination/setup UI (next Phase 1
  increment, coordinated with the declared-`archetypeId` persistence in the
  data-plane lane).
- Catalog → DB/config (Phase 2) and the reusable family library (Phase 3) are
  the follow-on increments.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- The hint-not-authority property is covered by
  `discovery-archetype-suggest.test.ts`.
