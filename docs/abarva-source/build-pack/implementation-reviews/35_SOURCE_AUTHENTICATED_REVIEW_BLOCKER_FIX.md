# Source Authenticated Review Blocker Fix

Date: 2026-04-26

Branch: `codex/fix-demo-signin-for-source-review`

## Purpose

Resolve or isolate the blocker that prevented authenticated review of:

- `/source`
- `/source/events/evt-source-data-ai-si-selection`

The previous blocker was local demo-code sign-in returning `500`, which kept the Source dashboard and event canvas from being reviewed in an authenticated browser session.

## Root Cause

The sign-in route itself is functional when the local runtime has Clerk configuration available.

The reproduced failure mode was environmental rather than a Source UI or auth-code regression:

- the isolated worktree did not have `.env.local`, so `CLERK_SECRET_KEY` was unavailable to the local route runtime
- without that key, `POST /api/auth/demo-code-sign-in` returns `clerk_not_configured`
- the attempted `source+clerk_test@abarva.com` account is not configured in Clerk
- a configured `+clerk_test@abarva.com` demo account returned a valid sign-in ticket and completed browser sign-in

No Clerk configuration value, ticket value, or secret was committed or documented here.

## Files Changed

- `docs/abarva-source/build-pack/implementation-reviews/35_SOURCE_AUTHENTICATED_REVIEW_BLOCKER_FIX.md`

No runtime files were changed.

## Fix / Resolution

No application code fix was required for this slice.

The review blocker is cleared for local authenticated review when:

1. the local worktree has the existing `.env.local` available at runtime
2. the reviewer uses a Clerk-configured demo account ending in `+clerk_test@abarva.com`
3. the demo code is `424242`

The route continues to reject unsupported demo accounts and invalid codes.

## Test Steps

Local server:

```bash
npm run dev -- --port 3071 --webpack
```

Why webpack was used:

- the temporary worktree used a `node_modules` symlink
- Turbopack rejected that symlink because it points outside the worktree filesystem root
- webpack allowed the local auth review to proceed without changing application code

Route checks:

```bash
curl -X POST http://localhost:3071/api/auth/demo-code-sign-in \
  -H 'Content-Type: application/json' \
  --data '{"email":"<configured +clerk_test account>","code":"424242"}'
```

Result:

- configured demo account: `200`, sign-in ticket returned
- unconfigured demo account: `404`, `demo_user_not_found`
- signed-out `/source`: `307` to `/sign-in?redirect=%2Fsource`

Browser result:

- authenticated `/source` loaded
- authenticated `/source/events/evt-source-data-ai-si-selection` loaded
- primary nav showed Source and the signed-in account menu

## Validation Results

- `git diff --check` passed
- trailing whitespace check passed
- non-ASCII punctuation check passed

## Risk Assessment

Risk is low because this slice does not change auth behavior.

Remaining caveat:

- local authenticated review still depends on a valid local `.env.local` and a Clerk-configured demo account
- this slice does not change Clerk dashboard configuration
- this slice does not add, expose, or commit credentials

## Explicitly Out Of Scope

- no Source UI changes
- no auth rewrite
- no auth bypass
- no tenant/security weakening
- no hardcoded production credentials
- no model calls
- no upload/parsing
- no persistence
- no workflow engine
- no approval engine
