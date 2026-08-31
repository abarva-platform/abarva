# 2026-08-31-home-narrative-measurement-artifact-gate -- Home Narrative Measurement Artifact Gate

## Release ID

`2026-08-31-home-narrative-measurement-artifact-gate`

## Status

`candidate`

## Plain-English Summary

The Home narrative quality workflow now prefers the admin model secret and fails when the measurement run produces no files. This prevents a green workflow from masking a failed model call and an empty provenance artifact.

## Layer Impact

Layer 4 product proof tooling only. This does not change tenant intake, source adapters, canonical records, projections, serving views, product rendering, or live data-plane state.

## Client Applicability

- All clients: Applies to shared Home narrative proof tooling.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/home-narrative-quality-measurement.yml` now prefers the admin model secret when running the Home narrative measurement.
- The workflow now checks the requested output directory after the measurement run and fails if no files were produced.
- Artifact upload now uses `if-no-files-found: error`.

## QA / Validation

- Pass: Workflow YAML change inspected locally.
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not run: Home narrative measurement workflow after merge.

## Rollout Plan

Merge through the normal PR path. No data load or route change is included. Rerun the Home narrative measurement workflow after merge and confirm the artifact contains generated measurement files.

## Deployment Authority

- Repo-owned deploy workflow: Not required for the proof-tooling behavior itself.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert this PR. The prior behavior would return, where the workflow could pass despite no measurement files being uploaded.

## Audit Evidence

Inspect the PR diff, release control output, and the follow-up Home narrative quality measurement workflow run.

## Known Gaps

This release makes the workflow truthful and usable as a provenance-artifact producer. It does not improve generated Home narrative quality or publish new Home chapter output.
