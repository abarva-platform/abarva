# 2026-08-31 Home ECL Narrative Opening Boundary

## Release ID

`2026-08-31-home-ecl-narrative-opening-boundary`

## Status

`candidate`

## Plain-English Summary

The Home ECL narrative build now requires the executive opening to come from the generated and verified chapter output. If no suitable business-led opening survives verification, the story plan records that gap instead of inserting a fixed fallback sentence.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: Home narrative generation is tightened so CXO-visible prose remains tied to published chapter claims.

Layer 3 Canonical Model: No schema or canonical data changes.

## Client Applicability

- All clients: Yes, for Home ECL narrative generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL/default serving controls apply.

## Changes Included

- Removed the fallback executive-opening injection from the Home ECL narrative build script.
- Updated the Home ECL narrative guard test to reject the fallback identifier and fixed fallback wording.

## QA / Validation

- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through a GitHub PR. The change becomes active in the next repo-owned Azure Container Apps deploy and in the next governed Home ECL narrative build run.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming live proof.
- Worker image invariant: Required before claiming build-job proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the Home route is live-proven with regenerated content.

## Rollback Plan

Revert the PR. No migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7227
- Local validation: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`.

## Known Gaps

This change removes the fixed fallback opening. It does not by itself regenerate, load, deploy, or browser-prove new Home content.
