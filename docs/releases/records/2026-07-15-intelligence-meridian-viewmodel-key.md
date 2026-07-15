# 2026-07-15-intelligence-meridian-viewmodel-key — Intelligence Meridian View Model Key Fix

## Release ID

`2026-07-15-intelligence-meridian-viewmodel-key`

## Status

`candidate`

## Plain-English Summary

Live signed-in proof after PR #4844 showed the Intelligence page could display the Healthcare Demo tenant while the advisory view model still fell back to the default Retail/Apex client key. This fix keeps canonical data-layer tenant keys separate from app client keys before building the Intelligence page view model. It also removes visible "loaded context" wording from the Intelligence page header.

## Layer Impact

- Global control lane: Intelligence page server route and advisory page copy.
- Product experience layer: signed-in tenant-specific Intelligence view model, visible page metadata, and aVa request surface context.
- No data-plane change: retrieval, data-layer promotion, ingestion, Source, Moves, and Tower are unchanged.

## Client Applicability

- All clients: yes, for Intelligence route key normalization when canonical tenant aliases appear.
- Specific clients: Meridian/Healthcare Demo was the live proof trigger.
- Internal only: no.
- Feature flag: none.

## Changes Included

- Intelligence page now converts canonical tenant aliases such as `meridian-health` back to the app client key `meridian` before calling `getEnterpriseLandscapeViewModel`.
- Intelligence page header now says "refreshed from active enterprise context" instead of "refreshed from loaded context."

## QA / Validation

- Pass: `npx jest src/lib/intelligence/__tests__/intelligence-view-model-client-key.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Not run: signed-in Meridian Intelligence browser proof after deploy.

## Rollout Plan

Merge to main through PR. The change becomes active after the repo-owned Azure Container Apps main deploy workflow builds and deploys the new main image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required for production runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Live signed-in proof required: yes, Meridian Intelligence UI proof before marking live-proven.

## Rollback Plan

Revert the PR or roll back the ACA web revision to the prior digest. No migration rollback or data repair is required.

## Audit Evidence

- Trigger proof: `/private/tmp/nexus-intelligence-ava-polish/proof/intelligence-ava-live-diagnostic-2026-07-15`
- PR URL: https://github.com/abarva-platform/abarva/pull/4848
- Production proof: pending signed-in browser UI proof

## Known Gaps

- This release does not change answer synthesis, visual artifact generation policy, data-layer promotion, Home, Moves, Source, or Tower.
