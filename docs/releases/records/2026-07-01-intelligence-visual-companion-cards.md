# 2026-07-01-intelligence-visual-companion-cards — Intelligence Visual Companion Cards

## Release ID

`2026-07-01-intelligence-visual-companion-cards`

## Status

`candidate`

## Plain-English Summary

The Intelligence right-side decision canvas now turns Claude-owned numeric Markdown tables into quiet executive visuals when useful: opportunity maps, metric tiles, or compact bar summaries. The left advisor answer remains prose-first and concise. The renderer still preserves Claude's table content and continues hiding canvas protocol markers from the visible answer.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence v2 UI renderer for all tenants using the executive canvas.

## Client Applicability

- All clients: Yes, for tenants on the Intelligence v2 canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Intelligence v2 routing only; no new flag.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: adds display-only visual summaries derived from right-canvas numeric Markdown tables.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: extends companion-canvas coverage to assert visual-map rendering while raw tab markers stay hidden.

## QA / Validation

- `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed.
- `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/tabbed-response.ts src/lib/intelligence/__tests__/tabbed-response.test.ts` passed.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build the exact merge SHA image, assign 100% ACA traffic to the healthy revision, then run signed-in SkyHarbor and Industrial/Lakeshore Intelligence smoke proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned ACA main deploy only.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, SkyHarbor and Industrial/Lakeshore Intelligence.

## Rollback Plan

Revert this UI release and redeploy the prior approved ACA image through the repo-owned workflow. No data migration or tenant data rollback is required.

## Audit Evidence

- PR URL, CI result, ACA revision, image digest, and signed-in proof screenshots to be attached after rollout.

## Known Gaps

- The renderer only visualizes chart/table cards that include compact numeric Markdown tables. Claude still owns whether a visual card is useful and what table data it emits.
