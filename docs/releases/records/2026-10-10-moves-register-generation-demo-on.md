# 2026-10-10 — Turn on register-governed generation for the synthetic demo tenant

## Release ID

`2026-10-10-moves-register-generation-demo-on`

## Status

`candidate`

## Plain-English Summary

The register-governed generation path (`2026-10-10-moves-assumption-register-generation`) shipped with its flag off for every tenant. It was to be turned on once two things were true: the register migration had been applied, and the demo Move's register had been populated. Both are now true. The migration was applied through the migration lab lane. The demo register was seeded through the governed operator job, with a named person's load approval and a stored proof bundle: 16 rows created, 4 confirmed, readback passed.

This change adds the synthetic demo tenant to `moves_assumption_register_generation_v1`. For that tenant, Move documents now cite register working figures as `[A:ID]`. A figure with neither evidence nor a matching register row blocks the document. Nothing changes for any other tenant.

## Layer Impact

- Release lane: `global-control-lane`, feature flag enrolment only.
- Layer 4 products: generation for Moves documents reads layer-3 register rows. No code, schema or data changes here.

## Client Applicability

- All clients: no change. The flag stays off.
- Specific clients: the synthetic demo tenant only.
- Feature flag: `moves_assumption_register_generation_v1`. It requires `moves_assumption_register_v1`, which the demo tenant already has.

## Changes Included

- `src/lib/features/registry.ts`: the flag's include list gains the demo tenant, and its summary records why.
- Generated manual refresh.

## QA / Validation

- The generation path's own suites and mutation results are recorded in its release record.
- Seed apply proof: validation passed (16 of 16 rows found, 4 confirmed, owner roles only), the quality gate passed, and a dry-run re-check plans 0 writes.
- `release:check`, the feature-flag suites and the manual check pass.

## Rollout Plan

Merge, then the repo-owned ACA deploy runs. Then generate one P3 or P4 document for the demo Move and check that it carries `[A:ID]` citations and the register table.

## Deployment Authority

Repo-owned ACA main deploy workflow only.

## Rollback Plan

Remove the tenant from the include list and redeploy. Generation falls back to the earlier path. Register rows stay. They are append-only and unaffected.

## Audit Evidence

- This PR and its merge commit.
- The seed job runs: the apply, and the idempotency dry run.
- The proof bundle in the private Blob proof container under `moves-demo-assumption-register-seed/runs/`.

## Known Gaps

- Not live-proven until a signed-in generation is captured for the demo Move.
