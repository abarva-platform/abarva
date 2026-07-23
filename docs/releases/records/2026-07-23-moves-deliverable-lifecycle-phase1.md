# 2026-07-23-moves-deliverable-lifecycle-phase1 — Moves Deliverable Lifecycle Phase 1

## Release ID

`2026-07-23-moves-deliverable-lifecycle-phase1`

## Status

`deployed; authorized operator apply proven`

## Plain-English Summary

Adds the governed deliverable lifecycle foundation for Strategic Moves. Role approvals are now
version-scoped, sign-off/write paths emit lifecycle events, authoritative deliverable pointers can
be live-validated against the event log, and a dry-run-first ACA operator backfill script is
available for legacy signed-off rows.

This does not wire the new lifecycle into phase-gate pass/fail semantics. After the code release
deployed, the exact owner-authorized, tenant-explicit legacy backfill was applied through the
sanctioned ACA operator job and rerun to prove idempotency.

## Layer Impact

- `global-control-lane`: application data model foundation for Strategic Moves deliverable
  lifecycle. Adds lifecycle columns and event log, plus widened
  `deliverable_role_approvals` uniqueness to include version.
- `global-control-lane`: Programs/Moves write layer now has `signOffDeliverable()` and
  `completeDeliverable()` write lifecycle events and authoritative pointer fields.
- `internal-admin`: operator job surface adds `moves:lifecycle-backfill` scripts for
  tenant-explicit status/apply runs under the ACA operator job contract.

## Client Applicability

- All clients: schema and write-path foundation applies to all governed Moves deliverables.
- Specific clients: none.
- Internal only: the backfill runner is an operator/admin tool.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260723100000_deliverable_lifecycle_events.sql`
- New helper: `src/lib/programs/deliverable-lifecycle.ts`
- Updated role approvals: `src/lib/programs/deliverable-role-approvals.ts`
- Updated mutations: `src/lib/programs/mutations.ts`
- New backfill runner: `scripts/programs/backfill-deliverable-lifecycle.ts`
- npm scripts: `moves:lifecycle-backfill`, `moves:lifecycle-backfill:status`,
  `moves:lifecycle-backfill:apply`

## QA / Validation

- `npx jest src/lib/programs/__tests__/deliverable-lifecycle.test.ts src/lib/programs/__tests__/deliverable-role-approvals.test.ts src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts src/lib/programs/__tests__/complete-deliverable-actor.test.ts src/lib/programs/playbook/__tests__/design-session-pack-approval-data.test.ts --runInBand` — pass, 32 tests.
- `npx eslint <touched files>` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — patch-related
  errors cleared; local compile still fails on pre-existing missing module resolution for
  `@xyflow/react` and `@dagrejs/dagre` in Home files.
- Post-deploy operator apply proof:
  `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`
  — PASS, `mode=apply`, reviewed workflow/report id `local-20260723T070210304Z`, migration hash
  `ff49c850a9bfe18ac837e7dfab19256d8cfe51f22cb01f86dbd0bdf014dabfcb`,
  `counts.backfilled=12`.
- Post-deploy operator idempotency proof:
  `/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`
  — PASS, same workflow/report id, `counts.skipped:already_processed_for_workflow_run=12`.

## Rollout Plan

Merge via PR to `main`. The repo-owned ACA main deploy workflow may build/deploy the code. The
schema migration must apply before any lifecycle backfill apply run. Backfill is dry-run-first and
tenant-explicit; live apply requires `--reviewed-report-id`.

The reviewed apply for `meridian-health`, `skyharbor-air`, and `first-capital` has now run. Future
tenant batches must repeat the same dry-run, owner-review, apply, proof-bundle, and idempotency
discipline.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR outside normal deployment and future sanctioned ACA
  operator job execution.
- Approved image digest: recorded by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live runtime.
- Worker image invariant: required before running the backfill as an ACA operator job.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this schema/code foundation alone; required before any
  later claim that gates/UI consume the lifecycle model.

## Rollback Plan

Code rollback is a normal PR revert. Schema rollback is intentionally non-destructive: leave the
additive columns/table in place and stop writing them. Reverting the role-approval uniqueness
widening would require collapsing any future version-scoped duplicate rows back to one row per
`(deliverable_id, role)`.

## Audit Evidence

- PRs: #5438 (schema/lifecycle foundation), #5440 (ACA operator bridge), #5443 (dry-run/status
  label semantics), #5461 (owner authorization record).
- Deployed image digest used for the operator apply:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:a2759de6ef44923dceb31ceeb852883de7fb85d971a0d014a705a2359506e481`.
- Focused Jest output and ESLint output from this branch.
- Apply proof bundle:
  `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`.
- Idempotency proof bundle:
  `/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`.

## Known Gaps

- The reviewed three-tenant backfill has been applied; other tenants remain unbackfilled until
  separately dry-run/reviewed/applied.
- No phase-gate evaluation semantics changed.
- Workstreams B/D/E/F/G remain out of scope.
- MEMBER AI ASSIST governed correction is separate Task B and is not executed by this Phase 1 PR.
