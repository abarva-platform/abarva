# 2026-07-30-airline-source-corpus-runtime-packaging — Source Corpus Runtime Packaging

## Release ID

`2026-07-30-airline-source-corpus-runtime-packaging`

## Status

`candidate`

## Plain-English Summary

Packages the approved demo Airline source-corpus files into the ACA runtime image so governed Container Apps Jobs can run source landing from the pinned deployed image instead of a local checkout.

## Layer Impact

client-data-lane: affects only source-corpus execution packaging for governed data jobs. It does not change product UI behavior, canonical records, publications, baselines, projections, Cube output, or provider routing.

## Client Applicability

- All clients: No.
- Specific clients: Demo Airline source-corpus execution path only.
- Internal only: Operator/runtime packaging.
- Public/demo only: Demo Airline lab execution.
- Feature flag: None.

## Changes Included

- Docker runtime image now copies the demo Airline `execution` controls directory.
- Docker runtime image now copies the demo Airline governed source-corpus package directory.

## QA / Validation

- PASS: `node --check scripts/knowledge/land-airline-source-corpus.mjs`
- PASS: observed the failed J1 ACA execution stopped before reconciliation because the runtime image lacked the source-corpus package manifest.
- PASS: `npm run release:check`

## Rollout Plan

Merge through the protected PR path and deploy through the repo-owned ACA main deploy workflow. Rerun the governed ACA source landing job only after the new digest is live and captured.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required before rerun of source landing.
- Worker image invariant: Source landing rerun must use the approved digest as an execution override or updated job image.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this packaging repair; product proof remains required at the later Home/aVa gates.

## Rollback Plan

Revert the Dockerfile copy-path additions and redeploy the prior ACA digest. No data mutation is introduced by the packaging change itself.

## Audit Evidence

- J1 failed execution: `job-airdn-source-register-lab-n0js0jm`
- Failure code: `package_manifest_missing`
- Follow-up source landing rerun must provide execution ID, image digest, Blob URIs, hashes, source landing totals, and reconciliation status.

## Known Gaps

This release only fixes runtime packaging for the source-corpus landing operator. It does not certify J1 landing, downstream processing, publications, baselines, projections, Cube parity, Home Knowledge, or aVa behavior.
