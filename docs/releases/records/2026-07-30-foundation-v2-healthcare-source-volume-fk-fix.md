# 2026-07-30-foundation-v2-healthcare-source-volume-fk-fix - Fix Source-Volume Load Ordering

## Release ID

`2026-07-30-foundation-v2-healthcare-source-volume-fk-fix`

## Status

`candidate`

## Plain-English Summary

The Healthcare Foundation V2 source-volume loader now writes parent source rows before child field values when processing large files. This fixes the first live source-volume apply failure, where a field batch could flush before its parent row batch and trigger a database foreign-key rejection.

The loader also defaults proof output to the container temp directory so ACA operator jobs can emit proof bundles without requiring a custom writable path.

## Layer Impact

Layer 1 and Layer 2 data-plane tooling for the isolated Foundation V2 Healthcare lane. The change affects source release landing and parsed field preservation only.

It does not create canonical objects, review decisions, publications, baselines, projections, Cube objects, product bindings, signed-in Knowledge proof, or aVa packet proof.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 Healthcare isolated execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/load-healthcare-source-volume-db.mjs` - flushes source record batches before their associated field-value batches and adds a focused self-test for the large-field row case.
- `scripts/foundation-v2/load-healthcare-source-volume-db.mjs` - defaults source-volume proof output to `/tmp` through `os.tmpdir()`.
- `docs/releases/records/2026-07-30-foundation-v2-healthcare-source-volume-fk-fix.md` - records the release lane, validation, rollout, and rollback.

## QA / Validation

- Pass: `node --check scripts/foundation-v2/load-healthcare-source-volume-db.mjs`.
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/load-healthcare-source-volume-db.mjs --mode self-test --out-dir /tmp/healthcare-source-volume-self-test-fk`.
- Pass: source-volume self-test confirmed the first write targets `source_records` before `source_field_values` for a one-row, 1,001-field replay.
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/load-healthcare-source-volume-db.mjs --mode plan --out-dir /tmp/healthcare-source-volume-plan-fk-fix`.
- Pass: source-volume plan still produced 40 CSV files, 140,773 source rows, and 1,437,376 source field values.
- Pending until merge/deploy: ACA operator job source-volume apply rerun with the new digest.
- Pending until merge/deploy: reader verification of exact source-volume counts.

## Rollout Plan

Merge through PR-only `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After runtime invariant passes, rerun Healthcare source-volume preflight, apply, and reader verify with the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: private operator job must be restored to its idle image and command after each run.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. If a source-volume apply has already committed with a later corrected image, preserve the isolated rows as audit evidence and do not mutate product providers or active baselines.

## Audit Evidence

- Failed apply proof directory: `/Users/anand/Downloads/foundation-v2-live-db-execution-20260730/phase-h-healthcare-db/09-source-volume-apply-writer`.
- Error class: source field values attempted to insert before matching source records were visible to the table foreign key.
- Local focused self-test proves corrected write order.
- PR URL, merge commit, ACA deploy run, runtime digest, and rerun proof will be appended after execution.

## Known Gaps

This change does not certify the Healthcare golden slice and does not prove product consumption. It only repairs the source-volume load path so the isolated database execution can proceed.
