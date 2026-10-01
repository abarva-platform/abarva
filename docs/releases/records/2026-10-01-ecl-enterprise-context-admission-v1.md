# 2026-10-01-ecl-enterprise-context-admission-v1 - Physical context admission

## Release ID

`2026-10-01-ecl-enterprise-context-admission-v1`

## Status

`candidate`

## Plain-English Summary

Adds a reviewed physical vocabulary for a versioned synthetic enterprise context source set. Seven distinct context-detail grains preserve modules, flows, spend lines, missing evidence requests, leadership observations, priorities, and external benchmarks without counting them as logical applications or client metrics. The relationship allowlist admits the source set's normalized verbs while retaining every previously allowed verb. No tenant rows are loaded or product read path is switched by this release.

## Layer Impact

- Release lane: `client-data-lane` for a synthetic lab candidate.
- Layer 1: unchanged.
- Layer 2: completes an exhaustive source-to-canonical object-type mapping and refuses unknown types or application/platform grains.
- Layer 3: adds seven catalog types, one non-rollup counting class, and reviewed object/relationship constraint values.
- Layer 4: unchanged; no Home selection or projection change.

## Client Applicability

- All clients: additive schema vocabulary only after the migration is applied; existing objects keep their types and counts.
- Specific clients: synthetic lab assessment candidate only for a later controlled load.
- Public/demo: no route change.
- Feature flag: none.

## Changes Included

- Exhaustive canonical mapping for all source object types, including logical applications versus modules, data products, deployments, personas, and platform classes.
- Additive ECL object catalog and relationship constraint migration.
- Matching disposable-Postgres schema draft and focused normalization tests.
- Classified the historical dense local proof's object-type catalog increase from 20 to 27; its fixture and product counts remain unchanged.

## QA / Validation

- Local adapter tests pass with all 5,759 source objects and 10,620 declared relationships preserved (one unresolved edge remains separate).
- On disposable PostgreSQL, the existing ECL substrate baseline accepted the new migration; a second application also succeeded. Insert-level proof admitted a logical application, governed module, and unreceived evidence request, plus all 26 normalized relationship verbs.
- The updated local schema draft built from scratch and registered the same seven `context_detail` types.
- Every canonical object type in the normalized source set resolved in the local catalog. Inserting one logical application plus one governed module and one evidence request yielded one row in `application_v` and three rows in the underlying object table.
- The migrated relationship constraint contains every normalized source relationship type and retains the old allowlist.
- A disposable PostgreSQL CI job repeats the baseline upgrade, migration idempotency, canonical-type coverage, application count isolation, all 26 normalized relationship verbs, and unknown-verb rejection.
- Release and CI checks must pass before merge.
- NOT RUN: shared-environment migration, tenant data load, independent readback, Home selection, agent retrieval, or signed-in new-assessment proof.

## Rollout Plan

Merge by PR. The ACA main workflow may ship code and migration files but must not apply the schema or load data from a web request. A separate reviewed, digest-pinned operator job must inspect the live ECL schema, apply the additive migration, build a new assessment, and stop for quality review before Home is pointed at it.

## Deployment Authority

- Shared web traffic changes only through `.github/workflows/aca-main-deploy.yml` from main.
- The schema/data operator lane is `docs/ops/aca-data-build-job-rule.md`.
- Approved image digest and runtime invariant: resolve from the exact-SHA deploy before any job.
- Live signed-in proof is required before any Home claim.

## Rollback Plan

Before schema application, revert the PR. After schema application, leave additive catalog terms in place while rolling back code; do not delete tenant data. Any later candidate assessment must use version selection and a separately reviewed data-plane rollback.

## Audit Evidence

- PR checks, local disposable-Postgres migration and schema-draft results, source-set hash, and operator-job/readback proof when later run.

## Known Gaps

- The physical vocabulary alone is not a loader. Source-file persistence, canonical object/relationship writes, readback, quality gate, and serving projection still need separate implementation.
- No context claim is client-attested or agent-ready merely because its type is admitted.
