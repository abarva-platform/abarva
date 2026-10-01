# 2026-10-01-synthetic-enterprise-canonical-load - New-Assessment Load Job

## Release ID

`2026-10-01-synthetic-enterprise-canonical-load`

## Status

`candidate`

## Plain-English Summary

Adds a private operator job that validates a pinned synthetic enterprise source set, preserves the source files in immutable Blob paths, and loads its source rows and canonical objects and relationships into a new assessment. It does not select that assessment for any product surface.

## Layer Impact

- Release lane: `client-data-lane` for synthetic lab context, executed by a private operator job.
- Layer 1: Preserves owner-shaped source files and every source row with stable IDs and file hashes.
- Layer 2: Re-runs the source adapter and checks source-set identity before loading.
- Layer 3: Writes canonical objects and resolved relationships with row lineage. An unresolved edge remains a declared gap, not a fabricated endpoint.
- Layer 4: No product read path or serving selection changes.

## Client Applicability

- All clients: No automatic data load or product change.
- Specific clients: None. The operator entrypoint is restricted to a registry-declared synthetic lab source set.
- Internal only: Controlled operator job.
- Public/demo only: Synthetic lab data only after explicit job execution.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_synthetic_enterprise_v1.ts`
- `scripts/ecl/__tests__/test_synthetic_enterprise_v1_load.ts`
- `.github/workflows/ecl-physical-admission.yml`
- `Dockerfile` carries the adapter's versioned relationship map into the private job image.
- `package.json` operator script

## QA / Validation

- PASS: Read-only generation validates 22 files, 16,416 source rows, 5,759 objects, 10,619 resolved relationships, and one unresolved edge.
- PASS: Disposable Postgres round trip checks source and canonical counts, logical application grain, selected provenance states, row lineage, and refusal to overwrite an occupied assessment.
- PASS: Local typecheck and lint.
- NOT RUN: CI repetition of the insertion path after the physical admission migration; pending PR checks.
- NOT RUN: Shared lab operator execution, independent live readback, or signed-in browser proof.

## Rollout Plan

Merge through a PR and deploy the image through the ACA main workflow. A separate governed ACA operator job must apply the admission migration and then execute the load with explicit tenant, assessment, source hash, idempotency key, operator identity, image digest, and synthetic review binding. Review readback and quality outputs before any serving promotion.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the image.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolve from the successful main deploy before operator execution.
- ACA runtime invariant: Required after image deployment.
- Worker image invariant: Required after image deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after a separate serving promotion; this change alone is not browser-visible.

## Rollback Plan

Do not promote the new assessment. The loader is insert-only and refuses occupied assessments; no old assessment is changed. If a job fails after a partial external Blob upload, leave immutable blobs for audit and inspect the operator proof before retrying. A schema rollback requires separate review because the admission migration is additive to shared ECL types.

## Audit Evidence

- PR diff and CI checks.
- Disposable Postgres readback log.
- Operator wrapper run output and Blob validation, quality-gate, and proof JSON from any actual lab load.
- ACA main deploy run and digest invariant proof.

## Known Gaps

- The new assessment is not served until a separate governed projection and promotion step.
- The source inventory has 750 application-related rows, but only 24 are logical applications; 726 are modules. The job records both denominators and marks serving ineligible against the 300-logical-application depth target until the synthetic source set is expanded or that target is explicitly revised.
- The unresolved relationship is retained in source and quality output, not materialized as a resolved canonical edge.
