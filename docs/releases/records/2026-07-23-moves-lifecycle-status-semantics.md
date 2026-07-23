# 2026-07-23 — Moves Lifecycle Status Semantics

## Release ID

`2026-07-23-moves-lifecycle-status-semantics`

## Status

`deployed; status/apply distinction proven`

## Plain-English Summary

This release fixes the Moves lifecycle backfill status report so dry-run/status rows are labeled as `would_backfill` instead of `backfilled`. The previous operator status run was non-mutating, but the report wording was too easy to misread as an applied backfill.

This release itself did not apply lifecycle state, run the backfill in apply mode, or correct MEMBER
AI ASSIST. After deployment, the approved apply run proved the distinction: apply reports
`backfilled`, while the same workflow rerun reports `skipped:already_processed_for_workflow_run`.

## Layer Impact

- `internal-admin`: Improves operator report semantics for dry-run/status backfill jobs.
- `client-data-lane`: No data-plane mutation in this release.

## Client Applicability

- All clients: No user-facing runtime change.
- Specific clients: Future tenant-explicit status runs receive clearer `would_backfill` labels.
- Internal only: AbarVa operator reporting.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/programs/backfill-deliverable-lifecycle.ts`
  - Status mode now rewrites predicted `backfilled` actions to `would_backfill`.
  - Apply mode still records real `backfilled` rows only after mutation.

## QA / Validation

- PASS: `npm run moves:lifecycle-backfill -- --help`
- PASS: `npx eslint scripts/programs/backfill-deliverable-lifecycle.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PASS: `npm run audit:architecture-rules`
- PASS: `npm run audit:enterprise-naming`
- PASS: `git diff --check`
- PASS: post-deploy authorized apply proof recorded `counts.backfilled=12`:
  `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`.
- PASS: same-workflow idempotency proof recorded
  `counts.skipped:already_processed_for_workflow_run=12`:
  `/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, rerun the tenant-explicit lifecycle status job and confirm the report uses `would_backfill`. Apply-mode jobs must still report real mutation states only after mutation; the approved apply/idempotency proof now confirms that split.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Captured by ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is internal operator reporting only.

## Rollback Plan

Revert this PR and redeploy the previous digest-pinned image. Since no data is mutated, rollback is code-only.

## Audit Evidence

- PR for this release.
- ACA main deploy run for the merged commit.
- Follow-up tenant-explicit status proof showing `would_backfill`.
- Approved apply proof:
  `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`.
- Idempotency rerun proof:
  `/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`.

## Known Gaps

- The reviewed `local-20260723T070210304Z` lifecycle backfill has been applied for the approved
  three-tenant batch only; future tenant batches remain pending.
- No MEMBER AI ASSIST correction has been executed.
