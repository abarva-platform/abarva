# 2026-05-30 · Atlas composition — IAC + initiative deep view

## Release ID

`2026-05-30-atlas-composition-iac-and-deep-view`

## Status

candidate

## Plain-English Summary

Atlas now has a deterministic composition bridge between tenant initiative facts and the Initiative-Archetype Corpus. When a user asks about a specific initiative, an industry archetype, or a comparison between the two, Atlas classifies the prompt before the LLM call, retrieves the tenant-scoped initiative deep view, resolves the IAC archetype through a category-to-archetype map when needed, and supplies a preassembled answer block to the prompt.

Hybrid answers use the required four-section structure: `Your data`, `Industry context`, `The gap`, `Next move`.

## Layer Impact

- `runtime-app-lane`: Atlas prompt assembly now receives a deterministic IAC/deep-view context block when the user asks initiative, archetype, or hybrid questions.
- `architecture-lane`: adds `src/lib/atlas/composition/` for intent classification, category mapping, and deterministic composition.
- `qa-validation-lane`: adds category-map validation, intent-classifier tests, a four-section parser test, tenant-scoping invariant coverage, and six golden snapshots across Apex Retail and Meridian Health.
- `data-plane-lane`: no schema or migration changes. All tenant facts still come from `getInitiativeDeepView`, which enforces `client_id` scoping.

## Client Applicability

- All clients: yes.
- Specific clients: Apex Retail and Meridian Health are covered in golden tests.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/composition/category-archetype-map.ts` — typed `CAT-NN` to registered IAC archetype-key map.
- `src/lib/atlas/composition/intent.ts` — deterministic classifier for initiative-specific, archetype-specific, and hybrid prompts.
- `src/lib/atlas/composition/compose.ts` — deterministic composition for initiative, archetype, and four-section hybrid answers.
- `src/lib/agent/retrieval.ts` and `src/lib/agent/retrieval-format.ts` — carry and render the Atlas IAC composition block inside retrieved context.
- `src/lib/atlas/llm.ts` — passes Atlas tenancy into retrieval so the composition block is available before the LLM call.
- Tests under `src/lib/atlas/composition/__tests__/`.

## QA / Validation

- PASS — `npx jest src/lib/atlas/composition --runInBand -u`
- PASS — `npx jest src/lib/atlas/iac src/lib/atlas/composition --runInBand`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npx eslint src/lib/atlas/composition src/lib/agent/retrieval.ts src/lib/agent/retrieval-format.ts src/lib/atlas/llm.ts`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main. The change is active in Atlas prompt assembly immediately. It does not alter database schema, ingestion, or tenant data.

## Rollback Plan

Revert this PR. That removes the composition helpers, retrieval-context wiring, tests, and this release record. Atlas falls back to the existing retrieval context path.

## Audit Evidence

- The category map test validates that every mapped value resolves through `getArchetype()`.
- The tenant-scoping test asks for Meridian's initiative under Apex tenancy and asserts the honest "no such initiative in your scope" response without Meridian content.
- Golden snapshots cover two initiative-specific prompts, two archetype-specific prompts, and two hybrid prompts across Apex Retail and Meridian Health.

## Known Gaps

- Name-only initiative lookup without an initiative id is intentionally conservative in this slice. Atlas classifies those prompts, but deep retrieval requires the initiative id unless a future search helper maps names to ids under tenant scope.
