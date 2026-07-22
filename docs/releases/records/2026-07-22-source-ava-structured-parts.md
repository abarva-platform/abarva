# 2026-07-22-source-ava-structured-parts — Source aVa Structured Answer Parts

## Release ID

`2026-07-22-source-ava-structured-parts`

## Status

`candidate`

## Plain-English Summary

Source aVa already receives structured answer parts from the Source agent route, including tables and bar charts. The bottom Source aVa bar now renders those parts inside the conversation instead of showing only the prose summary.

## Layer Impact

- `global-control-lane`: Updates the shared Source canvas bottom-bar UI. No data model, feature flag, prompt, deployment workflow, or environment changes are included.

## Client Applicability

- All clients: Any signed-in Source user on the canvas bottom aVa bar receives the rendering fix.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/AvaBottomBar.tsx`: Renders existing `ChatMessage.parts` with the shared `AgentResponseParts` renderer.
- `src/components/source/canvas/__tests__/AvaBottomBar.test.tsx`: Adds regression coverage for Source aVa table and bar-chart parts in the conversation panel.

## QA / Validation

- Live pre-fix observation against `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026?stage=responses`: the Source-specific ask API returned structured `agentResponseParts`, but the bottom aVa conversation did not surface a chart or table.
- `npx jest src/components/source/canvas/__tests__/AvaBottomBar.test.tsx --runInBand`: passed.
- `npx eslint src/components/source/canvas/AvaBottomBar.tsx src/components/source/canvas/__tests__/AvaBottomBar.test.tsx`: passed.
- `npm run release:check`: pending.
- Live post-deploy proof: pending merge and ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged commit, then verify the ACA runtime invariant and run signed-in browser proof that a Source aVa answer renders structured parts in the live bottom bar.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, because this affects the signed-in Source/aVa experience.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback or migration rollback is required.

## Audit Evidence

- PR: pending.
- CI/release check: pending.
- ACA runtime proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

- This release does not improve the underlying Source data completeness. If the event lacks vendor response coverage, artifacts, or workshop notes, aVa should still say that honestly.
- This release does not replace the simple bar renderer with Recharts; it makes the existing structured response parts visible in the Source bottom bar.
