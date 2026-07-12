# 2026-07-12-candidate-preview-mode - Candidate Preview Mode Contract

## Release ID

`2026-07-12-candidate-preview-mode`

## Status

`candidate`

## Plain-English Summary

Adds an explicit candidate preview-mode contract for SkyHarbor. The contract
defines the required flag, explicit candidate selection, module selection,
operator acknowledgement, blocked actions, and module preview-selection matrix.

This is proof/report work only. It does not write production tenant data,
update active tenant access, promote a candidate, change module runtime
behavior, make modules read candidate data by default, add runtime routes, or
claim realized value.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate runway: reads the candidate readiness control panel.
- Module Runtime: no change.
- Active Tenant Access Layer: no change.
- Promotion Gate: no change; promotion remains disabled.
- Preview Mode: contract and proof only, not runtime activation.

## Client Applicability

- Receives the change: all clients receive the new audit/report capability in
  code, but no client runtime behavior changes.
- SkyHarbor: reference tenant for the generated candidate preview-mode contract.
- Other tenants: no runtime impact.

## Changes Included

- Adds `npm run audit:candidate-preview-mode`.
- Adds a typed candidate preview-mode builder and CLI.
- Generates JSON, Markdown, HTML, and CSV proof artifacts.
- Adds architecture documentation for the explicit preview-mode boundary.

## QA / Validation

Current local status:

- Pass: `npm run audit:candidate-preview-mode`
- Pass: `npm run audit:candidate-readiness-control`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a PR after PR19. The normal ACA main deploy workflow may ship the
audit code and reports, but no product runtime path reads candidate data by
default.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl after merge/deploy.

## Rollback Plan

Revert the PR. Because the change writes no production tenant data and changes
no active runtime pointer, rollback requires no data cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/candidate-preview-mode/skyharbor/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Operator promotion workflow remains a separate follow-on milestone. Preview mode
is still contract-only and disabled by default.
