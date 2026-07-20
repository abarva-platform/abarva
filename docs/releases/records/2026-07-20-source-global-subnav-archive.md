# 2026-07-20-source-global-subnav-archive — Archive Source-Wide Legacy Top Tabs

## Release ID

`2026-07-20-source-global-subnav-archive`

## Status

`candidate`

## Plain-English Summary

The old Source secondary strip (`Decisions / Approvals / Portfolio / Capabilities / Setup`) is retired across Source pages. It created a second navigation model above the new Source shell, while the current design contract puts event workflow movement in the left journey/workspace rail and keeps portfolio/event discovery inside the Source book.

This release keeps existing Source routes working, but the legacy tab strip no longer renders anywhere it is imported.

## Layer Impact

- `global-control-lane`: changes shared Source page chrome for all tenants.
- `client-data-lane`: no data, schema, tenant, query, evidence, approval, or artifact mutation change.

## Client Applicability

- All clients: yes, for Source pages that previously mounted `SourceSubNav`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `SourceSubNav` now renders `null`.
- The legacy tab catalog exports are empty compatibility exports.
- The old active-tab resolver returns `archived` so new code cannot accidentally depend on the retired Source section-tab model.
- The unit test now locks the archive contract instead of codifying the old top-tab IA.

## QA / Validation

- Focused Jest: pass — `npm test -- --runTestsByPath tests/unit/source-subnav-active-state.test.ts src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` (18/18). Existing duplicate Jest mock warnings were unchanged.
- ESLint: pass — `npx eslint src/components/source/SourceSubNav.tsx tests/unit/source-subnav-active-state.test.ts`.
- TypeScript: pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- `git diff --check`: pass.
- `release:check`: pass — Release Control Gate, Deploy Authority Gate, and Pilot Data Loader Gate passed.
- Signed-in browser proof: required after deploy before calling this live-proven.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in browser proof on `https://app.abarva.ai/source/portfolio` and an event route. The proof must show the old top Source section strip absent while the Source portfolio and event shell remain usable.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. This is a UI chrome archive only and has no data rollback requirement.

## Audit Evidence

- Candidate PR diff and validation output.
- Post-deploy signed-in Source portfolio screenshot/crawl proving the old Source section strip is gone.
- Post-deploy signed-in Source event screenshot/crawl proving the event shell still uses the left journey/workspace rail.

## Known Gaps

- This archives the legacy top tabs. It does not redesign every non-event Source page into the event-shell workflow pattern; that remains a separate page-by-page design backlog.
