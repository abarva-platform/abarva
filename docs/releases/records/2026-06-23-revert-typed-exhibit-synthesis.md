# 2026-06-23-revert-typed-exhibit-synthesis — Roll Back Typed Exhibit Synthesis

## Release ID

`2026-06-23-revert-typed-exhibit-synthesis`

## Status

`candidate`

## Plain-English Summary

This release reverts PR #3895. The deployed deep reality crawl showed the audited second-pass visual exhibit synthesizer did not improve answer quality; it reduced overall pass rate from `155/290` on #3894 to `150/290` on #3895 and added an extra model call to visual questions. The safer runtime is the #3894 plumbing/rendering foundation while the real deterministic structured-data visual layer is designed.

## Layer Impact

- `global-control-lane`: removes the second-pass visual exhibit synthesis call from the shared Intelligence ask route.
- `client-data-lane`: no schema change, no migration, no data mutation.

## Client Applicability

- All clients: restores the #3894 visual behavior for all tenants.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: no flag change.

## Changes Included

- Reverts PR #3895 / merge commit `49ecc9564016e098c7da65c91d5bfdf2f79e27dd`.
- Removes `src/lib/intelligence/answer/visual-exhibit-synthesis.ts` and its tests.
- Preserves the #3895 release record as rolled-back history and adds this rollback record.

## QA / Validation

- Pending CI on the revert PR.
- Runtime evidence prompting rollback: #3895 deployed matrix passed 5/5, but full reality crawl was `150/290`, charts `9/50`, graphs `5/40`, worse overall than #3894's `155/290`.

## Rollout Plan

Merge to `main`; repo-owned Azure Container Apps deploy builds a new image and shifts 100% traffic to the revert revision. After deploy, rerun the tenant matrix to confirm the shared surface is still green.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside repo-owned deploy.
- Approved image digest: assigned by deploy workflow after merge.
- ACA runtime invariant: template image, active traffic revision image, and active revision image must agree.
- Worker image invariant: not affected.
- Feature/env flag update path: no change.
- Live signed-in proof required: yes; matrix proof after deploy.

## Rollback Plan

If reverting causes a regression, restore PR #3895 or roll ACA back to revision `m49ecc956`. The preferred path remains repo-owned PR/deploy.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3896
- Evidence: `out/reality-crawl-49ecc956/report.html`, `out/reality-crawl-49ecc956/summary.json`.

## Known Gaps

The product still needs the real permanent visual fix: deterministic visual specifications from structured tenant facts/relationships, not prompt-only or second-pass prose extraction.
