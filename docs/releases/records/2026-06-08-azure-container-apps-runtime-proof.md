# 2026-06-08-azure-container-apps-runtime-proof — Azure Container Apps runtime migration proof (doc)

## Release ID

`2026-06-08-azure-container-apps-runtime-proof`

## Status

`released`

## Plain-English Summary

Adds the documentation deliverable that records proof the AbarVa Next.js runtime runs on
Azure Container Apps and reaches the private Azure data plane (Postgres with public access
disabled, via VNet peering + private DNS), with a signed-in Meridian session, the
Responsible-AI acknowledgment written to the Azure DB, and the discovery capture panel
rendering — all without using Vercel as the proof runtime. This change is documentation only;
it does not alter any runtime.

## Layer Impact

Documentation only — no runtime layer is modified by this change. The document describes the
**global-control-lane** Azure Container Apps runtime migration (the runtime move itself is
tracked separately by the build/deploy actions it cites). No code, data-plane, schema,
migration, broker, or auth change rides in this PR.

## Client Applicability

- Internal only: this is an internal engineering/operations record.
- Not applicable to clients: no client-facing behavior changes from adding this document.

## Changes Included

- PR #3314.
- `docs/build/azure-container-apps-runtime/AZURE_CONTAINER_APPS_RUNTIME_PROOF_2026-06-08.md`
  — the proof record (inventory, image/digest, revision, env/secret matrix without values,
  DB connectivity proof, signed-in proof, rollback path) plus the criterion-#5 addendum.

## QA / Validation

- Content cross-checked against live Azure resources and the running ACA revision. **Pass.**
- The underlying runtime proof it documents passed 8/8 pass criteria live on ACA.
- CI: all checks **green** except this release-record gate (now satisfied by this record).

## Rollout Plan

Merge to `main`. Documentation only — there is no runtime rollout; nothing deploys or changes
behavior as a result of merging this PR.

## Rollback Plan

Revert PR #3314. No runtime, data, or schema impact, so rollback is a pure doc revert with no
operational constraints.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3314
- The document itself under `docs/build/azure-container-apps-runtime/`.
- Cited evidence: ACA URL, image digest, revision IDs, `/api/health` output, screenshots.

## Known Gaps

Tier B of the discovery feature (persist `discoveryShape` on Promote; wire upload/receipt/
template flows onto the live surfaces) remains open and is tracked in the discovery re-home
record and PR #3315.
