# 2026-07-12-source-shadow-proof — Source End-to-End Shadow Proof

## Release ID

`2026-07-12-source-shadow-proof`

## Status

`live-proven`

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

Post-merge deploy status:

- Pass: PR #4702 merged at commit
  `e35ee9ca385be17d5f33313aad35b2c8a6025c1a`.
- Pass: ACA main deploy run `29198877559` deployed PR16 to revision
  `ca-abarva-web-lab-eastus--me35ee9ca`.
- Pass: PR16 deployed image digest
  `sha256:35d2d9b88554e0692a6efa67a8a471ac0ab8c1a5b5ab82faa6d56f05291d38f2`.
- Pass: later main deploy run `29199477835` superseded the PR16 runtime with
  commit `6d05ee19c876fb69eaefabc3500759b2340c47e9`, which contains the
  PR16 merge commit.
- Pass: current live revision
  `ca-abarva-web-lab-eastus--m6d05ee19` receives 100% traffic.
- Pass: current live image digest
  `sha256:67f5cfe199e2492665b7bc076a6c5a7996c441cb0290769731c3d354107458ac`.
- Pass: runtime invariant passed for the current live revision.
- Pass: production health endpoint returned ok with Postgres and direct Postgres
  checks passing.
- Pass: signed-in post-deploy crawl run `29199701398` completed against
  `https://app.abarva.ai`.
- Pass with known watches: crawl artifact
  `/tmp/nexus-latest-postdeploy-crawl-29199701398/2026-07-12T16-14-58-525Z-local`
  recorded 150 observations, 0 P0, 100 P1, and 0 P2 findings. The P1 findings
  were the existing tenant-identity visibility watch class only across
  ApexRetail, Meridian, Arcturus, and Northstar.

## Rollout Plan

Merged to main through PR #4702 and deployed through the normal ACA main deploy
workflow. The current live main runtime contains the PR16 merge. No product
runtime path reads candidate data by default.

## Deployment Authority

- Repo-owned deploy workflow: used for the shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: current live digest
  `sha256:67f5cfe199e2492665b7bc076a6c5a7996c441cb0290769731c3d354107458ac`.
- ACA runtime invariant: passed after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof: passed with known P1 tenant-identity watches only.

## Rollback Plan

Revert the PR. Because the change is proof/report only and writes no production
tenant data, no Source tables, and no Outcome Ledger tables, rollback does not
require data migration, active pointer repair, or tenant cleanup.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/4702.
- Local validation output.
- Generated reports under `reports/source-shadow-proof/skyharbor/`.
- ACA deploy evidence:
  `/tmp/nexus-pr16-deploy-evidence-29198877559`.
- Current live deploy evidence:
  `/tmp/nexus-latest-deploy-evidence-29199477835`.
- Post-deploy crawl evidence:
  `/tmp/nexus-latest-postdeploy-crawl-29199701398/2026-07-12T16-14-58-525Z-local`.

## Known Gaps

Active Source runtime consumption, physical Source writes, physical Outcome
Ledger writes, active tenant access updates, candidate promotion, and realized
value attestation remain out of scope.
