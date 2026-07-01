# 2026-07-01-intelligence-companion-canvas-declutter — Intelligence Companion Canvas Declutter

## Release ID

`2026-07-01-intelligence-companion-canvas-declutter`

## Status

`candidate`

## Plain-English Summary

The Intelligence right canvas no longer mirrors the chat answer when Claude/aVa provides companion tabs. The answer remains in the chat rail, while the right canvas opens directly on Decision, Visual, Context, or Proof content that helps an executive reason about the answer.

## Layer Impact

- `global-control-lane`: Shared Intelligence UI behavior changes for every tenant using the v2 executive advisor surface. The renderer remains display-only and continues to use Claude-authored tab content without rewriting it.

## Client Applicability

- All clients: Yes, for the Intelligence v2 executive advisor canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: removes the right-side `Answer` tab when companion tabs exist, auto-selects the first companion tab, and adds concise companion-pane guidance.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: asserts that companion-tab answers do not show a duplicate right-side Answer tab.

## QA / Validation

- `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed, 13 tests.
- `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/tabbed-response.ts` passed.
- `git diff --check` passed.

## Rollout Plan

Merge to `main`, then deploy through the approved Azure Container Apps main deploy workflow. No database migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Standard ACA deploy workflow check.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, use Industrial Demo/Lakeshore and SkyHarbor/Airline Intelligence browser flows.

## Rollback Plan

Revert the UI commit and redeploy the prior image through the approved ACA lane, or move ACA traffic back to the previously healthy revision if an urgent rollback is required.

## Audit Evidence

- PR URL and merge SHA after PR creation.
- ACA workflow URL, active revision, image digest, and traffic state after deployment.
- Signed-in browser screenshots showing Intelligence right canvas opens on companion Decision/Visual/Context/Proof content instead of a duplicated Answer tab.

## Known Gaps

This slice removes duplication and improves companion-pane behavior. It does not yet add richer chart rendering beyond preserving Claude-authored Markdown table/chart content in the Visual pane.
