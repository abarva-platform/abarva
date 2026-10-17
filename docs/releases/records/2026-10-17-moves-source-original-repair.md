# 2026-10-17-moves-source-original-repair — retain original evidence bytes

## Release ID
`2026-10-17-moves-source-original-repair`

## Status
`candidate`

## Plain-English Summary
Some older synthetic evidence records retain extracted text but lack an original artifact binding. A bounded operator job restores the exact previously authorized bytes to the artifact vault and resets the affected reviews to pending. Corrected bindings must be reviewed again before they can support generation.

## Layer Impact
Release lane: `internal-admin`, with a fenced `public-demo` data repair.
- Layer 2: validates declared fixture paths and byte hashes against the existing load manifest.
- Layer 3: adds original artifact records and corrects review bindings, preserving prior records in private audit proof.
- Layer 4: source downloads become available; this release grants no model readiness or phase approval.

## Client Applicability
- All clients: none automatically.
- Specific clients: no real client data is eligible.
- Internal only: digest-pinned ACA operator job.
- Public/demo only: one exact private input hash for a declared synthetic scope.
- Feature flag: explicit apply, approved input hash and expiring repair permit.

## Changes Included
`ops:moves-source-original-repair`, its failure-boundary tests and the exact-input repair permit. Existing generation admission checks remain unchanged.

## QA / Validation
PASS: 11 targeted behavior tests, TypeScript, scoped ESLint and all 11 release checks. NOT RUN: live source and original-byte readback, pending-review verification and operator idle restoration; these are required after execution.

## Rollout Plan
Merge by PR to main. The repo-owned workflow builds and deploys the release image. Run the exact private input through `submit-aca-operator-job.mjs` using the approved digest. The job checks current Move identity, phase, source hashes, original load authorization and all before-row hashes before any writes; it serializes against the Move and locks source rows. No data repair runs during web startup.

## Deployment Authority
- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: captured from the successful main deploy.
- ACA runtime invariant: template and healthy 100% traffic revision must match the approved digest.
- Worker image invariant: both required delivery worker jobs must match it.
- Feature/env flag update path: no shared web flag changes; explicit operator execution overrides only.
- Live signed-in proof required: original download and corrected review state.

## Rollback Plan
Before commit, database changes roll back together. Uploaded exact original blobs are retained; no planned object is claimed as exclusively owned or automatically deleted. After commit, preserve the private before/after proof. A separately fenced repair may restore prior review rows and retire only the created artifacts if their versions and bindings remain unchanged. Do not undo a subsequent review. No phase, readiness or search-index changes need rollback.

## Audit Evidence
Public PR, CI, main deployment, and private operator input, before/after rows, original byte hashes, progress and validation proof. Original bytes and source identities remain in the private data plane and evidence bundle.

## Known Gaps
This restores source lineage only. Corrected extraction review, indexing, citation verification and canonical readiness remain required before blocked generation can resume.
