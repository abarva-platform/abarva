# 2026-09-20-source-nda-waiver-supplier-authority — Bind Waivers to Governed Supplier Identity

## Release ID

`2026-09-20-source-nda-waiver-supplier-authority`

## Status

`candidate`

## Plain-English Summary

Closes an identity gap before the NDA authority schema is applied. An NDA
waiver now has to reference a supplier legal entity already present in the
tenant's governed `source.vendor` registry. A free-form or nonexistent supplier
identifier cannot become waiver authority.

The migration refuses to apply if any existing waiver cannot resolve. It does
not repair, infer, seed, or rewrite supplier identity.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical authority: adds the missing supplier-identity foreign key
  to the event NDA waiver relation.
- Layer 4 products: no visible surface changes in this release.

## Client Applicability

- All clients: the shared authority constraint is tenant-scoped.
- Specific clients: none.
- Internal only: migration execution is operator controlled.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260920014000_source_nda_waiver_supplier_authority.sql`
- `src/__tests__/integration/source/source-nda-waiver-supplier-authority-migration.test.ts`

## QA / Validation

- Focused migration contract suite passes.
- Disposable PostgreSQL proof applies against the preceding NDA authority
  migration, accepts a governed entity, and rejects an absent entity.
- Full migration replay, TypeScript, ESLint, release check, migration seal, and
  disclosure scan results are recorded on the PR.
- No shared database was changed while authoring this candidate.

## Rollout Plan

Squash merge through a protected PR and deploy through the repo-owned ACA
workflow. Include this migration in the final full-set migration status and
explicit authorization packet. Apply only through `db-migration-lab.yml`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside governed workflows.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no for the constraint alone; required after
  Stage 05 consumes the authority.

## Rollback Plan

Before apply, revert the PR. After apply, retain the identity constraint. Any
constraint removal or data correction requires separate approval and evidence.

## Audit Evidence

Inspect the migration suite, PostgreSQL proof, PR checks, migration workflow
artifact, constraint readback, and final Stage 05 signed-in proof.

## Known Gaps

- Migration apply and database readback are pending.
- The constraint does not itself accept a supplier into an event candidate
  panel; that remains a separate authority.
