# 2026-07-22-moves-p2-readiness-blocker-copy — Moves P2 Gate Blocker Copy

## Release ID

`2026-07-22-moves-p2-readiness-blocker-copy`

## Status

`candidate`

## Plain-English Summary

P2 gate approval already blocked correctly when the signed Discovery Report still contained unresolved hard-gap language. The blocker message was too abstract: it repeated the criterion name instead of telling the user which record to fix. This release keeps the gate strict, but makes the failed `p2_readiness_cleared` reason explain that the signed Discovery Report must be replaced or regenerated/edited so it explicitly clears P2 or carries only non-blocking P3 caveats.

## Layer Impact

- Product runtime: changes the failed-check reason returned by `evaluateGate` for the P2→P3 transition.
- Strategic Moves governance: preserves the existing hard-gate logic and only improves the operator-facing explanation.
- Data plane: no schema, data-load, candidate, or tenant-context changes.

## Client Applicability

- All clients: yes, wherever Strategic Moves P2 gate approval is available.
- Specific clients: not tenant-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this follows the existing Moves gate path.

## Changes Included

- `src/lib/programs/governance.ts`
  - Adds actionable failure reasons for `p2_readiness_cleared` when the signed Discovery Report is missing, conditional, or still contains unresolved hard-gap language.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
  - Updates the P2 hard-gap regression to assert the actionable signed-Discovery-Report blocker message.

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/__tests__/governance-evaluate-gates.test.ts --runInBand`
  - Pass: 20 tests passed. Existing duplicate manual mock warnings are unrelated.
- `npx eslint src/lib/programs/governance.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
  - Pass.
- `npm run release:check`
  - Pass.
- `git diff --check`
  - Pass.

Live pre-fix diagnosis on sanctioned FS sandbox Move:

- `POST /api/v1/programs/4bf889aa-d4ee-4c1d-936b-51574614d191/phase-gate-approval`
- Returned only failed hard check: `p2_readiness_cleared`.
- Human-approved replacement Discovery Report upload succeeded and advanced P2→P3, proving the strict gate and replacement lifecycle are functioning.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the new digest-pinned web image to `ca-abarva-web-lab-eastus`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, verify a blocked P2 gate returns the actionable blocker message

## Rollback Plan

Revert this commit and redeploy the previous approved ACA web image. The rollback returns to the prior generic failed-check reason; gate strictness remains unchanged either way.

## Audit Evidence

- PR URL: pending
- Local proof: `proof/138-p2-gate-readpath-diagnosis`
- Lifecycle proof: `proof/139-p2-client-approved-replacement`
- Post-advance proof: `proof/140-p3-post-advance-state`

## Known Gaps

- This does not reduce File Cabinet artifact sprawl.
- This does not change the P2 gate criteria.
- This does not automatically rewrite existing AI-generated Discovery Reports that contain blocking language.
