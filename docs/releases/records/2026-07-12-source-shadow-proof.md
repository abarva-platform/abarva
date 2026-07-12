# 2026-07-12-source-shadow-proof — Source End-to-End Shadow Proof

## Release ID

`2026-07-12-source-shadow-proof`

## Status

`candidate`

## Plain-English Summary

Adds a Source end-to-end shadow proof for inactive SkyHarbor candidate data. The
proof simulates a Source workflow using candidate context and referenced Source
artifacts, producing a Source opportunity assessment, vendor/commercial leverage
findings, a decision brief, proposed Module Memory records, a Tower handoff
preview, and an evidence trace.

This is proof/report work only. It does not write production tenant data, write
physical Source or Outcome Ledger tables, promote the candidate, update active
tenant access, change live Source UI behavior, or let modules read candidate
data by default.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate Tenant Data Version: reads inactive SkyHarbor candidate metadata
  only.
- Source: generates a shadow workflow proof and executive decision brief; no
  runtime Source route or table changes.
- Module Memory: produces proposed memory records as JSON report artifacts
  only.
- Outcome Ledger / Tower: produces proposed value commitment and Tower handoff
  preview only; no measured, realized, or attested value.
- Active Tenant Access Layer: no change.
- Module Runtime: no change.

## Client Applicability

- All clients: Source shadow-proof audit pattern.
- Specific clients: SkyHarbor proof fixture/report output.
- Internal only: candidate proof harness and generated reports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `npm run audit:source-shadow-proof`.
- Adds Source shadow-proof builder and CLI.
- Generates SkyHarbor Source proof, summary, decision brief, Module Memory
  preview, Tower handoff preview, and evidence trace.
- Adds architecture documentation for Source shadow proof.

## QA / Validation

Current local status:

- Pass: `npm run audit:source-shadow-proof`
- Pass: `npm run audit:candidate-module-workbench-preview`
- Pass: `npm run audit:candidate-module-readiness-preview`
- Pass: `npm run audit:candidate-module-derived-plan`
- Pass: `npm run audit:candidate-module-graph-plan`
- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:candidate-promotion-gate`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for changed files
- Pass: `git diff --check`

## Rollout Plan

Merge to main through a PR. The normal ACA main deploy workflow may ship the
code and generated reports, but no product runtime path reads candidate data by
default.

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
tenant data, no Source tables, and no Outcome Ledger tables, rollback does not
require data migration, active pointer repair, or tenant cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/source-shadow-proof/skyharbor/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Active Source runtime consumption, physical Source writes, physical Outcome
Ledger writes, active tenant access updates, candidate promotion, and realized
value attestation remain out of scope.
