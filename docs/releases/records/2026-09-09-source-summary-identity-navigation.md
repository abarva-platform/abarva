# Source summary identity and navigation polish

## Release ID

`2026-09-09-source-summary-identity-navigation`

## Status

`candidate`

## Plain-English Summary

Keep completed Source-event summaries audit-readable by using a canonical email when a person record has only a generic placeholder name, preserving historical-stage navigation, and labeling the event return link for its actual Source 360 destination.

## Layer Impact

- Layer 4 product projection, `global-control-lane`: Source approval-ledger presentation and event navigation only.
- No intake, adapter, canonical data, schema, cube, corpus, or tenant-data mutation.

## Client Applicability

All clients using Source event approvals. Person resolution remains tenant-scoped through the existing canonical approval record and person lookup.

## Changes Included

- Prefer a canonical person email over generic names such as `User`, `Admin`, or `Unknown`.
- Keep non-placeholder display labels as the primary identity choice.
- Rename the event return link from `All Source events` to `Source 360`, matching its existing `/source/workspace` destination.
- Preserve the requested stage and workspace when a completed event redirects into its read-only summary.
- Add focused loader, lifecycle-routing, and navigation contract tests.

## QA / Validation

- PASS: focused approval-ledger loader, lifecycle-routing, and Source route-shell tests (21 Jest tests and 4 Playwright route-contract tests).
- PASS: scoped ESLint and full TypeScript checks.
- PASS: `npm run release:check` and `git diff --check`.
- NOT RUN: live signed-in completed-event summary proof; required after deployment.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Verify the completed-event ledger shows a useful canonical identity and the return link reads `Source 360`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: template image, active revision, and worker images must match.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. Approval records and Source-event lifecycle data are unchanged.

## Audit Evidence

- Focused test output, PR, merge SHA, ACA deploy run, runtime invariant, and signed-in summary proof.

## Known Gaps

Historical stages without a stage-level approval record continue to disclose that the approver was not recorded.
