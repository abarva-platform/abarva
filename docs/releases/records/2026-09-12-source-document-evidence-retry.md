# 2026-09-12 — Source document evidence retry safety

## Release ID

`2026-09-12-source-document-evidence-retry`

## Status

`candidate`

## Plain-English Summary

Make the governed document-evidence loader safely repeatable. A retry now refreshes pages, spans, and extractions for the selected source files while preserving the referenced document file identity, so existing lineage references do not block the load.

## Layer Impact

- **Release lane:** `client-data-lane`.
- **Source adapters:** no change.
- **Canonical model:** no change.
- **Products:** no change; this supplies the document rows consumed by Source Evidence and Contract 360.
- **Evidence substrate:** selected document page, span, and extraction rows are refreshed within the existing tenant and file scope.

## Client Applicability

- All clients: no default data mutation.
- Specific clients: only the explicitly selected tenant and contract IDs passed to the operator job.
- Internal only: operator execution and proof bundle.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Update `scripts/source/load-contract-depth-document-evidence.mjs` to remove all dependent spans and pages for selected files before upserting their replacement rows.
- Keep existing `doc.file` rows in place during normal retries; optional orphan-file deletion remains disabled unless explicitly requested by an operator environment variable.

## QA / Validation

- `npm run release:check` passed.
- `node --test scripts/source/__tests__/load-contract-depth-document-evidence.test.mjs` passed.
- Azure retry will be verified against the selected cloud contract document package before release status is changed.

## Rollout Plan

Merge to `main`, build and deploy through the repo-owned Azure Container Apps workflow, then run the selected document-evidence operator job with a digest-pinned worker image. Confirm document file, page, span, and extraction counts from the proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required for the document-evidence operator job.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected Source Evidence and Contract 360 routes.

## Rollback Plan

Revert the application change through a normal PR. The data load is transactional and can be rerun with the prior loader version; no destructive schema migration is included.

## Audit Evidence

- PR and CI checks for this release.
- Azure operator-job execution and proof bundle.
- Source Evidence signed-in verification.

## Known Gaps

This release does not invent raw contract PDFs or repair unrelated contract-register identity gaps. Unloaded evidence remains explicitly unavailable.
