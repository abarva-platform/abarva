# 2026-08-31-home-attention-quality-proof — Home Attention Quality Proof

## Release ID

`2026-08-31-home-attention-quality-proof`

## Status

`candidate`

## Plain-English Summary

This release tightens Home narrative generation so a chapter with verified attention evidence cannot publish a generic refusal-style message. It also preserves the generated Home artifact when the visible-quality gate fails, so reviewers can inspect the exact rejected page output.

## Layer Impact

Layer 4 PRODUCTS: Home narrative generation ranks concrete attention claims ahead of evidence-boundary claims for the executive attention chapter.

Layer 4 PRODUCTS: Home narrative proof output now records the generated artifact before a visible-quality failure exits.

Release lane: `client-data-lane`.

## Client Applicability

- All clients: Home narrative generation behavior is shared.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/build_home_ecl_narrative_layer.ts`

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/tsx -e "Promise.all([import('./scripts/data-build/build-home-chapters.ts'), import('./scripts/ecl/build_home_ecl_narrative_layer.ts')]).then(()=>console.log('tsx import ok'))"`
- PASS: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After deployment, run the Home narrative plan-only operator job before any write.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA web and worker image update through the repo-owned workflow only.
- Approved image digest: Assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required by deploy workflow.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a write job publishes new Home narrative rows.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No database rollback is required unless a later write job publishes rows; if that happens, rerun the prior accepted Home narrative write package.

## Audit Evidence

- PR: pending.
- CI: pending.
- Plan-only Home narrative operator proof: pending after deploy.

## Known Gaps

This release does not apply new Home narrative rows and does not change the Home visual design.
