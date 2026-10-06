# 2026-10-05-discovery-blueprint-catalog-declare — Discovery blueprints: catalog + declared archetype wins

## Release ID

`2026-10-05-discovery-blueprint-catalog-declare`

## Status

`candidate`

## Plain-English Summary

The discovery blueprint (what evidence a Move must gather, who to interview) was
selected purely by **keyword inference** over a Move's text. That mis-routes:
a governed data-foundation Move whose text mentions clinical/claims terms was
classified as a contact-center agent-assist Move, so it demanded the wrong
evidence families. It also made the system rigid — every new industry/client
scenario needed a new hardcoded blueprint plus a new matcher branch.

This change does two things, keeping the design deliberately lightweight:

1. **Identity is declared, never inferred.** A Move can declare its archetype,
   and a declared archetype that matches a known blueprint **wins outright**.
   Keyword inference remains only as a fallback suggestion when nothing is
   declared (a stale/unknown declaration falls through to inference rather than
   mis-selecting). This is the data-operating-model rule applied to archetype
   resolution.
2. **Blueprints become a catalog.** All blueprints live in a single
   `DISCOVERY_BLUEPRINT_CATALOG` keyed by archetype id — the extensibility seam
   a deploying firm configures against (today in code; structured to move to
   DB/config + a setup UI later) so adding an industry is a catalog entry, not a
   matcher branch. The first new entry, **Governed Data Foundation for AI / LLM
   Automation**, is added with data-governance families (governance ownership,
   semantic layer, lineage/audit, data quality, platform readiness, identity
   resolution, privacy/security, responsible-AI, measurement, finance baseline).

Backward-compatible by construction: a Move with no declared archetype resolves
exactly as before.

## Layer Impact

Release lane: `global-control-lane` — shared discovery-blueprint resolution for
all clients. Behavior is unchanged for undeclared Moves; declaration only *wins*
when it exactly matches a catalog archetype id.

- `3 CANONICAL MODEL` / archetype resolution: `getDiscoveryBlueprint` now honors
  a declared archetype id via the catalog before falling back to inference;
  `buildDiscoveryBlueprintInputFromProgram` is split so the declared id is read
  separately (not blended into the inference text) and passed through.
- `4 PRODUCTS` (Moves): the readiness view and the artifact-upload family
  resolution both resolve the declared blueprint, so a correctly-declared Move
  gets the right evidence families.

## Client Applicability

- All clients: resolution change applies wherever a Move declares an archetype;
  undeclared Moves are unaffected.
- Specific clients: none targeted by this change (declaring a specific Move to
  the new archetype is a separate data-plane change).
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — the change is additive and backward-compatible (a
  declaration only wins on an exact catalog match).

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` — add the
  `GOVERNED_DATA_FOUNDATION` blueprint; `DISCOVERY_BLUEPRINT_CATALOG`;
  `resolveDeclaredDiscoveryBlueprint` + id normalization; `getDiscoveryBlueprint`
  gains a `declaredArchetypeId` param and declared-precedence;
  `suggestionKeywords` added to the blueprint type (setup-time hint only).
- `src/lib/programs/discovery/evidence-readiness.ts` — `resolveDeclaredProgramArchetypeId`
  reads the declared id; `loadDiscoveryEvidenceReadiness` passes it through;
  `buildDiscoveryBlueprintInputFromProgram` reuses the shared helper.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts` — resolves the
  declared blueprint for upload family resolution.
- `src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-catalog.test.ts`
  — declared-wins, normalization, unknown-declaration fallback, catalog
  integrity, and unchanged-inference cases (wired via the already-run
  orchestrator `__tests__` CI path).

## QA / Validation

- `jest` (new catalog suite) — **PASS**: 7/7 (declared-wins, normalization,
  fallback, catalog integrity, unchanged inference).
- `jest` (regression: `evidence-readiness`, `discovery-plan`) — **PASS**: 28/28.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors.
- `audit:test-ci-coverage:check` — **PASS**: census refreshed; new suite is
  CI-covered.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag; undeclared Moves unchanged on
merge. Declaring a specific Move to an archetype, and loading evidence against
its families, are separate data-plane changes.

## Rollback Plan

Revert the PR. The change is additive (new catalog entry + a declared-precedence
branch); reverting restores pure keyword inference with no data or migration
impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- This lands the catalog + declared-wins seam in code. Moving the catalog to
  DB/config and a setup UI (so a deploying firm configures archetypes without
  code), and a `suggestDiscoveryArchetypes` helper that reads `suggestionKeywords`,
  are deliberate follow-ups, not in this pass.
- Declaring the demo Move to `governed_data_foundation` and building
  policy-compliant synthetic evidence (loaded pending, human-approved) against
  its families is the next, separate data-plane step.
- No signed-in visual proof (not possible off the private data plane here).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- Declared-wins and unchanged-inference equivalence are covered by
  `discovery-blueprint-catalog.test.ts`.
