# 2026-08-04-retired-tenant-row-purge — Add Retired Tenant Row Purge Operator

## Release ID

`2026-08-04-retired-tenant-row-purge`

## Status

`candidate`

## Plain-English Summary

This release adds a governed private-operator script for deleting rows that are explicitly scoped to retired tenant keys. It is limited to the approved retired aliases and protects the current `skyharbor_global` tenant by checking that keep-client IDs do not overlap retired-client IDs before any delete can commit. The operator also handles unscoped dependent child rows that reference scoped parent rows through foreign keys, so parent rows are not blocked by child evidence rows that do not carry their own tenant column. Follow-up hardening adds chunked deletes for large tables, scoped trigger overrides for immutable audit-style tables, child-first semantic delete ordering, staged commit mode for large purge runs, targeted purge indexes for large scoped tables, smaller compact proof output that can be extracted from ACA logs, final-only deletion of client registry rows so staged passes do not lose the client-id scope they still need for later counts, configurable delete chunk size plus per-operation statement timeout for long final drains, dry-run pending-table counts in compact proof, a read-only residue distribution audit, a focused final-residue purge for the five directly tenant-keyed context/semantic tables that remained slow through the generic planner, child-side FK index preparation for slow semantic parent deletes, and a zero-keep guarded table-truncate path that covers old context/semantic base tables and truncates them only when tenant-scoped tables contain no current-tenant rows.

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

- `scripts/ops/purge-retired-tenant-rows.mjs`: exact-key row purge operator with dry-run, apply, FK-order retry passes, dependent FK child-row planning, defensive FK metadata guards, targeted purge indexes, chunked large-table deletes, configurable chunk size and per-operation statement timeout, scoped trigger overrides for known immutable audit tables, staged table-level commits with partial-progress proof, compact structured proof output, preserved run-level client-id scope, final-only client registry deletion, and an explicit `--atomic` fallback for the earlier all-or-nothing transaction behavior.
- `scripts/ops/audit-retired-tenant-residue.mjs`: read-only residue audit for the concentrated final tables, including total rows and tenant-key distributions.
- `scripts/ops/purge-retired-tenant-residue.mjs`: focused final-residue purge for the five audited direct `tenant_key` tables, with explicit retired-key predicates, per-table expression indexes, child-side FK index preparation, chunk-level progress output, a guarded table-truncate mode that covers `semantic2_*` / `enterprise_context_*` base tables and refuses any current-tenant rows, dry-run/apply modes, budget controls, and before/after proof.
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
- PASS: a later apply attempt reached the ACA execution timeout without a structured blocker list and restored the private operator job to idle. This patch changes the default apply strategy to staged commits with bounded per-operation chunks and final proof fields for `completed`, `budgetExhausted`, and remaining pending rows.
- PASS: a staged apply attempt committed partial progress but remained too slow and emitted compact proof too large for tail extraction. This patch adds targeted expression indexes for large scoped tables, shorter per-operation statement timeout, smaller delete chunks, progress events, and a 20-row cap for compact pending proof.
- PASS: indexed staged apply through the private operator committed partial progress, reduced retired residue from 138 tables to 10 tables, and restored the operator to idle, but a follow-up aggressive pass exposed that client registry rows must not be deleted before all other scoped rows are gone. This patch preserves the initial client-id scope for the whole run and defers client registry deletion until it is the only remaining scoped operation.
- PASS: a final drain attempt on the remaining direct tenant-key rows progressed safely but showed that fixed 1,000-row chunks were too slow for the last large semantic tables. This patch makes chunk size and per-operation statement timeout configurable and stamps those settings in the proof.
- PASS: follow-up dry-runs exposed that compact proof totals were not enough to choose the next purge primitive for concentrated residue. This patch includes the top dry-run pending table names and row counts in compact proof output.
- PASS: the final residue is concentrated in five direct-scoped tables. This patch adds a read-only tenant-distribution audit so operators can decide whether a table can be safely handled with a faster table-level operation or must continue through row-level deletes.
- PASS: the read-only residue audit showed the final residue tables are direct `tenant_key` tables with no keep-tenant values in the audited tenant column. This patch adds a focused final-residue purge so operators can remove only the approved retired keys from those five tables without the broad generic planner overhead.
- PASS: a focused apply deleted the enterprise context residue quickly but showed `semantic2_facts` parent deletes were slowed by per-row referential checks. This patch prepares child-side FK indexes before deleting each target table.
- PASS: a follow-up focused apply with child-side FK indexes still progressed at roughly minutes per chunk on semantic parent tables. This patch adds an explicit table-level truncate option that refuses to run unless all five target tables have zero `skyharbor_global` rows, uses no `CASCADE`, and records total rows before/after in proof.
- PASS: the first guarded table-truncate attempt failed closed because PostgreSQL found dependent foreign-key tables outside the original five-table list. This patch resolves the dependency closure through Postgres catalogs, allows only old context/semantic table names, keeps the no-`CASCADE` behavior, and refuses to truncate any tenant-scoped dependency with current-tenant rows.
- PASS: the dependency-closure attempt also failed closed because the live database still had old context/semantic dependency tables outside the five-table list. This patch broadens the guarded truncate candidate set to all `public.semantic2_*` and `public.enterprise_context_*` base tables while preserving the current-tenant row refusal and no-`CASCADE` fail-closed behavior.
- NOT RUN in this PR revision: final-only-client-delete destructive apply. That is a separate private ACA operator execution after deploy.

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
