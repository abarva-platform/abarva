# 2026-08-16 — Operator Proof Marker Coverage

## Release ID

`2026-08-16-operator-proof-marker-coverage`

## Status

`candidate`

## Plain-English Summary

The private operator wrapper now extracts proof bundles from the Source L4/cube refresh marker as well as the existing Semantic2 marker. This keeps refreshed projection jobs on the same auditable evidence path as canonical layer jobs.

## Layer Impact

Layer 4 / Products (`internal-admin` lane): improves the operator proof path for governed Source projection and cube refresh jobs. It does not change product runtime behavior or data contents by itself.

## Client Applicability

- All clients: none directly.
- Specific clients: none directly.
- Internal only: private operator evidence capture.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ops/submit-aca-operator-job.mjs` accepts `__SOURCE_L4_CUBE_PROOF_TGZ_*` proof markers.
- The wrapper self-test now exercises both supported proof marker families.

## QA / Validation

- Pass: `npm run ops:aca-job -- --self-test`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow will publish the wrapper change in the web image used by the private operator job. No data-build job runs from this release alone.

## Deployment Authority

- Repo-owned deploy workflow: approved session authority.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before using the new image for operator jobs.
- Worker image invariant: not changed directly.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR and redeploy. Existing operator logs remain inspectable; future Source L4/cube proof extraction would fall back to raw logs until the marker support is restored.

## Audit Evidence

- PR and deploy evidence to be added after merge.
- Local wrapper self-test output.
- Release control gate output.

## Known Gaps

This change only extends proof extraction. It does not run a data refresh, materialize graph rows, update product read models, or verify runtime pages.
