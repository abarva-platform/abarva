# 2026-10-03-source-nda-synthetic-authority-schema - Lab authority schema

## Release ID

`2026-10-03-source-nda-synthetic-authority-schema`

## Status

`candidate`

## Plain-English Summary

Adds an event-scoped synthetic-admin publication variant to the NDA template authority table. It is distinct from production Legal publication, and this migration does not create any template, signature, supplier communication, or event decision.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 canonical model: adds event scope and immutable admin actor/rationale fields, while retaining the original Legal publication constraint for existing records. Executed-NDA and envelope writes must cite a template applicable to their event.
- Layer 4 Source: no application code is included in this release.

## Client Applicability

- All clients: existing Legal-published versions remain globally applicable within their tenant.
- Specific clients: none.
- Internal only: the synthetic-admin authority is constrained to the lab tenant and one event.
- Public/demo only: no public route.
- Feature flag: no runtime flag changed.

## Changes Included

- `supabase/migrations/20261003170000_source_nda_synthetic_admin_publication.sql`.

## QA / Validation

- PASS: disposable PostgreSQL 16 applied the migration on the existing-shape tables.
- PASS: existing Legal publication and lab synthetic publication inserted under their distinct constraints.
- PASS: a non-lab synthetic row and cross-event executed-NDA and envelope rows were rejected. The existing immutability trigger rejected a post-publication edit.
- PASS: TypeScript, focused tests, ESLint, and all 11 release gates on the combined candidate branch. CI on this isolated migration PR remains separate.
- BLOCKED: shared-database apply needs exact pending-set authorization and readback.

## Rollout Plan

Squash-merge the migration through a PR. The repo-owned main deploy workflow may run for the merge, but it does not apply schema. Apply only through the repo-owned private-network migration workflow after a fresh status and exact-set authorization. Application code depending on the new columns must not merge before applied-schema proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: verify after the main workflow, if it runs.
- ACA runtime invariant: verify web template, sole 100%-traffic revision and required workers after deploy.
- Worker image invariant: same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: after the later application release and migration apply, not from this schema-only merge.

## Rollback Plan

Do not drop the new columns or constraint while published rows or envelope/executed authority may depend on them. If the migration is applied and a defect is found, stop synthetic publication and ship a forward corrective migration. Existing Legal publication remains available.

## Audit Evidence

- PR and CI after creation; isolated-Postgres command results; migration status and apply artifacts after authorization.

## Known Gaps

- The migration is authored only. No shared schema or NDA evidence row was changed by local validation.
