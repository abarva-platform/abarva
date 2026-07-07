# 2026-06-27-ava-agent-logo-canonical — Canonical aVa Agent Logo Assets

## Release ID

`2026-06-27-ava-agent-logo-canonical`

## Status

`candidate`

## Plain-English Summary

The aVa agent logo is now a real shared brand asset instead of a hand-drawn inline SVG inside the component. Home, Intelligence, Tower, Source, and Moves surfaces that use the shared aVa mark now render the same current logo, including the visible dark leading `a` and the slanted blue `V`.

## Layer Impact

- `global-control-lane`: Updates a shared UI primitive used across agent surfaces for all clients.
- Static asset layer: Adds canonical aVa wordmark/avatar SVGs plus PNG fallbacks under `public/brand/ava/`.
- Test layer: Component tests now guard the canonical asset path instead of the retired inline drawing internals.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent-answer/AvaAskMark.tsx` renders the canonical repo-stored aVa asset.
- `public/brand/ava/` stores the latest supplied aVa SVG and PNG assets.
- `public/brand/ava/README.md` documents which asset to use and tells future surfaces to render through `AvaAskMark`.
- Focused tests for aVa ask, Home KNOW ask, and the shared aVa chat shell now assert the canonical dark wordmark asset.

## QA / Validation

- Pass: `./node_modules/.bin/jest src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/ava-chat/__tests__/AvaChatShell.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` — 5 suites, 55 tests passed. Jest emitted pre-existing duplicate manual mock warnings.
- Pass: `./node_modules/.bin/eslint src/components/agent-answer/AvaAskMark.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/ava-chat/__tests__/AvaChatShell.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx`
- Pass pending rerun after this release-record template update: `npm run release:check`.

## Rollout Plan

Merge to `main`, then deploy through the approved Azure Container Apps main deployment lane. No migration, tenant load, feature flag, or environment variable change is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout to `app.abarva.ai`.
- Shared runtime mutators: No manual shared ACA mutation is part of this release.
- Approved image digest: To be recorded by the main ACA deploy workflow.
- ACA runtime invariant: Active template image, traffic revision image, and 100% traffic revision must match the approved main image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, visual smoke on at least Home, Intelligence, Tower, Source, and Moves after deploy.

## Rollback Plan

Revert this PR and redeploy the prior main image through the approved ACA path. The app returns to the previous inline `AvaAskMark`; the new static assets become unused.

## Audit Evidence

- Assets: `public/brand/ava/`
- Shared component: `src/components/agent-answer/AvaAskMark.tsx`
- Tests: focused Jest and ESLint commands listed above.

## Known Gaps

This change standardizes the shared aVa mark. It does not rename historical internal component/type names such as `AtlasChatPanel` or remove old references in release records and docs.
