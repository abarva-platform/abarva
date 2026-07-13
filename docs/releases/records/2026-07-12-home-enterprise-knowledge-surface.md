# 2026-07-12-home-enterprise-knowledge-surface — Home Enterprise Knowledge Surface

## Release ID

`2026-07-12-home-enterprise-knowledge-surface`

## Status

`candidate`

## Plain-English Summary

This release keeps Home as a workflow-led enterprise knowledge browser. It upgrades the Home first screen from a plain context explorer into a clearer Enterprise Knowledge surface that shows the active Home context, setup-control caveats, known facts, source-backed evidence, gaps, answerability, ready areas, and relationship coverage before work is sent to Intelligence, Moves, Source, or Tower.

## Layer Impact

- Home UI/read model: reads the existing Home context browser payload and the setup-control read model, then renders a richer enterprise knowledge snapshot with honest source caveats.
- Tenant data plane: no writes, no schema changes, no candidate promotion, and no active tenant access layer change.
- aVa surface: remains scoped to loaded Home context; advisory synthesis stays in Intelligence.

## Client Applicability

- All clients: yes, the Home UI behavior is shared.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag. Candidate preview language appears only when an explicit `candidatePreview=true` parameter is present.

## Changes Included

- `src/app/(maestro)/home/page.tsx` — updates the page metadata and passes explicit candidate-preview state plus setup-control read model into Home.
- `src/components/home/HomeSurface.tsx` — adds the data status strip, optional candidate preview banner, Enterprise Knowledge Snapshot, Evidence Coverage, Answerability, Top Gaps, Ready Areas, Relationship Overview, and setup-control source caveats.
- `src/components/home/__tests__/HomeSurface.test.tsx` — extends focused Home rendering tests for the Enterprise Knowledge surface and explicit candidate-preview boundary.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`.
- Pass: `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run release:check`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Note: default `npx tsc --noEmit --pretty false` hit a local Node heap OOM at the default heap limit before the larger-heap run passed.

## Rollout Plan

Merge through the protected GitHub PR flow. The change becomes active only after the repo-owned Azure Container Apps main deploy workflow builds and deploys the merged commit.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment for Home active view and explicit candidate-preview banner behavior.

## Rollback Plan

Revert the PR. This restores the prior Home explorer layout without data migrations or runtime state rollback.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/4732`.
- Focused test output: `reports/home-enterprise-knowledge-surface/latest/home-pr1-proof.md`.
- Signed-in screenshots: pending post-deploy proof.

## Known Gaps

- No new backend candidate context read is introduced in this PR.
- No Admin Add Data redesign, candidate promotion, or module runtime consumption changes are included.
- The setup-control active tenant access pointer and candidate tenant data version source are not wired yet; Home displays that caveat rather than claiming active-version proof.
