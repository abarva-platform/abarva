# 2026-10-05-moves-discovery-archetype-declaration-job — Governed discovery archetype declaration

## Release ID

`2026-10-05-moves-discovery-archetype-declaration-job`

## Status

`candidate`

## Plain-English Summary

Adds a narrowly scoped operator job that can declare a discovery archetype on one tenant-scoped Move. It merges only `charter.classification.archetype`, verifies the resolved discovery blueprint and required evidence-family keys, and refuses stale or conflicting program identity. It does not create evidence, approve evidence, advance a phase, or change the legacy program archetype or function-pack key.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical model: one explicit, tenant-scoped classification may be recorded on an existing program through an Azure/Postgres conditional update.
- Layer 4 Moves: discovery evidence-family resolution consumes the declared classification; no product route or UI behavior changes.

## Client Applicability

- All clients: No automatic behavior change.
- Specific clients: None encoded in source.
- Internal only: Operator job; each execution requires an explicit canonical tenant key and Move UUID.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/data-plane/write-adapters/discoveryArchetypeWriteAdapter.ts`
- `scripts/moves/declare-discovery-archetype-job.ts`
- `package.json`
- Focused adapter and resolver tests.

## QA / Validation

- Focused unit tests: `PASS` — conditional writer tests verify tenant/id scoping, legacy-field guards, JSONB merge semantics, and fail-closed behavior when the target row does not match; the resolver test pins the declared blueprint and required family keys.
- ESLint: `PASS` — changed TypeScript files.
- Typecheck: `PASS` — repository typecheck wrapper.
- Release check: `NOT RUN` — pending final candidate commit.
- Remote CI: `NOT RUN` — pending PR creation.
- Governed ACA declaration job and signed-in readback: `NOT RUN` — must occur only after merge and verified deployment.

## Rollout Plan

Merge through a squash PR. Ship the job code only through `.github/workflows/aca-main-deploy.yml`; run it through `npm run ops:aca-job` with the approved digest-pinned image. The run must match a canonical tenant, a tenant-scoped Move UUID, a private name fingerprint, and the expected current archetype. No evidence or phase mutation is part of this job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the exact deploy run and operator-job output.
- ACA runtime invariant: Required before running the data job.
- Worker image invariant: Must match the deployed approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; confirm only the declared classification and unchanged early-phase/evidence state after the job.

## Rollback Plan

The job is idempotent for the same declared archetype and makes no evidence, gate, or phase changes. A correction requires a separately reviewed, tenant-scoped operator job; do not repurpose this job to overwrite a different declaration. Reverting the code does not erase the recorded classification.

## Audit Evidence

- PR and CI checks.
- Exact successful ACA main deploy run and digest-parity verification.
- Private Blob proof bundle with run id, tenant scope, Move UUID, input source SHA, image digest, idempotency key, progress, validation, and quality-gate outputs.
- Signed-in readback of the resulting Move classification and unchanged phase/evidence state.

## Known Gaps

This operator path declares one archetype for one explicit Move. Evidence-package creation and approval remain separate governed steps and are not authorized by this release.
