# 2026-07-17-home-knowledge-intelligence-style — Home Knowledge Intelligence Visual Alignment

## Release ID

`2026-07-17-home-knowledge-intelligence-style`

## Status

`candidate`

## Plain-English Summary

This release restyles the Home / Knowledge design-contract surface so it visually aligns with the existing Intelligence page: editorial typography, flatter panels, tighter evidence tables, muted status colors, and less rounded dashboard clutter. It does not regenerate tenant content, change Claude prompts, change data contracts, or alter module runtime behavior.

## Layer Impact

- `global-control-lane` — Home / Knowledge UI: Restyles the rendered Knowledge surface to match the Intelligence page visual language.
- `client-data-lane` — No data-layer impact: no schema, ingestion, candidate, active-context, or source-file changes.
- `experimental` — No AI-generation impact: no Claude or model prompt changes.

## Client Applicability

- All clients: Applies to any tenant rendered through the Home Knowledge design-contract surface.
- Specific clients: Meridian Health remains the primary signed-in proof tenant for this surface.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Home Knowledge routing behavior; no new flag is introduced.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `docs/releases/records/2026-07-17-home-knowledge-intelligence-style.md`

## QA / Validation

- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx` — not-run yet, pending local dependency path resolution.
- `npm run audit:home-knowledge-design-contract-ui` — pass.
- `npm run release:check` — not-run after this record update.
- `git diff --check` — pass.
- Signed-in Meridian Home browser proof after ACA deploy — not-run yet.

## Rollout Plan

Merge through the standard PR path to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA runtime invariant, health endpoint, and signed-in Meridian Home render.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not allowed outside the repo-owned workflow.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow reports worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Home / Knowledge.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. The rollback is CSS/component-only and does not require data rollback.

## Audit Evidence

Expected evidence:

- PR URL.
- Main deploy workflow run.
- ACA deployment artifact with image digest and runtime invariant.
- Health check output.
- Signed-in Meridian Home screenshots.

## Known Gaps

This release does not address content quality, Claude narrative generation, source-data completeness, or old dataset retirement. It is a visual-system alignment pass only.
