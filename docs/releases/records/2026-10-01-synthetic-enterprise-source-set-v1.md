# 2026-10-01-synthetic-enterprise-source-set-v1 — Versioned synthetic enterprise source set

## Release ID

`2026-10-01-synthetic-enterprise-source-set-v1`

## Status

`candidate`

## Plain-English Summary

Adds one deterministic synthetic enterprise definition and generator. It emits owner-shaped source files, stable object identities, typed relationships, source provenance, two comparable KPI periods, declared imperfections, and one externally sourced benchmark with an explicit comparability boundary. This release does not load the data or change the record currently shown in Home.

## Layer Impact

- Release lane: `client-data-lane` (synthetic lab dataset candidate only).
- Layer 1: adds an internal synthetic source-set definition and generated extract contract.
- Governance: registers the dataset for scoped operator-job ingestion and requires retrieval proof before agent use.
- Layers 2-4: unchanged in this release. Existing adapters and product projections are not silently switched to the new source set.

## Client Applicability

- All clients: no data change.
- Specific clients: synthetic lab tenant only after a separately controlled load and promotion.
- Internal only: source generation and local validation tooling.
- Public/demo only: no route change.
- Feature flag: none.

## Changes Included

- Versioned synthetic enterprise definition.
- Deterministic source-set generator and independent output validator.
- Mutation and reproducibility tests.
- A public-source benchmark cited to the issuing agency, kept separate from synthetic tenant metrics.
- Dataset onboarding manifest recording delegated synthetic-lab review; no real-client attestation.

## QA / Validation

- Generated the source set twice and confirmed identical file-set hashes.
- Independently validated 22 file hashes and row counts, exact object/relationship-to-source-row reconciliation, temporal KPI observations, known gaps, application/program/contract joins, and distribution checks.
- Mutation tests reject changed source bytes, changed object attributes, and undeclared graph endpoints.
- `node --test scripts/ecl/__tests__/run-synthetic-enterprise-v1-tests.mjs` passed.
- Context-corpus manifest validation and release check must pass before merge.
- No ACA job, tenant write, projection generation, aVa retrieval, or signed-in Home proof is claimed for this data set.

## Rollout Plan

Merge through a PR. The repo ACA main workflow may deploy the generation code, but it must not execute a data build as part of this release. A subsequent scoped, digest-pinned ACA operator job may generate and load the source set only after its adapter and readback contract is reviewed and tested.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for web/worker image promotion.
- Shared runtime mutators: none in this release.
- Approved image digest: resolve from the successful exact-SHA main deploy.
- ACA runtime invariant: verify web template, 100% revision and required workers share the approved digest.
- Worker image invariant: required before claiming runtime availability.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any later Home claim, not for an unrun generator.

## Rollback Plan

Revert the PR before any data job. If a later scoped job loads this source set, do not delete tenant rows as a code rollback; use the subsequent release's assessment-version selection and data-plane rollback procedure.

## Audit Evidence

- PR checks, source-set generator output, independent validator output, file-set hash, and scoped operator-job proof when run.
- Dataset manifest and release record.

## Known Gaps

- Existing dense loader and validator still target the historical 14-file profile; this 22-file source set is not load-ready through that path yet.
- Source-native relationship verbs in the new extract are not all accepted by the current ECL physical relationship constraint or the canonical graph dictionary. The Layer 2 adapter must exhaustively normalize them to reviewed canonical types, with an explicit schema change where semantics have no faithful existing type; unresolved verbs must fail the load rather than be dropped.
- No canonical/serving promotion, Home segment spine, narrative, aVa or export proof exists for this version.
- The approved synthetic source-set review does not make any object agent-ready or client-attested.
