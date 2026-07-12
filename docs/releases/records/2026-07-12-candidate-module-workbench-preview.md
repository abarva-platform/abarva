# 2026-07-12-candidate-module-workbench-preview - Candidate Module Workbench Preview

## Release ID

`2026-07-12-candidate-module-workbench-preview`

## Status

`candidate`

## Plain-English Summary

Adds read-only candidate workbench preview packets for Moves, Source, and Tower.
SkyHarbor now has a proof artifact showing what each workbench can inspect from
the inactive candidate tenant data version, which evidence backs the preview,
and which blockers remain before runtime consumption.

This does not write tenant data, promote a candidate, update active tenant
access, change live module behavior, or let modules read candidate data by
default.

## Layer Impact

- Release lane: `global-control-lane` for shared proof tooling and architecture
  contracts. No client data lane writes are included.
- Candidate Tenant Data Version Store: reads existing inactive candidate
  metadata.
- Module Context APIs: emits report-only preview packets shaped like module
  context packets for Moves, Source, and Tower.
- Active Tenant Access Layer: unchanged.
- Module runtime: unchanged.

## Client Applicability

- All clients: the workbench preview builder is generic over candidate records
  and module-readiness proof.
- Specific clients: SkyHarbor has generated proof artifacts in this release.
- Internal only: audit/proof command and reports.
- Public/demo only: no.
- Feature flag: no runtime feature flag because no runtime route consumes this.

## Changes Included

- `src/lib/enterprise-data/candidate-preview/candidate-module-workbench-preview.ts`
- `scripts/audit/build-candidate-module-workbench-preview.ts`
- `docs/architecture/candidate-module-workbench-preview.md`
- `reports/candidate-module-workbench-previews/skyharbor/*`
- `npm run audit:candidate-module-workbench-preview`

## QA / Validation

- Pass: `npm run audit:candidate-module-workbench-preview`
- Pass: `npm run audit:candidate-module-readiness-preview`
- Pass: `npm run audit:candidate-module-preview`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for candidate workbench preview files
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` through PR. The repo-owned Azure Container Apps main deploy
workflow may deploy the code, but there is no runtime behavior to activate. The
new proof command can be run locally or in CI to refresh workbench preview
artifacts.

## Deployment Authority

- Repo-owned deploy workflow: allowed after merge.
- Shared runtime mutators: none.
- Approved image digest: assigned by ACA main deploy workflow if deployed.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged unless deploy workflow updates workers.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl should remain green, but this
  PR does not add module runtime consumption.

## Rollback Plan

Revert the PR. Since the change writes no production tenant data and changes no
runtime route behavior, rollback is code/artifact removal only.

## Audit Evidence

- PR URL
- `reports/candidate-module-workbench-previews/skyharbor/preview-summary.json`
- `reports/candidate-module-workbench-previews/skyharbor/candidate-module-workbench-preview-proof.json`
- validation command output
- ACA deploy/runtime-invariant evidence if merged and deployed

## Known Gaps

- Workbench preview is a report artifact only; no signed-in UI uses it yet.
- Source and Tower still need module-targeted derived plans before runtime
  consumption can be considered.
- Active promotion remains disabled.
- Modules do not read candidate data by default.
