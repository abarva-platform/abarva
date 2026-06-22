# 2026-06-22-intelligence-all-tenant-ask-guard — All-tenant Intelligence ask expert guard

## Release ID

`2026-06-22-intelligence-all-tenant-ask-guard`

## Status

`candidate`

## Plain-English Summary

Adds a regression guard at the streamed Intelligence ask boundary so Ava's visible expert chips stay tenant-appropriate across the pilot tenant set. This protects against a repeat of a retail answer showing a healthcare expert, or an airline answer losing its airline expert, even when lower-level router tests pass.

## Layer Impact

- `global-control-lane`: shared Intelligence ask API test coverage changes for all tenants.
- `client-data-lane`: no client data, schema, migration, ingestion, or retrieval-store change.

## Client Applicability

- All clients: yes, this guards the shared Intelligence ask route.
- Specific clients: Apex Retail Group, SkyHarbor Air, Meridian Health System, First Capital, and Lakeshore Holdings are explicitly covered.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; this is a deterministic regression guard.

## Changes Included

- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`: adds an all-tenant streamed `agent-answer` matrix that verifies the visible expert-chip family and blocks cross-vertical expert leakage.

## QA / Validation

- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — passed.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and shifts the new image. No manual data migration or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout after merge.
- Shared runtime mutators: none.
- Approved image digest: captured by ACA deploy evidence after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: deploy workflow updates worker jobs to the same image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, post-deploy crawl plus targeted signed-in Intelligence ask verification before declaring browser-proven.

## Rollback Plan

Revert the PR if the guard creates an unexpected CI issue. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy run: pending.
- Post-deploy crawl: pending.

## Known Gaps

This is a deterministic regression guard, not a browser proof. Lakeshore remains `DIVERSIFIED` and intentionally has no single vertical ExpertPack fence until product chooses a precise vertical mapping.
