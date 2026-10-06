# 2026-09-12 - Source document identity boundary

## Release ID

`2026-09-12-source-document-identity-boundary`

## Status

`candidate`

## Plain-English Summary

Keep document evidence attached to the contract that owns it. A companion source package now uses a contract-scoped identifier for an external marketplace sourcing note, and the loader refuses to overwrite a document file already owned by another contract.

## Layer Impact

- **Release lane:** `client-data-lane`.
- **Client intake:** corrects the source package document identifier and regenerated page-text companion rows.
- **Source adapters:** no adapter change.
- **Canonical model:** no schema change; document ownership is validated before upsert.
- **Products:** no presentation change; Source Evidence and Contract 360 receive corrected lineage.

## Client Applicability

- **Specific clients:** the explicitly selected tenant and contract IDs passed to the Source data-plane operator; Source users consuming corrected document lineage receive the resulting read-only projection.
- No default data mutation.
- Operator execution is limited to the explicitly selected tenant, package, and contract IDs.
- No real client document content is added to the public repository.

## Changes Included

- Give the marketplace sourcing note a contract-scoped source file ID.
- Regenerate the package page-text companion and manifest metadata.
- Fail closed when an incoming source file ID is already owned by a different contract.
- Add behavior coverage for the identity-conflict message.
- Allow the optional page-text companion quality-gate metadata file to be absent.

## QA / Validation

**Status: pass.**

- `node --test scripts/source/__tests__/load-contract-depth-document-evidence.test.mjs`
- `npm run test:behaviors -- --runInBand`
- Package companion generation reports six page rows for one contract.
- Existing ACA document-evidence runs remain transactional and are rerunnable.

## Rollout Plan

Merge through the protected `main` PR path, deploy the exact merge SHA through `.github/workflows/aca-main-deploy.yml`, prove the digest-pinned ACA runtime invariant, then rerun the selected document-evidence operator job.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Data mutation: ACA operator job only, with a digest-pinned worker image.
- Shared web traffic: no ad hoc mutation.
- Live proof: required for Source Evidence and Contract 360 routes.

## Rollback Plan

Revert through a normal PR. The data operation is transactional and can be rerun with the previous package version.

## Audit Evidence

The release is complete only after CI, ACA deployment, runtime-invariant proof, operator-job proof, and signed-in Source Evidence verification all pass.

## Known Gaps

This release does not remap unrelated register-only contracts or invent missing raw documents. Unloaded lanes remain explicitly unavailable.
