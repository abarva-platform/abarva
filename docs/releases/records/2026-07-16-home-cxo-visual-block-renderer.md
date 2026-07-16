# 2026-07-16-home-cxo-visual-block-renderer — Home CXO Visual Blocks Renderer

## Release ID

`2026-07-16-home-cxo-visual-block-renderer`

## Status

`candidate`

## Plain-English Summary

Home now has a renderer contract for Claude-derived `visual_blocks`: Claude emits structured data only, and the product renders that data as first-class Home visuals such as context-strength snapshots, relationship/dependency diagrams, evidence-gap tables, card grids, and module action strips. Weak generated prose is not promoted to runtime, but independently valid visual blocks can be approved and rendered without hand-splicing model output into the UI.

## Layer Impact

- `global-control-lane`: Home / Knowledge UI adds visual primitives and visual-block rendering on the CXO Enterprise Brief surface.
- `global-control-lane`: Enterprise Knowledge narratives separate runtime approval of generated prose from independently validated structured visual blocks.
- `internal-admin`: generation / QA scripts add visual-block approval output and a generated TypeScript artifact for approved structured visual data.

## Client Applicability

- All clients: the renderer contract is general Home / Knowledge infrastructure.
- Specific clients: current generated visual-block proof is Meridian / Healthcare Demo only.
- Internal only: proof reports under `reports/home-cxo-narrative-visuals/`.
- Public/demo only: no public route added.
- Feature flag: no new feature flag; behavior is gated by presence of approved `visual_blocks`.

## Changes Included

- `src/components/home/HomeVisualBlockRenderer.tsx`
- `src/components/home/HomeBriefVisuals.tsx`
- `src/components/home/HomeSurface.tsx`
- `src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts`
- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-visual-blocks-approved.ts`
- `scripts/knowledge/generate-home-knowledge-claude-narratives.ts`
- `scripts/knowledge/audit-knowledge-home-insights.ts`
- `reports/home-cxo-narrative-visuals/`

## QA / Validation

- Pass: `npx eslint src/components/home/HomeVisualBlockRenderer.tsx src/components/home/HomeBriefVisuals.tsx src/components/home/HomeSurface.tsx src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts scripts/knowledge/generate-home-knowledge-claude-narratives.ts src/data/enterprise-knowledge/narratives/generated/meridian-claude-visual-blocks-approved.ts`
- Pass: `npm run audit:knowledge-home-insights`
- Pass: `git diff --check`
- Pass: saved-response generation produced `reports/home-cxo-narrative-visuals/visual-block-approval.json` with `visual_blocks_pass: true`.
- Blocked locally: `npx tsc --noEmit --pretty false` initially failed with local Node heap out-of-memory; an extended-heap retry was started for verification.
- Not yet done: signed-in browser screenshots for the Home tabs, because local Clerk auth requires a valid signed-in session.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deployment workflow. No database migrations, worker jobs, or tenant-data writes are included.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: supplied by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Home visual blocks on the Meridian / Healthcare Demo Home route.

## Rollback Plan

Revert the PR. Runtime will return to prose/fallback Home rendering and will stop consuming the generated visual-block artifact.

## Audit Evidence

- `reports/home-cxo-narrative-visuals/visual-block-approval.json`
- `reports/home-cxo-narrative-visuals/visual-block-approval.md`
- `reports/home-cxo-narrative-visuals/generated-visual-blocks.json`
- `reports/home-cxo-narrative-visuals/visual-clutter-audit.csv`
- `reports/home-cxo-narrative-visuals/home-cxo-narrative-visuals-proof.html`

## Known Gaps

- The latest Claude prose generation still fails the CXO prose gate and is not promoted.
- Signed-in Home visual screenshots are still required before claiming browser-visible proof.
