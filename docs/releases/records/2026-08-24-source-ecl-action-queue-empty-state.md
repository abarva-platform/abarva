# 2026-08-24-source-ecl-action-queue-empty-state — Source ECL Action Queue Empty State

## Release ID

`2026-08-24-source-ecl-action-queue-empty-state`

## Status

`candidate`

## Plain-English Summary

Source workspace browser QA found that a populated ECL-backed Source portfolio could still show an Action Queue empty state saying no Source rows were returned. This changes that visible sentence so it describes the empty decision-window queue only, while preserving the populated contracts and vendors on the page. It also updates the ECL proof workflow's producer-coverage assertion to the current committed surface count.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection UI plus CI proof assertion maintenance. No data, schema, loader, adapter, tenant-routing, or persistence behavior changes.

## Client Applicability

- All clients: Applies to the shared Source workspace UI when the action queue is empty.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates the Source workspace Action Queue empty-state copy in `ContextLens`.
- Updates the ECL no-stop proof workflow's expected producer coverage counts from the pre-expansion model to the current committed projection-surface model.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — pass.
- `npm run release:check` — pass.
- Live signed-in Chrome read of the ECL Source workspace proved the portfolio rendered with 230 contracts and 101 vendors; that proof is not part of this PR's code change but explains why the copy defect was visible.

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow will publish the shared runtime image from main.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live rollout.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for claiming the Source ECL browser surface fixed in production.

## Rollback Plan

Revert this UI copy change and redeploy the previous shared runtime image. No data rollback is required.

## Audit Evidence

- Focused Jest output from the Source workspace ECL browser-surface test.
- Live Chrome screenshot artifact from the pre-fix QA run: `reports/ecl-product-browser-live-qa-2026-08-24/source-chrome-ecl-current.png`.

## Known Gaps

This change does not alter whether a contract qualifies for the Action Queue. It only prevents the empty queue from being described as an empty Source dataset.
