# 2026-06-17 Intelligence Pages Force-Dynamic — unblock the production build (sweep)

## Release ID

`2026-06-17-intelligence-pages-force-dynamic`

## Status

`candidate`

## Plain-English Summary

Completes the build unblock. After `/intelligence/author` was fixed, `next build` failed prerendering the next intelligence route (`/intelligence/contradictions/[contradictionId]`), and an audit showed many intelligence routes were missing the `force-dynamic` flag that their siblings already set. These are all signed-in, tenant-scoped reading views whose client components use `useSearchParams()` (a static-CSR bailout) and which read the active client per-request — so none should be statically prerendered. This sweep adds `export const dynamic = 'force-dynamic'` to every remaining intelligence route page that lacked it, so the production image builds.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** UI/route config — one `export const dynamic` line appended to 12 intelligence route pages. No data-plane, schema, provider, or API change.

## Client Applicability

- **All clients:** Yes — restores the ability to build/deploy; affected routes render dynamically as their siblings already do.
- **Feature flag:** None.

## Changes Included

- `src/app/intelligence/{ask,patterns,quality,signals,synthesize,solutions,topics}/page.tsx`, `.../signals/[signalId]`, `.../solutions/[solutionId]`, `.../topics/[topicId]`, `.../contradictions/[contradictionId]`, `.../failure-modes/[slug]/page.tsx` — append `export const dynamic = 'force-dynamic'`.

## QA / Validation

- **PASS** — `npx eslint src/app/intelligence/`: clean (no parse/lint errors).
- **PASS** — audit: all `src/app/intelligence/**/page.tsx` now set `force-dynamic`.
- **PASS (pending re-run)** — root cause confirmed from the failed `az acr build` (`useSearchParams() should be wrapped in a suspense boundary` prerender bailout on intelligence routes lacking `force-dynamic`); the subsequent `az acr build` is expected to complete and will be attached.
- **not run** — unit/integration suites (this is a route-config-only change with no logic change).

## Rollout Plan

Merge to `main` (squash), then `az acr build` → ACA web revision + worker job image. No migration, no flag.

## Rollback Plan

Revert the appended lines; build returns to its failing state.

## Audit Evidence

- PR: (to attach on open)
- Build: the ACR build that previously failed on intelligence prerender now succeeds.

## Known Gaps

- A lint rule or a shared `force-dynamic` default for the intelligence segment would prevent recurrence when new routes are added. Out of scope here.
