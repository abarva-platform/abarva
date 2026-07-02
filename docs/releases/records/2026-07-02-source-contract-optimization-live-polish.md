# 2026-07-02-source-contract-optimization-live-polish — Source Contract Optimization Live Polish

## Release ID

`2026-07-02-source-contract-optimization-live-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the live Source contract-optimization experience for the SkyHarbor AMS existing-contract scenario. When a contract optimization profile is present, Source now leads with the contract baseline, optimization findings, negotiation levers, recommended path, and evidence caveats instead of showing generic vendor-response panels first. The contract brief export also avoids scaffold-style wording, and the Source aVa API now exposes a clean top-level advisor answer so user-facing proof does not fall through into internal JSON.

## Layer Impact

- `global-control-lane`: Updates shared Source UI rendering, Source aVa API response shape, and Source contract-optimization brief wording. The behavior is generic and applies to any Source event with a contract optimization profile.
- `client-data-lane`: No new data-plane writes, migrations, or row mutations are included in this polish release.

## Client Applicability

- All clients: Shared Source rendering and Source aVa response contract changes are available wherever the feature path is used.
- Specific clients: The immediate live proof target is SkyHarbor Air contract optimization event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None added.

## Changes Included

- `src/components/source/canvas/responses/ResponsesStageView.tsx`: prioritizes the contract optimization lane when a profile exists.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: applies the same contract-first ordering in the simple-front shell.
- `src/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel.tsx`: uses exact business-facing section labels.
- `src/lib/source/contract-optimization/brief.ts`: replaces `Current state:` with `Observed issue:`.
- `src/lib/source/nexus-api.ts` and `src/lib/source/sentinel-chat-llm.ts`: expose clean top-level `answer`, `message`, and `text` fields.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: labels Source event evidence as a governed Source intake record instead of a physical table name.
- `src/types/optional-external-modules.d.ts`: adds compile-time declarations for already-used optional integrations so full TypeScript can run in this worktree without changing runtime behavior.
- Regression tests for the contract panel, brief wording, and Source aVa answer contract.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts src/components/source/canvas/contract-optimization/__tests__/ContractOptimizationProfilePanel.test.tsx src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts`
- PASS: `npx eslint src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel.tsx src/components/source/canvas/contract-optimization/__tests__/ContractOptimizationProfilePanel.test.tsx src/lib/source/contract-optimization/brief.ts src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts src/lib/source/nexus-api.ts src/lib/source/sentinel-chat-llm.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/types/optional-external-modules.d.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `npm run release:check`
- Pending before release: PR checks, ACA deploy, and signed-in SkyHarbor browser proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main lane, assign 100% traffic to the healthy revision, then run the signed-in SkyHarbor Source proof for the contract optimization event and export MD/DOCX/PDF artifacts.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps `ca-abarva-web-lab-eastus`.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Verify the deployed revision and image digest before browser proof.
- Worker image invariant: No worker job image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the prior healthy ACA revision. No migration rollback or data cleanup is required because this release has no schema or data-plane writes.

## Audit Evidence

- PR URL: pending.
- Focused Jest output listed above.
- Deployment logs, ACA revision/digest, signed-in screenshots, API payloads, and exported brief files will be stored in the Source contract optimization proof folder after deploy.

## Known Gaps

Live ACA deployment and signed-in browser proof are pending for this release candidate.
