# 2026-06-03-signin-responsible-ai-message — Restore Responsible AI message on sign-in

## Release ID

`2026-06-03-signin-responsible-ai-message`

## Status

`candidate`

## Plain-English Summary

Restore a short Responsible AI / human-approval message on the sign-in experience so invited users see the governance framing before entering the product.

## Layer Impact

- `global-control-lane`: Shared authentication shell copy for every invited user. No backend logic, auth policy, or tenant behavior changes.

## Client Applicability

- All clients: Yes. The sign-in shell is shared.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Restore the Responsible AI notice in `/src/components/auth/SignInShell.tsx`.
- Add this release record.

## QA / Validation

- `npx eslint src/components/auth/SignInShell.tsx` — passed
- `npm run test:behaviors` — passed (`103/103`)
- `npm run test:nav` — passed (`26/26`)
- `npm run test:integration` — failed in pre-existing unrelated lanes (for example `agent1-foundation`, `build-wave-progress`, `shell-topbar-auth`); no sign-in-shell-specific failure observed
- `npm run release:check -- --base origin/main --head HEAD` — passed
- Local smoke: `npx next dev --webpack` on `http://localhost:3005`, then `curl /sign-in` confirmed `Responsible AI`, `AI output may contain errors`, and `Human approval is required` render in the page HTML

## Rollout Plan

Merge to `main` through the repository merge queue. Production sign-in shell updates on the next Vercel deploy for `main`.

## Rollback Plan

Revert the sign-in shell copy change in a follow-up PR and merge through the queue. No migration or data rollback needed.

## Audit Evidence

- PR URL
- Required GitHub checks
- Vercel production deployment for merged `main`
- Sign-in page visual verification

## Known Gaps

- Broader legal/compliance audit across the product is still pending and out of scope for this copy restore.
