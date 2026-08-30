# 2026-08-30-home-v2-implementation-prompt-pack — Home V2 Implementation Prompt Pack

## Release ID

`2026-08-30-home-v2-implementation-prompt-pack`

## Status

`candidate`

## Plain-English Summary

Adds a repository-grounded Home V2 implementation prompt pack. The pack converts the Home V2
narrative and architecture design into page-level prompts, source/layer input maps, executive packet
sections, deterministic visual dataset refs, architecture run-map rules, data-browser rules, and the
first build slice for the Home Current-State Architecture experience.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Design and execution contract only for Home surfaces.
- Layer 3 Canonical Model: No schema or data mutation.
- Runtime: No code path, route, or deployment behavior changes.

## Client Applicability

- All clients: Home design and implementation standard.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- Adds `docs/architecture/home-v2-implementation-prompt-pack-2026-08-30.md`.
- Links the prompt pack from the existing Home V2 narrative and page-prompt design contracts.
- Defines source/layer maps for workbook/source families, ECL substrates, and Home surfaces.
- Defines the architecture wheel/run-map as a deterministic renderer contract, not a one-off mockup.
- Defines the data browser as a slice/dice workbench with typed-view counting and lineage drawers.

## QA / Validation

- Documentation-only change: pass.
- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass after release-record status wording was corrected.

## Rollout Plan

Merge through pull request. No deployment, data-build job, migration, or runtime cutover is required
for this documentation-only contract.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No, because this release changes only design documentation.

## Rollback Plan

Revert the pull request if the implementation contract needs to be superseded.

## Audit Evidence

- Pull request diff and release-control output.

## Known Gaps

This release does not implement the new Home renderers, visual datasets, data browser V2, org chart,
or interview evidence surfaces. Those are explicitly listed as follow-up build items in the prompt
pack.
