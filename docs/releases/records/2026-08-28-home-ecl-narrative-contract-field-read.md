# 2026-08-28-home-ecl-narrative-contract-field-read — Home ECL Contract Field Read

## Release ID

`2026-08-28-home-ecl-narrative-contract-field-read`

## Status

`candidate`

## Plain-English Summary

The Home ECL narrative writer now reads contract spend and supplier concentration from the same projection payload field names used by the Home runtime reader. This prevents a populated contract projection from being summarized as having no annualized contract value.

## Layer Impact

Layer 4 products (`global-control-lane`): Home preview narrative generation reads the existing ECL projection payload consistently with the runtime Home bundle reader.

Layer 3 canonical/projection (`global-control-lane`): No schema, table, or data-model changes. Existing projection rows are interpreted with the committed field names.

## Client Applicability

- All clients: Applies to Home ECL narrative generation when the ECL provider is active.
- Specific clients: None named.
- Internal only: Operator proof scripts and tests.
- Public/demo only: None.
- Feature flag: Existing Home ECL provider controls remain unchanged.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- Pass: `npm run test:ecl-home-narrative-layer`
- Pass: `npm run test:npm-script-targets`
- Pass: `git diff --check`
- Pending: `npm run release:check` after this release record update

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps deploy workflow builds and deploys the main image. The Home ECL narrative operator job must then be rerun to regenerate stored narrative rows before browser proof is claimed.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web image containing this script change.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the narrative operator job and readback pass.

## Rollback Plan

Revert the pull request and redeploy the previous approved image. If generated Home narrative rows need to be restored, rerun the prior approved Home ECL narrative operator image against the same tenant and assessment.

## Audit Evidence

Pull request, local validation output, ACA deploy run, Home ECL narrative operator apply/readback output, and signed-in browser screenshot after regeneration.

## Known Gaps

This release fixes field interpretation only. It does not itself regenerate the stored Home narrative rows or prove the browser surface.
