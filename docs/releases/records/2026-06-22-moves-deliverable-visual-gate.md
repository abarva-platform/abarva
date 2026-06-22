# 2026-06-22-moves-deliverable-visual-gate — Moves Deliverables Must Render Real Visuals

## Release ID

`2026-06-22-moves-deliverable-visual-gate`

## Status

`candidate`

## Plain-English Summary

Moves deliverables can no longer pass as client-ready when an architecture or solution artifact merely
mentions diagrams but saves a prose-only artifact. Architecture-family artifacts now preserve the
profile-rendered visual HTML, inspect the final saved HTML for real diagram sections, and quarantine
visual-required outputs when the visuals are missing. Narrative HTML deliverables also render declared
exhibits as visible SVG-backed exhibit blocks instead of ignoring the exhibit metadata.

## Layer Impact

- `global-control-lane`: shared deliverable persistence, HTML rendering, profile gates, and quality
  tests changed for the Moves deliverable pipeline.
- `experimental`: structured architecture rendering is still produced through the existing structured
  exhibit path, but visual-required architecture/solution artifacts now hard-quarantine if the final
  artifact is prose-only.

## Client Applicability

- All clients: any tenant using Moves deliverable generation receives the safer render/quality gate.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing structured-exhibit generation remains flag-controlled; the missing-visual
  quarantine applies to visual-required profiles.

## Changes Included

- `src/lib/deliverables/orchestrator/persistence.ts` — preserves architecture-profile HTML from deck
  overwrite, derives quality signals from the final saved HTML, and hard-quarantines visual-required
  prose-only artifacts.
- `src/lib/deliverables/orchestrator/renderers.ts` — renders declared narrative exhibits as visible
  SVG-backed exhibit blocks alongside tables.
- `src/lib/deliverables/profiles/registry.ts` — marks Solution Design as a visual-renderer-required
  architecture-family profile.
- `src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts` and
  `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — regression coverage for prose-only
  quarantine, deck-overwrite prevention, and visible SVG exhibit output.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand` — 2 suites, 13 tests passed.
- PASS: `npx jest src/lib/visual-system/__tests__/architecture-html-renderer.test.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand` — 3 suites, 25 tests passed.
- PASS: `npx eslint src/lib/deliverables/orchestrator/persistence.ts src/lib/deliverables/orchestrator/renderers.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/profiles/registry.ts`.
- BLOCKED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json` hit existing
  repo dependency/type gaps outside this patch: missing `js-yaml` declarations, missing
  `@azure-rest/ai-document-intelligence`, and missing `@axe-core/playwright` types.

## Rollout Plan

Merge through the normal PR path, then deploy through the repo-owned production deploy workflow. After
deployment, rerun a SkyHarbor canary Move and inspect the persisted architecture/solution artifacts for
actual SVG/HTML visuals before calling the deliverable-quality objective complete.

## Deployment Authority

- Repo-owned deploy workflow: normal main merge deploy path.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable before deploy.
- ACA runtime invariant: no direct ACA mutation.
- Worker image invariant: no direct worker mutation.
- Feature/env flag update path: no flag changes in this PR.
- Live signed-in proof required: yes, before claiming SkyHarbor production-lab artifact quality is fixed.

## Rollback Plan

Revert the PR. Existing artifact records remain available; new generation would return to the prior
behavior where missing visuals could be observe-only unless the broader quality flag blocked them.

## Audit Evidence

Focused Jest output, architecture visual-gate Jest output, changed-file ESLint output, TypeScript
output, release check output, PR review/CI once opened, and post-deploy SkyHarbor canary artifact proof.

## Known Gaps

This patch fixes rendered visual presence and visual-required architecture/solution gating. It does not
yet add finance-grade chart generation for Business Case or a dedicated sourcing funnel/chart renderer;
those remain follow-on renderer/profile work after this blocking visual-slip defect is closed.
