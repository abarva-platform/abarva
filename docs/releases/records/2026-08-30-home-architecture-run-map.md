# 2026-08-30-home-architecture-run-map — Home Architecture Run Map

## Release ID

`2026-08-30-home-architecture-run-map`

## Status

`candidate`

## Plain-English Summary

Changes the Home Current-State Architecture surface so it opens with an executive run map before
the detailed architecture workbench. The run map groups the estate into business and technology
blocks, shows named anchors and denominators, and keeps the existing detailed architecture
workbench below it so no evidence surface is removed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Home Current-State Architecture presentation changes.
- Layer 3 Canonical Model: No schema, source, serving-view, or data mutation.
- Runtime: Client-rendered Home component update only.

## Client Applicability

- All clients using the Home v4/ECL architecture surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home route behavior.

## Changes Included

- Adds an executive run-map section with six conceptual blocks: Health Plan/Payer,
  Provider/Delivery, Back Office, Data/Analytics/AI, Infrastructure/Hosting, and
  Vendor/Commercial Spine.
- Computes each block from existing Home application, integration, and infrastructure rows.
- Preserves the detailed architecture workbench and capability drilldown underneath the new
  conceptual entry.
- Adds regression coverage that the conceptual blocks render and the grain warning remains.

## QA / Validation

- `npx jest src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`: pass.
- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass after this QA wording update.
- Signed-in Home browser proof: not-run; required after merge and deploy.

## Rollout Plan

Merge through pull request and deploy through the repo-owned Azure Container Apps main workflow.
After deployment, run signed-in Home browser proof on the Current-State Architecture surface and
capture a screenshot.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home Current-State Architecture must show the run map and
  retain the detailed architecture workbench.

## Rollback Plan

Revert the pull request and redeploy the previous digest-pinned image through the repo-owned ACA
workflow.

## Audit Evidence

- Pull request, CI output, deploy workflow run, and signed-in Home browser screenshot.

## Known Gaps

This slice does not yet build the full physical system passport drawer, data browser V2, org chart,
or leadership interview surface. It also does not create new source records or change Home narrative
generation.
