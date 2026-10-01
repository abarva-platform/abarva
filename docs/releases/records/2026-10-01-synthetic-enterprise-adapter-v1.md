# 2026-10-01-synthetic-enterprise-adapter-v1 — ID-led normalization contract

## Release ID

`2026-10-01-synthetic-enterprise-adapter-v1`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Layer 2 adapter for the versioned synthetic enterprise source set. It preserves declared IDs, source-file hashes, source-row IDs, source system, value source, attestation state, and unresolved relationships. An explicit map normalizes relationship vocabulary without fuzzy name matching or silent edge loss. Product modules retain their parent relationship, while unreceived evidence requests remain requests rather than supporting proof. This release does not write a database or activate a product surface.

## Layer Impact

- Release lane: `client-data-lane` (synthetic lab adapter candidate only).
- Layer 1: unchanged.
- Layer 2: adds a disposable normalized artifact and an exact relationship mapping contract.
- Layer 3: adds reviewed relationship terms to the canonical dictionary but does not persist canonical rows.
- Layer 4: unchanged.

## Client Applicability

- All clients: additive canonical relationship terms, no active-data change.
- Specific clients: synthetic lab source set only after a later approved load.
- Internal only: adapter execution and QA artifact.
- Public/demo only: no route change.
- Feature flag: none.

## Changes Included

- One explicit source-native to canonical relationship map.
- Distinct `MODULE_OF` and `EVIDENCE_REQUESTED_FOR` semantics; the latter is not a `SUPPORTS` claim.
- Application rows normalize to 24 logical applications and 726 `application_module` objects, so later estate totals cannot count modules as distinct products.
- ID-led normalized objects, resolved relationships, and a separate unresolved-edge set.
- Source-file and row lineage on every normalized object and relationship.
- Tests for full denominator preservation, flow-row lineage, unknown-verb refusal, and dictionary coverage.

## QA / Validation

- PASS locally: source-set validator runs before normalization; normalized object and relationship denominators equal the source manifest, with unresolved edges counted separately.
- PASS locally: Python adapter tests and TypeScript dictionary tests. Formatting, diff, release, and relevant CI gates must pass before merge.
- NOT RUN: ACA job, tenant write, ECL physical-schema admission, projection generation, aVa retrieval, or signed-in Home proof.

## Rollout Plan

Merge through a PR after the source-set release is on main. The repo ACA main workflow may deploy the adapter code, but it must not execute a data build. A subsequent scoped, digest-pinned ACA operator job must separately validate physical ECL object and relationship types, write a new assessment, and prove readback before Home is repointed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for web/worker image promotion.
- Shared runtime mutators: none in this release.
- Approved image digest: resolve from the successful exact-SHA main deploy.
- ACA runtime invariant: verify web template, 100% revision, and required workers share the approved digest.
- Worker image invariant: required before claiming runtime availability.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any later Home claim, not for an unrun adapter.

## Rollback Plan

Revert the PR before a future data build. No data-plane rollback is needed because this release does not write rows. A later loaded assessment must use its own scoped rollback and version-selection procedure.

## Audit Evidence

- PR checks, normalized artifact quality summary, source-set hash, complete denominator reconciliation, dictionary tests, and later operator-job proof when run.

## Known Gaps

- The current ECL physical object catalog and relationship check do not admit every normalized type; a reviewed migration and new-assessment loader are required.
- No canonical/serving promotion, Home segment spine, narrative, aVa, or export proof exists for this version.
- Source-set and adapter review do not make any object agent-ready or client-attested.
