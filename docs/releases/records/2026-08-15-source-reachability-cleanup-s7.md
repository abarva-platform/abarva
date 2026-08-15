# 2026-08-15-source-reachability-cleanup-s7 — Retire Dormant Source Agent Panel

## Release ID

`2026-08-15-source-reachability-cleanup-s7`

## Status

`candidate`

## Plain-English Summary

This release removes one dormant Source canvas component that is no longer reachable from any Source route, script, or test. It keeps the active Source workflow unchanged while reducing obsolete UI code that can confuse future workflow simplification.

## Layer Impact

Layer 4 Products only. The change deletes an unused Source presentation component and updates the Source canvas reachability baseline. It does not touch client intake, source adapters, canonical data, persistence, migrations, or live data-plane behavior.

## Client Applicability

- All clients: Receives the same smaller Source UI bundle after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removed `src/components/source/PersistentNexusPanel.tsx`.
- Updated `docs/architecture/source-canvas-orphans.json` from 96 to 95 unreachable Source canvas files.

## QA / Validation

- PASS: `node scripts/audit/source-canvas-reachability.mjs --update`
- PASS: `node scripts/audit/source-canvas-reachability.mjs`
- Pending: reference sweep, whitespace check, release check, PR checks, merge, ACA deploy, runtime invariant, post-deploy crawl.

## Rollout Plan

Open a pull request, merge to `main` after validation, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting image. No manual Azure runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge to `main`.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Post-deploy Source route smoke/crawl proof required before calling the release live-proven.

## Rollback Plan

Revert the removal commit and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR: Pending.
- Local reachability proof: `node scripts/audit/source-canvas-reachability.mjs`
- Deploy proof: Pending.
- Runtime invariant proof: Pending.
- Post-deploy crawl proof: Pending.

## Known Gaps

The Atlas production CXO gauntlet is currently blocked by the Clerk automation account ban before any tenant turns execute. That is tracked as a separate auth/proof hard gate and is not changed by this Source cleanup release.
