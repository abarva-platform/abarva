# 2026-06-02-home-admin-docs-cleanup — Home/Admin Docs Cleanup

## Release ID

`2026-06-02-home-admin-docs-cleanup`

## Status

`candidate`

## Plain-English Summary

This release updates the Home refinement execution package and setup snapshot generator so they match the current product direction: Home is for insights, decisions, actions, outcomes, and learning; Admin is for setup operations such as users, connectors, templates, tenant configuration, and data-load controls. It removes stale guidance that would route setup/admin work into Home.

## Layer Impact

- `internal-admin`: Updates internal execution docs and an audit snapshot generator used by operators and agents.
- `global-control-lane`: Clarifies route expectations for Home/Admin surfaces without changing live routing behavior in this PR.

## Client Applicability

- All clients: Indirectly, through clearer Home/Admin execution guidance.
- Specific clients: None.
- Internal only: The changed package and snapshot generator are internal/operator-facing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/build/home-refinement-package/README.md`
- `docs/build/home-refinement-package/ROUTE_MIGRATION.md`
- `docs/build/home-refinement-package/ACCEPTANCE_CRITERIA.md`
- `docs/build/home-refinement-package/master-prompt.md`
- `docs/build/home-refinement-package/claude-code-runbook.md`
- `docs/build/home-refinement-package/NAV_REORGANIZATION.md`
- `docs/build/home-refinement-package/DOWNSTREAM_PACKAGE_UPDATES.md`
- `src/scripts/audit/render-setup-home-snapshot.ts`

## QA / Validation

- PASS: `rg -n "Eight panels|Setup panels|Configure group|Explore / Configure|/home/data-trust|/home/connectors|/home/agent-readiness|/home/configuration|/home/tenant-profile|Setup -> Home|renames everything to Home|/setup/.*home|destination: '/home|/home/\\$1|/setup/\\*.*?/home" docs/build/home-refinement-package src/scripts/audit/render-setup-home-snapshot.ts` returns no stale setup-to-Home guidance; remaining `/home` mentions are intentional canonical Home routes.
- PASS: `npx eslint src/scripts/audit/render-setup-home-snapshot.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. There is no runtime app change in this PR; the change affects internal execution guidance and generated audit snapshot wording.

## Rollback Plan

Revert the PR to restore the prior package wording and snapshot copy.

## Audit Evidence

- PR URL: pending.
- Local validation commands: grep audit, ESLint, `git diff --check`, and `npm run release:check`.

## Known Gaps

Historical audit docs and release records may still mention older `/home/*` setup aliases for traceability. This PR does not rewrite historical records.
