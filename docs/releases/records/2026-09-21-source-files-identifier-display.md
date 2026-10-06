# 2026-09-21-source-files-identifier-display - Keep Internal IDs Out of Files Metadata

## Release ID

`2026-09-21-source-files-identifier-display`

## Status

`candidate`

## Plain-English Summary

Source New Files now states when a recorded person or artifact reference has no client-ready name
instead of displaying an internal UUID. The file and its audit metadata remain visible; the UI does
not hide the unresolved evidence state.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: changes display formatting for existing file metadata only.
- Layers 1-3: no intake, adapter, canonical object, stored value, or read-model change.

## Client Applicability

- All clients: yes, on the Source New Files detail surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Move the existing Source UUID-display rule into one shared utility used by portfolio and Files
  presentation paths.
- Replace UUID-valued origin, register, supersession, approver, final-acceptor, and final-uploader
  values with field-specific unresolved states.
- Preserve dates, the file row, and all non-UUID display values.

The Files detail surface renders these metadata families:

- File list: title, status, format, size, and version.
- Preview: file name, format, artifact type/group/family, description, generation time, and origin.
- Version: current version, status/lifecycle state, supersession references, and update time.
- Evidence: source basis, register reference, context trace, evidence families, citation state, and
  confidence.
- Governance: approval actor/time, final acceptance actor/time, final upload actor/time, review
  group, meeting date, and comment.
- Authenticity: digest, authority/finality state, generated-artifact reference, missing inputs,
  completed inputs, and assumptions.

The fields that can contain an unresolved UUID on the current read model are `generatedBy`,
`sourceRegisterId`, `supersedesArtifactId`, `supersededByArtifactId`, `approvedBy`,
`clientFinalAcceptedBy`, and `clientFinalUploadedBy`. This component has no tenant-scoped person or
artifact-name resolver for them, so it fails visibly as unresolved. Context trace, generated ID,
and SHA-256 remain deliberately labelled technical references.

## QA / Validation

- The new rendered negative control fails against the prior behavior with UUID-valued file
  metadata.
- The Files component and portfolio-adapter suites pass with the shared rule.
- Mutating the shared UUID check to return false makes the Files regression fail.
- TypeScript, focused ESLint, behavior tests, diff checking, and release control are required before
  merge.

## Rollout Plan

Merge through a protected pull request and deploy through the repository-owned Azure Container Apps
main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deployment workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the Source New Files detail surface.

## Rollback Plan

Revert the squash merge and redeploy the resulting main revision through the same workflow. No data
rollback is required.

## Audit Evidence

- Focused Jest output for Files metadata and the existing portfolio UUID guard.
- Pull-request checks and deployment runtime-invariant artifact.
- A later signed-in Source New Files capture of the affected metadata fields.

## Known Gaps

No tenant-scoped identity resolver is available to this component. Signed-in re-acceptance remains
separate from this code candidate.
