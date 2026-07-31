# 2026-07-31-skyharbor-air-foundation-v2-phase2-schema-bootstrap — Apply the Foundation V2 knowledge-pipeline schema to skyharbor-air's dedicated Postgres

## Release ID

`2026-07-31-skyharbor-air-foundation-v2-phase2-schema-bootstrap`

## Status

`released`

## Plain-English Summary

Phase 2 of the Tenant Knowledge Execution Program for skyharbor-air: apply the real, tenant-agnostic
Foundation V2 knowledge-pipeline schema — `supabase/migrations/20260729015000_knowledge_publication_consumption_phase3c2e.sql`
(schemas: source_registry, evidence, working, knowledge, metrics, governance, publication, consumption,
audit, operations, RLS keyed on `tenant_key`) — to skyharbor-air's own dedicated Postgres server
(`pg-abarva-skair-lab-eus2-001`), provisioned in the Phase 1 release.

This required resolving a real architectural question first: the only governed migration-apply workflow
in this repo (`db-migration-lab.yml`) is hardcoded to the *shared* control-plane database behind
`ca-abarva-web-lab-eastus`, not any dedicated per-tenant Postgres server. Direction from Anand: the
dedicated skyharbor-air Postgres is authoritative for this lane; the shared workflow is reference
material only; do not enable public network access; do not blindly apply all 301 repository migrations;
build a parameterized private migration job targeting the dedicated server; apply only the approved
schema contract; keep RLS/tenant_key controls as defense in depth even inside a dedicated server; verify
by independent readback from inside the VNet.

Built accordingly: a new, reusable ACA job (`job-skair-private-operator-lab`, added in the Phase 1
release's PR) inside the private VNet, mirroring the existing `job-abarva-private-operator-eus` /
`scripts/ops/submit-aca-operator-job.mjs` pattern rather than a bespoke one-off. Applied via
`db:migrate:ci` scoped to exactly one file with `MIGRATION_FORCE_NAME` — not the full migration ledger.

## Layer Impact

**Release lane: `client-data-lane`.**

- Layer 3 (canonical model) schema only. No tenant facts inserted — the migration's own header states
  "Tenant-agnostic Azure/Postgres migration artifact. No tenant facts are inserted here." No product
  surface reads this database yet.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

No code changes in this specific action (the ACA job and readback script were added in the Phase 1
PR/commit history on `feat/skyharbor-air-foundation-v2-phase1-iac`). This record documents a live
database state change:

- Set `DATABASE_URL` as an Azure Container Apps secret (`database-url`) directly on
  `job-skair-private-operator-lab` — not embedded in any file, not Key-Vault-backed (the dedicated Key
  Vault is private-network-only and unreachable from outside the VNet; ACA job secrets are a separate,
  directly-settable resource property).
- Ran `npm run ops:aca-job -- --script db:migrate:ci --job job-skair-private-operator-lab --resource-group
  rg-abarva-skair-lab-eus2-001 --container db-migrate --secret-env DATABASE_URL=database-url --env
  MIGRATION_FORCE_NAME=20260729015000_knowledge_publication_consumption_phase3c2e.sql` — applied exactly
  one migration file against `abarva_skyharbor_air_knowledge_lab`.

## QA / Validation

- Apply-time log: `Pending migrations (1): - 20260729015000_knowledge_publication_consumption_phase3c2e.sql`
  → `✓ Applied 1 pending migration: 20260729015000_knowledge_publication_consumption_phase3c2e.sql`. Not
  trusted alone — see independent readback below.
- **Independent readback**, a separate execution/DB connection (`db:migrate:ledger`), not a re-read of
  the apply logs: `{"totalApplied":1,"latest":{"name":"20260729015000_knowledge_publication_consumption_phase3c2e.sql","sha256":"f007f6d3cb9b4bc233a3469d9997444bb8f1758e22f70185888f3b3946a0f970",...}}`.
- Recorded sha256 cross-checked against the on-disk file with `shasum -a 256` locally — matches exactly
  (`f007f6d3...a0f970`), confirming the exact current file content ran, not a stale or tampered copy.
- The ACA job's own idle-restore self-check (`verifyIdle()` in `submit-aca-operator-job.mjs`) confirmed
  the job returned to its documented idle state after both the apply and the readback runs.
- `node scripts/release-check.mjs` — passed (no release-relevant files changed by this specific record's
  action; the code that made this possible was already covered by the Phase 1 record).

## Rollout Plan

No code rollout — this is a live database schema change, already applied and verified above. No product
surface consumes this schema yet, so nothing downstream is affected by this release landing.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — applied via the ad-hoc ACA operator job pattern
  (`scripts/ops/submit-aca-operator-job.mjs`), the same mechanism `db-migration-lab.yml` itself uses
  under the hood, just pointed at skyharbor-air's own job/resource group instead of the shared one.
- Shared runtime mutators: None. This action touches only skyharbor-air's dedicated, isolated Postgres
  server — no shared database, no `app.abarva.ai` traffic, no existing ACA revision.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:a0e08d55d1531529986a5da55eba88a5f3be003e91b6fb2b57b1e52bc982ddb5`
  (same digest as Phase 1 — the currently-deployed `main` image at time of execution).
- ACA runtime invariant: Not applicable.
- Worker image invariant: The private-operator job's idle state was restored and independently
  self-verified after this run (see QA section).
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

`npx tsx src/scripts/run-migrations.ts --force 20260729015000_knowledge_publication_consumption_phase3c2e.sql`
does not itself provide a down-migration; the rollback path is dropping the 10 schemas directly
(`DROP SCHEMA ... CASCADE` for source_registry, evidence, working, knowledge, metrics, governance,
publication, consumption, audit, operations) via the same private-operator job, or — since no product
data has landed and no downstream consumer exists yet — simply leaving the schema in place and not
proceeding to Phase 3 until any concern is resolved. No data-loss risk either way.

## Audit Evidence

- Apply logs, ledger readback output, and the local sha256 cross-check — all captured in this record's
  QA section.
- `docs/ops/skyharbor-air-foundation-v2-extension-scope.md` and
  `docs/ops/dual-tenant-knowledge-execution-program.md` — updated with the same evidence.

## Known Gaps

- Deeper readback (confirming RLS is actually enabled per table, confirming every representative table
  exists, not just the migration-ledger record) is written
  (`scripts/knowledge/verify-tenant-knowledge-schema.mjs`) but cannot run yet: the ACA job's
  digest-pinned image predates this branch's commits, and images are only built by the governed
  `aca-main-deploy.yml` workflow off `main`, never ad hoc. This is a real, structural sequencing
  constraint, not an oversight — run it once this branch merges and a new image builds.
- Phase 3 onward (source landing, parse, canonical assembly, graph/metrics, publication, product
  certification) has not started.
