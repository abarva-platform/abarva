# 2026-07-12-candidate-module-readiness-preview — Candidate Module Readiness Preview

## Release ID

`2026-07-12-candidate-module-readiness-preview`

## Status

`candidate`

## Plain-English Summary

Adds a five-module readiness preview for inactive candidate tenant data
versions. SkyHarbor now has a report showing Home, Intelligence, Moves, Source,
and Tower readiness based on candidate evidence, fact plans, graph plan,
derived plan, preview packet availability, and promotion guardrails.

This does not write tenant data, promote a candidate, update active tenant
access, or change live module behavior.

## Layer Impact

- Release lane: `global-control-lane` for shared proof tooling and architecture
  contracts. No client data lane writes are included.
- Candidate Tenant Data Version Store: reads existing inactive candidate
  metadata.
- Module Context APIs: uses existing preview packet availability to score
  module readiness.
- Active Tenant Access Layer: unchanged.
- Module runtime: unchanged.

## Client Applicability

- All clients: the readiness preview builder is generic over candidate records
  and module-readiness proof.
- Specific clients: SkyHarbor has generated proof artifacts in this release.
- Internal only: audit/proof command and reports.
- Public/demo only: no.
- Feature flag: no runtime feature flag because no runtime route consumes this.

## Changes Included

- `src/lib/enterprise-data/candidate-preview/candidate-module-readiness-preview.ts`
- `scripts/audit/build-candidate-module-readiness-preview.ts`
- `docs/architecture/candidate-module-readiness-preview.md`
- `reports/candidate-module-readiness-previews/skyharbor/*`
- `npm run audit:candidate-module-readiness-preview`

## QA / Validation

- Pass: `npm run audit:candidate-module-readiness-preview`
- Pass: `npm run audit:candidate-module-preview`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:candidate-promotion-gate`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for candidate readiness preview files
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` through PR. The repo-owned Azure Container Apps main deploy
workflow may deploy the code, but there is no runtime behavior to activate. The
new proof command can be run locally or in CI to refresh readiness artifacts.

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
- `reports/candidate-module-readiness-previews/skyharbor/readiness-summary.json`
- `reports/candidate-module-readiness-previews/skyharbor/module-readiness-preview.json`
- validation command output
- ACA deploy/runtime-invariant evidence if merged and deployed

## Known Gaps

- Readiness preview is a report artifact only; no signed-in UI uses it yet.
- Moves, Source, and Tower preview packets are not generated yet.
- Active promotion remains disabled.
- Modules do not read candidate data by default.
