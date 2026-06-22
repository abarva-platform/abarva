# 2026-06-22-moves-architecture-v2-ava-rendering — Moves architecture visuals and Ava response rendering

## Release ID

`2026-06-22-moves-architecture-v2-ava-rendering`

## Status

`candidate`

## Plain-English Summary

Completes the next shared step of the Moves deliverable redo: target-architecture artifacts now carry
the reasoning chain from current-state flow to gaps to target capability, render 13 visual exhibit
blocks with SVG diagrams and so-what captions, and pass truthful render-derived signals into the
quality gate. A governed reason-first DeliverablePlan pass now runs before the architecture visual
model for flagged architecture artifacts. Storyline decks also have a native PPTX renderer, and the
shared Ava chat shell can render compact markdown tables and response-window bar charts instead of
flattening every assistant answer into raw text.

## Layer Impact

- `global-control-lane`: shared deliverable model, renderer, generation schema, persistence quality
  wiring, and shared agent response rendering changed for all surfaces that use the shell.
- `experimental`: structured architecture generation remains governed by the existing
  `deliverable_structured_exhibits` and `deliverable_quality_contract` tenant flags.

## Client Applicability

- All clients: the shared architecture model/renderer and Ava response renderer are tenant-agnostic.
- Specific clients: none; First Capital remains a fixture-only proof model.
- Internal only: none.
- Public/demo only: none.
- Feature flag: architecture generation/rendering remains activated through existing deliverable
  feature flags; chat response rendering is shared shell behavior.

## Changes Included

- `src/lib/visual-system/architecture-model.ts` — ArchitectureModel v2 fields and validation.
- `src/lib/visual-system/architecture-html-renderer.ts` — 13 SVG-backed exhibit sections and
  render-derived contract signals.
- `src/lib/visual-system/architecture-generation.ts` — governed tool schema and prompt updated for
  v2 architecture output.
- `src/lib/deliverables/planning/deliverable-plan-generation.ts` — governed forced-output
  DeliverablePlan pass and validation for the current-to-gap-to-target chain.
- `src/lib/deliverables/orchestrator/generate-service.ts` — architecture artifacts generate the
  reason-first plan before the visual model and pass it into architecture generation context.
- `src/lib/deliverables/orchestrator/persistence.ts` — quality contract now receives truthful
  architecture render signals.
- `src/lib/visual-system/storyline-deck.ts` — native PPTX renderer and insight-headline validation
  for storyline decks.
- `src/components/shell/AgentColumn.tsx` and `src/lib/agent/response-parts.ts` — Ava responses render
  markdown tables and compact bar-chart directives.
- `src/app/api/chat/agent/route.ts` — chat doctrine permits compact tables and the narrow chart block
  while still banning raw SQL/JSON/id dumps.

## QA / Validation

- PASS: `npx jest src/lib/visual-system/__tests__/storyline-deck.test.ts src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/visual-system/__tests__/architecture-html-renderer.test.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts src/lib/agent/__tests__/response-parts.test.ts --runInBand` — 8 suites, 50 tests passed, including native PPTX buffer proof.
- PASS: `npx jest src/lib/source/agent-generation/__tests__ src/lib/source/stage-packs/__tests__/stage-packs.test.ts src/__tests__/integration/source/source-agent-missions.test.ts src/__tests__/integration/source/source-agent-mission-report.test.ts --runInBand` — 10 suites, 180 tests passed. Two stale Source mission expectations were aligned to the current Sentinel-owned data-readiness mission and 12-mission read model; no Source runtime code changed.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json` after refreshing local `node_modules` from the existing lockfile.
- PASS: `npx eslint src/` — 0 errors, existing repo warnings only.
- PASS: `npm run release:check`.
- PASS: `npm run audit:architecture-rules`.
- PASS: `git diff --check`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build` with local env sourced from the root checkout — production compile, TypeScript, page data collection, and static page generation completed.
- BLOCKED: local browser proof did not complete. The dev server started on `http://127.0.0.1:3020`, but the sourced local Clerk env produced an infinite token-refresh redirect loop before `/` reached DOM content. This blocks local signed-in Source/Intelligence/SkyHarbor browser proof and must be rerun in a valid authenticated environment or CI preview.

## Rollout Plan

Merge through the normal PR path. Architecture structured rendering is dark except for tenants already
enabled by existing feature flags. Ava response rendering becomes available anywhere the shared shell
agent column is used.

## Deployment Authority

- Repo-owned deploy workflow: normal main merge deploy path.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: no direct ACA mutation.
- Worker image invariant: no direct worker mutation.
- Feature/env flag update path: no flag changes in this PR.
- Live signed-in proof required: required before claiming SkyHarbor/client artifact readiness; not
  performed in this local implementation pass.

## Rollback Plan

Revert the PR. Existing deliverable flags provide an additional containment layer for structured
architecture generation; shared chat rendering reverts with the shell component.

## Audit Evidence

Local focused Jest output; Source mission slice output; TypeScript output; lint output; production build
output; release-check and architecture-audit outputs from this branch; browser-blocker server logs; PR
review once opened.

## Known Gaps

- Native PPTX rendering is proven at the model/native-renderer layer; full artifact download-route
  wiring remains follow-on work.
- Live SkyHarbor signed-in artifact proof remains follow-on work because local Clerk keys blocked
  browser route proof in this worktree.
- Source deterministic mission/read-model tests are green; Source signed-in browser crawler proof
  remains blocked by the same local Clerk issue.
