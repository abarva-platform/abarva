# 2026-06-01-no-auto-action-boundary — No Auto-Action Boundary Gate

## Release ID

`2026-06-01-no-auto-action-boundary`

## Status

`candidate`

## Plain-English Summary

Adds an automated guard that scans agent tools for two safety issues: direct imports of external mutation clients and write-capable tool descriptions that do not require explicit user or human confirmation before side effects. This reinforces the AI-as-advisor posture already documented in ADR-0006.

## Layer Impact

`global-control-lane`: Adds a CI and npm audit gate for shared agent tooling across all clients.

## Client Applicability

- All clients: Agent tool governance applies globally.
- Specific clients: None.
- Internal only: The CI enforcement and audit script are internal engineering controls.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/audit/no-auto-action-boundary.mjs`
- `.github/workflows/no-auto-action-boundary.yml`
- `package.json` audit script wiring
- Agent tool description hardening where required by the new gate

## QA / Validation

- PASS: `npm run audit:no-auto-action-boundary`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merges to `main` as a control-plane CI guard. Once merged, pull requests and pushes to `main` run the no-auto-action boundary workflow automatically.

## Rollback Plan

Revert the PR to remove the workflow, script, package script, and description-only hardening. No database migration or tenant data change is involved.

## Audit Evidence

- PR URL
- CI run for `No Auto-Action Boundary`
- Local audit command output

## Known Gaps

This is a repo-native guard rather than a dependency-cruiser rule because dependency-cruiser is not currently installed or configured in the repository. The enforced behavior matches the backlog intent and can be migrated to dependency-cruiser later if that becomes the standard.
