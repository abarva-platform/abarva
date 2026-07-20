# 2026-07-20-db-migration-lab-workflow — Governed database-migration delivery lane

## Release ID

`2026-07-20-db-migration-lab-workflow`

## Status

`candidate` — code reviewed and merge-ready. **The real ACA-job pathway to the live
Azure lab database has not yet been exercised end-to-end via this workflow.** No
migration has been applied through this lane. See QA / Validation and Known Gaps.

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
- `pending` — `npm run release:check`, to run before PR.

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

## Known Gaps

- **The real ACA-job → Azure Postgres pathway has not been proven end-to-end.** See the
  `NOT YET PROVEN` line in QA / Validation. This must be closed with a real
  `mode=status` dispatch of this workflow before any `mode=apply` run is attempted.
- **The `source_stage_guidebooks` migration from PR #5135 has still not been applied to
  any real environment.** This release only builds the lane; it does not use it yet. The
  guidebook feature and any UI reading `source_stage_guidebooks` remain correctly
  dormant until a `mode=apply` run confirms the table, seed row, and repository read
  path via `docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`'s
  own outstanding verification steps.
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
