# 2026-09-20-source-executed-nda-authority — Executed NDA Meaning

## Release ID

`2026-09-20-source-executed-nda-authority`

## Status

`candidate`

## Plain-English Summary

An NDA file in the Source cabinet no longer has to stand in for legal meaning
that the file record does not contain. This candidate adds one immutable,
tenant-scoped authority record linking an executed NDA artifact to its event,
declared supplier legal entity, Legal-published template version, scope,
validity window, execution time, uploader, and recorder. A filename, title, or
supplier-name string cannot create coverage.

This candidate creates no executed NDA, signature, approval, supplier
selection, template publication, waiver, or tenant row.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical authority: adds the governed meaning of an executed NDA
  while retaining the existing File Cabinet artifact as the byte-level record.
- Layer 4 Source projection: extends the fail-closed NDA authority reader with
  current, hashed, exact-type executed NDA records for one event and supplier
  legal entity.

## Client Applicability

- All clients: shared tenant-fenced schema and reader contract.
- Specific clients: none.
- Internal only: migration execution is an operator-controlled action.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260920010000_source_executed_nda_authority.sql`
- `src/lib/source/nda/nda-authority-repository.ts`
- `src/lib/source/nda/__tests__/nda-authority-repository.test.ts`
- `src/__tests__/integration/source/source-executed-nda-authority-migration.test.ts`

## QA / Validation

- Failing-first proof: repository behavior failed without executed NDA rows,
  and the migration suite failed while the relation was absent.
- Focused repository and migration suites: 2 suites, 7 tests passed.
- Disposable PostgreSQL 16 proof: both NDA authority migrations applied;
  one authenticated tenant saw its row and zero opposite-tenant rows; a
  material rewrite was rejected; explicit retirement succeeded.
- The insert trigger rejected anything that was not a current, hashed
  `nda_executed` artifact bound to the same event and tenant.
- TypeScript, scoped ESLint, migration seal, release check, and CI results are
  recorded on the PR.
- No shared database was changed while authoring this candidate.

## Rollout Plan

Squash merge through a PR and deploy the exact main SHA through the repo-owned
ACA workflow. Apply only through the governed database-migration workflow after
its preflight names the approved pending set. Read back the relation, policies,
foreign keys, and tenant behavior before mounting it on Stage 05.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside governed workflows.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after Stage 05 consumes the authority;
  this candidate alone changes no visible screen.

## Rollback Plan

Before apply, revert the PR. After apply, leave the empty relation in place and
disable callers; dropping an authority relation or deleting authority rows
requires a separately approved migration plan. This migration is additive and
seeds no rows.

## Audit Evidence

Inspect the migration and repository behavior suites, disposable PostgreSQL
proof, PR checks, governed migration artifacts, schema readback, and exact-SHA
ACA runtime evidence.

## Known Gaps

- The schema must be applied separately after merge and deploy.
- No executed NDA authority rows are seeded.
- Candidate supplier selection still needs a governed event-scoped reader.
- Stage 05 remains unmounted until the physical schema and both authority
  readers are proven.
