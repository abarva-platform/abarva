# 2026-07-12-candidate-module-derived-plans — Candidate Module Derived Plans

## Release ID

`2026-07-12-candidate-module-derived-plans`

## Status

`candidate`

## Plain-English Summary

Adds a non-destructive candidate derived-plan audit for Moves, Source, and
Tower. The audit turns inactive SkyHarbor candidate source records into
module-targeted derived-plan proof artifacts so workbench previews can show
which candidate facts each module could inspect before any active promotion.

This is proof/report work only. It does not write production tenant data,
promote the candidate, update active tenant access, or change runtime module
behavior.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate Tenant Data Version: reads inactive candidate metadata only.
- Derived Intelligence Store: plans module-targeted derived objects as report
  artifacts only; no physical persistence.
- Module Context APIs: updates readiness/workbench preview generation to
  recognize module-targeted derived plans and existing workbench preview
  packets.
- Active Tenant Access Layer: no change.
- Module Runtime: no change.

## Client Applicability

- All clients: architecture and audit command pattern.
- Specific clients: SkyHarbor proof fixture/report output.
- Internal only: candidate proof harness and generated reports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `npm run audit:candidate-module-derived-plan`.
- Adds module-derived plan builder and audit command.
- Updates candidate module readiness preview to consume module-targeted derived
  plans and existing workbench preview summaries.
- Updates candidate module workbench preview default derived-plan input.
- Adds architecture documentation and generated SkyHarbor proof reports.

## QA / Validation

Current local status:

- Pass: `npm run audit:candidate-module-derived-plan`
- Pass: `npm run audit:candidate-module-readiness-preview`
- Pass: `npm run audit:candidate-module-workbench-preview`
- Pass: `npm run audit:candidate-module-preview`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`

## Rollout Plan

Merge to main through a PR. The normal ACA main deploy workflow may ship the
code and reports, but no product runtime path reads candidate data by default.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow if merged.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl after merge/deploy.

## Rollback Plan

Revert the PR. Because the change is proof/report only and writes no production
tenant data, rollback does not require data migration or tenant cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/candidate-module-derived-plans/skyharbor/`.
- Updated readiness/workbench reports under their existing SkyHarbor report
  directories.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Derived plans remain inactive report artifacts. Runtime module consumption,
candidate promotion, active tenant access updates, and physical persistence are
explicitly out of scope.
