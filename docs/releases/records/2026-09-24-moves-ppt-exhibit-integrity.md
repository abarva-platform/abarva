# 2026-09-24-moves-ppt-exhibit-integrity — Moves PPT Exhibit Integrity

## Release ID

`2026-09-24-moves-ppt-exhibit-integrity`

## Status

`candidate`

## Plain-English Summary

Moves deliverable generation no longer creates placeholder exhibit slides merely because a profile lists required exhibits. A PowerPoint-oriented deliverable must now receive real, diagram-ready exhibit content from the synthesis pass; otherwise the existing quality gate surfaces the missing visual instead of producing a fake-complete deck. The PPT renderer also normalizes slide text consistently so a governing sentence is not repeated as a bullet when Markdown emphasis differs.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 PRODUCTS: Changes Moves generated deliverable assembly and PPT rendering behavior for client-facing artifact outputs.
- AI artifact generation: Updates the synthesis prompt schema so model output includes exhibit content that is specific enough for diagrams, rather than only document prose.

## Client Applicability

- All clients: Applies to all Moves deliverables generated through the orchestrated artifact path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing deliverable-generation and quality-gate paths.

## Changes Included

- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/orchestrator/prompt-builder.ts`
- `src/lib/deliverables/orchestrator/renderers.tsx`
- `src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts`
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts src/lib/visual-system/__tests__/storyline-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — passed, 70 tests.
- `npm run typecheck` — passed.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow will build and deploy the web image. No migration, data load, feature flag change, registry activation, or tenant data mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Yes, main merge deploy.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Moves deliverable generation should be smoke-tested before claiming product-visible behavior.

## Rollback Plan

Revert the PR and let the repo-owned deploy workflow roll the application image back through the normal main deployment path. No data rollback is required.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks for the PR.
- ACA deploy run and runtime invariant after merge.

## Known Gaps

This change blocks fake-complete exhibit slides and preserves model-authored exhibit intent, but it does not yet replace every PPT layout with bespoke consulting-grade slide design. A follow-on quality pass should evaluate generated slide screenshots against the deck design standard.
