# 2026-08-16-api-unauthenticated-json-401 — Unauthenticated API Calls Answer 401 JSON

## Release ID

`2026-08-16-api-unauthenticated-json-401`

## Status

`candidate`

## Plain-English Summary

When a session expired, every authenticated API call failed as `TypeError: Failed to fetch`. Nothing
in the failure said the caller was signed out, so an expired session was indistinguishable from the
network being down.

The cause is that `auth.protect()` answers an unauthenticated request with a redirect to the HTML
sign-in page. That is right for a page — a person should land on sign-in. It is wrong for an API call:
the redirect reaches `fetch()` as an opaque cross-document navigation, and the caller only sees a
generic network error.

Unauthenticated requests to `/api/*` now return `401` with a JSON body naming the reason. Page routes
still redirect, unchanged.

This also removes a standing pressure to weaken auth. Three endpoints were previously moved into the
public route list specifically to "avoid Clerk HTML redirects" so that probes would receive JSON —
`/api/health/azure-connectivity`, `/api/health/postgres-disruption`, and
`/api/admin/parallel-run-invariants`. Making a route public to fix an error *format* gives up its auth
gate. With a correct 401 available, that trade is no longer necessary for future endpoints.

## Layer Impact

- Release lane: `global-control-lane`
- Products: all surfaces, at the proxy/middleware layer.
- Canonical model: No canonical data, adapter, migration, entitlement, or route protection changed.
  The same routes are protected as before; only the *response shape* for an unauthenticated API
  request changed, from an HTML redirect to a JSON 401.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/proxy.ts` — adds `shouldAnswerUnauthenticatedApiWithJson` and returns a 401 JSON response for
  unauthenticated `/api/*` requests before `auth.protect()` runs
- `src/__tests__/unit/proxy-api-unauthenticated-json.test.ts` (new)

## QA / Validation

- Pass: `npx jest` across the four proxy suites — 26 tests, including 4 new cases
- Pass: `npx eslint` on changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

Behaviour covered by tests: an API route with no session answers JSON; an authenticated API request is
untouched; a page route still redirects; and a path that merely contains the word `api` (`/apiary`,
`/docs/api`) is not treated as an API route.

How it was found: a live signed-in verification session expired mid-run, and every authenticated probe
began failing as `TypeError: Failed to fetch` with no indication that auth was the cause.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. No manual runtime mutation, migration, or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image, and revision health match
  the deployed digest before claiming live-proven.
- Worker image invariant: Not affected; no worker job changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — an unauthenticated `/api/*` call must return 401 JSON, and a
  signed-in call must be unaffected.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. The change adds a response branch ahead of `auth.protect()`; reverting restores the
redirect behaviour with no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Post-deploy check that an unauthenticated `/api/*` request returns 401 JSON.

## Known Gaps

- The three endpoints already in the public list are left public. Moving them back behind auth is a
  separate change that needs its own review of each probe's callers, and is not bundled here.
- This does not address why the verification session expired, nor the browser-automation instability
  seen alongside it. Those are separate.
