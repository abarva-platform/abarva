# Source Authenticated Route Smoke Review

## Files Changed

- `src/__tests__/integration/source/source-authenticated-route-smoke.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/38_SOURCE_AUTHENTICATED_ROUTE_SMOKE_REVIEW.md`

## Coverage Added

The smoke test verifies the deterministic route boundary around authenticated Source access:

- `/source(.*)` remains listed in the authenticated route matcher.
- The demo-code sign-in handoff route remains public so unauthenticated users can initiate demo sign-in.
- The Source dashboard route module renders deterministic seeded content.
- The Source event route module renders the seeded Data & AI Modernization event canvas shell.
- The route/component sources do not import model, upload/parsing, ProgramSurface, preview, or demo surface code.

## Auth Boundary

This is not a full Clerk browser automation test. The current Jest coverage confirms the route files, route matcher, and deterministic server/component render path. The authenticated browser review remains the evidence that local sign-in can reach the two Source routes.

## Validation Results

- `npx jest src/__tests__/integration/source/source-authenticated-route-smoke.test.ts` passed.
- `npx eslint src/__tests__/integration/source/source-authenticated-route-smoke.test.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build -- --webpack` passed.
- `git diff --check` passed.

`npm run build` with the default Turbopack runner could not be completed from this temporary worktree because the local validation harness uses a symlinked `node_modules` outside the worktree root. The failure was the known Turbopack symlink-root panic and did not indicate an application compile error. The webpack production build passed in the same worktree.

## Production Readiness Impact

This adds deterministic coverage evidence for Source route readiness but does not make Source production ready. It does not replace live persona testing, production-domain sign-in validation, or full Clerk integration coverage.

`docs/build/production-readiness.json` was not updated in this slice because no production gate changed from blocked or partial to passing.

## Out Of Scope Confirmation

No auth rewrite, model calls, upload/parsing, persistence, chat UI, Source runtime mutation, `/programs`, `/preview`, or `/demo` work was done.
