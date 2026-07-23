# 2026-07-23-home-knowledge-v4-focused-review-jobs — Focused Home V4 Review Operator Jobs

## Release ID

`2026-07-23-home-knowledge-v4-focused-review-jobs`

## Status

`candidate`

## Plain-English Summary

Adds tenant-specific npm entry points for the Home Knowledge V4 review generator so the governed Azure Container Apps operator job can run one demo tenant at a time. This lets operators generate and review Meridian and FS Demo first, then Airline and Retail last, without regenerating every tenant on each pass.

## Layer Impact

- Internal/admin operations: adds focused data-build scripts used by the ACA operator job.
- Client data lane: no content is loaded or published by this release; it only makes candidate generation easier to control.

## Client Applicability

- All clients: no direct runtime change.
- Specific clients: Meridian, FS Demo, Airline Demo, Retail Demo, and Lakeshore receive focused review-job entry points.
- Internal only: yes, this is an operator/data-build control change.
- Public/demo only: applies to synthetic demo tenants when the governed operator job is run.
- Feature flag: none.

## Changes Included

- `package.json`
  - `home:knowledge-v4:review-job:meridian`
  - `home:knowledge-v4:review-job:fs-demo`
  - `home:knowledge-v4:review-job:airline-demo`
  - `home:knowledge-v4:review-job:retail-demo`
  - `home:knowledge-v4:review-job:lakeshore`

## QA / Validation

- PASS: package script validation confirmed all five focused npm scripts exist.
- PASS: packet-only local validation for `home:knowledge-v4:review-job:meridian`.
- PASS: packet-only local validation for `home:knowledge-v4:review-job:fs-demo`.
- PENDING: `npm run release:check` after this release record update.
- PENDING: GitHub PR checks.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main workflow, then run the focused scripts only through `scripts/ops/submit-aca-operator-job.mjs` with a digest-pinned image and the Anthropic secret reference.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release; only the repo-owned deploy workflow may update ACA web/worker images.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before running the operator job.
- Worker image invariant: required by ACA main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no for the script entry points themselves; required before any generated content is loaded or claimed live.

## Rollback Plan

Revert the package-script additions. Existing all-tenant review generation remains available through `home:knowledge-v4:review-job`.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI run: to be added after PR validation.
- Operator job proof: generated separately when each focused tenant job runs.

## Known Gaps

This release does not generate, approve, load, or publish Home V4 content. Candidate content remains review-only until a separate governed load/publish step is approved.
