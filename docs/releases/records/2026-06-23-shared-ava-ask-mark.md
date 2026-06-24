# 2026-06-23-shared-ava-ask-mark — Shared aVa Ask Mark

## Release ID

`2026-06-23-shared-ava-ask-mark`

## Status

`candidate`

## Plain-English Summary

This release restores the refined aVa mark at the left side of the ask box while keeping Home on the real Home KNOW backend. The prior Home hotfix removed the old iframe fallback, but Home still used a duplicated ask bar with a sparkle icon. This change creates one shared mark component and uses it in both the canonical Ava ask bar and the Home KNOW ask bar.

## Layer Impact

`global-control-lane`: shared frontend presentation for ask bars used across Home and Ava surfaces.

## Client Applicability

- All clients using Home KNOW or the canonical Ava ask component.
- No tenant-specific data, schema, or retrieval changes.
- No feature flag.

## Changes Included

- Adds `AvaAskMark`, the shared `aVa` visual mark for ask boxes.
- Replaces the hard-coded sparkle in `AvaAsk`.
- Replaces the hard-coded sparkle in `HomeKnowAsk`.
- Adds test assertions so both ask bars render the shared mark.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx`
- PASS: `npx eslint src/components/agent-answer/AvaAsk.tsx src/components/agent-answer/AvaAskMark.tsx src/components/home/know/HomeKnowAsk.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx`
- NOT RUN YET: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the repo-owned ACA main deploy workflow. No Vercel path.

## Deployment Authority

Deployment remains Azure Container Apps through `.github/workflows/aca-main-deploy.yml`.

## Rollback Plan

Revert this PR to restore the prior sparkle icon. No data rollback required.

## Audit Evidence

User-visible regression: the newly restored Home KNOW surface no longer showed the refined `aVa` mark in the ask box.

## Known Gaps

This PR only restores the shared ask-box mark. It does not redesign the full Home canvas.
