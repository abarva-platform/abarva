# 2026-09-20-source-nda-authority-schema — Stage 05 NDA Authority Storage

## Release ID

`2026-09-20-source-nda-authority-schema`

## Status

`candidate`

## Plain-English Summary

Source can now distinguish an NDA policy that is unavailable from a governed
template register in which Legal has published no applicable version. The
schema also records an NDA waiver only as an explicit, named, time-bound Legal
decision for one event and one declared supplier legal entity. Missing files,
workflow progress, and empty strings never create a waiver.

This candidate authors the schema and its read repository. It creates no
template, waiver, approval, supplier contact, or tenant row.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical authority: adds a versioned NDA template register and
  event-scoped NDA waiver records.
- Layer 4 Source projection: adds a fail-closed repository that returns the
  applicable template versions and waivers for one tenant, event, and declared
  supplier entity.

## Client Applicability

- All clients: the schema contract is shared and tenant-fenced.
- Specific clients: none.
- Internal only: migration execution is an operator-controlled action.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260920003500_source_nda_authority.sql`
- `src/lib/source/nda/nda-authority-repository.ts`
- `src/lib/source/nda/__tests__/nda-authority-repository.test.ts`
- `src/__tests__/integration/source/source-nda-authority-migration.test.ts`

## QA / Validation

- Failing-first proof: focused tests failed because both the migration and
  repository were absent.
- Focused repository and migration suites: 2 suites, 7 tests passed.
- Mutation proof: removing the tenant predicate from the waiver query failed
  the scoped-reader test.
- Disposable PostgreSQL 16 apply proof: migration applied cleanly; the
  authenticated tenant saw one template and one waiver; the opposite tenant
  saw zero of each; published-template and approved-waiver rewrites were both
  rejected; an explicit waiver revocation succeeded.
- TypeScript, scoped ESLint, migration seal, release check, and CI results are
  recorded on the PR.
- No shared database was changed while authoring this candidate.

## Rollout Plan

Squash merge through a PR. Let the repo-owned ACA workflow deploy the exact
main SHA. Run `db-migration-lab.yml` in `status` mode, then in `apply` mode with
the exact `APPLY` confirmation. Read back both relations and their RLS policies
before wiring Stage 05 readiness to the repository.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the governed workflows.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after the repository is mounted on Stage
  05; this candidate alone does not change a visible screen.

## Rollback Plan

Before apply, revert the PR. After apply, leave empty authority tables in place
while callers are disabled; removing governed authority rows or relations
requires a separately approved migration plan. This migration contains no
destructive statement and seeds no rows.

## Audit Evidence

Inspect the migration, repository behavior suite, migration contract suite,
PR checks, governed migration workflow artifacts, schema readback, and runtime
invariant proof.

## Known Gaps

- The migration must be applied separately after merge and deploy.
- No Legal template versions or waivers are seeded.
- Stage 05 does not consume this repository until the schema readback passes.
- Supplier legal-entity selection remains a separate governed authority; this
  repository requires its declared identifier and never derives one from a
  supplier name.
