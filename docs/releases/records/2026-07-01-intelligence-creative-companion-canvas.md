# 2026-07-01-intelligence-creative-companion-canvas — Intelligence Creative Companion Canvas

## Release ID

`2026-07-01-intelligence-creative-companion-canvas`

## Status

`candidate`

## Plain-English Summary

The Intelligence right canvas becomes a companion board instead of a tabbed document reader. When Claude/aVa provides multiple useful companion sections, the right side now shows them together as useful views: decision, visual, industry signal, comparison, and proof boundary. This uses the available right-side space for relevant decision support rather than forcing the user to click through small tabs. The page header is also tightened so more of the first viewport is available for the answer and decision canvas.

## Layer Impact

- `global-control-lane`: Shared Intelligence UI and prompt-contract behavior changes for all tenants using the v2 executive advisor surface.
- `model-plane-contract`: The prompt contract now asks Claude to choose three to five interesting companion cards for strategic or analytical answers while preserving the display-only renderer boundary.

## Client Applicability

- All clients: Yes, for Intelligence v2.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: renders Claude-owned companion sections as a multi-card Decision canvas and removes the redundant tab row when those views exist.
- `src/lib/intelligence/tabbed-response.ts`: updates the output contract from tab-reader language to companion-card language and encourages three to five relevant lenses.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: asserts the companion board renders five cards without exposing raw tab markers or duplicate answer tabs.
- `src/lib/intelligence/__tests__/tabbed-response.test.ts`: asserts the updated companion-card prompt contract.

## QA / Validation

- Focused Intelligence v2 and tabbed-response tests: `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed, 13/13 tests.
- Scoped ESLint: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/tabbed-response.ts src/lib/intelligence/__tests__/tabbed-response.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check` passed.
- Production build passed: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/next build`.

## Rollout Plan

Merge to `main`, then deploy through the approved Azure Container Apps main deploy workflow. No database migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Standard ACA deploy workflow check.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, with Industrial Demo/Lakeshore and SkyHarbor/Airline Intelligence questions.

## Rollback Plan

Revert the UI/prompt-contract commit and redeploy through the approved ACA lane, or shift ACA traffic to the previously healthy revision if urgent rollback is required.

## Audit Evidence

- PR URL, CI checks, and merge SHA.
- ACA workflow URL, active revision, image digest, and traffic state after deployment.
- Signed-in browser screenshots showing the Companion board with multiple relevant cards.

## Known Gaps

This slice still renders chart-ready content as Markdown tables inside cards. It does not yet convert numeric card data into bespoke plotted charts.
