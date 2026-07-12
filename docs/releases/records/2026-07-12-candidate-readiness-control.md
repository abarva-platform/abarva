# 2026-07-12-candidate-readiness-control - Candidate Readiness Control Panel

## Release ID

`2026-07-12-candidate-readiness-control`

## Status

`candidate`

## Plain-English Summary

Adds a consolidated SkyHarbor candidate readiness control panel. The panel
answers whether the candidate is preview-ready, confirms that it is not
active-runtime-ready, and lists the exact criteria required before any future
active promotion.

This is proof/report work only. It does not write production tenant data,
update active tenant access, promote a candidate, enable runtime module
consumption, make modules read candidate data by default, write physical tables,
or claim realized value.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate runway: aggregates existing inactive SkyHarbor candidate proof
  artifacts.
- Module Runtime: no change.
- Active Tenant Access Layer: no change.
- Promotion Gate: read-only summary only; promotion remains disabled.
- Source, Moves, Tower: consumes shadow proof reports only.

## Client Applicability

- Receives the change: all clients receive the new audit/report capability in
  code, but no client runtime behavior changes.
- SkyHarbor: reference tenant for the generated readiness control artifacts.
- Other tenants: no runtime impact. All-tenant batch status is included only as
  context.

## Changes Included

- Adds `npm run audit:candidate-readiness-control`.
- Adds a typed candidate readiness control builder and CLI.
- Generates JSON, Markdown, HTML, and CSV control reports.
- Adds architecture documentation for the readiness control boundary.

## QA / Validation

Current local status:

- Pass: `npm run audit:candidate-readiness-control`
- Pass: `npm run audit:moves-shadow-proof`
- Pass: `npm run audit:source-shadow-proof`
- Pass: `npm run audit:all-tenant-candidate-batch`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a PR after PR18. The normal ACA main deploy workflow may ship the
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
- Generated reports under `reports/candidate-readiness-control/skyharbor/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Explicit candidate preview mode and operator promotion workflow remain separate
follow-on milestones.
