# 2026-07-12-all-tenant-candidate-batch — All-Tenant Candidate Batch Dry-Run

## Release ID

`2026-07-12-all-tenant-candidate-batch`

## Status

`candidate`

## Plain-English Summary

Adds an all-tenant candidate batch dry-run report that shows which tenants can
move through the candidate runway today, which tenants are blocked, and what
minimum remediation is needed tenant by tenant.

This is proof/report work only. It does not write production tenant data, update
active tenant access, promote candidates, write physical tables, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate runway: reads existing proof artifacts and source inventory only.
- Source Adapter / Canonical Ingestion / Target Writer: evaluated in dry-run
  report form only.
- Candidate Tenant Data Version: SkyHarbor candidate metadata is reused as
  inactive proof; other tenants are inventoried.
- Promotion Gate: evaluated as proof metadata only; no promotion is enabled.
- Module Runtime: no change.
- Active Tenant Access Layer: no change.

## Client Applicability

- SkyHarbor: candidate/shadow proof-ready reference tenant.
- Lakeshore, Meridian, Apex, First Capital / Arcturus, Northstar, Morgan Street
  if present: inventory/remediation rows only unless future packet mappings are
  added.
- All clients: establishes the batch eligibility report pattern.

## Changes Included

- Adds `npm run audit:all-tenant-candidate-batch`.
- Adds all-tenant candidate batch builder and CLI.
- Generates JSON, Markdown, HTML, and CSV remediation matrix reports.
- Adds architecture documentation for the batch audit.

## QA / Validation

Current local status:

- Pass: `npm run audit:all-tenant-candidate-batch`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`
- Pass: `npm run release:check`

Supporting validation:

- Pass: `npm run audit:stranded-intelligence-report`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:source-shadow-proof`

## Rollout Plan

Merge through a PR. The normal ACA main deploy workflow may ship the audit code
and reports, but no product runtime path reads candidate data by default.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl after merge/deploy.

## Rollback Plan

Revert the PR. Because the change writes no production tenant data and updates
no active runtime pointer, rollback requires no data cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/all-tenant-candidate-batch/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Moves shadow proof, candidate readiness control panel, explicit candidate
preview mode, and operator promotion workflow remain separate follow-on
milestones.
