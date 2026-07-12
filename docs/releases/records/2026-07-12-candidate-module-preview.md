# 2026-07-12-candidate-module-preview — Candidate Module Read-Only Preview

## Release ID

`2026-07-12-candidate-module-preview`

## Status

`candidate`

## Plain-English Summary

Adds a read-only preview proof for inactive candidate tenant data versions. The
first proof renders SkyHarbor candidate data into Home and Intelligence preview
packets so operators can inspect what those modules could see after a future
promotion. This does not write tenant data, promote the candidate, change active
tenant access, or alter live module behavior.

## Layer Impact

- Release lane: `global-control-lane` for shared proof tooling and architecture
  contracts. No client data lane writes are included.
- Candidate Tenant Data Version Store: reads existing inactive candidate
  metadata and proof links.
- Module Context APIs: produces Home and Intelligence preview packets aligned to
  the module-context packet shape.
- Derived Intelligence Store: previews derived insight inputs only; does not
  persist or materialize derived intelligence.
- Active Tenant Access Layer: unchanged.

## Client Applicability

- All clients: the preview builder is generic over candidate records.
- Specific clients: SkyHarbor has generated proof artifacts in this release.
- Internal only: audit/proof command and reports.
- Public/demo only: no.
- Feature flag: no runtime feature flag because no runtime route consumes this.

## Changes Included

- `src/lib/enterprise-data/candidate-preview/candidate-module-preview.ts`
- `scripts/audit/build-candidate-module-preview.ts`
- `docs/architecture/candidate-module-preview.md`
- `reports/candidate-module-previews/skyharbor/*`
- `npm run audit:candidate-module-preview`

## QA / Validation

- Pass: `npm run audit:candidate-module-preview`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:candidate-promotion-gate`
- Pass: `npm run audit:candidate-tenant-version`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for candidate preview files
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` through PR. The repo-owned Azure Container Apps main deploy
workflow may deploy the code, but there is no runtime behavior to activate. The
new proof command can be run locally or in CI to refresh preview artifacts.

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
- `reports/candidate-module-previews/skyharbor/preview-summary.json`
- `reports/candidate-module-previews/skyharbor/candidate-module-preview-proof.json`
- validation command output
- ACA deploy/runtime-invariant evidence if merged and deployed

## Known Gaps

- Preview packets are report artifacts only; no signed-in UI uses them yet.
- Active promotion remains disabled.
- Modules do not read candidate data by default.
