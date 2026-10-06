# 2026-10-06 — Canonical Tenant Key for NDA Template Event Scope

## Release ID

`2026-10-06-source-nda-template-event-canonical-fk`

## Status

`candidate`

## Plain-English Summary

An event created before tenant-key canonicalization may retain a declared legacy key. An NDA template publication uses the canonical key. This migration lets the two identify the same tenant while keeping a database foreign key to the exact event. It does not publish a template or approve any NDA.

## Layer Impact

- **Release lane:** `client-data-lane` because the change is a tenant-scoped database relationship and requires a separately governed migration apply.
- **Canonical model:** Adds a generated canonical tenant key to the existing event record for database-enforced relationships. It does not change the declared source key or create a supplier, contract or approval fact.
- **Product projection:** The NDA publication table keeps its canonical tenant key and its event-scoped foreign key. No route or UI behavior is broadened.

## Client Applicability

- All clients: The constraint is installed for all event rows; only a recognized declared alias changes its matching key.
- Specific clients: None named in this public record.
- Internal only: Migration execution is an operator-controlled data-plane action.
- Public/demo only: Existing lab-only publication policy is unchanged.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20261006193500_source_nda_template_event_canonical_fk.sql`
- A focused migration contract test under `src/lib/source/nda/__tests__/`.

## QA / Validation

- Red-first test failed before the migration file existed, then passed after the migration was added.
- A disposable local PostgreSQL 18 cluster reproduced the original FK rejection. With the proposed migration applied locally, the canonical key for a legacy-key event was accepted; a different tenant's event was rejected; changing the referenced event's tenant was rejected.
- Mutation proof: replacing the canonicalizer with the raw key made the focused test fail; restoring it returned the test to green.
- Full local typecheck, NDA suite, release controls and applicable CI are required before merge; record their final results in the PR.

## Rollout Plan

Merge only after applicable CI and review. The repo-owned ACA main workflow may carry the repository change but does not apply this database migration. Apply this one migration only after a separate exact-file authorization and a status/preflight showing the expected pending set. Read back the constraint and replay the exact signed-in publication afterward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this change.
- Approved image digest: Not yet assigned.
- ACA runtime invariant: Prove web template and sole healthy 100%-traffic revision after merge.
- Worker image invariant: Prove both required workers on the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the separately authorized migration apply.

## Rollback Plan

Do not drop the new FK or generated key while published rows may depend on them. Keep publication fail-closed and use the existing governed upload path while an operator reviews any rollback. A compensating migration requires separate review and authorization.

## Audit Evidence

- Local red/green and mutation outputs, disposable-Postgres positive and negative outcomes, PR CI, migration status/apply audit chain, schema readback and signed-in replay.

## Known Gaps

- The migration is authored only. It has not been applied to a shared database, and positive signed-in publication remains unproven.
