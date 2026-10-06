# 2026-09-20-source-event-candidate-supplier-authority — Explicit Candidate Panel Authority

## Release ID

`2026-09-20-source-event-candidate-supplier-authority`

## Status

`candidate`

## Plain-English Summary

Adds the governed record that explicitly accepts one supplier legal entity into
one sourcing event's candidate panel. The record requires a named accepter, a
timestamp, rationale, and evidence reference. Supplier invitation, response,
recommendation, and award fields cannot create this authority by implication.

This candidate authors empty shared schema and a fail-closed reader. It creates
no supplier, contact, event, candidate, communication, or tenant-data row.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical authority: adds immutable, event-scoped candidate-panel
  acceptance linked to the governed Source event and supplier legal entity.
- Layer 4 Source projection: adds a tenant-scoped repository that returns only
  explicitly accepted, non-retired candidate authorities.

## Client Applicability

- All clients: the empty schema contract is shared and tenant-fenced.
- Specific clients: none.
- Internal only: migration execution remains operator controlled.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260920012000_source_event_candidate_supplier_authority.sql`
- `src/lib/source/candidate-suppliers/event-candidate-authority-repository.ts`
- `src/lib/source/candidate-suppliers/__tests__/event-candidate-authority-repository.test.ts`
- `src/__tests__/integration/source/source-event-candidate-supplier-authority-migration.test.ts`

## QA / Validation

- Focused repository and migration suites: 2 suites, 7 tests passed.
- The repository query contains no invitation, response, or recommendation
  status and joins the accepted authority to `source.vendor` legal identity.
- TypeScript and scoped ESLint pass with the repository tests included.
- Disposable PostgreSQL apply and mutation proof are recorded on the PR.
- No shared database was changed while authoring this candidate.

## Rollout Plan

Squash merge through a protected PR and let the repo-owned ACA workflow deploy
the exact main SHA. Apply through `db-migration-lab.yml` only after a fresh
status readback and explicit authorization for the full pending migration set.
Read back the relation, constraints, policies, empty tenant slices, and
opposite-tenant denial before mounting it in Source New.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside governed workflows.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after a Source New consumer is mounted;
  this candidate alone changes no visible page.

## Rollback Plan

Before apply, revert the PR. After apply, leave the empty authority relation in
place while callers are disabled. Removing a governed authority relation or
records requires a separately approved migration plan.

## Audit Evidence

Inspect the migration and repository suites, PostgreSQL apply proof, PR checks,
governed migration workflow artifacts, schema/RLS readback, and runtime
invariant proof.

## Known Gaps

- The migration is authored but not applied.
- No candidate authorities or supplier contacts are seeded.
- The Source New candidate panel does not consume this repository yet.
- Candidate-panel acceptance is not award selection and does not authorize
  supplier contact.
