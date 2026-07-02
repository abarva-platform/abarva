# 2026-07-02-source-contract-optimization-answer-quality — Source Contract Optimization Answer Quality

## Release ID

`2026-07-02-source-contract-optimization-answer-quality`

## Status

`candidate`

## Plain-English Summary

Source contract optimization answers now respond to the actual executive question instead of returning the same generic sourcing read for every prompt. Renewal, cure-notice, missing-evidence, proof-before-renewal, and financial-exposure questions use the extracted contract optimization evidence and produce distinct sourcing guidance.

## Layer Impact

- `global-control-lane`: updates shared Source answer composition and Source canvas display labels.
- `public-demo`: improves the signed-in SkyHarbor Source demo path for existing contract optimization.

## Client Applicability

- All clients: contract-optimization Source answers use the new deterministic question-specific path when matching evidence exists.
- Specific clients: SkyHarbor-coded Source demo events display `SkyHarbor Air` instead of the generic demo label.
- Internal only: none.
- Public/demo only: no public route change.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: adds the contract optimization answer builder.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: adds regression coverage for renew/rebid, cure notice, and missing evidence questions.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: normalizes SkyHarbor Source event display labels.
- `src/components/source/PersistentNexusPanel.tsx`: renders the persistent Source assistant dock as `aVa`.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/__tests__/source-answer-engine.test.ts`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/contract-optimization/__tests__/ContractOptimizationProfilePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts`
- PASS: `npx eslint src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/PersistentNexusPanel.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `npm run release:check`
- PENDING: live signed-in SkyHarbor Source proof after ACA deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, verify the active ACA revision and health endpoint, then rerun the signed-in SkyHarbor Source contract optimization proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deploy workflow only
- Approved image digest: pending deploy
- ACA runtime invariant: active web revision receives 100% traffic
- Worker image invariant: deploy workflow updates worker jobs to the new image
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the merge commit and redeploy through `aca-main-deploy.yml`. No migration or data-plane rollback is required.

## Audit Evidence

- PR: pending
- CI: pending
- Live proof folder: `/Users/anand/Downloads/source-contract-optimization-live-proof-20260702T002734Z/`

## Known Gaps

The final live browser proof is pending until this candidate is merged and deployed.
