# 2026-08-30-home-record-browser-v2 — Home Record Browser V2

## Release ID

`2026-08-30-home-record-browser-v2`

## Status

`candidate`

## Plain-English Summary

Changes the Home Browse-the-Record surface from a simple fact list into a compact slice/dice
browser. The page now opens with packet-level denominators, dimension controls, a distribution
strip, a compact table, and a selected-row evidence drawer. It keeps unknown source-file rollups
explicit instead of inventing workbook lineage that is not present in the current packet. When the
ECL runtime packet supplies source-family summaries, the browser renders those as serving-projection
coverage so leaders can see which governed Home source families contributed rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Home Browse-the-Record presentation changes.
- Layer 3 Canonical Model: No schema, source, serving-view, or data mutation.
- Runtime: Home ECL packet assembly now includes source-family summaries for the serving
  projections it actually reads.

## Client Applicability

- All clients using the Home v4/ECL Browse-the-Record surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home route behavior.

## Changes Included

- Adds slice/dice controls for domain, fact family, signal type, evidence state, and value state.
- Replaces the long card list with a compact table using column presets: fact id, statement,
  domain, type, and evidence state.
- Adds a selected-row drawer with fact type, domains, evidence state, value state, and evidence
  references.
- Preserves honest coverage language when source-file/workbook rollups are absent from the packet.
- Adds source-family coverage cards when the ECL runtime packet supplies serving-projection
  summaries.
- Updates Browse-the-Record regression tests to assert the slice/dice browser, table columns,
  denominator, search, empty state, and dimension filtering.
- Updates ECL bundle tests to assert that runtime packets carry source-family summaries for the
  serving projections being read.

## QA / Validation

- `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/preview/__tests__/BrowseTheData.test.tsx --runInBand`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`: pass.
- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass.
- Signed-in Home browser proof: not-run; required after merge and deploy.

## Rollout Plan

Merge through pull request and deploy through the repo-owned Azure Container Apps main workflow.
After deployment, run signed-in Home browser proof on the Browse-the-Record surface and capture a
screenshot.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home Browse-the-Record must show slice/dice controls, the
  compact table, and the selected-row evidence drawer.

## Rollback Plan

Revert the pull request and redeploy the previous digest-pinned image through the repo-owned ACA
workflow.

## Audit Evidence

- Pull request, CI output, deploy workflow run, and signed-in Home browser screenshot.

## Known Gaps

This slice does not create raw Layer-1 workbook lineage or raw-row source-file summaries. The new
runtime summaries are explicitly marked as `serving_projection` coverage from governed Home serving
views. Offline packet generation continues to own true client-intake/source-file summary context when
that source inventory is supplied.
