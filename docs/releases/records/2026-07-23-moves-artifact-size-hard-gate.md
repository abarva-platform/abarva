# 2026-07-23-moves-artifact-size-hard-gate — Moves Artifact Size Hard Gate

## Release ID

`2026-07-23-moves-artifact-size-hard-gate`

## Status

`candidate`

## Plain-English Summary

Moves generated documents now treat the phase-close artifact size band as a real
quality gate for sponsor decision documents. The live First Capital sandbox run
proved P4/P5 documents could pass quality while becoming far too long for
executive use. This release keeps the existing generator and evidence controls,
but changes the affected Moves artifact profiles so oversized roadmap,
business-case, financial-model, value-model, handoff, and value-measurement
documents block export instead of receiving only a warning.

## Layer Impact

- `global-control-lane`: shared Moves document-quality behavior changes for all
  tenants using the governed deliverable orchestrator.
- No schema, migration, data-load, candidate-promotion, or tenant-ingestion
  behavior changes.

## Client Applicability

- All clients: yes, for Moves generated deliverables routed through the
  orchestrator quality bar.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is a quality-control tightening.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-bar-registry.ts`
  - `business_case`, `roadmap`, and `handoff_pack` now enforce their maximum word
    ceilings as blockers.
  - Added hard size profiles for `estimate_model`, `value_model`, and
    `value_measurement_contract`.
- `src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`
  validates the phase-close hard ceilings.
- `src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts`
  proves oversized Moves artifacts now fail instead of passing as board-ready.

## QA / Validation

- Focused Jest:
  `npx jest src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand`
  - Passed: 2 suites, 28 tests.
  - Known pre-existing warning: duplicate Jest manual mock names.
- Broader validation to be captured before release:
  - `npx eslint ...`
  - `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  - `npm run release:check`
  - `git diff --check`

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and
deploys the new image. Verify the ACA runtime invariant before claiming the
quality gate is live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no user-data mutation required for this control
  change; runtime invariant plus tests are sufficient unless a later smoke uses a
  disposable Move.

## Rollback Plan

Revert the PR or temporarily restore the affected artifact profiles to
warning-only ceilings. No data rollback is required because this release changes
quality evaluation behavior only.

## Audit Evidence

- PR URL: pending.
- Focused Jest result: passed locally in
  `/private/tmp/nexus-moves-artifact-size-guard`.
- Triggering proof: First Capital sandbox P4/P5 run showed
  `execution_roadmap` at 21,825 words against an 11,000-word ceiling and
  `business_case` at 19,030 words against a 9,500-word ceiling while still
  passing quality.

## Known Gaps

- This release blocks oversized artifacts; it does not itself rewrite the
  generated artifact prompts or regenerate the earlier oversized sandbox outputs.
- Target-state architecture and discovery report remain warning-only on the
  ceiling because they are intentionally deeper analytical artifacts.
