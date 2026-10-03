# 2026-09-29 Moves Approved-Evidence Revision Binding

## Release ID

`2026-09-29-moves-approved-evidence-revision`

## Status

`candidate`

## Plain-English Summary

Move context snapshots and generated deliverables are now bound to a fingerprint of the complete, tenant-scoped approved-evidence set. A later evidence approval makes older snapshots and outputs visibly stale, prevents their acceptance or use to satisfy a generated-deliverable gate, and requires a rebuild plus human review. Evidence sets larger than the supported snapshot limit fail closed instead of being partially fingerprinted.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Moves: adds evidence-revision freshness to the File Cabinet, generated-output approval, worker processing, and phase-gate evaluation.
- Layer 3, canonical model: reads approved evidence records without changing their schema or ownership. The revision binds tenant and Move identity to approved source content and reviewed extraction.
- Layers 1/2: no intake format or adapter change.

## Client Applicability

- All clients: yes, for Moves evidence review and generated deliverables.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

Legacy generated outputs without a verifiable evidence revision appear unverified and cannot be newly accepted as authoritative; rebuild them from the current approved evidence first. Existing human approval and sponsor gates remain separate and unchanged.

## Changes Included

- Deterministic approved-evidence revision hashing and tenant/Move-scoped snapshot loading.
- Snapshot revision propagation through context extracts, queued and direct generation, generated Office companions, accepted deliverables, and `deliverables_v2` structured data.
- Worker-side stale-snapshot rejection, API-side approval validation, and phase-gate verification against the current revision.
- File Cabinet freshness labels, hidden approval controls for stale/unverified output, and phase refresh after evidence changes.
- Focused route, worker, persistence, gate, component, revision, and snapshot tests; explicit CI suite wiring.
- No migration, data job, or feature-flag change.

## QA / Validation

- Pass: focused Moves evidence revision suites, 13 suites / 127 tests, including the generic Moves enqueue route.
- Pass: CI test-coverage census regenerated; committed census matches the current workflow commands.
- Pass: repository typecheck (`npm run typecheck`) and scoped ESLint.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Pending: PR review/CI, deployment, ACA runtime invariant, and signed-in verification.
- Not run: sponsor sign-off and phase advancement; these require the accountable human approver.

## Rollout Plan

Squash-merge through the protected PR path. Build and deploy only through `.github/workflows/aca-main-deploy.yml`. After runtime proof, open the synthetic Move used for signed-in verification, confirm the evidence refresh is reflected, rebuild the affected deliverable, and verify the new output is current and offers human review. Do not perform sponsor sign-off or advance a phase during this release smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending exact-SHA workflow and template/100%-traffic revision readback.
- Worker image invariant: pending required worker image readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify stale-to-current behavior and human review affordance without signing the sponsor gate.

## Rollback Plan

Revert through a PR and redeploy via the repo-owned ACA main workflow. No database migration or evidence rows are rewritten. The evidence and artifact metadata remain intact; the previous runtime behavior resumes on rollback.

## Audit Evidence

- Focused test output and coverage-census result.
- PR, exact-SHA CI run, ACA deploy run, digest readback, and signed-in smoke receipts to be added after each proof completes.

## Known Gaps

- More than 80 approved evidence rows currently fail closed and require the snapshot limit/pagination contract to be expanded before generation can proceed.
- Old generated deliverables without a revision need to be rebuilt and reviewed; this release does not backfill or rewrite them.
- Sponsor approval and phase advancement remain explicit human decisions and are not performed by this release smoke.
