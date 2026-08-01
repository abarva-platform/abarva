# 2026-08-01-foundation-v3-ingest-role-hardening - Isolated Ingest Role Binding

## Release ID

`2026-08-01-foundation-v3-ingest-role-hardening`

## Status

`candidate`

## Plain-English Summary

Adds a targeted database migration for an isolated synthetic lab tenant's ingest identity path. The migration skips non-target replay databases, but on the isolated lab database it refuses to run unless both the existing ingest target role and the existing managed-identity login role are present, then hardens the target role to `NOLOGIN` and grants it to the managed-identity login role.

## Layer Impact

- CLIENT INTAKE: no change.
- SOURCE ADAPTERS: no source parsing or adapter behavior changes.
- CANONICAL MODEL: no canonical records, publications, or baselines are created by this release.
- PRODUCTS: no product surface changes.
- Operations/data-plane identity: adds a narrowly scoped migration script so the existing private operator job can repair the isolated lab ingest role binding through the governed targeted-migration path.

## Client Applicability

- All clients: no.
- Specific clients: one isolated synthetic lab tenant only.
- Internal only: yes, operator/data-plane repair path.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `foundation-v3:migrate:skair-ingest-role:dry` and `foundation-v3:migrate:skair-ingest-role:apply` npm scripts.
- Adds `supabase/migrations/20260801190000_skyharbor_air_ingest_role_hardening.sql`, scoped to the isolated lab database name so fresh replay environments can still validate the full migration set.
- Adds this release record.

## QA / Validation

- Pass: `node -e 'JSON.parse(require("fs").readFileSync("package.json","utf8")); console.log("package.json ok")'`
- Pass: added-line restricted-token scan for this targeted diff.
- Pass: `npm run release:check`

## Rollout Plan

Merge through the protected PR flow, wait for the repo-owned ACA deploy to publish a digest-pinned image, then run the targeted dry/apply scripts from the isolated operator job.

## Deployment Authority

- Repo-owned deploy workflow: required after merge so the targeted migration scripts are present in the worker image.
- Shared runtime mutators: none in this release.
- Approved image digest: set by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: verify template image and 100% traffic revision image after the deploy workflow completes.
- Worker image invariant: targeted operator job execution must use the approved digest-pinned image and restore its idle image after the run.
- Feature/env flag update path: none.
- Live signed-in proof required: no, this release does not alter a product surface.

## Rollback Plan

Run a follow-up migration that revokes `skyharbor_air_ingest` from `"mi-skair-ingest-lab-001"` if the identity binding must be withdrawn. Do not drop either role as rollback.

## Audit Evidence

Evidence is captured under `/Users/anand/Downloads/foundation-v3-phase-a-apply-20260801/identity-readback/` and the targeted migration job output folder.

## Known Gaps

This release only makes the role binding repair available. It does not run source extraction, normalize data, resolve identity, approve candidates, publish a baseline, update Cube, or prove a product surface.
