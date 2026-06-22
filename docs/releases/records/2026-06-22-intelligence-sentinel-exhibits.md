# 2026-06-22-intelligence-sentinel-exhibits — Sentinel Ask Exhibits

## Release ID

`2026-06-22-intelligence-sentinel-exhibits`

## Status

`candidate`

## Plain-English Summary

Ask Ava now emits the same structured exhibit event for Sentinel-classified Intelligence answers as it does for the general answer path. This closes the prose-only gap where IT productivity or spend questions could stream reasoning stages but never hand tables or charts to the shared renderer.

## Layer Impact

- `global-control-lane`: shared `/api/intelligence/ask` response behavior changes for all tenants. The route now builds structured exhibits from Sentinel stage prose and citations before emitting `done`.

## Client Applicability

- All clients: yes, any tenant using Ask Ava through the shared Intelligence route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this only emits exhibits when the existing structured-exhibit builder finds renderable grounded data.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: Sentinel reasoning path collects stage citations, builds structured exhibits, and emits an `agent-answer` NDJSON event.
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`: regression coverage for Sentinel exhibit emission.

## QA / Validation

- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and shifts the shared runtime. No migration, data load, DNS, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: no manual ACA mutation.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: verified by the ACA main deploy workflow after merge.
- Worker image invariant: verified by the ACA main deploy workflow after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl plus targeted Ask Ava exhibit proof when signed-in browser/auth state is available.

## Rollback Plan

Revert the route/test commit and redeploy through the repo-owned ACA workflow. Since this release adds an optional event to the stream and does not alter schema or persisted data, rollback is code-only.

## Audit Evidence

- PR: to be added.
- CI: focused Jest command listed above; release gate to be run before PR.
- Runtime proof: pending merge/deploy.

## Known Gaps

The broad post-deploy crawl proves signed-in route coverage, but it does not visually type into the `/intelligence` v2 home Ask box. A targeted signed-in UI proof remains the strongest final evidence for rendered tables/charts.
