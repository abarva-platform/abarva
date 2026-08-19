# 2026-08-19-v6-v7-dead-code-sweep — fix a live always-failing answer path, remove its dead code

## Release ID

`2026-08-19-v6-v7-dead-code-sweep`

## Status

`candidate`

## Plain-English Summary

An architecture-mapping investigation into confusing "V6/V7" terminology surfaced a real,
currently-live bug: `/api/intelligence/ask` composes a Home-tab answer via
`buildHomeKnowAgentAnswer`, which reads a synthetic dataset manifest
(`V6_GENERATED_MANIFEST.json`) under a per-tenant dataset directory. Every one of those
directories was deleted from the repo months ago as part of the tenant-input-standard cleanup,
and nothing regenerates them. Confirmed directly: the manifest is missing for all six configured
tenants, with no exception. The result is that this code path throws on every single call, for
every tenant, every time a user asks aVa a question while the Home tab is active — caught by an
existing `try/catch` (the log line is literally named `"[home-know.blank-guard]"`, meaning
whoever added that catch already knew this kept firing) and silently downgraded to a fallback
response instead of a real one. This is very likely the mechanism behind the open backlog item
"aVa retrieval returning zero sources for loaded tenants."

The fix: the same route already has direct access to `buildHomeKnowResponse` — the live,
working engine that `/api/home/know/ask` already serves real answers with — so this change calls
that instead of the permanently-broken V6 file path. Same input/output contract
(`HomeKnowAskRequest` → `HomeKnowResponse`), same downstream `homeKnowResponseToAvaAnswer`
composition, no behavior contract change, just a working data source instead of a guaranteed-dead
one.

With that call site fixed, `buildHomeKnowAgentAnswer` had zero remaining callers. Tracing its
dependency chain (and a parallel, self-contained V7 cluster with its own long-standing zero
callers) found eight files with no real importer anywhere in the app — confirmed individually,
not assumed from an earlier audit, since that audit's own hardcoded "active runtime" file list
turned out to already be stale (it still listed some of these as active after they'd already
been fully disconnected). All eight are removed here, along with their test files.

One adjacent area was investigated and deliberately left alone: `v6-context-browser.ts` and its
import chain (`home-summary-runtime.ts`, `home-summary-snapshot.ts`, `home-data-quality.ts`) are
reachable from a real, separate live route (`/api/home/summary-snapshot`) that this change did not
fully trace end to end. Rather than guess, it stays untouched pending its own dedicated
verification.

## Layer Impact

Lane: `global-control-lane`. This is a runtime behavior change on a live, shared product route
(`/api/intelligence/ask`'s Home-tab answer composition), not a data-build script — the first
change this stretch that touches served application behavior rather than an offline generator.

## Client Applicability

- All clients: yes — any tenant asking aVa a question while the Home tab is active previously hit
  the always-failing path and got a degraded fallback; all now get a real answer from the working
  engine.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — this corrects a code path that was unconditionally broken, not a new
  capability being gated in.

## Changes Included

- `src/app/api/intelligence/ask/route.ts` — Home-tab answer composition now calls
  `buildHomeKnowResponse` (from `home-know-engine.ts`) instead of the removed
  `buildHomeKnowAgentAnswer`; import updated accordingly.
- `src/lib/home/know/home-know-agent-answer.ts` — removed `buildHomeKnowAgentAnswer` (its sole
  caller was the route above) and its now-unused imports; kept `shouldUseHomeKnowAgentAnswer` and
  `homeKnowResponseToAvaAnswer`, both still in use.
- Removed (source + test, each individually confirmed to have zero real importers after the
  route fix): `src/lib/home/know/v6-home-ask.ts`, `home-v6-executive-synthesis.ts`,
  `v6-home-know-response.ts`, `v7-home-ask.ts`, `v7-home-know-response.ts`; `src/lib/home/
  v7-context-browser.ts`; `src/lib/intelligence/ask/retrievers/v7-dossier.ts`; `src/lib/tower/
  v7-tower-projection.ts`.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors
  (confirms no remaining reference to any deleted file anywhere in the app).
- `npx eslint` on both changed files — PASS, 0 errors.
- `npx jest --testPathPatterns="src/(app/api/intelligence|lib/home|lib/intelligence)"` — 25 suites
  / 58 tests failing with these changes, versus a same-command baseline on the unmodified branch of
  27 suites / 91 tests failing. The failures on both sides are the same pre-existing,
  environment-gated set (e.g. tests expecting a live Postgres connection this sandbox doesn't
  have) — none are new, and this change measurably *reduced* the failure count rather than adding
  to it.
- Every deletion was individually confirmed via direct import-graph search (not inherited from the
  prior sunset audit's classification, which was found to be stale) before being removed.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image and shifts 100% traffic per the
standard workflow. Because this changes served answer behavior on a live route (not just a
data-build script), a live signed-in proof is required after deploy: ask aVa a question with the
Home tab active for a real tenant and confirm it returns the deterministic Home KNOW answer
instead of the generic blank-guard fallback, and confirm the `[home-know.blank-guard]` warning no
longer appears in fresh logs for that request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the deploy workflow itself (standard path, no ad hoc `az
  containerapp` commands in this change).
- Approved image digest: recorded at deploy time in the workflow's own evidence bundle.
- ACA runtime invariant: verified post-deploy (template image = 100%-traffic revision image)
  before any live-proof claim, same as every deploy this stretch.
- Live signed-in proof required: **yes** — this is the first change this stretch to affect a live
  served route rather than an offline data-build script.

## Rollback Plan

Revert the commit. The reverted state restores the always-failing V6 path and its silent
fallback — i.e., reverting returns to the previously-shipped (broken) behavior, not to a worse
state. No data migration involved; this is pure application code.

## Audit Evidence

PR link recorded at merge. Post-deploy live-proof (screenshot or logged request/response showing
a real Home KNOW answer instead of the blank-guard fallback) to be attached once performed.

## Known Gaps

`v6-context-browser.ts` and its import chain were investigated but deliberately left unchanged —
they are reachable from a real, separate live route (`/api/home/summary-snapshot`) that this
change did not fully trace. Whether that chain has the same class of always-failing bug, or is
genuinely working, is unverified and should be its own dedicated investigation, not a assumption
riding on this change's scope.
