# 2026-08-27-ecl-object-absence-cleanup-status — ECL Object Absence Cleanup Status

## Release ID

`2026-08-27-ecl-object-absence-cleanup-status`

## Status

`candidate`

## Plain-English Summary

Records governed cleanup proof for one retired mixed-schema object that is already absent in the lab data plane, and teaches the four-lane ECL status artifact to count object-level absence proof separately from schema-level absence proof.

## Layer Impact

Layer 3 and operations reporting only. No product read path, runtime route, schema migration, or data-plane mutation is changed by this release record and status update.

## Client Applicability

- All clients: no product behavior change
- Specific clients: none
- Internal only: ECL completion tracking and cleanup evidence
- Public/demo only: none
- Feature flag: none

## Changes Included

- Adds object-level retired-layer proof for `knowledge.entity_source_identity`.
- Extends `scripts/ecl/write_ecl_four_lane_completion_status.mjs` so accepted absent-object proof contributes to L-CLEANUP.
- Updates `docs/architecture/ecl-four-lane-completion-status.json` from 34/851 to 35/851 retired legacy data-plane assets.

## QA / Validation

- Four-lane status test: pass.
- Operator self-test: pass.
- Retired-layer purge self-test: pass.
- Diff whitespace check: pass.
- Release check: pass after release-record status wording update.

## Rollout Plan

Merge to main through a pull request. The change is a documentation/status and script-accounting update; the next ACA deploy makes the status script available in the runtime image, but no traffic or data-plane mutation is required for this slice.

## Deployment Authority

- Repo-owned deploy workflow: standard main deploy after merge
- Shared runtime mutators: none
- Approved image digest: resolved by deploy workflow
- ACA runtime invariant: standard workflow invariant
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR to remove the object proof from L-CLEANUP accounting. No database rollback is needed because this slice does not mutate Azure data.

## Audit Evidence

- Retired-layer cleanup dry-run: `https://github.com/abarva-platform/abarva/actions/runs/33028715643`
- Prior source-registry absence proof: `https://github.com/abarva-platform/abarva/actions/runs/33020651518`
- Status artifact: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

L-CLEANUP remains incomplete at 35/851. Further mixed-schema objects require the same static preflight, live dry-run, dependency/code-reference review, and apply-or-absence proof before they can move.
