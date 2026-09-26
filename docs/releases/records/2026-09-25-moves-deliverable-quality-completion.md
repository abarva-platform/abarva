# 2026-09-25-moves-deliverable-quality-completion — Complete compact deliverable contracts

## Release ID

`2026-09-25-moves-deliverable-quality-completion`

## Status

`candidate`

## Plain-English Summary

This release completes the deterministic deliverable-quality cleanup started by the prior Moves
quality slice. Every shared deliverable structure is now capped at seven sections, Moves quality-bar
section floors now match required sections instead of re-mandating optional headings, and fixed
section structures still receive use-case-specific exhibits and tables so compact documents do not
become generic.

The release keeps the golden-exemplar gate honest: no model judge is marked ready until
human-curated exemplars exist.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates generated-deliverable contracts, artifact briefs, and quality gates for
  Moves and Source deliverables. No canonical data, tenant intake, source adapters, or data-plane
  state changes are included.

## Client Applicability

- All clients: Applies to generated deliverable contracts wherever this product runtime is used.
- Specific clients: None.
- Internal only: The exemplar audit remains an internal quality-control report.
- Public/demo only: Not specific to public demo flows.
- Feature flag: None.

## Changes Included

- Compresses the remaining over-sectioned deliverable structures, including Charter, Roadmap,
  Discovery Report, Estimate Model, Value Model, Mobilization Plan, Executive Playback, Source
  Sourcing Strategy Memo, and Source Executive Recommendation.
- Keeps fixed section structures fixed for section shape while restoring archetype-specific
  exhibits and tables in the composed artifact brief.
- Aligns quality-bar `minSections` floors to required sections for the remaining compact Moves
  artifacts.
- Updates Charter preflight, shared Charter contract, fallback section generation, and regression
  tests to the seven-section Charter contract.
- Adds regression coverage that no shared deliverable structure exceeds seven sections and that
  Moves quality floors follow required-section counts.

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/generation-plan.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/shared/__tests__/artifact-contracts.test.ts src/lib/programs/__tests__/charter-preflight.test.ts src/lib/programs/deliverables/orchestrated/__tests__/quality-bar-wiring.test.ts --runInBand` — 115/115 tests passed.
- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts src/lib/deliverables/__tests__/legacy-generate-policy.test.ts src/lib/visual-system/__tests__/storyline-deck.test.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts scripts/moves/__tests__/audit-golden-exemplars.test.ts --runInBand` — 176/176 tests passed.
- Pass: `NODE_OPTIONS='--require ./src/scripts/_mock-server-only-preload.cjs' ./node_modules/.bin/tsx -e "..."` structural check — every shared deliverable structure is at or below seven sections; every Moves quality-bar floor equals the required-section count.
- Pass with expected gap: `npm run moves:audit-golden-exemplars -- --out /tmp/moves-golden-exemplar-coverage-after-8473.json` — report generated; 0/20 human-approved exemplars complete, `readyForJudge=false`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may rebuild the runtime after
merge; no separate data build, migration, feature flag, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed if triggered by merge to main.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds an image.
- ACA runtime invariant: Standard post-deploy invariant if a web deploy is triggered.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-data proof required; this is generated-deliverable
  contract logic. A smoke generation can be run separately if desired.

## Rollback Plan

Revert the PR. Rollback restores the prior deliverable structure counts, brief composition behavior,
and quality-bar section floors. No migration rollback is required.

## Audit Evidence

- PR and CI evidence to be attached when opened.
- Local focused test output listed above.
- Exemplar coverage report: `/tmp/moves-golden-exemplar-coverage-after-8473.json`.

## Known Gaps

Human-curated golden exemplars remain incomplete. The code now makes the gap machine-readable and
keeps `readyForJudge=false`; it does not fabricate approvals or generated exemplars.
