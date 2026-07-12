# 2026-07-12-operator-promotion-workflow - Operator Promotion Workflow

## Release ID

`2026-07-12-operator-promotion-workflow`

## Status

`candidate`

## Plain-English Summary

Adds a disabled operator promotion workflow for SkyHarbor. The workflow defines
future approval steps, required evidence, rollback plan, blocked actions, and
future enablement criteria.

This is proof/report work only. It does not execute promotion, capture approval,
write production tenant data, update active tenant access, promote a candidate,
change module runtime behavior, make modules read candidate data by default,
execute rollback, or claim realized value.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate runway: reads candidate preview-mode and promotion-gate proof.
- Operator Promotion: workflow definition only, disabled by default.
- Module Runtime: no change.
- Active Tenant Access Layer: no change.
- Promotion Gate: no change; promotion remains disabled.

## Client Applicability

- Receives the change: all clients receive the new audit/report capability in
  code, but no client runtime behavior changes.
- SkyHarbor: reference tenant for the generated operator promotion workflow.
- Other tenants: no runtime impact.

## Changes Included

- Adds `npm run audit:operator-promotion-workflow`.
- Adds a typed operator promotion workflow builder and CLI.
- Generates JSON, Markdown, HTML, approval checklist CSV, and rollback plan
  JSON.
- Adds architecture documentation for the disabled promotion workflow boundary.

## QA / Validation

Current local status:

- Pass: `npm run audit:operator-promotion-workflow`
- Pass: `npm run audit:candidate-preview-mode`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a PR after PR20. The normal ACA main deploy workflow may ship the
audit code and reports, but no product runtime path promotes candidate data.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl after merge/deploy.

## Rollback Plan

Revert the PR. Because the change writes no production tenant data, changes no
active runtime pointer, and executes no promotion, rollback requires no data
cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/operator-promotion-workflow/skyharbor/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Actual promotion execution remains intentionally unimplemented and disabled.
