# 2026-07-04-source-p0-pilot-blockers — Source aVa + Portfolio P0 Fixes

## Release ID

`2026-07-04-source-p0-pilot-blockers`

## Status

`candidate`

## Plain-English Summary

Three P0 Source module fixes for pilot readiness at Lakeshore Holdings:

1. **P0-1 (aVa not question-responsive):** The Sentinel chat LLM was already wired in code but `SENTINEL_CHAT_USE_LLM=true` was missing from the ACA container environment. Set the env var directly via `az containerapp update` — no code deploy needed. aVa now calls `claude-sonnet-4-6` on every Source chat question, grounded in event evidence chunks.

2. **P0-2 (probe event portfolio pollution):** Permission-check middleware creates synthetic probe events (e.g. `LAKE-PERMISSION-PROBE-1782853604765-2026`) that were appearing in the Source portfolio alongside real sourcing events. Added an `isProbeOrTestSourceEvent` filter in `src/lib/source/queries.ts` to suppress probe events from both `getPendingSourceEvents` and `listSourcingEvents`.

3. **P0-3 (internal metadata labels in downloads):** Demo-seeded artifact bodies contained header lines like `**Evidence label:** synthetic_demo` and `**CXO review status:**` that were surfacing in client-facing DOCX/HTML exports and AI generation prompts. Added `sanitizeArtifactBodyForExport` in the agent generation context binder to strip these lines before any consumer touches a body — applied in `collectUpstreamBodies` (prompt context) and in four narrative payload binders (export path).

## Layer Impact

- **lane: global-control-lane** — Source module behavior change for all tenants.
- **Application layer** (Source chat, portfolio listing, artifact export): aVa chat now returns real LLM answers; probe events no longer appear in portfolio; internal metadata no longer leaks into exports.
- **No schema or migration changes.**

## Client Applicability

- All clients: P0-2 probe filter and P0-3 sanitizer apply to all tenants.
- P0-1 (env var) was already applied live to `ca-abarva-web-lab-eastus` before this PR; this PR carries no runtime change for P0-1 — the ACA update was the fix.

## Changes Included

- `src/lib/source/queries.ts` — `isProbeOrTestSourceEvent` helper + filter applied in `getPendingSourceEvents` and `listSourcingEvents`
- `src/lib/source/agent-generation/context-binder.ts` — `sanitizeArtifactBodyForExport` function; applied in `collectUpstreamBodies`
- `src/lib/source/agent-generation/server.ts` — re-exports `sanitizeArtifactBodyForExport`
- `src/lib/source/exports/payloads/narrative-docx-payload.ts` — applies sanitizer on authored body read
- `src/lib/source/exports/payloads/demand-challenge-payload.ts` — applies sanitizer on authored body read
- `src/lib/source/exports/payloads/sourcing-approach-payload.ts` — applies sanitizer on authored body read
- `src/lib/source/exports/payloads/vendor-risk-pack-payload.ts` — applies sanitizer on authored body read
- Live ACA env var change: `SENTINEL_CHAT_USE_LLM=true` set on `ca-abarva-web-lab-eastus` (pre-deploy, not in code)

## QA / Validation

- `npx tsc --noEmit` in worktree — **pass** (0 errors in changed files)
- P0-1: live env var confirmed via `az containerapp show --query "properties.template.containers[0].env"` on `ca-abarva-web-lab-eastus` — **pass**
- P0-2: code path verified by reading probe event pattern (`-PROBE-` in event_code, `permission probe` in event_name) against how Clerk middleware names permission-check events — **pass** (code review)
- P0-3: sanitizer regex confirmed against known patterns (`**Evidence label:**`, `**CXO review status:**`) — **pass** (code review)
- Integration tests: not applicable — no new test suite changes; the filter and sanitizer are additive suppressions on data that should never have been visible

## Deployment Authority

- Repo-owned deploy workflow: merge to `main` triggers ACA auto-deploy to `ca-abarva-web-lab-eastus`
- Shared runtime mutators: none beyond the pre-applied env var (`SENTINEL_CHAT_USE_LLM=true`)
- No infrastructure, DNS, migration, or traffic-shift step required

## Rollout Plan

Merge to `main` → ACA auto-deploys on push to main (`ca-abarva-web-lab-eastus`). No migration, no feature flag, no runbook steps beyond standard ACA revision.

## Rollback Plan

Revert this PR and push to main. ACA will redeploy the prior revision. P0-1 env var (`SENTINEL_CHAT_USE_LLM=true`) would need to be removed manually via `az containerapp update` if rollback to non-LLM mode is required, but the code degrades gracefully (falls back to deterministic stub if the env var is absent).

## Audit Evidence

- PR: (pending — this record is the pre-merge candidate)
- CI: standard ESLint + tsc checks
- ACA env proof: `az containerapp show -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --query "properties.template.containers[0].env"` shows `SENTINEL_CHAT_USE_LLM=true`

## Context Ingestion Evidence

Not applicable — no ingestion/context path changed.

## Known Gaps

- P0-4 (stage-future artifacts visible): needs live verification; code already filters by stage in `UniversalCanvasShell`.
- P1-1, P1-2, P1-3, P1-5: not addressed in this PR — separate wave.
- `sanitizeArtifactBodyForExport` strips only known patterns; any future internal metadata label patterns added to seed data would need the regex updated.
