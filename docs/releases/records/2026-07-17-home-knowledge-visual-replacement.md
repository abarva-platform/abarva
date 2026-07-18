# 2026-07-17-home-knowledge-visual-replacement — Home Knowledge Visual Replacement

## Release ID

`2026-07-17-home-knowledge-visual-replacement`

## Status

`candidate`

## Plain-English Summary

Home Knowledge now receives a visible component-level replacement for the areas that previously still looked like the old dimension directory. The change aligns the Home Knowledge canvas with the Intelligence/Tower surface typography and introduces Recharts-backed executive visuals for context concentration, confidence distribution, use-case prioritization, and governed knowledge proof coverage.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI layer: updates `HomeKnowledgeDesignContractSurface` rendering and styling only.
- Home Knowledge read surface: changes how existing approved Home Knowledge design-contract data is presented.
- Data layer: no schema, loader, candidate, active-context, or module-context data changes.

## Client Applicability

- All clients: all tenants using the Home Knowledge design-contract surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `scripts/audit/home-knowledge-design-contract-ui.mjs`
- Adds Recharts-backed dimension-volume charting, confidence distribution, use-case priority ranking, and governed proof-stage coverage visuals.
- Keeps the governed proof-flow diagram for executive comprehension while requiring quantitative visuals to render through Recharts.
- Aligns Home Knowledge typography tokens to the Intelligence/Tower surface (`Inter` body, `Fraunces`/Georgia serif headings, warm canvas palette).
- Hardens the Home Knowledge UI audit so Recharts, `ResponsiveContainer`, Recharts test ids, and the shared heading token cannot silently disappear.

## QA / Validation

- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx scripts/audit/home-knowledge-design-contract-ui.mjs` — passed.
- `npm run audit:home-knowledge-design-contract-ui` — passed.
- `npm run audit:home-cxo-story-quality` — passed.
- `npm run release:check` — passed after this release record update.
- `git diff --check` — passed.

## Rollout Plan

Merge through a GitHub PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared lab/product web runtime. After deploy, verify health, runtime invariant, and signed-in browser proof on the Meridian Home Knowledge surface.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian Home Knowledge Overview, Context Confidence, Use Cases, Proof, and a dimension Data tab.

## Rollback Plan

Revert the PR or roll back to the prior ACA digest through the approved Azure Container Apps rollback path. No data migrations or tenant data changes are included.

## Audit Evidence

- PR URL: to be added in PR body.
- Local validation commands listed above.
- Post-deploy proof bundle: to be produced after merge/deploy.

## Known Gaps

This PR changes the visual component layer only. It does not regenerate Claude-derived narrative content, alter Home aVa behavior, or change active/candidate data promotion. The governed proof-flow remains a structured HTML explanation; the measurable charts on the surface are Recharts-backed.
