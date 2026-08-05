# 2026-08-04-retired-tenant-row-purge — Add Retired Tenant Row Purge Operator

## Release ID

`2026-08-04-retired-tenant-row-purge`

## Status

`candidate`

## Plain-English Summary

This release adds a governed private-operator script for deleting rows that are explicitly scoped to retired tenant keys. It is limited to the approved retired aliases and protects the current `skyharbor_global` tenant by checking that keep-client IDs do not overlap retired-client IDs before any delete can commit. The operator also handles unscoped dependent child rows that reference scoped parent rows through foreign keys, so parent rows are not blocked by child evidence rows that do not carry their own tenant column. Follow-up hardening adds chunked deletes for large tables and scoped trigger overrides for immutable audit-style tables during the approved purge transaction.

## Layer Impact

Client intake and source adapters: no template or intake behavior change.

Canonical model and products: no runtime read-path change in this PR. The script is an internal data-plane operation used after runtime has been moved to the current SkyHarbor foundation.

Operations: adds dry-run, apply, and post-verify proof for tenant-key row retirement.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: applies only to the approved retired tenant keys during an operator run.
- Internal only: AbarVa data-plane operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ops/purge-retired-tenant-rows.mjs`: exact-key row purge operator with dry-run, apply, FK-order retry passes, dependent FK child-row planning, defensive FK metadata guards, chunked large-table deletes, scoped trigger overrides for known immutable audit tables, compact structured proof output, and rollback-on-pending behavior.
- `package.json`: adds dry-run/apply npm entries for the row purge and changes the old data-layer apply script to use `--apply` directly.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-tenant-rows.mjs --validate-only`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --validate-only`
- PASS: `npx eslint scripts/ops/purge-retired-tenant-rows.mjs scripts/ops/purge-retired-data-layers.mjs`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run secrets:staged`
- PASS: a failed pre-fix apply attempt rolled back cleanly and a subsequent read-only inventory confirmed retired rows remained present rather than partially deleted.
- PASS: a post-fix dry-run failure before any delete exposed a malformed FK metadata guard case; the follow-up guard keeps malformed FK metadata out of generated SQL.
- PASS: a subsequent apply attempt rolled back cleanly after exposing large-table statement timeouts, append-only triggers, immutable triggers, and one dependent-artifact foreign-key blocker; this hardening addresses those blockers with chunking, scoped trigger overrides, and dependent FK row planning.
- PASS: a follow-up apply attempt failed closed before commit when the special audit-log delete ran before trigger overrides; this patch moves the scoped trigger override around the special delete and the normal retry loop.
- PASS: a later apply attempt failed closed with eight pending tables. This patch adds child-first ordering for semantic tables, smaller delete chunks, a scoped reference clear for retired move artifacts referenced by deliverables, all-user trigger overrides for program audit tables, and a longer per-statement timeout for large semantic deletes.
- NOT RUN: destructive retired tenant-row apply. That is a separate private ACA operator execution after deploy.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, run the row-purge dry run through the private ACA operator job, review proof, run apply only if the proof is exact-key scoped and `skyharbor_global` remains protected, then run a post-apply verification inventory.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA web image and worker job images through the main deploy workflow only.
- Approved image digest: captured by deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is an internal operator tool. Data-plane proof is required for any subsequent purge execution.

## Rollback Plan

Revert the PR and redeploy through ACA if the tool is defective before execution. If a later apply run commits deletes, restoration requires database backup or a separately approved restore job; this release does not create a product runtime dependency.

## Audit Evidence

- PR URL after creation.
- CI checks on the PR.
- ACA deploy evidence after merge.
- Private operator dry-run/apply/post-verify proof folders for actual retirement runs.

## Known Gaps

The script deletes rows by exact tenant/client scope; it does not scan arbitrary JSON/text payload mentions. The earlier inventory can be rerun with JSON/text scanning if a separate content-reference cleanup is required.
