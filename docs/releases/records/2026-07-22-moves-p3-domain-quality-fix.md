# 2026-07-22-moves-p3-domain-quality-fix — Moves P3 Domain Binding and Architecture Prompt Quality

## Release ID

`2026-07-22-moves-p3-domain-quality-fix`

## Status

`candidate`

## Plain-English Summary

Moves P3 generation now distinguishes financial-services commercial-lending Agent Assist from healthcare contact-center Agent Assist, and the P3 target-state architecture brief no longer seeds unrelated AP/payment example language into non-AP Moves. The P3 architecture prompt now explicitly asks for conceptual, logical, and physical architecture sections plus a visible evidence-to-design story spine.

## Layer Impact

- `global-control-lane`: updates shared Strategic Moves discovery-blueprint resolution and deliverable prompt construction.
- `client-data-lane`: no data migration, no tenant data load, and no candidate/active data-layer promotion.

## Client Applicability

- All clients: Yes, through safer shared blueprint resolution and domain-neutral P3 prompt guidance.
- Specific clients: First Capital / FS Demo receives the immediate commercial-lending Agent Assist fix.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Existing Moves generation path consumes this after ACA deploy.

## Changes Included

- Adds a financial-services commercial-lending Agent Assist discovery blueprint.
- Resolves lending/KYC/credit/core-banking Agent Assist archetypes before the broad healthcare Agent Assist matcher.
- Makes the P3 future-state assignment domain-aware and removes stale AP/payment example metrics from the generic brief.
- Makes the solution prompt boundary domain-neutral.
- Adds regression tests for commercial-lending blueprint selection and P3 prompt leakage/architecture completeness.

## QA / Validation

- `npx jest src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand` — pass.
- `npx eslint src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/solution-prompt-factory.ts src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — failed on pre-existing unrelated Home diagram dependencies: `@xyflow/react` and `@dagrejs/dagre` missing from the worktree install/type graph. No Moves files were named in the error output.

## Rollout Plan

Open PR against `abarva-platform/abarva`, squash merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the exact merge SHA, then run signed-in First Capital P3 generation proof on the sanctioned Codex sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: pending deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes, First Capital sandbox Move P3 generation retry

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending
- Live proof before fix: First Capital sandbox P3 generation returned healthcare blueprint binding and P3 quality blocks for target-state architecture / solution design.
- Post-fix signed-in proof: pending deploy.

## Known Gaps

- This does not relax the P3 quality gate.
- This does not approve or advance a real client Move.
- This does not alter candidate data, Active Tenant Access, Home, Source, or Tower.
