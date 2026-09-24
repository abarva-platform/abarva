# 2026-09-24 Moves Deliverable Quality Contract

## Release ID

`2026-09-24-moves-deliverable-quality-contract`

## Status

`candidate`

## Plain-English Summary

This release candidate tightens generated Moves deliverables so visual quality checks only credit
content that was actually rendered. It also gives exhibit renderers typed data payloads so missing
or unsupported exhibit data is reported as a gap instead of being replaced by a generic diagram.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 PRODUCTS: Moves deliverable generation, preview, export, and quality assessment become
  stricter about visual evidence. No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, data-plane,
  or tenant data changes are included.

## Client Applicability

- All clients: Applies to generated Moves deliverables after the code path is adopted.
- Specific clients: None.
- Internal only: Status and measurement tooling are operator-facing.
- Public/demo only: None.
- Feature flag: None in this candidate.

## Changes Included

- Adds typed exhibit data payload support to the Moves deliverable render contract.
- Removes generic visual fallback behavior when an exhibit has no drawable data.
- Credits storyline deck exhibits only when the persisted artifact contains rendered visual markup
  inside the matching exhibit block.
- Adds optional authored `deckSlides` to the renderable artifact contract and makes PPTX output use
  authored slide messages, points, notes, and linked exhibit payloads when present.
- Removes an unused storyline PPTX renderer that could only draw placeholder exhibit boxes; the
  live generated-deliverable PPTX path remains the orchestrator renderer.
- Compresses the target-architecture, solution-design, and operating-model prose structures so
  visuals, work-split, decision-rights, component, data, control, and operability detail are carried
  by focused exhibits/tables instead of forced generated essays.
- Adds focused negative tests for label-only and out-of-scope exhibit markers.
- Adds a report-only golden-bar signal measurement runner over caller-provided artifact exports.
- Routes the reachable legacy engagement-deliverable fallback through central document-generation
  policy instead of a hardcoded small-model / 2,048-token call.
- Adds a status ledger under `docs/status/moves-deliverable-quality/STATUS.md`.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts --runInBand` — passed, 65/65 tests.
- `./node_modules/.bin/eslint src/lib/deliverables/orchestrator/persistence.ts src/lib/visual-system/storyline-deck.ts src/lib/deliverables/orchestrator/types.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/orchestrator/renderers.tsx src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__fixtures__/ams-rfp.ts` — passed.
- `./node_modules/.bin/eslint scripts/moves/measure-golden-bar-signals.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit -p tsconfig.json --pretty false` — passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts --runInBand` — passed, 37/37 tests.
- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/__tests__/legacy-generate-policy.test.ts --runInBand` — passed, 2/2 tests.
- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts src/lib/deliverables/__tests__/legacy-generate-policy.test.ts src/lib/visual-system/__tests__/storyline-deck.test.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts --runInBand` — passed, 122/122 tests.
- `./node_modules/.bin/jest --runTestsByPath src/lib/visual-system/__tests__/storyline-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — passed, 46/46 tests after removing the unused placeholder PPTX renderer.
- `npm run moves:measure-golden-bar-signals -- --input /tmp/moves-golden-bar-sample.json --out /tmp/moves-golden-bar-report.json --since-days 90` — passed on a local two-record sample; detected duplicate headings and unsupported quantified claims only on the in-window artifact.
- Generated artifact proof under `/tmp/moves-deliverable-quality-proof`: structured exhibit generated HTML/DOCX/PPTX with rendered visual content; missing-data exhibit did not appear in generated HTML/DOCX/PPTX and no rasterisation-failure notice was shipped.
- Authored-slide artifact proof under `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`: generated PPTX contained the authored governing message, authored support point, linked exhibit title, speaker notes, and suppressed section-derived slides.

## Rollout Plan

Open a PR for review. This candidate does not require data-plane migration, tenant data mutation,
or live artifact refresh. The brief for this lane explicitly excludes deployment work.

## Deployment Authority

- Repo-owned deploy workflow: Not requested for this candidate.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable unless a later approved merge/deploy occurs.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not in this candidate.

## Rollback Plan

Revert the PR to restore the previous exhibit render contract and quality-credit behavior. No
database, tenant data, migration, or runtime configuration rollback is required.

## Audit Evidence

- Focused Jest and targeted ESLint results listed above.
- Status ledger: `docs/status/moves-deliverable-quality/STATUS.md`.
- Golden-bar measurement script: `scripts/moves/measure-golden-bar-signals.ts`.
- Local artifact proof summary: `/tmp/moves-deliverable-quality-proof/proof-summary.json`.
- Local authored-slide proof summary: `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`.

## Known Gaps

This candidate applies section elasticity to Target Architecture, Solution Design, and Operating
Model only. It does not implement section elasticity across all remaining structures, legacy route
retirement, golden-bar enforcement, or model-judge calibration.
