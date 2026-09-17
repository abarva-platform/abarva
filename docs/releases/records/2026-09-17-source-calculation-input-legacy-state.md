# 2026-09-17-source-calculation-input-legacy-state - Reconcile automated input inclusion

## Release ID

`2026-09-17-source-calculation-input-legacy-state`

## Status

`candidate`

## Plain-English Summary

An older package loader marked cited evidence rows as `included` even though it did not map those rows into a numeric formula. The scoped correction operator now recognizes only that exact automated state, archives it, and changes it to `pending_review` while clearing unsupported candidate amounts. Unknown inclusion reasons, nonempty payloads, numeric inputs, and human decisions still stop the job.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1 and Layer 2: unchanged.
- Layer 3: one governed, version-scoped operator job may correct calculation-input inclusion state and reason alongside the previously approved amount fields. Every before-image row is archived and hash checked.
- Layer 4: unchanged; its writer overlay remains inactive until the correction is verified.

## Client Applicability

- All clients: no change to ordinary loaders or product reads.
- Internal only: exact-scope operator plan, apply, verify, and restore.
- Public/demo: no new value claim is authorized.

## Changes Included

- Fail-closed classification of a legacy automated evidence-reference state.
- In-place transition to `pending_review` with an explicit unmapped-input reason.
- Archive, compare-and-swap restore, and negative integration tests for altered reasons.

## QA / Validation

- PASS: focused disposable-PostgreSQL integration tests, including rejection of an unrecognized reason and exact restore of the archived state.
- REQUIRED: scoped ESLint, TypeScript, release check, CI, digest-matched ACA deploy, read-only plan, and governed apply/verify proof.
- NOT RUN: signed-in product proof until the data job and Layer 4 activation complete.

## Rollout Plan

Squash-merge after CI and deploy through `.github/workflows/aca-main-deploy.yml`. Run a fresh read-only plan against the deployed digest. Apply only if the six-ID set, before-image, ownership/package hashes, Layer 4 definition, and preactivation state match. Verify the private Blob archive and canonical readback before activating Layer 4.

## Deployment Authority

- Repo-owned web deploy only; no feature-branch traffic shift.
- Data mutation only through the governed ACA operator job.
- Runtime template, active revision, and worker images must match the approved digest.

## Rollback Plan

The operator's restore mode requires the exact after-image hash and reconstructs the archived before-image. Code rollback requires a separate PR. Do not restore after dependent Layer 4 or human actions without a fresh impact review.

## Audit Evidence

Focused negative tests, CI checks, deployment invariant proof, and the later operator plan/apply/verify bundles.

## Known Gaps

An automated evidence citation is not a reviewed calculation input. The correction does not supply a formula, validate a savings estimate, or confirm realized value.
