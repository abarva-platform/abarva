# 2026-07-20-db-migration-lab-workflow — Governed database-migration delivery lane

## Release ID

`2026-07-20-db-migration-lab-workflow`

## Status

`released` — the governed lane is live and has completed a real apply against the
shared lab database. Sequence: PR #5156 merged → real `status` dispatch caught a real
bug (`verifyIdle()` missing `"Stopped"`, fixed in #5165) → real `status` dispatch came
back completely clean (run 29784270343, `idleVerified: true`) → per-migration dossiers
built and evidence-backed (owning PR, merge commit, ledger state, why each was pending)
→ real `apply` dispatch (run 29789097644) applied all 3 pending migrations cleanly.
Full detail in QA / Validation and Audit Evidence.

## Plain-English Summary

PR #5135 (`source_stage_guidebooks`) surfaced a real release-engineering gap: the ACA
main-deploy pipeline can ship application code that depends on new schema without ever
applying that schema. Nothing calls the new table today, so it was safe — but a future
migration-backed feature could deploy successfully and then fail at runtime the moment a
route reads or writes the missing column.

This release adds a governed, `workflow_dispatch`-only GitHub Actions workflow
(`.github/workflows/db-migration-lab.yml`) that is the *only* sanctioned way to apply a
migration to the shared lab/production Postgres database. It never runs automatically on
push or merge — a merged migration file sits pending until an operator deliberately
dispatches this workflow and a required-reviewer GitHub Environment approves it. The
workflow runs migrations from inside the exact image currently serving production
traffic (proof that the migration is on `main`, with no separate build step), inside the
existing private-VNet ACA operator job (`job-abarva-private-operator-eus`), using its
Key Vault-managed `DATABASE_URL` secretRef — never a raw connection string in CI.

**A real incident during development of this workflow, and its resolution:** while
sanity-checking the CLI argument shape for this workflow's ACA-job invocation, a command
intended as a local parsing check actually reached this environment's live-authenticated
Azure CLI and started one real (immediately-failed) job execution against the shared
operator job. Investigation confirmed zero risk — the execution never received a
`DATABASE_URL` or any credential, so it could not have reached Postgres even had it
started successfully — but it surfaced two real defects this release fixes:

1. The workflow's draft used three invented per-step container names
   (`db-migrate-status`/`db-migrate-apply`/`db-migrate-verify`) that don't exist on the
   job template (which has exactly two real containers: `private-operator-idle` and
   `db-migrate`). All three steps now use the real name, `db-migrate`.
2. The wrapper (`scripts/ops/submit-aca-operator-job.mjs`) had no way to confirm its own
   idle-restore actually worked, and no way to validate its own command construction
   without real Azure credentials. Both are fixed below.

The one piece of live-infrastructure drift the incident caused — the job's
`replicaTimeout` left at `7200` instead of the documented idle value `1800` — was
restored via a minimal, timeout-only `az containerapp job update` (approved by Anand,
read-before-write, no image/command/args/cpu/memory touched since those were already
correct) and independently re-verified read-only afterward. No database credentials were
ever supplied during the incident or its resolution; no data was read, written, or
touched.

## Layer Impact

- `internal-admin`: this is an operator-facing release-engineering capability, not a
  client-visible product surface. It runs against the same shared Azure Postgres
  instance that `client-data-lane` features ultimately read from, but it ships no
  application code path.
- No product route, UI, or API changes. `run-migrations.ts` and
  `submit-aca-operator-job.mjs` are operator tooling, not runtime dependencies of any
  served request.

## Client Applicability

- All clients: indirectly — this is the lane that will apply schema changes any client
  feature eventually depends on, but this release ships no client-visible behavior.
- Specific clients: none.
- Internal only: yes — GitHub Actions operators with `production` environment approval
  authority.
- Public/demo only: no.
- Feature flag: none — this is a deploy-time/operator capability, not a runtime flag.

## Changes Included

- `.github/workflows/db-migration-lab.yml` (new) — `workflow_dispatch` with `mode`
  (`status`/`apply`, default `status`) and `confirm` (must be exactly `APPLY` for
  `mode=apply`) inputs. Asserts `main` HEAD, resolves the live-deployed image digest
  (no fresh build), runs preflight (`db:migrate:dry`) always, then — `apply` mode only,
  behind the `production` GitHub Environment approval gate — apply (`db:migrate:ci`),
  schema readback (`db:azure:verify`), and an affected-feature health check against
  `${PRODUCTION_BASE_URL}/api/health`. Every run uploads an audit-artifact evidence
  bundle and writes a `$GITHUB_STEP_SUMMARY`.
- `src/scripts/run-migrations.ts` — added `computeFileSha256`/`findMigrationDrift`
  (fails loudly, with a `--force <name>` remediation path, if an already-applied
  migration file was edited post-application) and a Postgres advisory lock
  (`pg_try_advisory_lock`/`pg_advisory_unlock`) serializing concurrent apply attempts.
  The `schema_migrations.sha256` column existed but was dead/unpopulated before this
  change; both INSERT paths now populate it.
- `package.json` — added `db:migrate:ci` (`run-migrations.ts --ci`), needed because the
  operator-job wrapper only accepts a bare npm script name.
- `scripts/ops/submit-aca-operator-job.mjs` — added `--plan-only` (builds the exact `az`
  command sequence and writes it to `plan.json` without ever calling `az` — no
  authentication, no network call, no Azure state touched) and `verifyIdle()` (reads the
  job template back after `restoreIdle()` and throws if container name, image, command,
  args, CPU, memory, or `replicaTimeout` don't match the documented idle contract; wired
  into the existing `finally` block so it runs whether the job succeeded or failed).
- `scripts/ops/__tests__/submit-aca-operator-job.test.ts` (new) — 7 tests driving the
  wrapper via `--plan-only` as a subprocess: never invokes `az`, targets the real
  `db-migrate` container name, redacts `DATABASE_URL` secret-env references from the
  written plan, restore-idle plan matches the documented idle values, and the existing
  digest-pin / script-name guards still fire in plan-only mode.
- `src/scripts/__tests__/run-migrations.test.ts` — extended with drift-detection and
  sha256 unit tests (9 new tests).
- `scripts/ops/submit-aca-operator-job.mjs` (second pass) — `verifyIdle()` extended to a
  golden-idle-state check: parallelism/replicaCompletionCount, no non-terminal execution
  left running/queued, env-var-name/secretRef-name/identity drift vs. a pre-run baseline.
- `src/scripts/print-migration-ledger.ts` (new) — dumps `schema_migrations` as JSON
  (`db:migrate:ledger`), with a single-line JSON block bounded by
  `__DB_MIGRATION_LEDGER_BEGIN__`/`_END__` markers for reliable extraction from
  Azure-log-prefixed output.
- `src/lib/source/stage-guidebooks/verify-repository-readback.ts` (new) — calls the real
  `getSourceStageGuidebook()` function (`db:verify:source-stage-guidebooks`), proving
  "application can use it," not just "schema exists."
- `.github/workflows/db-migration-lab.yml` (second pass) — added Migration ledger,
  Repository readback, and Assemble audit chain steps; records the ACA revision name;
  final sequence: preflight → apply → schema readback → ledger → repository readback →
  affected-feature health → audit chain → run summary.
- `.github/workflows/db-migration-ci-selftest.yml` (new) — full status/plan/apply/schema
  readback/ledger/repository-readback sequence against disposable Postgres, same
  mode/confirm gate and npm scripts as the lab workflow, plus a `--plan-only` invocation
  of the real wrapper. Discloses what it does not prove (ACA transport, restore-idle).
- `.github/workflows/db-migration-lab.yml` (third pass) — "Migration ledger" now runs
  in `status` mode too, not just `apply`. It is a pure read; seeing the full applied-
  migration ledger during preflight (not just the pending list) is real evidence for
  investigating *why* a migration is pending before ever approving an apply.
- `.github/workflows/db-migration-lab.yml` (fourth pass — mode fail-closed hardening):
  a real incident during this release's own apply (a dispatch that omitted `-f
  mode=apply` silently ran `mode=status` instead, because `required: true` with a
  `default:` still lets GitHub Actions fall through to the default on omission)
  motivated this fix.
  - Removed `default: status` from the `mode` input entirely — every dispatch (UI or
    API) must now explicitly choose `status` or `apply`; there is no silent fallback.
  - New "Announce dispatched mode" step, first in the job, prints the resolved mode to
    both the log (`::notice::`) and `$GITHUB_STEP_SUMMARY` before any other logic runs.
  - `mode` added as an explicit field in `audit-chain.json`.
  - Upload artifact name now includes both mode and run id
    (`db-migration-lab-<mode>-<run-id>`), so a downloaded evidence bundle is
    self-describing outside of run context.
- This release record.

## QA / Validation

- `pass` — `npx jest scripts/ops/__tests__/submit-aca-operator-job.test.ts
  src/scripts/__tests__/run-migrations.test.ts` — 47/47 passed.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean.
- `pass` — `npx eslint scripts/ops/submit-aca-operator-job.mjs
  scripts/ops/__tests__/submit-aca-operator-job.test.ts` — clean.
- `pass` — YAML syntax of `db-migration-lab.yml` validated with `js-yaml` (no
  `actionlint` available in this environment).
- `pending` — **mode fail-closed real verification.** After merge, a real
  `workflow_dispatch` omitting the `mode` input should be attempted and confirmed to
  be rejected by the GitHub API (not silently defaulted), proving the fix actually
  closes the gap that caused the earlier silent-status incident. To be updated with
  the real result once run.
- `pass` — **Isolated Postgres integration test**, real `postgres:16-alpine` via Docker:
  full 271-migration replay from zero; drift detection correctly fires exit-1 on a
  tampered already-applied migration file and clears once restored; advisory lock
  correctly blocks a concurrent `db:migrate:ci` with exit-1 while held (verified with a
  genuinely long-lived `pg_advisory_lock` session, not a self-releasing one-shot `psql
  -c`) and succeeds once released.
- `NOT YET PROVEN` — **The real ACA-job pathway end-to-end.** The isolated-Postgres test
  above proves `run-migrations.ts` itself is correct. It does not prove that
  `submit-aca-operator-job.mjs` invoking `db:migrate:ci` inside the real
  `job-abarva-private-operator-eus` ACA job, against the real Azure lab Postgres, via the
  real `azure-postgres-control-database-url` Key Vault secretRef, actually works. Per
  explicit instruction from Anand, this is deliberately **not** attempted via any further
  ad hoc `az` CLI invocation from this environment — the only sanctioned way to exercise
  this pathway now is a real `workflow_dispatch` of the reviewed, merged workflow itself,
  gated by the `production` GitHub Environment approval. That run is the next step after
  this PR merges, and is itself the live proof this gap requires.
- `pass` — `npm run release:check` — all gates pass.
- `pass` — Full CI-self-test sequence run manually, end-to-end, against a fresh local
  `postgres:16` container, using the exact commands the CI self-test workflow runs:
  bootstrap → `db:migrate:dry --allow-destructive` → `db:migrate:ci --allow-destructive`
  (all 271 migrations applied, including both `source_stage_guidebooks` migrations) →
  `db:azure:verify` (271 migrations, 376 tables) → `db:migrate:ledger` (marker-bounded
  JSON correctly identifies the latest migration by name+sha256) →
  `db:verify:source-stage-guidebooks` (repository readback returns the real Strategy
  guidebook: published, 5 sections, version 1 — via the real repository function, not
  raw SQL).
- This run surfaced and fixed a real bug: a from-zero replay trips the
  destructive-pattern scanner on routine `ALTER TABLE ... DROP CONSTRAINT IF EXISTS`
  statements in old migrations, so the CI self-test needs `--allow-destructive` (same
  reasoning `azure-l5-reset-replay.yml` already uses). The lab workflow correctly does
  NOT have this flag — it only ever applies one new, non-destructive migration against
  an already-migrated database.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow (ships this workflow file
and script changes as ordinary repository content — none of this release's own code runs
as part of a request path, so the code deploy itself carries zero runtime risk).
Immediately after merge, the first real use of `db-migration-lab.yml` should be a
`mode=status` dispatch (read-only preflight) against the lab environment to prove the
ACA-job pathway before any `mode=apply` run is attempted — this is the live proof
flagged as outstanding above. Only after that succeeds should `mode=apply` be dispatched
to actually apply the still-unconfirmed `source_stage_guidebooks` migration from PR
#5135.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` ships this
  release's files as ordinary code (no runtime behavior change). The new
  `db-migration-lab.yml` workflow itself is the deploy authority for future database
  migrations — `workflow_dispatch` only, `production` GitHub Environment approval
  required for `mode=apply`, restricted to `main` HEAD.
- Shared runtime mutators: `job-abarva-private-operator-eus` (ACA Job, private VNet) via
  `submit-aca-operator-job.mjs`, invoked only by the new workflow going forward — not by
  ad hoc local `az` commands. The one manual `az containerapp job update` run during this
  release's development (see Plain-English Summary) was a narrowly-scoped, explicitly
  approved, timeout-only correction to restore documented idle state after an
  unintended live-Azure incident during testing — not a precedent for future ad hoc use.
- Approved image digest: this release does not build or promote a new web image; the
  migration workflow resolves whatever digest is currently serving 100% production
  traffic at dispatch time.
- ACA runtime invariant: not applicable — no image/revision change in this release.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not applicable — no client-facing surface.

## Rollback Plan

Revert the merge commit. `db-migration-lab.yml` is `workflow_dispatch`-only and idle
until deliberately invoked, so reverting it has no in-flight effect. The
`run-migrations.ts` changes (drift detection, advisory lock) are additive safety checks
on an existing script — reverting restores the prior (less safe, but functionally
equivalent) behavior. The `submit-aca-operator-job.mjs` changes (`--plan-only`,
`verifyIdle()`) are additive; reverting removes the new safety net but does not change
existing call sites' behavior when `--plan-only` isn't passed.

## Audit Evidence

- PR: to be opened from branch `codex/db-migration-lab-workflow` (or equivalent) against
  `main`.
- Focused Jest log: 47/47 passed (`submit-aca-operator-job.test.ts` +
  `run-migrations.test.ts`).
- Typecheck log: clean.
- Lint log: clean.
- Isolated-Postgres integration evidence: full replay, drift-detection, and
  advisory-lock behavior confirmed against a real local `postgres:16-alpine` container
  (manual verification during development; not yet packaged as an automated
  `run-migrations.integration.test.ts` — see Known Gaps).
- Live-Azure incident evidence: pre-change and post-change `az containerapp job show`
  reads of `job-abarva-private-operator-eus` (recorded in this session's transcript);
  confirms the only field changed was `replicaTimeout` (`7200` → `1800`), no new
  execution was started by the restore, and no `DATABASE_URL` value (only a pre-existing
  Key Vault `secretRef`, unmodified) exists on the job template.
- **Real GitHub Actions run**, not just local verification:
  [db-migration-ci-selftest.yml run 29773166993](https://github.com/abarva-platform/abarva/actions/runs/29773166993)
  — triggered automatically by this PR's own `pull_request` path filter, `conclusion:
  success`, all 17 steps green in 1m21s, including Apply, Schema readback, Migration
  ledger, and Repository readback against a real disposable GitHub Actions Postgres
  service container.
- **Real `status` dispatch #1** ([run 29780099664](https://github.com/abarva-platform/abarva/actions/runs/29780099664)):
  proved the ACA-job → Azure Postgres transport for the first time; surfaced the
  `terminalStatus()` bug (fixed in #5165).
- **Real `status` dispatch #2** ([run 29784270343](https://github.com/abarva-platform/abarva/actions/runs/29784270343)):
  fully clean, `idleVerified: true` both invocations, real migration ledger
  (`totalApplied: 272`, most recent applied 2026-07-18T16:30:26Z) confirming the
  3-migration pending gap and ruling out ledger reset / wrong database / hash mismatch.
- **Migration dossiers**: `deliverable_role_approvals` (PR #5102, merge
  `0c4e6780501701273b1850c0fb19eefd64f4e16b`, deploy run 29716552978 success — code
  live, migration never applied) and `source_stage_guidebooks` + seed (PR #5135, merge
  `02c08d3e28f16d6fe708fb9caaca3c56d3e1547b`, deploy run 29744269332 success — same
  pattern). Both merged after the last successful manual apply (2026-07-18T16:30:26Z);
  root cause is a ~2-day gap in the pre-existing manual `db:migrate` runbook path, not
  a project-wide "deploy never applies migrations" pattern (272 continuously-applied
  ledger entries going back to migration `001` rule that out).
- **`deliverable_role_approvals` defect — precise classification** (corrected
  2026-07-21 after review; an earlier draft of this record's own summary blurred
  "confirmed defect" and "observed incident," which are different claims):
  - Missing production schema: **confirmed** — the table did not exist against the
    live database prior to this release's apply (see the dossier above).
  - Throwing code path: **confirmed** — a controlled reproduction (fresh Postgres, all
    271 pre-apply migrations applied, `deliverable_role_approvals` dropped to match
    the exact live gap) issued the real query `getRoleApprovalSummary()` runs via the
    real `getAzureWriteFluentClient()` and captured the real error:
    `relation "deliverable_role_approvals" does not exist` — exactly what
    `if (error) throw error` (line 146) would throw.
  - Affected gate/artifact combinations: **confirmed** — propagates through
    `meetsApprovalBar` → `governance.ts`'s `design_approved`/`business_case_approved`
    gate checks → `POST /api/v1/programs/:id/advance` and `.../phase-gate-approval`,
    for `business_case`/`target_state_architecture`/`operating_model` deliverables
    only.
  - Observed live production invocation: **not proven.** A Log Analytics search
    (`log-abarva-observability-lab-eastus`, `ContainerAppConsoleLogs_CL`) since the
    #5141 gate-enforcement deploy found zero matching incidents — no real request
    trace, exception, or affected user execution was found.
  - **Precise statement:** the missing table created a confirmed latent runtime defect
    in the gate-evaluation path. The code would throw when the affected gate and
    artifact combinations were evaluated, but no evidence was found that a live
    production user had triggered that exact path before remediation. This release's
    apply closed the gap before any observed incident, not in response to one.
- **Real `apply` dispatch** ([run 29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644),
  2026-07-20T23:53Z–00:10Z, all 17 steps `success`): applied all 3 pending migrations.
  - Apply log: `✓ 3 migrations applied` — `deliverable_role_approvals.sql`,
    `source_stage_guidebooks.sql`, `source_stage_guidebooks_seed_strategy.sql`, in order.
  - Schema readback: `"migrations": 275` (272 + 3, exact match), `"publicTables": 422`.
  - Repository readback (real `getSourceStageGuidebook()` call, not raw SQL):
    `{"ok":true,"stageKey":"strategy","clientKey":null,"title":"Strategy Gate
    Review","status":"published","sectionCount":5,"version":1}` — confirms the table,
    the seeded row, `client_key IS NULL` as designed, `stage_key = "strategy"`, and
    that the real application code path can read it.
  - Affected-feature health: `{"ok":true,"checks":{"postgres":true,
    "direct_postgres":true}}`.
  - Migration ledger post-apply: `totalApplied: 275`, latest entry
    `20260720131500_source_stage_guidebooks_seed_strategy.sql` with real sha256
    `47a741a3b5cafdfeae5a726b5c2d83bb175637970bca34919e7bf7d2044fb012` (matches the
    hash independently computed during local/CI verification earlier).
  - Audit chain: `{"workflowRunId":"29789097644","commitSha":
    "0b59e44bc4612d0fe4402ce86cf13007303ba156","operator":"anandsundaram-hash",
    "migrationName":"20260720131500_source_stage_guidebooks_seed_strategy.sql",
    "migrationSha256":"47a741a3b5...","totalMigrationsApplied":275,
    "databaseTarget":"ca-abarva-web-lab-eastus (rg-abarva-controlplane-lab-eastus)",
    "applicationRevision":"ca-abarva-web-lab-eastus--m0b59e44b","imageDigest":
    "...@sha256:2c88e2d7dcacd95a397e441a8f2e009d0c31f5e7205cbc8a962efe8f60f7f624"}`.
  - Idle verification post-apply: `{"idleVerified":true,"problems":[]}`.
  - Both migrations are purely additive (`CREATE TABLE IF NOT EXISTS`,
    `INSERT ... ON CONFLICT DO NOTHING`) — no existing table, row, or schema touched.

## Known Gaps

- **RESOLVED as of the first real dispatch (2026-07-20, run 29780099664):** the
  ACA-job → Azure Postgres transport is now proven — `db:migrate:dry` ran inside the
  real `job-abarva-private-operator-eus` execution and correctly listed 3 pending
  migrations from the live lab database. The run's overall job status still failed,
  but from a real bug this exposed, not the transport: `verifyIdle()`'s
  `terminalStatus()` list was missing `"Stopped"`, so a genuinely-inactive, two-day-old
  historical execution (`job-abarva-private-operator-eus-zyb14zz`, confirmed unrelated
  via a read-only `az containerapp job execution show`) was misclassified as
  non-terminal. Fixed and covered by two new direct-import unit tests (see the
  follow-up commit). This is exactly why status mode was run before apply.
- **RESOLVED 2026-07-20T23:53Z, run [29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644):**
  all 3 pending migrations applied via `mode=apply`. See Audit Evidence for the full
  readback/repository-readback/health/ledger/audit-chain results. A first apply
  dispatch (run 29788617578) accidentally ran without `-f mode=apply -f confirm=APPLY`
  set, so it silently ran `status` again (harmless — every apply-only step reported
  `skipped`, confirmed via the GitHub Actions API before treating anything as applied).
  The corrected redispatch is the one that actually ran.
- **The isolated-Postgres integration coverage lives in this session's manual testing
  notes, not as an automated test file.** `run-migrations.integration.test.ts` (referenced
  in `run-migrations.test.ts`'s header comment) does not exist yet — a real follow-up if
  this level of coverage should run in CI rather than only having been exercised
  manually once.
- **`environment: production` gates the entire workflow, including `mode=status`.** This
  is intentionally conservative (same approval bar for anything that can reach the
  shared database, even read-only), but means even a preflight check requires the same
  reviewer approval as an apply. If that friction proves too high in practice, a
  narrower gate (approval required only for `mode=apply`) is a reasonable follow-up.
- **Only the lab/shared environment is covered.** Per Anand's original framing, this
  should become a platform-level capability — Moves, Tower, Intelligence, and future
  client data-plane migrations will need the same lane. This release deliberately scopes
  to proving the pattern once (lab environment, Source's own pending migration) rather
  than generalizing it before it has been exercised for real.
